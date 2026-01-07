import {
  DataIntegrityResult,
  DataIntegrityService,
  dataIntegrityService,
  createStudent,
  updateStudent,
  deleteStudent,
  createAbsence,
  rollbackAbsence,
  performIntegrityCheck
} from './dataIntegrity.js'

// Mock the dependencies
jest.mock('./validation.js', () => ({
  validateStudent: jest.fn(),
  validateGroup: jest.fn(),
  validateAbsence: jest.fn(),
  validateExcelData: jest.fn(),
  validateFile: jest.fn(),
  ValidationError: class ValidationError extends Error {
    constructor(field, message, value = null) {
      super(message)
      this.name = 'ValidationError'
      this.field = field
      this.value = value
    }
  }
}))

jest.mock('./referentialIntegrity.js', () => ({
  checkReferentialIntegrity: jest.fn(),
  safeDelete: jest.fn(),
  getCascadeDeletePreview: jest.fn(),
  ReferentialIntegrityError: class ReferentialIntegrityError extends Error {
    constructor(entity, operation, conflicts) {
      super(`Referential integrity violation: ${operation} on ${entity}`)
      this.name = 'ReferentialIntegrityError'
      this.entity = entity
      this.operation = operation
      this.conflicts = conflicts
    }
  }
}))

jest.mock('./auditLog.js', () => ({
  auditLogger: {
    logStudentCreate: jest.fn(),
    logStudentUpdate: jest.fn(),
    logStudentDelete: jest.fn(),
    logAbsenceCreate: jest.fn(),
    logAbsenceRollback: jest.fn()
  },
  logStudentCreate: jest.fn(),
  logStudentUpdate: jest.fn(),
  logStudentDelete: jest.fn(),
  logAbsenceCreate: jest.fn(),
  logAbsenceRollback: jest.fn()
}))

jest.mock('./concurrencyControl.js', () => ({
  concurrencyManager: {
    updateVersion: jest.fn(),
    checkConcurrentModification: jest.fn()
  },
  updateVersion: jest.fn(),
  checkConcurrentModification: jest.fn()
}))

import { validateStudent, validateAbsence, ValidationError } from './validation.js'
import { checkReferentialIntegrity, safeDelete, ReferentialIntegrityError } from './referentialIntegrity.js'
import { logStudentCreate, logStudentUpdate, logStudentDelete, logAbsenceCreate, logAbsenceRollback } from './auditLog.js'
import { updateVersion, checkConcurrentModification } from './concurrencyControl.js'

