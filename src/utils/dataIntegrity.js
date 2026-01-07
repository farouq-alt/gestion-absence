// Comprehensive data integrity service combining validation, referential integrity, audit logging, and concurrency control

import { 
  validateStudent, 
  validateGroup, 
  validateAbsence, 
  validateExcelData, 
  validateFile,
  createValidationResult,
  ValidationError 
} from './validation.js'

import { 
  checkReferentialIntegrity, 
  safeDelete, 
  getCascadeDeletePreview,
  ReferentialIntegrityError 
} from './referentialIntegrity.js'

import { 
  auditLogger,
  logStudentCreate,
  logStudentUpdate,
  logStudentDelete,
  logGroupCreate,
  logGroupUpdate,
  logGroupDelete,
  logAbsenceCreate,
  logAbsenceUpdate,
  logAbsenceDelete,
  logAbsenceRollback,
  logBulkImport,
  logBulkExport
} from './auditLog.js'

import { 
  concurrencyManager,
  getCurrentVersion,
  updateVersion,
  checkConcurrentModification,
  acquireLock,
  releaseLock,
  optimisticUpdate,
  ConcurrencyConflictError
} from './concurrencyControl.js'

// Data integrity operation result
export class DataIntegrityResult {
  constructor(success = false, data = null, errors = [], warnings = []) {
    this.success = success
    this.data = data
    this.errors = errors
    this.warnings = warnings
    this.auditEntry = null
    this.version = null
  }

  addError(error) {
    this.errors.push(error)
    this.success = false
    return this
  }

  addWarning(warning) {
    this.warnings.push(warning)
    return this
  }

  setAuditEntry(entry) {
    this.auditEntry = entry
    return this
  }

  setVersion(version) {
    this.version = version
    return this
  }
}

// Main data integrity service
export class DataIntegrityService {
  constructor() {
    this.auditLogger = auditLogger
    this.concurrencyManager = concurrencyManager
  }

  // Student operations with full integrity checks
  async createStudent(studentData, userId, allData) {
    const result = new DataIntegrityResult()

    try {
      // 1. Validation
      const validationErrors = validateStudent(studentData, allData.students || [])
      if (validationErrors.length > 0) {
        validationErrors.forEach(error => result.addError(error))
        return result
      }

      // 2. Referential integrity check
      const integrityCheck = checkReferentialIntegrity(studentData, 'student', 'CREATE', allData)
      if (!integrityCheck.isValid) {
        integrityCheck.conflicts.forEach(conflict => 
          result.addError(new ValidationError(conflict.field, conflict.message, conflict.value))
        )
        return result
      }

      // 3. Generate ID and prepare final data
      const student = {
        ...studentData,
        id: this.generateId(allData.students || []),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }

      // 4. Create version tracking
      const version = updateVersion('student', student.id, userId)

      // 5. Audit logging
      const auditEntry = logStudentCreate(student, userId)

      result.success = true
      result.data = student
      result.setVersion(version)
      result.setAuditEntry(auditEntry)

      return result

    } catch (error) {
      result.addError(new ValidationError('system', `Erreur système: ${error.message}`))
      return result
    }
  }

