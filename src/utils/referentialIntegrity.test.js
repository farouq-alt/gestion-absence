import {
  checkStudentIntegrity,
  checkGroupIntegrity,
  checkAbsenceIntegrity,
  checkReferentialIntegrity,
  safeDelete,
  getCascadeDeletePreview,
  ReferentialIntegrityError
} from './referentialIntegrity.js'

describe('Referential Integrity Utilities', () => {
  const mockData = {
    secteurs: [
      { id: 1, nom: 'IA & Digital' },
      { id: 2, nom: 'Industriel' }
    ],
    filieres: [
      { id: 1, nom: 'Développement Digital', secteurId: 1 },
      { id: 2, nom: 'Infrastructure Digitale', secteurId: 1 }
    ],
    groups: [
      { id: 1, nom: 'DEV101', filiereId: 1 },
      { id: 2, nom: 'DEV102', filiereId: 1 }
    ],
    students: [
      { id: 1, cef: 'CEF001', nom: 'ALAMI Mohammed', groupeId: 1 },
      { id: 2, cef: 'CEF002', nom: 'BENALI Fatima', groupeId: 1 }
    ],
    absences: [
      { id: 1, stagiaireId: 1, date: '2025-01-15', duree: 2.5 },
      { id: 2, stagiaireId: 2, date: '2025-01-16', duree: 5 }
    ]
  }

  describe('checkStudentIntegrity', () => {
    it('validates student creation with valid group', () => {
      const student = { id: 3, cef: 'CEF003', groupeId: 1 }
      const conflicts = checkStudentIntegrity(student, 'CREATE', mockData)
      expect(conflicts).toHaveLength(0)
    })

    it('detects missing group reference', () => {
      const student = { id: 3, cef: 'CEF003', groupeId: 999 }
      const conflicts = checkStudentIntegrity(student, 'CREATE', mockData)
      expect(conflicts).toHaveLength(1)
      expect(conflicts[0].type).toBe('MISSING_REFERENCE')
      expect(conflicts[0].field).toBe('groupeId')
      expect(conflicts[0].message).toBe('Groupe avec ID 999 n\'existe pas')
    })

    it('detects missing filiere reference through group', () => {
      const dataWithInvalidGroup = {
        ...mockData,
        groups: [{ id: 1, nom: 'DEV101', filiereId: 999 }]
      }
      const student = { id: 3, cef: 'CEF003', groupeId: 1 }
      const conflicts = checkStudentIntegrity(student, 'CREATE', dataWithInvalidGroup)
      expect(conflicts).toHaveLength(1)
      expect(conflicts[0].type).toBe('MISSING_REFERENCE')
      expect(conflicts[0].field).toBe('filiereId')
    })

    it('prevents deletion when student has absences', () => {
      const student = { id: 1, cef: 'CEF001' }
      const conflicts = checkStudentIntegrity(student, 'DELETE', mockData)
      expect(conflicts).toHaveLength(1)
      expect(conflicts[0].type).toBe('DEPENDENT_RECORDS')
      expect(conflicts[0].field).toBe('absences')
      expect(conflicts[0].message).toBe('Impossible de supprimer: 1 absence(s) enregistrée(s)')
    })

    it('allows deletion when student has no absences', () => {
      const student = { id: 3, cef: 'CEF003' }
      const conflicts = checkStudentIntegrity(student, 'DELETE', mockData)
      expect(conflicts).toHaveLength(0)
    })
  })

  describe('checkGroupIntegrity', () => {
    it('validates group creation with valid filiere', () => {
      const group = { id: 3, nom: 'DEV103', filiereId: 1 }
      const conflicts = checkGroupIntegrity(group, 'CREATE', mockData)
      expect(conflicts).toHaveLength(0)
    })

    it('detects missing filiere reference', () => {
      const group = { id: 3, nom: 'DEV103', filiereId: 999 }
      const conflicts = checkGroupIntegrity(group, 'CREATE', mockData)
      expect(conflicts).toHaveLength(1)
      expect(conflicts[0].type).toBe('MISSING_REFERENCE')
      expect(conflicts[0].field).toBe('filiereId')
    })

    it('prevents deletion when group has students', () => {
      const group = { id: 1, nom: 'DEV101' }
      const conflicts = checkGroupIntegrity(group, 'DELETE', mockData)
      expect(conflicts).toHaveLength(2) // Students and absences through students
      expect(conflicts[0].type).toBe('DEPENDENT_RECORDS')
      expect(conflicts[0].field).toBe('students')
      expect(conflicts[1].field).toBe('absences')
    })

    it('allows deletion when group has no students', () => {
      const group = { id: 3, nom: 'DEV103' }
      const conflicts = checkGroupIntegrity(group, 'DELETE', mockData)
      expect(conflicts).toHaveLength(0)
    })
  })

  describe('checkAbsenceIntegrity', () => {
    it('validates absence creation with valid student', () => {
      const absence = { id: 3, stagiaireId: 1, date: '2025-01-17' }
      const conflicts = checkAbsenceIntegrity(absence, 'CREATE', mockData)
      expect(conflicts).toHaveLength(0)
    })

    it('detects missing student reference', () => {
      const absence = { id: 3, stagiaireId: 999, date: '2025-01-17' }
      const conflicts = checkAbsenceIntegrity(absence, 'CREATE', mockData)
      expect(conflicts).toHaveLength(1)
      expect(conflicts[0].type).toBe('MISSING_REFERENCE')
      expect(conflicts[0].field).toBe('stagiaireId')
    })

    it('detects missing group reference through student', () => {
      const dataWithInvalidStudent = {
        ...mockData,
        students: [{ id: 1, cef: 'CEF001', groupeId: 999 }]
      }
      const absence = { id: 3, stagiaireId: 1, date: '2025-01-17' }
      const conflicts = checkAbsenceIntegrity(absence, 'CREATE', dataWithInvalidStudent)
      expect(conflicts).toHaveLength(1)
      expect(conflicts[0].type).toBe('MISSING_REFERENCE')
      expect(conflicts[0].field).toBe('groupeId')
    })

    it('allows absence deletion without conflicts', () => {
      const absence = { id: 1, stagiaireId: 1 }
      const conflicts = checkAbsenceIntegrity(absence, 'DELETE', mockData)
      expect(conflicts).toHaveLength(0)
    })
  })

  describe('checkReferentialIntegrity', () => {
    it('returns valid result for valid entity', () => {
      const student = { id: 3, cef: 'CEF003', groupeId: 1 }
      const result = checkReferentialIntegrity(student, 'student', 'CREATE', mockData)
      expect(result.isValid).toBe(true)
      expect(result.conflicts).toHaveLength(0)
      expect(result.hasBlockingConflicts()).toBe(false)
    })

    it('returns invalid result with conflicts', () => {
      const student = { id: 3, cef: 'CEF003', groupeId: 999 }
      const result = checkReferentialIntegrity(student, 'student', 'CREATE', mockData)
      expect(result.isValid).toBe(false)
      expect(result.conflicts).toHaveLength(1)
      expect(result.hasBlockingConflicts()).toBe(true)
    })

    it('filters conflicts by type', () => {
      const group = { id: 1, nom: 'DEV101' }
      const result = checkReferentialIntegrity(group, 'group', 'DELETE', mockData)
      const dependentConflicts = result.getConflictsByType('DEPENDENT_RECORDS')
      expect(dependentConflicts).toHaveLength(2)
    })

    it('gets all conflict messages', () => {
      const student = { id: 3, cef: 'CEF003', groupeId: 999 }
      const result = checkReferentialIntegrity(student, 'student', 'CREATE', mockData)
      const messages = result.getAllMessages()
      expect(messages).toHaveLength(1)
      expect(messages[0]).toBe('Groupe avec ID 999 n\'existe pas')
    })

    it('throws error for unknown entity type', () => {
      const entity = { id: 1 }
      expect(() => {
        checkReferentialIntegrity(entity, 'unknown', 'CREATE', mockData)
      }).toThrow('Unknown entity type: unknown')
    })
  })

  describe('safeDelete', () => {
    it('allows deletion when no conflicts', () => {
      const student = { id: 3, cef: 'CEF003' }
      const result = safeDelete(student, 'student', mockData)
      expect(result.allowed).toBe(true)
      expect(result.conflicts).toEqual([])
    })

    it('prevents deletion when conflicts exist', () => {
      const student = { id: 1, cef: 'CEF001' }
      expect(() => {
        safeDelete(student, 'student', mockData)
      }).toThrow(ReferentialIntegrityError)
    })

    it('allows forced deletion despite conflicts', () => {
      const student = { id: 1, cef: 'CEF001' }
      const result = safeDelete(student, 'student', mockData, { force: true })
      expect(result.allowed).toBe(true)
      expect(result.warnings).toHaveLength(1)
    })

    it('returns cascade preview when cascade option enabled', () => {
      const group = { id: 1, nom: 'DEV101' }
      const result = safeDelete(group, 'group', mockData, { cascade: true })
      expect(result.group).toEqual([group])
      expect(result.students).toHaveLength(2)
      expect(result.absences).toHaveLength(2)
      expect(result.warnings).toContain('2 étudiant(s) seront supprimé(s)')
    })
  })

  describe('getCascadeDeletePreview', () => {
    it('shows cascade effects for secteur deletion', () => {
      const secteur = { id: 1, nom: 'IA & Digital' }
      const preview = getCascadeDeletePreview(secteur, 'secteur', mockData)
      
      expect(preview.secteur).toEqual([secteur])
      expect(preview.filieres).toHaveLength(2)
      expect(preview.groups).toHaveLength(2)
      expect(preview.students).toHaveLength(2)
      expect(preview.absences).toHaveLength(2)
      expect(preview.warnings).toContain('2 étudiant(s) seront supprimé(s)')
      expect(preview.warnings).toContain('2 absence(s) seront supprimée(s)')
    })

    it('shows cascade effects for filiere deletion', () => {
      const filiere = { id: 1, nom: 'Développement Digital' }
      const preview = getCascadeDeletePreview(filiere, 'filiere', mockData)
      
      expect(preview.filiere).toEqual([filiere])
      expect(preview.groups).toHaveLength(2)
      expect(preview.students).toHaveLength(2)
      expect(preview.absences).toHaveLength(2)
    })

    it('shows cascade effects for group deletion', () => {
      const group = { id: 1, nom: 'DEV101' }
      const preview = getCascadeDeletePreview(group, 'group', mockData)
      
      expect(preview.group).toEqual([group])
      expect(preview.students).toHaveLength(2)
      expect(preview.absences).toHaveLength(2)
    })

    it('shows cascade effects for student deletion', () => {
      const student = { id: 1, cef: 'CEF001' }
      const preview = getCascadeDeletePreview(student, 'student', mockData)
      
      expect(preview.student).toEqual([student])
      expect(preview.absences).toHaveLength(1)
      expect(preview.warnings).toContain('1 absence(s) seront supprimée(s)')
    })

    it('shows no cascade effects when no dependencies', () => {
      const student = { id: 3, cef: 'CEF003' }
      const preview = getCascadeDeletePreview(student, 'student', mockData)
      
      expect(preview.student).toEqual([student])
      expect(preview.absences).toHaveLength(0)
      expect(preview.warnings).toHaveLength(0)
    })
  })

  describe('ReferentialIntegrityError', () => {
    it('creates error with entity and conflicts', () => {
      const conflicts = [{ type: 'DEPENDENT_RECORDS', message: 'Test conflict' }]
      const error = new ReferentialIntegrityError('student', 'DELETE', conflicts)
      
      expect(error.name).toBe('ReferentialIntegrityError')
      expect(error.entity).toBe('student')
      expect(error.operation).toBe('DELETE')
      expect(error.conflicts).toEqual(conflicts)
      expect(error.message).toBe('Referential integrity violation: DELETE on student')
    })
  })
})