describe('Data Integrity Service', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('DataIntegrityResult', () => {
    it('creates result with default values', () => {
      const result = new DataIntegrityResult()
      
      expect(result.success).toBe(false)
      expect(result.data).toBeNull()
      expect(result.errors).toEqual([])
      expect(result.warnings).toEqual([])
      expect(result.auditEntry).toBeNull()
      expect(result.version).toBeNull()
    })

    it('creates result with provided values', () => {
      const result = new DataIntegrityResult(true, { test: 'data' }, ['error'], ['warning'])
      
      expect(result.success).toBe(true)
      expect(result.data).toEqual({ test: 'data' })
      expect(result.errors).toEqual(['error'])
      expect(result.warnings).toEqual(['warning'])
    })

    it('adds errors and sets success to false', () => {
      const result = new DataIntegrityResult(true)
      const error = new ValidationError('field', 'message')
      
      result.addError(error)
      
      expect(result.success).toBe(false)
      expect(result.errors).toContain(error)
    })

    it('adds warnings without affecting success', () => {
      const result = new DataIntegrityResult(true)
      
      result.addWarning('warning message')
      
      expect(result.success).toBe(true)
      expect(result.warnings).toContain('warning message')
    })

    it('sets audit entry and version', () => {
      const result = new DataIntegrityResult()
      const auditEntry = { id: '1', action: 'CREATE' }
      const version = { version: 1 }
      
      result.setAuditEntry(auditEntry)
      result.setVersion(version)
      
      expect(result.auditEntry).toBe(auditEntry)
      expect(result.version).toBe(version)
    })
  })

  describe('DataIntegrityService', () => {
    let service
    const mockAllData = {
      students: [
        { id: 1, cef: 'CEF001', nom: 'Existing Student', email: 'existing@ofppt.ma', groupeId: 1 }
      ],
      groups: [
        { id: 1, nom: 'DEV101', filiereId: 1 }
      ],
      absences: [
        { id: 1, stagiaireId: 1, date: '2025-01-15', duree: 2.5 }
      ]
    }

    beforeEach(() => {
      service = new DataIntegrityService()
    })

    describe('createStudent', () => {
      const validStudentData = {
        cef: 'CEF002',
        nom: 'New Student',
        email: 'new@ofppt.ma',
        groupeId: 1
      }

      it('creates student successfully with valid data', async () => {
        validateStudent.mockReturnValue([])
        checkReferentialIntegrity.mockReturnValue({ isValid: true, conflicts: [] })
        updateVersion.mockReturnValue({ version: 1 })
        logStudentCreate.mockReturnValue({ id: 'audit1' })

        const result = await service.createStudent(validStudentData, 'user123', mockAllData)

        expect(result.success).toBe(true)
        expect(result.data.cef).toBe('CEF002')
        expect(result.data.id).toBeDefined()
        expect(result.data.createdAt).toBeDefined()
        expect(result.data.updatedAt).toBeDefined()
        expect(validateStudent).toHaveBeenCalledWith(validStudentData, mockAllData.students)
        expect(checkReferentialIntegrity).toHaveBeenCalledWith(validStudentData, 'student', 'CREATE', mockAllData)
        expect(updateVersion).toHaveBeenCalled()
        expect(logStudentCreate).toHaveBeenCalled()
      })

      it('fails with validation errors', async () => {
        const validationError = new ValidationError('cef', 'CEF is required')
        validateStudent.mockReturnValue([validationError])

        const result = await service.createStudent(validStudentData, 'user123', mockAllData)

        expect(result.success).toBe(false)
        expect(result.errors).toContain(validationError)
        expect(checkReferentialIntegrity).not.toHaveBeenCalled()
      })

      it('fails with referential integrity errors', async () => {
        validateStudent.mockReturnValue([])
        checkReferentialIntegrity.mockReturnValue({
          isValid: false,
          conflicts: [{ field: 'groupeId', message: 'Group not found', value: 999 }]
        })

        const result = await service.createStudent(validStudentData, 'user123', mockAllData)

        expect(result.success).toBe(false)
        expect(result.errors).toHaveLength(1)
        expect(result.errors[0].field).toBe('groupeId')
      })

      it('handles system errors', async () => {
        validateStudent.mockImplementation(() => {
          throw new Error('System error')
        })

        const result = await service.createStudent(validStudentData, 'user123', mockAllData)

        expect(result.success).toBe(false)
        expect(result.errors[0].field).toBe('system')
        expect(result.errors[0].message).toContain('Erreur système')
      })
    })

    describe('updateStudent', () => {
      const updateData = { nom: 'Updated Name' }

      it('updates student successfully', async () => {
        validateStudent.mockReturnValue([])
        checkReferentialIntegrity.mockReturnValue({ isValid: true, conflicts: [] })
        checkConcurrentModification.mockReturnValue({ hasConflicts: false, canProceed: true })
        updateVersion.mockReturnValue({ version: 2 })
        logStudentUpdate.mockReturnValue({ id: 'audit2' })

        const result = await service.updateStudent(1, updateData, 'user123', mockAllData)

        expect(result.success).toBe(true)
        expect(result.data.nom).toBe('Updated Name')
        expect(result.data.updatedAt).toBeDefined()
        expect(validateStudent).toHaveBeenCalled()
        expect(updateVersion).toHaveBeenCalledWith('student', 1, 'user123')
        expect(logStudentUpdate).toHaveBeenCalled()
      })

      it('fails when student not found', async () => {
        const result = await service.updateStudent(999, updateData, 'user123', mockAllData)

        expect(result.success).toBe(false)
        expect(result.errors[0].field).toBe('id')
        expect(result.errors[0].message).toBe('Étudiant non trouvé')
      })

      it('fails with concurrency conflicts', async () => {
        const expectedVersion = { version: 1 }
        checkConcurrentModification.mockReturnValue({
          hasConflicts: true,
          canProceed: false,
          conflicts: [{ field: 'version', message: 'Version mismatch' }]
        })

        const result = await service.updateStudent(1, updateData, 'user123', mockAllData, expectedVersion)

        expect(result.success).toBe(false)
        expect(result.errors[0].field).toBe('version')
      })
    })

    describe('deleteStudent', () => {
      it('deletes student successfully when no conflicts', async () => {
        safeDelete.mockReturnValue({ allowed: true })
        updateVersion.mockReturnValue({ version: 2 })
        logStudentDelete.mockReturnValue({ id: 'audit3' })

        const result = await service.deleteStudent(1, 'user123', mockAllData)

        expect(result.success).toBe(true)
        expect(result.data.deleted).toBe(true)
        expect(result.data.student).toEqual(mockAllData.students[0])
        expect(safeDelete).toHaveBeenCalledWith(mockAllData.students[0], 'student', mockAllData, {})
        expect(logStudentDelete).toHaveBeenCalled()
      })

      it('fails when student not found', async () => {
        const result = await service.deleteStudent(999, 'user123', mockAllData)

        expect(result.success).toBe(false)
        expect(result.errors[0].field).toBe('id')
        expect(result.errors[0].message).toBe('Étudiant non trouvé')
      })

      it('fails with referential integrity conflicts', async () => {
        safeDelete.mockImplementation(() => {
          throw new ReferentialIntegrityError('student', 'DELETE', [
            { field: 'absences', message: 'Student has absences', value: 1 }
          ])
        })

        const result = await service.deleteStudent(1, 'user123', mockAllData)

        expect(result.success).toBe(false)
        expect(result.errors[0].field).toBe('absences')
      })

      it('succeeds with force option despite conflicts', async () => {
        safeDelete.mockReturnValue({
          allowed: true,
          warnings: ['Student has dependent records']
        })
        updateVersion.mockReturnValue({ version: 2 })
        logStudentDelete.mockReturnValue({ id: 'audit3' })

        const result = await service.deleteStudent(1, 'user123', mockAllData, { force: true })

        expect(result.success).toBe(true)
        expect(result.warnings).toContain('Student has dependent records')
      })
    })

    describe('createAbsence', () => {
      const validAbsenceData = {
        stagiaireId: 1,
        date: '2025-01-16',
        duree: 2.5,
        etat: 'NJ'
      }

      it('creates absence successfully', async () => {
        validateAbsence.mockReturnValue([])
        checkReferentialIntegrity.mockReturnValue({ isValid: true, conflicts: [] })
        updateVersion.mockReturnValue({ version: 1 })
        logAbsenceCreate.mockReturnValue({ id: 'audit4' })

        const result = await service.createAbsence(validAbsenceData, 'user123', mockAllData)

        expect(result.success).toBe(true)
        expect(result.data.stagiaireId).toBe(1)
        expect(result.data.recordedBy).toBe('user123')
        expect(result.data.recordedAt).toBeDefined()
        expect(result.data.canRollback).toBe(true)
        expect(result.data.rollbackDeadline).toBeDefined()
        expect(validateAbsence).toHaveBeenCalledWith(validAbsenceData, mockAllData.absences)
        expect(logAbsenceCreate).toHaveBeenCalled()
      })

      it('fails with validation errors', async () => {
        const validationError = new ValidationError('stagiaireId', 'Student is required')
        validateAbsence.mockReturnValue([validationError])

        const result = await service.createAbsence(validAbsenceData, 'user123', mockAllData)

        expect(result.success).toBe(false)
        expect(result.errors).toContain(validationError)
      })
    })

    describe('rollbackAbsence', () => {
      const rollbackableAbsence = {
        id: 1,
        stagiaireId: 1,
        recordedBy: 'user123',
        rollbackDeadline: new Date(Date.now() + 10 * 60 * 1000).toISOString() // 10 minutes from now
      }

      beforeEach(() => {
        mockAllData.absences = [rollbackableAbsence]
      })

      it('rolls back absence successfully', async () => {
        updateVersion.mockReturnValue({ version: 2 })
        logAbsenceRollback.mockReturnValue({ id: 'audit5' })

        const result = await service.rollbackAbsence(1, 'user123', mockAllData)

        expect(result.success).toBe(true)
        expect(result.data.rolledBack).toBe(true)
        expect(result.data.absence).toEqual(rollbackableAbsence)
        expect(logAbsenceRollback).toHaveBeenCalledWith(rollbackableAbsence, 'user123')
      })

      it('fails when absence not found', async () => {
        const result = await service.rollbackAbsence(999, 'user123', mockAllData)

        expect(result.success).toBe(false)
        expect(result.errors[0].field).toBe('id')
        expect(result.errors[0].message).toBe('Absence non trouvée')
      })

      it('fails when rollback deadline expired', async () => {
        const expiredAbsence = {
          ...rollbackableAbsence,
          rollbackDeadline: new Date(Date.now() - 10 * 60 * 1000).toISOString() // 10 minutes ago
        }
        mockAllData.absences = [expiredAbsence]

        const result = await service.rollbackAbsence(1, 'user123', mockAllData)

        expect(result.success).toBe(false)
        expect(result.errors[0].field).toBe('rollback')
        expect(result.errors[0].message).toBe('Délai de rollback expiré')
      })

      it('fails when user is not the one who recorded the absence', async () => {
        const otherUserAbsence = {
          ...rollbackableAbsence,
          recordedBy: 'otherUser'
        }
        mockAllData.absences = [otherUserAbsence]

        const result = await service.rollbackAbsence(1, 'user123', mockAllData)

        expect(result.success).toBe(false)
        expect(result.errors[0].field).toBe('rollback')
        expect(result.errors[0].message).toBe('Seul l\'utilisateur qui a enregistré l\'absence peut l\'annuler')
      })
    })

    describe('generateId', () => {
      it('generates ID 1 for empty array', () => {
        const id = service.generateId([])
        expect(id).toBe(1)
      })

      it('generates next ID based on existing items', () => {
        const items = [{ id: 1 }, { id: 3 }, { id: 2 }]
        const id = service.generateId(items)
        expect(id).toBe(4)
      })

      it('handles items without ID', () => {
        const items = [{ id: 1 }, { name: 'no id' }, { id: 2 }]
        const id = service.generateId(items)
        expect(id).toBe(3)
      })
    })

    describe('performIntegrityCheck', () => {
      it('reports healthy system with no issues', () => {
        const healthyData = {
          students: [
            { id: 1, cef: 'CEF001', email: 'test1@ofppt.ma', groupeId: 1 }
          ],
          groups: [
            { id: 1, nom: 'DEV101' }
          ],
          absences: [
            { id: 1, stagiaireId: 1, canRollback: false }
          ]
        }

        const result = service.performIntegrityCheck(healthyData)

        expect(result.isHealthy).toBe(true)
        expect(result.issues).toHaveLength(0)
        expect(result.summary.students).toBe(1)
        expect(result.summary.groups).toBe(1)
        expect(result.summary.absences).toBe(1)
      })

      it('detects orphaned students', () => {
        const dataWithOrphanedStudents = {
          students: [
            { id: 1, cef: 'CEF001', email: 'test1@ofppt.ma', groupeId: 999 } // Non-existent group
          ],
          groups: [],
          absences: []
        }

        const result = service.performIntegrityCheck(dataWithOrphanedStudents)

        expect(result.isHealthy).toBe(false)
        expect(result.issues).toContain('1 étudiant(s) sans groupe valide')
        expect(result.summary.orphanedStudents).toBe(1)
      })

      it('detects orphaned absences', () => {
        const dataWithOrphanedAbsences = {
          students: [],
          groups: [],
          absences: [
            { id: 1, stagiaireId: 999 } // Non-existent student
          ]
        }

        const result = service.performIntegrityCheck(dataWithOrphanedAbsences)

        expect(result.isHealthy).toBe(false)
        expect(result.issues).toContain('1 absence(s) sans étudiant valide')
        expect(result.summary.orphanedAbsences).toBe(1)
      })

      it('detects duplicate CEFs', () => {
        const dataWithDuplicateCefs = {
          students: [
            { id: 1, cef: 'CEF001', email: 'test1@ofppt.ma', groupeId: 1 },
            { id: 2, cef: 'CEF001', email: 'test2@ofppt.ma', groupeId: 1 } // Duplicate CEF
          ],
          groups: [{ id: 1 }],
          absences: []
        }

        const result = service.performIntegrityCheck(dataWithDuplicateCefs)

        expect(result.isHealthy).toBe(false)
        expect(result.issues).toContain('1 CEF(s) en double')
        expect(result.summary.duplicateCefs).toBe(1)
      })

      it('detects duplicate emails', () => {
        const dataWithDuplicateEmails = {
          students: [
            { id: 1, cef: 'CEF001', email: 'test@ofppt.ma', groupeId: 1 },
            { id: 2, cef: 'CEF002', email: 'test@ofppt.ma', groupeId: 1 } // Duplicate email
          ],
          groups: [{ id: 1 }],
          absences: []
        }

        const result = service.performIntegrityCheck(dataWithDuplicateEmails)

        expect(result.isHealthy).toBe(false)
        expect(result.issues).toContain('1 email(s) en double')
        expect(result.summary.duplicateEmails).toBe(1)
      })

      it('detects expired rollback deadlines', () => {
        const dataWithExpiredRollbacks = {
          students: [{ id: 1, cef: 'CEF001', email: 'test@ofppt.ma', groupeId: 1 }],
          groups: [{ id: 1 }],
          absences: [
            {
              id: 1,
              stagiaireId: 1,
              canRollback: true,
              rollbackDeadline: new Date(Date.now() - 10 * 60 * 1000).toISOString() // Expired
            }
          ]
        }

        const result = service.performIntegrityCheck(dataWithExpiredRollbacks)

        expect(result.isHealthy).toBe(true) // Expired rollbacks are warnings, not issues
        expect(result.warnings).toContain('1 absence(s) avec rollback expiré')
      })
    })
  })

  describe('convenience functions', () => {
    beforeEach(() => {
      validateStudent.mockReturnValue([])
      checkReferentialIntegrity.mockReturnValue({ isValid: true, conflicts: [] })
      updateVersion.mockReturnValue({ version: 1 })
      logStudentCreate.mockReturnValue({ id: 'audit1' })
    })

    it('creates student using convenience function', async () => {
      const studentData = { cef: 'CEF002', nom: 'Test', email: 'test@ofppt.ma', groupeId: 1 }
      const result = await createStudent(studentData, 'user123', { students: [] })

      expect(result.success).toBe(true)
      expect(result.data.cef).toBe('CEF002')
    })

    it('performs integrity check using convenience function', () => {
      const result = performIntegrityCheck({ students: [], groups: [], absences: [] })

      expect(result.isHealthy).toBe(true)
      expect(result.summary.students).toBe(0)
    })
  })
})