  async updateStudent(studentId, updateData, userId, allData, expectedVersion = null) {
    const result = new DataIntegrityResult()

    try {
      // 1. Find existing student
      const existingStudent = allData.students?.find(s => s.id === studentId)
      if (!existingStudent) {
        result.addError(new ValidationError('id', 'Étudiant non trouvé'))
        return result
      }

      // 2. Concurrency check
      if (expectedVersion) {
        const conflictCheck = checkConcurrentModification('student', studentId, expectedVersion)
        if (conflictCheck.hasConflicts && !conflictCheck.canProceed) {
          conflictCheck.conflicts.forEach(conflict => 
            result.addError(new ValidationError(conflict.field, conflict.message))
          )
          return result
        }
      }

      // 3. Prepare updated data
      const updatedStudent = {
        ...existingStudent,
        ...updateData,
        id: studentId, // Ensure ID doesn't change
        updatedAt: new Date().toISOString()
      }

      // 4. Validation
      const validationErrors = validateStudent(updatedStudent, allData.students || [])
      if (validationErrors.length > 0) {
        validationErrors.forEach(error => result.addError(error))
        return result
      }

      // 5. Referential integrity check
      const integrityCheck = checkReferentialIntegrity(updatedStudent, 'student', 'UPDATE', allData)
      if (!integrityCheck.isValid) {
        integrityCheck.conflicts.forEach(conflict => 
          result.addError(new ValidationError(conflict.field, conflict.message, conflict.value))
        )
        return result
      }

      // 6. Update version
      const version = updateVersion('student', studentId, userId)

      // 7. Audit logging
      const auditEntry = logStudentUpdate(studentId, existingStudent, updatedStudent, userId)

      result.success = true
      result.data = updatedStudent
      result.setVersion(version)
      result.setAuditEntry(auditEntry)

      return result

    } catch (error) {
      result.addError(new ValidationError('system', `Erreur système: ${error.message}`))
      return result
    }
  }

  async deleteStudent(studentId, userId, allData, options = {}) {
    const result = new DataIntegrityResult()

    try {
      // 1. Find existing student
      const existingStudent = allData.students?.find(s => s.id === studentId)
      if (!existingStudent) {
        result.addError(new ValidationError('id', 'Étudiant non trouvé'))
        return result
      }

      // 2. Referential integrity check
      const deleteResult = safeDelete(existingStudent, 'student', allData, options)
      
      if (!deleteResult.allowed && !options.force) {
        deleteResult.conflicts?.forEach(conflict => 
          result.addError(new ValidationError(conflict.field, conflict.message, conflict.value))
        )
        return result
      }

      // 3. Add warnings for dependent records
      if (deleteResult.warnings) {
        deleteResult.warnings.forEach(warning => result.addWarning(warning))
      }

      // 4. Update version
      const version = updateVersion('student', studentId, userId)

      // 5. Audit logging
      const auditEntry = logStudentDelete(existingStudent, userId)

      result.success = true
      result.data = { deleted: true, student: existingStudent }
      result.setVersion(version)
      result.setAuditEntry(auditEntry)

      return result

    } catch (error) {
      if (error instanceof ReferentialIntegrityError) {
        error.conflicts.forEach(conflict => 
          result.addError(new ValidationError(conflict.field, conflict.message, conflict.value))
        )
      } else {
        result.addError(new ValidationError('system', `Erreur système: ${error.message}`))
      }
      return result
    }
  }

  // Group operations with full integrity checks
  async createGroup(groupData, userId, allData) {
    const result = new DataIntegrityResult()

    try {
      // 1. Validation
      const validationErrors = validateGroup(groupData, allData.groups || [], allData.students || [])
      if (validationErrors.length > 0) {
        validationErrors.forEach(error => result.addError(error))
        return result
      }

      // 2. Referential integrity check
      const integrityCheck = checkReferentialIntegrity(groupData, 'group', 'CREATE', allData)
      if (!integrityCheck.isValid) {
        integrityCheck.conflicts.forEach(conflict => 
          result.addError(new ValidationError(conflict.field, conflict.message, conflict.value))
        )
        return result
      }

      // 3. Generate ID and prepare final data
      const group = {
        ...groupData,
        id: this.generateId(allData.groups || []),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }

      // 4. Create version tracking
      const version = updateVersion('group', group.id, userId)

      // 5. Audit logging
      const auditEntry = logGroupCreate(group, userId)

      result.success = true
      result.data = group
      result.setVersion(version)
      result.setAuditEntry(auditEntry)

      return result

    } catch (error) {
      result.addError(new ValidationError('system', `Erreur système: ${error.message}`))
      return result
    }
  }

