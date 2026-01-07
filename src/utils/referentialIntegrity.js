// Referential integrity utilities for maintaining data consistency

// Referential integrity error class
export class ReferentialIntegrityError extends Error {
  constructor(entity, operation, conflicts) {
    super(`Referential integrity violation: ${operation} on ${entity}`)
    this.name = 'ReferentialIntegrityError'
    this.entity = entity
    this.operation = operation
    this.conflicts = conflicts
  }
}

// Check referential integrity for student operations
export const checkStudentIntegrity = (student, operation, allData) => {
  const conflicts = []

  switch (operation) {
    case 'CREATE':
    case 'UPDATE':
      // Check if group exists
      const group = allData.groups?.find(g => g.id === student.groupeId)
      if (!group) {
        conflicts.push({
          type: 'MISSING_REFERENCE',
          field: 'groupeId',
          message: `Groupe avec ID ${student.groupeId} n'existe pas`,
          value: student.groupeId
        })
      }

      // Check if filiere exists (through group)
      if (group) {
        const filiere = allData.filieres?.find(f => f.id === group.filiereId)
        if (!filiere) {
          conflicts.push({
            type: 'MISSING_REFERENCE',
            field: 'filiereId',
            message: `Filière avec ID ${group.filiereId} n'existe pas`,
            value: group.filiereId
          })
        }

        // Check if secteur exists (through filiere)
        if (filiere) {
          const secteur = allData.secteurs?.find(s => s.id === filiere.secteurId)
          if (!secteur) {
            conflicts.push({
              type: 'MISSING_REFERENCE',
              field: 'secteurId',
              message: `Secteur avec ID ${filiere.secteurId} n'existe pas`,
              value: filiere.secteurId
            })
          }
        }
      }
      break

    case 'DELETE':
      // Check if student has absence records
      const absences = allData.absences?.filter(a => a.stagiaireId === student.id) || []
      if (absences.length > 0) {
        conflicts.push({
          type: 'DEPENDENT_RECORDS',
          field: 'absences',
          message: `Impossible de supprimer: ${absences.length} absence(s) enregistrée(s)`,
          value: absences.length,
          dependentRecords: absences
        })
      }
      break
  }

  return conflicts
}

// Check referential integrity for group operations
export const checkGroupIntegrity = (group, operation, allData) => {
  const conflicts = []

  switch (operation) {
    case 'CREATE':
    case 'UPDATE':
      // Check if filiere exists
      const filiere = allData.filieres?.find(f => f.id === group.filiereId)
      if (!filiere) {
        conflicts.push({
          type: 'MISSING_REFERENCE',
          field: 'filiereId',
          message: `Filière avec ID ${group.filiereId} n'existe pas`,
          value: group.filiereId
        })
      }

      // Check if secteur exists (through filiere)
      if (filiere) {
        const secteur = allData.secteurs?.find(s => s.id === filiere.secteurId)
        if (!secteur) {
          conflicts.push({
            type: 'MISSING_REFERENCE',
            field: 'secteurId',
            message: `Secteur avec ID ${filiere.secteurId} n'existe pas`,
            value: filiere.secteurId
          })
        }
      }
      break

    case 'DELETE':
      // Check if group has students
      const students = allData.students?.filter(s => s.groupeId === group.id) || []
      if (students.length > 0) {
        conflicts.push({
          type: 'DEPENDENT_RECORDS',
          field: 'students',
          message: `Impossible de supprimer: ${students.length} étudiant(s) assigné(s)`,
          value: students.length,
          dependentRecords: students
        })
      }

      // Check if group has absence records (through students)
      const groupAbsences = allData.absences?.filter(a => 
        students.some(s => s.id === a.stagiaireId)
      ) || []
      if (groupAbsences.length > 0) {
        conflicts.push({
          type: 'DEPENDENT_RECORDS',
          field: 'absences',
          message: `Impossible de supprimer: ${groupAbsences.length} absence(s) enregistrée(s) pour les étudiants du groupe`,
          value: groupAbsences.length,
          dependentRecords: groupAbsences
        })
      }
      break
  }

  return conflicts
}

