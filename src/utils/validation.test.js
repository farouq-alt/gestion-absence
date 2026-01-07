import {
  validateStudent,
  validateGroup,
  validateAbsence,
  validateExcelData,
  validateFile,
  ValidationError,
  createValidationResult
} from './validation.js'

describe('Data Validation Utilities', () => {
  describe('validateStudent', () => {
    const validStudent = {
      id: 1,
      cef: 'CEF001',
      nom: 'ALAMI Mohammed',
      email: 'alami.m@ofppt.ma',
      groupeId: 1,
      noteDiscipline: 18
    }

    const existingStudents = [
      { id: 2, cef: 'CEF002', email: 'existing@ofppt.ma' }
    ]

    it('validates a correct student', () => {
      const errors = validateStudent(validStudent, existingStudents)
      expect(errors).toHaveLength(0)
    })

    it('requires CEF', () => {
      const student = { ...validStudent, cef: '' }
      const errors = validateStudent(student, existingStudents)
      expect(errors).toHaveLength(1)
      expect(errors[0].field).toBe('cef')
      expect(errors[0].message).toBe('CEF est requis')
    })

    it('validates CEF format', () => {
      const student = { ...validStudent, cef: '123' }
      const errors = validateStudent(student, existingStudents)
      expect(errors).toHaveLength(1)
      expect(errors[0].field).toBe('cef')
      expect(errors[0].message).toBe('CEF doit contenir 6-12 caractères alphanumériques')
    })

    it('checks CEF uniqueness', () => {
      const student = { ...validStudent, cef: 'CEF002' }
      const errors = validateStudent(student, existingStudents)
      expect(errors).toHaveLength(1)
      expect(errors[0].field).toBe('cef')
      expect(errors[0].message).toBe('CEF doit être unique')
    })

    it('requires name', () => {
      const student = { ...validStudent, nom: '' }
      const errors = validateStudent(student, existingStudents)
      expect(errors).toHaveLength(1)
      expect(errors[0].field).toBe('nom')
      expect(errors[0].message).toBe('Nom est requis')
    })

    it('validates name length', () => {
      const student = { ...validStudent, nom: 'A' }
      const errors = validateStudent(student, existingStudents)
      expect(errors).toHaveLength(1)
      expect(errors[0].field).toBe('nom')
      expect(errors[0].message).toBe('Nom doit contenir 2-50 caractères')
    })

    it('validates name characters', () => {
      const student = { ...validStudent, nom: 'ALAMI123' }
      const errors = validateStudent(student, existingStudents)
      expect(errors).toHaveLength(1)
      expect(errors[0].field).toBe('nom')
      expect(errors[0].message).toBe('Nom ne peut contenir que des lettres, espaces, apostrophes et tirets')
    })

    it('requires email', () => {
      const student = { ...validStudent, email: '' }
      const errors = validateStudent(student, existingStudents)
      expect(errors).toHaveLength(1)
      expect(errors[0].field).toBe('email')
      expect(errors[0].message).toBe('Email est requis')
    })

    it('validates email format', () => {
      const student = { ...validStudent, email: 'invalid-email' }
      const errors = validateStudent(student, existingStudents)
      expect(errors).toHaveLength(1)
      expect(errors[0].field).toBe('email')
      expect(errors[0].message).toBe('Format email invalide')
    })

    it('checks email uniqueness', () => {
      const student = { ...validStudent, email: 'existing@ofppt.ma' }
      const errors = validateStudent(student, existingStudents)
      expect(errors).toHaveLength(1)
      expect(errors[0].field).toBe('email')
      expect(errors[0].message).toBe('Email doit être unique')
    })

    it('requires group', () => {
      const student = { ...validStudent, groupeId: null }
      const errors = validateStudent(student, existingStudents)
      expect(errors).toHaveLength(1)
      expect(errors[0].field).toBe('groupeId')
      expect(errors[0].message).toBe('Groupe est requis')
    })

    it('validates discipline score range', () => {
      const student = { ...validStudent, noteDiscipline: 25 }
      const errors = validateStudent(student, existingStudents)
      expect(errors).toHaveLength(1)
      expect(errors[0].field).toBe('noteDiscipline')
      expect(errors[0].message).toBe('Note discipline doit être entre 0 et 20')
    })
  })

  describe('validateGroup', () => {
    const validGroup = {
      id: 1,
      nom: 'DEV101',
      filiereId: 1
    }

    const existingGroups = [
      { id: 2, nom: 'DEV102', filiereId: 1 }
    ]

    it('validates a correct group', () => {
      const errors = validateGroup(validGroup, existingGroups, [])
      expect(errors).toHaveLength(0)
    })

    it('requires name', () => {
      const group = { ...validGroup, nom: '' }
      const errors = validateGroup(group, existingGroups, [])
      expect(errors).toHaveLength(1)
      expect(errors[0].field).toBe('nom')
      expect(errors[0].message).toBe('Nom du groupe est requis')
    })

    it('validates name length', () => {
      const group = { ...validGroup, nom: 'A' }
      const errors = validateGroup(group, existingGroups, [])
      expect(errors).toHaveLength(1)
      expect(errors[0].field).toBe('nom')
      expect(errors[0].message).toBe('Nom du groupe doit contenir 2-20 caractères')
    })

    it('checks name uniqueness within filiere', () => {
      const group = { ...validGroup, nom: 'DEV102' }
      const errors = validateGroup(group, existingGroups, [])
      expect(errors).toHaveLength(1)
      expect(errors[0].field).toBe('nom')
      expect(errors[0].message).toBe('Nom du groupe doit être unique dans la filière')
    })

    it('requires filiere', () => {
      const group = { ...validGroup, filiereId: null }
      const errors = validateGroup(group, existingGroups, [])
      expect(errors).toHaveLength(1)
      expect(errors[0].field).toBe('filiereId')
      expect(errors[0].message).toBe('Filière est requise')
    })

    it('prevents deletion when students exist', () => {
      const group = { ...validGroup, _isDeleting: true }
      const studentsInGroup = [{ id: 1, groupeId: 1 }]
      const errors = validateGroup(group, existingGroups, studentsInGroup)
      expect(errors).toHaveLength(1)
      expect(errors[0].field).toBe('students')
      expect(errors[0].message).toBe('Impossible de supprimer le groupe: 1 étudiant(s) assigné(s)')
    })
  })

  describe('validateAbsence', () => {
    const today = new Date().toISOString().split('T')[0]
    const validAbsence = {
      id: 1,
      stagiaireId: 1,
      date: today,
      duree: 2.5,
      etat: 'NJ'
    }

    it('validates a correct absence', () => {
      const errors = validateAbsence(validAbsence, [])
      expect(errors).toHaveLength(0)
    })

    it('requires student', () => {
      const absence = { ...validAbsence, stagiaireId: null }
      const errors = validateAbsence(absence, [])
      expect(errors).toHaveLength(1)
      expect(errors[0].field).toBe('stagiaireId')
      expect(errors[0].message).toBe('Stagiaire est requis')
    })

    it('requires date', () => {
      const absence = { ...validAbsence, date: '' }
      const errors = validateAbsence(absence, [])
      expect(errors).toHaveLength(1)
      expect(errors[0].field).toBe('date')
      expect(errors[0].message).toBe('Date est requise')
    })

    it('prevents future dates', () => {
      const futureDate = new Date()
      futureDate.setDate(futureDate.getDate() + 1)
      const absence = { ...validAbsence, date: futureDate.toISOString().split('T')[0] }
      const errors = validateAbsence(absence, [])
      expect(errors).toHaveLength(1)
      expect(errors[0].field).toBe('date')
      expect(errors[0].message).toBe('Date ne peut pas être dans le futur')
    })

    it('requires duration', () => {
      const absence = { ...validAbsence, duree: null }
      const errors = validateAbsence(absence, [])
      expect(errors).toHaveLength(1)
      expect(errors[0].field).toBe('duree')
      expect(errors[0].message).toBe('Durée est requise')
    })

    it('validates duration range', () => {
      const absence = { ...validAbsence, duree: 10 }
      const errors = validateAbsence(absence, [])
      expect(errors).toHaveLength(1)
      expect(errors[0].field).toBe('duree')
      expect(errors[0].message).toBe('Durée doit être entre 0.5 et 8 heures')
    })

    it('validates state values', () => {
      const absence = { ...validAbsence, etat: 'INVALID' }
      const errors = validateAbsence(absence, [])
      expect(errors).toHaveLength(1)
      expect(errors[0].field).toBe('etat')
      expect(errors[0].message).toBe('État doit être J (Justifiée) ou NJ (Non justifiée)')
    })

    it('prevents duplicate absences', () => {
      const existingAbsences = [
        { id: 2, stagiaireId: 1, date: today }
      ]
      const errors = validateAbsence(validAbsence, existingAbsences)
      expect(errors).toHaveLength(1)
      expect(errors[0].field).toBe('duplicate')
      expect(errors[0].message).toBe('Absence déjà enregistrée pour ce stagiaire à cette date')
    })
  })

  describe('validateExcelData', () => {
    const validData = [
      { CEF: 'CEF001', Nom: 'ALAMI Mohammed', Email: 'alami@ofppt.ma', Groupe: 'DEV101' },
      { CEF: 'CEF002', Nom: 'BENALI Fatima', Email: 'benali@ofppt.ma', Groupe: 'DEV101' }
    ]

    it('validates correct data', () => {
      const errors = validateExcelData(validData, [])
      expect(errors).toHaveLength(0)
    })

    it('requires data array', () => {
      const errors = validateExcelData(null, [])
      expect(errors).toHaveLength(1)
      expect(errors[0].field).toBe('data')
      expect(errors[0].message).toBe('Aucune donnée à importer')
    })

    it('limits data size', () => {
      const largeData = Array(1001).fill(validData[0])
      const errors = validateExcelData(largeData, [])
      expect(errors).toHaveLength(1)
      expect(errors[0].field).toBe('data')
      expect(errors[0].message).toBe('Maximum 1000 lignes par import')
    })

    it('validates required fields', () => {
      const invalidData = [{ CEF: 'CEF001', Nom: '', Email: 'test@ofppt.ma', Groupe: 'DEV101' }]
      const errors = validateExcelData(invalidData, [])
      expect(errors).toHaveLength(1)
      expect(errors[0].field).toBe('row_2_Nom')
      expect(errors[0].message).toBe('Ligne 2: Nom est requis')
    })

    it('detects duplicate CEFs within file', () => {
      const duplicateData = [
        { CEF: 'CEF001', Nom: 'ALAMI Mohammed', Email: 'alami@ofppt.ma', Groupe: 'DEV101' },
        { CEF: 'CEF001', Nom: 'BENALI Fatima', Email: 'benali@ofppt.ma', Groupe: 'DEV101' }
      ]
      const errors = validateExcelData(duplicateData, [])
      expect(errors).toHaveLength(1)
      expect(errors[0].field).toBe('row_3_CEF')
      expect(errors[0].message).toBe('Ligne 3: CEF en double dans le fichier')
    })

    it('detects existing CEFs in system', () => {
      const existingStudents = [{ cef: 'CEF001', email: 'existing@ofppt.ma' }]
      const errors = validateExcelData(validData, existingStudents)
      expect(errors).toHaveLength(1)
      expect(errors[0].field).toBe('row_2_CEF')
      expect(errors[0].message).toBe('Ligne 2: CEF existe déjà dans le système')
    })
  })

  describe('validateFile', () => {
    it('requires file', () => {
      const errors = validateFile(null)
      expect(errors).toHaveLength(1)
      expect(errors[0].field).toBe('file')
      expect(errors[0].message).toBe('Fichier requis')
    })

    it('validates file size', () => {
      const largeFile = { size: 6 * 1024 * 1024, type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }
      const errors = validateFile(largeFile)
      expect(errors).toHaveLength(1)
      expect(errors[0].field).toBe('file')
      expect(errors[0].message).toBe('Taille de fichier maximum: 5MB')
    })

    it('validates file type', () => {
      const invalidFile = { size: 1024, type: 'text/plain' }
      const errors = validateFile(invalidFile)
      expect(errors).toHaveLength(1)
      expect(errors[0].field).toBe('file')
      expect(errors[0].message).toBe('Format de fichier non supporté. Utilisez .xlsx ou .xls')
    })

    it('accepts valid Excel files', () => {
      const validFile = { size: 1024, type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }
      const errors = validateFile(validFile)
      expect(errors).toHaveLength(0)
    })
  })

  describe('ValidationError', () => {
    it('creates error with field and message', () => {
      const error = new ValidationError('testField', 'Test message')
      expect(error.name).toBe('ValidationError')
      expect(error.field).toBe('testField')
      expect(error.message).toBe('Test message')
      expect(error.value).toBeNull()
    })

    it('creates error with value', () => {
      const error = new ValidationError('testField', 'Test message', 'testValue')
      expect(error.value).toBe('testValue')
    })
  })

  describe('createValidationResult', () => {
    it('creates valid result with no errors', () => {
      const result = createValidationResult([])
      expect(result.isValid).toBe(true)
      expect(result.errors).toHaveLength(0)
    })

    it('creates invalid result with errors', () => {
      const errors = [new ValidationError('field1', 'Error 1')]
      const result = createValidationResult(errors)
      expect(result.isValid).toBe(false)
      expect(result.errors).toHaveLength(1)
    })

    it('filters errors by field', () => {
      const errors = [
        new ValidationError('field1', 'Error 1'),
        new ValidationError('field2', 'Error 2'),
        new ValidationError('field1', 'Error 3')
      ]
      const result = createValidationResult(errors)
      const field1Errors = result.getErrorsByField('field1')
      expect(field1Errors).toHaveLength(2)
    })

    it('gets first error for field', () => {
      const errors = [
        new ValidationError('field1', 'Error 1'),
        new ValidationError('field1', 'Error 2')
      ]
      const result = createValidationResult(errors)
      const firstError = result.getFirstError('field1')
      expect(firstError.message).toBe('Error 1')
    })

    it('gets all error messages', () => {
      const errors = [
        new ValidationError('field1', 'Error 1'),
        new ValidationError('field2', 'Error 2')
      ]
      const result = createValidationResult(errors)
      const messages = result.getAllMessages()
      expect(messages).toEqual(['Error 1', 'Error 2'])
    })
  })
})