  async deleteGroup(groupId, userId, allData, options = {}) {
    const result = new DataIntegrityResult()

    try {
      // 1. Find existing group
      const existingGroup = allData.groups?.find(g => g.id === groupId)
      if (!existingGroup) {
        result.addError(new ValidationError('id', 'Groupe non trouvé'))
        return result
      }

      // 2. Get cascade delete preview if requested
      if (options.cascade) {
        const cascadePreview = getCascadeDeletePreview(existingGroup, 'group', allData)
        result.data = { cascadePreview }
        
        if (!options.confirmed) {
          result.addWarning('Suppression en cascade requiert confirmation')
          cascadePreview.warnings.forEach(warning => result.addWarning(warning))
          return result
        }
      }

      // 3. Referential integrity check
      const deleteResult = safeDelete(existingGroup, 'group', allData, options)
      
      if (!deleteResult.allowed && !options.force && !options.cascade) {
        deleteResult.conflicts?.forEach(conflict => 
          result.addError(new ValidationError(conflict.field, conflict.message, conflict.value))
        )
        return result
      }

      // 4. Update version
      const version = updateVersion('group', groupId, userId)

      // 5. Audit logging
      const auditEntry = logGroupDelete(existingGroup, userId)

      result.success = true
      result.data = { deleted: true, group: existingGroup }
      result.setVersion(version)
      result.setAuditEntry(auditEntry)

      return result

    } catch (error) {
      if (error instanceof ReferentialIntegrityError) {
        error.conflicts.forEach(conflict => 
          result.addError(new ValidationError(conflict.field, conflict.message, conflict.value))
        )
      } else {
        result.addError(new ValidationError('system', `Erreur système: ${error.message}`))
      }
      return result
    }
  }

  // Absence operations with full integrity checks
  async createAbsence(absenceData, userId, allData) {
    const result = new DataIntegrityResult()

    try {
      // 1. Validation
      const validationErrors = validateAbsence(absenceData, allData.absences || [])
      if (validationErrors.length > 0) {
        validationErrors.forEach(error => result.addError(error))
        return result
      }

      // 2. Referential integrity check
      const integrityCheck = checkReferentialIntegrity(absenceData, 'absence', 'CREATE', allData)
      if (!integrityCheck.isValid) {
        integrityCheck.conflicts.forEach(conflict => 
          result.addError(new ValidationError(conflict.field, conflict.message, conflict.value))
        )
        return result
      }

      // 3. Generate ID and prepare final data
      const absence = {
        ...absenceData,
        id: this.generateId(allData.absences || []),
        recordedBy: userId,
        recordedAt: new Date().toISOString(),
        canRollback: true,
        rollbackDeadline: new Date(Date.now() + 30 * 60 * 1000).toISOString() // 30 minutes
      }

      // 4. Create version tracking
      const version = updateVersion('absence', absence.id, userId)

      // 5. Audit logging
      const auditEntry = logAbsenceCreate(absence, userId)

      result.success = true
      result.data = absence
      result.setVersion(version)
      result.setAuditEntry(auditEntry)

      return result

    } catch (error) {
      result.addError(new ValidationError('system', `Erreur système: ${error.message}`))
      return result
    }
  }

  async rollbackAbsence(absenceId, userId, allData) {
    const result = new DataIntegrityResult()

    try {
      // 1. Find existing absence
      const existingAbsence = allData.absences?.find(a => a.id === absenceId)
      if (!existingAbsence) {
        result.addError(new ValidationError('id', 'Absence non trouvée'))
        return result
      }

      // 2. Check rollback eligibility
      const now = new Date()
      const rollbackDeadline = new Date(existingAbsence.rollbackDeadline)
      
      if (now > rollbackDeadline) {
        result.addError(new ValidationError('rollback', 'Délai de rollback expiré'))
        return result
      }

      if (existingAbsence.recordedBy !== userId) {
        result.addError(new ValidationError('rollback', 'Seul l\'utilisateur qui a enregistré l\'absence peut l\'annuler'))
        return result
      }

      // 3. Update version
      const version = updateVersion('absence', absenceId, userId)

      // 4. Audit logging
      const auditEntry = logAbsenceRollback(existingAbsence, userId)

      result.success = true
      result.data = { rolledBack: true, absence: existingAbsence }
      result.setVersion(version)
      result.setAuditEntry(auditEntry)

      return result

    } catch (error) {
      result.addError(new ValidationError('system', `Erreur système: ${error.message}`))
      return result
    }
  }