// Check referential integrity for absence operations
export const checkAbsenceIntegrity = (absence, operation, allData) => {
  const conflicts = []

  switch (operation) {
    case 'CREATE':
    case 'UPDATE':
      // Check if student exists
      const student = allData.students?.find(s => s.id === absence.stagiaireId)
      if (!student) {
        conflicts.push({
          type: 'MISSING_REFERENCE',
          field: 'stagiaireId',
          message: `Étudiant avec ID ${absence.stagiaireId} n'existe pas`,
          value: absence.stagiaireId
        })
      }

      // Check if student's group exists
      if (student) {
        const group = allData.groups?.find(g => g.id === student.groupeId)
        if (!group) {
          conflicts.push({
            type: 'MISSING_REFERENCE',
            field: 'groupeId',
            message: `Groupe avec ID ${student.groupeId} n'existe pas pour l'étudiant`,
            value: student.groupeId
          })
        }
      }
      break

    case 'DELETE':
      // No referential integrity issues for deleting absences
      break
  }

  return conflicts
}

// Check referential integrity for filiere operations
export const checkFiliereIntegrity = (filiere, operation, allData) => {
  const conflicts = []

  switch (operation) {
    case 'CREATE':
    case 'UPDATE':
      // Check if secteur exists
      const secteur = allData.secteurs?.find(s => s.id === filiere.secteurId)
      if (!secteur) {
        conflicts.push({
          type: 'MISSING_REFERENCE',
          field: 'secteurId',
          message: `Secteur avec ID ${filiere.secteurId} n'existe pas`,
          value: filiere.secteurId
        })
      }
      break

    case 'DELETE':
      // Check if filiere has groups
      const groups = allData.groups?.filter(g => g.filiereId === filiere.id) || []
      if (groups.length > 0) {
        conflicts.push({
          type: 'DEPENDENT_RECORDS',
          field: 'groups',
          message: `Impossible de supprimer: ${groups.length} groupe(s) assigné(s)`,
          value: groups.length,
          dependentRecords: groups
        })
      }
      break
  }

  return conflicts
}

// Check referential integrity for secteur operations
export const checkSecteurIntegrity = (secteur, operation, allData) => {
  const conflicts = []

  switch (operation) {
    case 'DELETE':
      // Check if secteur has filieres
      const filieres = allData.filieres?.filter(f => f.secteurId === secteur.id) || []
      if (filieres.length > 0) {
        conflicts.push({
          type: 'DEPENDENT_RECORDS',
          field: 'filieres',
          message: `Impossible de supprimer: ${filieres.length} filière(s) assignée(s)`,
          value: filieres.length,
          dependentRecords: filieres
        })
      }
      break
  }

  return conflicts
}

// Generic referential integrity checker
export const checkReferentialIntegrity = (entity, entityType, operation, allData) => {
  let conflicts = []

  switch (entityType) {
    case 'student':
      conflicts = checkStudentIntegrity(entity, operation, allData)
      break
    case 'group':
      conflicts = checkGroupIntegrity(entity, operation, allData)
      break
    case 'absence':
      conflicts = checkAbsenceIntegrity(entity, operation, allData)
      break
    case 'filiere':
      conflicts = checkFiliereIntegrity(entity, operation, allData)
      break
    case 'secteur':
      conflicts = checkSecteurIntegrity(entity, operation, allData)
      break
    default:
      throw new Error(`Unknown entity type: ${entityType}`)
  }

  return {
    isValid: conflicts.length === 0,
    conflicts,
    hasBlockingConflicts: () => conflicts.some(c => c.type === 'DEPENDENT_RECORDS' || c.type === 'MISSING_REFERENCE'),
    getConflictsByType: (type) => conflicts.filter(c => c.type === type),
    getAllMessages: () => conflicts.map(c => c.message)
  }
}