  // Excel import with full integrity checks
  async validateExcelImport(file, data, userId, allData) {
    const result = new DataIntegrityResult()

    try {
      // 1. File validation
      const fileErrors = validateFile(file)
      if (fileErrors.length > 0) {
        fileErrors.forEach(error => result.addError(error))
        return result
      }

      // 2. Data validation
      const dataErrors = validateExcelData(data, allData.students || [])
      if (dataErrors.length > 0) {
        dataErrors.forEach(error => result.addError(error))
        return result
      }

      // 3. Prepare preview data
      const previewData = data.map((row, index) => ({
        rowNumber: index + 2,
        cef: String(row.CEF || '').trim().toUpperCase(),
        nom: String(row.Nom || '').trim(),
        email: String(row.Email || '').trim().toLowerCase(),
        groupe: String(row.Groupe || '').trim()
      }))

      result.success = true
      result.data = {
        preview: previewData,
        count: previewData.length,
        file: {
          name: file.name,
          size: file.size,
          type: file.type
        }
      }

      return result

    } catch (error) {
      result.addError(new ValidationError('system', `Erreur système: ${error.message}`))
      return result
    }
  }

  async processExcelImport(validatedData, userId, allData) {
    const result = new DataIntegrityResult()
    const importedStudents = []
    const errors = []

    try {
      // Process each student with full integrity checks
      for (const studentData of validatedData.preview) {
        try {
          const createResult = await this.createStudent(studentData, userId, {
            ...allData,
            students: [...(allData.students || []), ...importedStudents]
          })

          if (createResult.success) {
            importedStudents.push(createResult.data)
          } else {
            errors.push({
              row: studentData.rowNumber,
              errors: createResult.errors
            })
          }
        } catch (error) {
          errors.push({
            row: studentData.rowNumber,
            errors: [new ValidationError('system', error.message)]
          })
        }
      }

      // 4. Audit logging for bulk import
      const auditEntry = logBulkImport('student', importedStudents.length, userId, {
        fileName: validatedData.file.name,
        totalRows: validatedData.count,
        successCount: importedStudents.length,
        errorCount: errors.length
      })

      result.success = errors.length === 0
      result.data = {
        imported: importedStudents,
        errors: errors,
        summary: {
          total: validatedData.count,
          success: importedStudents.length,
          failed: errors.length
        }
      }
      result.setAuditEntry(auditEntry)

      if (errors.length > 0) {
        result.addWarning(`${errors.length} ligne(s) n'ont pas pu être importées`)
      }

      return result

    } catch (error) {
      result.addError(new ValidationError('system', `Erreur système: ${error.message}`))
      return result
    }
  }

  // Utility methods
  generateId(existingItems) {
    const maxId = existingItems.reduce((max, item) => Math.max(max, item.id || 0), 0)
    return maxId + 1
  }

  // Batch operations with transaction-like behavior
  async batchOperation(operations, userId) {
    const results = []
    const rollbackOperations = []

    try {
      for (const operation of operations) {
        const result = await operation()
        results.push(result)

        if (!result.success) {
          // Rollback previous operations
          for (const rollback of rollbackOperations.reverse()) {
            try {
              await rollback()
            } catch (rollbackError) {
              console.error('Rollback failed:', rollbackError)
            }
          }
          break
        }

        // Add rollback operation if needed
        if (operation.rollback) {
          rollbackOperations.push(operation.rollback)
        }
      }

      return {
        success: results.every(r => r.success),
        results,
        summary: {
          total: operations.length,
          success: results.filter(r => r.success).length,
          failed: results.filter(r => !r.success).length
        }
      }

    } catch (error) {
      return {
        success: false,
        error: error.message,
        results
      }
    }
  }

  // Health check for data integrity
  performIntegrityCheck(allData) {
    const issues = []
    const warnings = []

    // Check for orphaned students (students without valid groups)
    const orphanedStudents = (allData.students || []).filter(student => 
      !allData.groups?.find(group => group.id === student.groupeId)
    )
    if (orphanedStudents.length > 0) {
      issues.push(`${orphanedStudents.length} étudiant(s) sans groupe valide`)
    }

    // Check for orphaned absences (absences without valid students)
    const orphanedAbsences = (allData.absences || []).filter(absence => 
      !allData.students?.find(student => student.id === absence.stagiaireId)
    )
    if (orphanedAbsences.length > 0) {
      issues.push(`${orphanedAbsences.length} absence(s) sans étudiant valide`)
    }

    // Check for duplicate CEFs
    const cefs = (allData.students || []).filter(s => s.cef).map(s => s.cef.toLowerCase())
    const duplicateCefs = cefs.filter((cef, index) => cefs.indexOf(cef) !== index)
    if (duplicateCefs.length > 0) {
      issues.push(`${duplicateCefs.length} CEF(s) en double`)
    }

    // Check for duplicate emails
    const emails = (allData.students || []).filter(s => s.email).map(s => s.email.toLowerCase())
    const duplicateEmails = emails.filter((email, index) => emails.indexOf(email) !== index)
    if (duplicateEmails.length > 0) {
      issues.push(`${duplicateEmails.length} email(s) en double`)
    }

    // Check for expired rollback deadlines
    const now = new Date()
    const expiredRollbacks = (allData.absences || []).filter(absence => 
      absence.canRollback && new Date(absence.rollbackDeadline) < now
    )
    if (expiredRollbacks.length > 0) {
      warnings.push(`${expiredRollbacks.length} absence(s) avec rollback expiré`)
    }

    return {
      isHealthy: issues.length === 0,
      issues,
      warnings,
      summary: {
        students: allData.students?.length || 0,
        groups: allData.groups?.length || 0,
        absences: allData.absences?.length || 0,
        orphanedStudents: orphanedStudents.length,
        orphanedAbsences: orphanedAbsences.length,
        duplicateCefs: duplicateCefs.length,
        duplicateEmails: duplicateEmails.length
      }
    }
  }
}

// Create singleton instance
export const dataIntegrityService = new DataIntegrityService()

// Export convenience functions
export const createStudent = (studentData, userId, allData) => 
  dataIntegrityService.createStudent(studentData, userId, allData)

export const updateStudent = (studentId, updateData, userId, allData, expectedVersion) => 
  dataIntegrityService.updateStudent(studentId, updateData, userId, allData, expectedVersion)

export const deleteStudent = (studentId, userId, allData, options) => 
  dataIntegrityService.deleteStudent(studentId, userId, allData, options)

export const createGroup = (groupData, userId, allData) => 
  dataIntegrityService.createGroup(groupData, userId, allData)

export const deleteGroup = (groupId, userId, allData, options) => 
  dataIntegrityService.deleteGroup(groupId, userId, allData, options)

export const createAbsence = (absenceData, userId, allData) => 
  dataIntegrityService.createAbsence(absenceData, userId, allData)

export const rollbackAbsence = (absenceId, userId, allData) => 
  dataIntegrityService.rollbackAbsence(absenceId, userId, allData)

export const validateExcelImport = (file, data, userId, allData) => 
  dataIntegrityService.validateExcelImport(file, data, userId, allData)

export const processExcelImport = (validatedData, userId, allData) => 
  dataIntegrityService.processExcelImport(validatedData, userId, allData)

export const performIntegrityCheck = (allData) => 
  dataIntegrityService.performIntegrityCheck(allData)