// Cascade delete helper - returns what would be deleted
export const getCascadeDeletePreview = (entity, entityType, allData) => {
  const toDelete = {
    [entityType]: [entity],
    warnings: []
  }

  switch (entityType) {
    case 'secteur':
      // Find all filieres in this secteur
      const secteurFilieres = allData.filieres?.filter(f => f.secteurId === entity.id) || []
      toDelete.filieres = secteurFilieres
      
      // Find all groups in these filieres
      const secteurGroups = allData.groups?.filter(g => 
        secteurFilieres.some(f => f.id === g.filiereId)
      ) || []
      toDelete.groups = secteurGroups
      
      // Find all students in these groups
      const secteurStudents = allData.students?.filter(s => 
        secteurGroups.some(g => g.id === s.groupeId)
      ) || []
      toDelete.students = secteurStudents
      
      // Find all absences for these students
      const secteurAbsences = allData.absences?.filter(a => 
        secteurStudents.some(s => s.id === a.stagiaireId)
      ) || []
      toDelete.absences = secteurAbsences
      break

    case 'filiere':
      // Find all groups in this filiere
      const filiereGroups = allData.groups?.filter(g => g.filiereId === entity.id) || []
      toDelete.groups = filiereGroups
      
      // Find all students in these groups
      const filiereStudents = allData.students?.filter(s => 
        filiereGroups.some(g => g.id === s.groupeId)
      ) || []
      toDelete.students = filiereStudents
      
      // Find all absences for these students
      const filiereAbsences = allData.absences?.filter(a => 
        filiereStudents.some(s => s.id === a.stagiaireId)
      ) || []
      toDelete.absences = filiereAbsences
      break

    case 'group':
      // Find all students in this group
      const groupStudents = allData.students?.filter(s => s.groupeId === entity.id) || []
      toDelete.students = groupStudents
      
      // Find all absences for these students
      const groupAbsences = allData.absences?.filter(a => 
        groupStudents.some(s => s.id === a.stagiaireId)
      ) || []
      toDelete.absences = groupAbsences
      break

    case 'student':
      // Find all absences for this student
      const studentAbsences = allData.absences?.filter(a => a.stagiaireId === entity.id) || []
      toDelete.absences = studentAbsences
      break
  }

  // Add warnings for significant deletions
  if (toDelete.students?.length > 0) {
    toDelete.warnings.push(`${toDelete.students.length} étudiant(s) seront supprimé(s)`)
  }
  if (toDelete.absences?.length > 0) {
    toDelete.warnings.push(`${toDelete.absences.length} absence(s) seront supprimée(s)`)
  }
  if (toDelete.groups?.length > 0) {
    toDelete.warnings.push(`${toDelete.groups.length} groupe(s) seront supprimé(s)`)
  }
  if (toDelete.filieres?.length > 0) {
    toDelete.warnings.push(`${toDelete.filieres.length} filière(s) seront supprimée(s)`)
  }

  return toDelete
}

// Safe delete helper - performs referential integrity checks before deletion
export const safeDelete = (entity, entityType, allData, options = {}) => {
  const { force = false, cascade = false } = options
  
  // Check referential integrity
  const integrityCheck = checkReferentialIntegrity(entity, entityType, 'DELETE', allData)
  
  if (!integrityCheck.isValid && !force && !cascade) {
    throw new ReferentialIntegrityError(entityType, 'DELETE', integrityCheck.conflicts)
  }

  // If cascade is enabled, return what would be deleted
  if (cascade) {
    return getCascadeDeletePreview(entity, entityType, allData)
  }

  // If force is enabled, allow deletion despite conflicts
  if (force) {
    return {
      allowed: true,
      warnings: integrityCheck.getAllMessages()
    }
  }

  return {
    allowed: integrityCheck.isValid,
    conflicts: integrityCheck.conflicts
  }
}