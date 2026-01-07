import fc from 'fast-check'
import { 
  validateStudent, 
  validateGroup, 
  validateAbsence,
  validateExcelData,
  validateFile,
  ValidationError,
  createValidationResult
} from '../../utils/validation'

// Feature: enhanced-user-management, Property 3: Student data validation
describe('Property 3: Student data validation', () => {
  
  beforeEach(() => {
    jest.clearAllMocks()
  })

  // Arbitraries for generating test data
  const validCEFArbitrary = fc.string({ minLength: 6, maxLength: 12 })
    .map(s => s.replace(/[^A-Z0-9]/gi, '0')) // Replace invalid chars with '0'
    .filter(s => s.length >= 6) // Ensure minimum length after replacement
    .map(s => s.substring(0, 12).padEnd(6, '0').toUpperCase()) // Ensure 6-12 chars, pad if needed

  const invalidCEFArbitrary = fc.oneof(
    fc.constant(''), // Empty
    fc.string({ minLength: 1, maxLength: 5 }).filter(s => /^[A-Z0-9]+$/i.test(s)), // Too short but valid chars
    fc.string({ minLength: 13, maxLength: 20 }).filter(s => /^[A-Z0-9]+$/i.test(s)), // Too long but valid chars
    fc.string({ minLength: 6, maxLength: 12 }).filter(s => !/^[A-Z0-9]+$/i.test(s)) // Right length but invalid chars
  )

  const validNameArbitrary = fc.string({ minLength: 2, maxLength: 50 })
    .filter(s => /^[a-zA-ZÀ-ÿ\s'-]{2,50}$/u.test(s) && s.trim().length >= 2)

  const invalidNameArbitrary = fc.oneof(
    fc.constant(''), // Empty
    fc.string({ minLength: 1, maxLength: 1 }).filter(s => /^[a-zA-ZÀ-ÿ\s'-]$/u.test(s)), // Too short
    fc.string({ minLength: 51, maxLength: 100 }).filter(s => /^[a-zA-ZÀ-ÿ\s'-]+$/u.test(s)), // Too long
    fc.string({ minLength: 2, maxLength: 50 }).filter(s => !/^[a-zA-ZÀ-ÿ\s'-]+$/u.test(s)) // Invalid characters
  )

  const validEmailArbitrary = fc.emailAddress()

  const invalidEmailArbitrary = fc.oneof(
    fc.constant(''), // Empty
    fc.string({ minLength: 1, maxLength: 50 }).filter(s => s && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s)) // Invalid format
  )

  const validGroupIdArbitrary = fc.string({ minLength: 1, maxLength: 20 }).filter(s => s.trim().length > 0)

  const validDisciplineScoreArbitrary = fc.float({ min: 0, max: 20 })

  const invalidDisciplineScoreArbitrary = fc.oneof(
    fc.float({ min: -10, max: Math.fround(-0.1) }), // Negative
    fc.float({ min: Math.fround(20.1), max: 100 }), // Too high
    fc.constant(NaN),
    fc.constant('invalid')
  )

  const studentArbitrary = fc.record({
    id: fc.option(fc.string(), { nil: undefined }),
    cef: validCEFArbitrary,
    nom: validNameArbitrary,
    email: validEmailArbitrary,
    groupeId: validGroupIdArbitrary,
    noteDiscipline: fc.option(validDisciplineScoreArbitrary, { nil: undefined })
  })

  describe('Student validation properties', () => {
    it('should accept all valid student data combinations', () => {
      fc.assert(
        fc.property(
          studentArbitrary,
          fc.array(studentArbitrary, { maxLength: 5 }), // existing students
          (student, existingStudents) => {
            // Ensure no conflicts with existing students
            const uniqueStudent = {
              ...student,
              cef: student.cef + '_UNIQUE',
              email: student.email.replace('@', '_unique@')
            }
            
            const errors = validateStudent(uniqueStudent, existingStudents)
            expect(errors).toHaveLength(0)
          }
        ),
        { numRuns: 2 }
      )
    })

    it('should reject students with invalid CEF format', () => {
      fc.assert(
        fc.property(
          invalidCEFArbitrary,
          validNameArbitrary,
          validEmailArbitrary,
          validGroupIdArbitrary,
          (invalidCEF, nom, email, groupeId) => {
            const student = { cef: invalidCEF, nom, email, groupeId }
            const errors = validateStudent(student, [])
            
            const cefErrors = errors.filter(e => e.field === 'cef')
            expect(cefErrors.length).toBeGreaterThan(0)
            
            if (invalidCEF === '') {
              expect(cefErrors.some(e => e.message.includes('requis'))).toBe(true)
            } else {
              expect(cefErrors.some(e => 
                e.message.includes('6-12 caractères') || 
                e.message.includes('alphanumériques')
              )).toBe(true)
            }
          }
        ),
        { numRuns: 2 }
      )
    })

    it('should reject students with invalid names', () => {
      fc.assert(
        fc.property(
          validCEFArbitrary,
          invalidNameArbitrary,
          validEmailArbitrary,
          validGroupIdArbitrary,
          (cef, invalidName, email, groupeId) => {
            const student = { cef, nom: invalidName, email, groupeId }
            const errors = validateStudent(student, [])
            
            const nameErrors = errors.filter(e => e.field === 'nom')
            expect(nameErrors.length).toBeGreaterThan(0)
            
            if (invalidName === '') {
              expect(nameErrors.some(e => e.message.includes('requis'))).toBe(true)
            } else if (invalidName.length < 2 || invalidName.length > 50) {
              expect(nameErrors.some(e => e.message.includes('2-50 caractères'))).toBe(true)
            } else {
              expect(nameErrors.some(e => e.message.includes('lettres'))).toBe(true)
            }
          }
        ),
        { numRuns: 2 }
      )
    })

    it('should reject students with invalid email format', () => {
      fc.assert(
        fc.property(
          validCEFArbitrary,
          validNameArbitrary,
          invalidEmailArbitrary,
          validGroupIdArbitrary,
          (cef, nom, invalidEmail, groupeId) => {
            const student = { cef, nom, email: invalidEmail, groupeId }
            const errors = validateStudent(student, [])
            
            const emailErrors = errors.filter(e => e.field === 'email')
            expect(emailErrors.length).toBeGreaterThan(0)
            
            if (invalidEmail === '') {
              expect(emailErrors.some(e => e.message.includes('requis'))).toBe(true)
            } else {
              expect(emailErrors.some(e => e.message.includes('Format email invalide'))).toBe(true)
            }
          }
        ),
        { numRuns: 2 }
      )
    })

    it('should reject students with invalid discipline scores', () => {
      fc.assert(
        fc.property(
          validCEFArbitrary,
          validNameArbitrary,
          validEmailArbitrary,
          validGroupIdArbitrary,
          invalidDisciplineScoreArbitrary,
          (cef, nom, email, groupeId, invalidScore) => {
            const student = { cef, nom, email, groupeId, noteDiscipline: invalidScore }
            const errors = validateStudent(student, [])
            
            const scoreErrors = errors.filter(e => e.field === 'noteDiscipline')
            expect(scoreErrors.length).toBeGreaterThan(0)
            expect(scoreErrors.some(e => e.message.includes('entre 0 et 20'))).toBe(true)
          }
        ),
        { numRuns: 2 }
      )
    })

    it('should detect duplicate CEF numbers', () => {
      fc.assert(
        fc.property(
          studentArbitrary,
          studentArbitrary,
          (student1, student2) => {
            // Make student2 have the same CEF as student1 but different ID
            const duplicateStudent = {
              ...student2,
              id: 'different-id',
              cef: student1.cef,
              email: student2.email.replace('@', '_different@') // Ensure email is different
            }
            
            const errors = validateStudent(duplicateStudent, [student1])
            
            const cefErrors = errors.filter(e => e.field === 'cef')
            expect(cefErrors.some(e => e.message.includes('unique'))).toBe(true)
          }
        ),
        { numRuns: 2 }
      )
    })

    it('should detect duplicate email addresses', () => {
      fc.assert(
        fc.property(
          studentArbitrary,
          studentArbitrary,
          (student1, student2) => {
            // Make student2 have the same email as student1 but different ID and CEF
            const duplicateStudent = {
              ...student2,
              id: 'different-id',
              cef: student2.cef + '_DIFFERENT',
              email: student1.email
            }
            
            const errors = validateStudent(duplicateStudent, [student1])
            
            const emailErrors = errors.filter(e => e.field === 'email')
            expect(emailErrors.some(e => e.message.includes('unique'))).toBe(true)
          }
        ),
        { numRuns: 2 }
      )
    })

    it('should allow updates to the same student without duplicate errors', () => {
      fc.assert(
        fc.property(
          studentArbitrary,
          (student) => {
            // Update the same student (same ID)
            const updatedStudent = {
              ...student,
              nom: student.nom + ' Updated'
            }
            
            const errors = validateStudent(updatedStudent, [student])
            
            // Should not have duplicate errors for CEF or email
            const cefErrors = errors.filter(e => e.field === 'cef' && e.message.includes('unique'))
            const emailErrors = errors.filter(e => e.field === 'email' && e.message.includes('unique'))
            
            expect(cefErrors).toHaveLength(0)
            expect(emailErrors).toHaveLength(0)
          }
        ),
        { numRuns: 2 }
      )
    })
  })

  describe('Excel import validation properties', () => {
    const excelRowArbitrary = fc.record({
      CEF: validCEFArbitrary,
      Nom: validNameArbitrary,
      Email: validEmailArbitrary,
      Groupe: validGroupIdArbitrary
    })

    it('should accept valid Excel data', () => {
      fc.assert(
        fc.property(
          fc.array(excelRowArbitrary, { minLength: 1, maxLength: 10 }),
          fc.array(studentArbitrary, { maxLength: 5 }),
          (excelData, existingStudents) => {
            // Ensure no conflicts by making CEFs and emails unique
            const uniqueData = excelData.map((row, index) => ({
              ...row,
              CEF: row.CEF + `_${index}`,
              Email: row.Email.replace('@', `_${index}@`)
            }))
            
            const errors = validateExcelData(uniqueData, existingStudents)
            expect(errors).toHaveLength(0)
          }
        ),
        { numRuns: 1 }
      )
    })

    it('should reject Excel data with duplicate CEFs within file', () => {
      fc.assert(
        fc.property(
          excelRowArbitrary,
          excelRowArbitrary,
          (row1, row2) => {
            // Make both rows have the same CEF but different emails
            const duplicateData = [
              row1,
              {
                ...row2,
                CEF: row1.CEF,
                Email: row2.Email.replace('@', '_different@')
              }
            ]
            
            const errors = validateExcelData(duplicateData, [])
            
            const cefErrors = errors.filter(e => e.message.includes('CEF en double dans le fichier'))
            expect(cefErrors.length).toBeGreaterThan(0)
          }
        ),
        { numRuns: 1 }
      )
    })

    it('should reject Excel data with duplicate emails within file', () => {
      fc.assert(
        fc.property(
          excelRowArbitrary,
          excelRowArbitrary,
          (row1, row2) => {
            // Make both rows have the same email but different CEFs
            const duplicateData = [
              row1,
              {
                ...row2,
                CEF: row2.CEF + '_DIFFERENT',
                Email: row1.Email
              }
            ]
            
            const errors = validateExcelData(duplicateData, [])
            
            const emailErrors = errors.filter(e => e.message.includes('Email en double dans le fichier'))
            expect(emailErrors.length).toBeGreaterThan(0)
          }
        ),
        { numRuns: 1 }
      )
    })

    it('should reject Excel data that conflicts with existing students', () => {
      fc.assert(
        fc.property(
          excelRowArbitrary,
          studentArbitrary,
          (excelRow, existingStudent) => {
            // Make Excel row conflict with existing student
            const conflictingData = [{
              ...excelRow,
              CEF: existingStudent.cef,
              Email: excelRow.Email.replace('@', '_different@') // Different email to avoid double conflict
            }]
            
            const errors = validateExcelData(conflictingData, [existingStudent])
            
            const cefErrors = errors.filter(e => e.message.includes('CEF existe déjà dans le système'))
            expect(cefErrors.length).toBeGreaterThan(0)
          }
        ),
        { numRuns: 1 }
      )
    })

    it('should reject empty or oversized Excel data', () => {
      // Test empty data
      const emptyErrors = validateExcelData([], [])
      expect(emptyErrors.some(e => e.message.includes('Aucune donnée'))).toBe(true)
      
      // Test oversized data - use a simpler approach
      const oversizedData = Array(1001).fill().map((_, i) => ({
        CEF: `CEF${i.toString().padStart(6, '0')}`,
        Nom: `Student ${i}`,
        Email: `student${i}@test.com`,
        Groupe: 'Group1'
      }))
      
      const errors = validateExcelData(oversizedData, [])
      expect(errors.some(e => e.message.includes('Maximum 1000 lignes'))).toBe(true)
    })
  })

  describe('File validation properties', () => {
    // Mock File objects for testing
    const createMockFile = (name, size, type) => ({
      name,
      size,
      type,
      lastModified: Date.now()
    })

    it('should accept valid Excel files', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 1, maxLength: 50 }),
          fc.integer({ min: 1, max: 5 * 1024 * 1024 }), // Up to 5MB
          fc.constantFrom(
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            'application/vnd.ms-excel'
          ),
          (fileName, fileSize, fileType) => {
            const file = createMockFile(fileName, fileSize, fileType)
            const errors = validateFile(file)
            expect(errors).toHaveLength(0)
          }
        ),
        { numRuns: 1 }
      )
    })

    it('should reject files that are too large', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 1, maxLength: 50 }),
          fc.integer({ min: 5 * 1024 * 1024 + 1, max: 10 * 1024 * 1024 }), // Over 5MB but not too large
          fc.constantFrom(
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            'application/vnd.ms-excel'
          ),
          (fileName, fileSize, fileType) => {
            const file = createMockFile(fileName, fileSize, fileType)
            const errors = validateFile(file)
            
            const sizeErrors = errors.filter(e => e.message.includes('Taille de fichier maximum'))
            expect(sizeErrors.length).toBeGreaterThan(0)
          }
        ),
        { numRuns: 1 }
      )
    })

    it('should reject files with invalid types', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 1, maxLength: 50 }),
          fc.integer({ min: 1, max: 1024 * 1024 }), // 1MB
          fc.constantFrom('text/plain', 'image/jpeg', 'application/pdf'),
          (fileName, fileSize, invalidType) => {
            const file = createMockFile(fileName, fileSize, invalidType)
            const errors = validateFile(file)
            
            const typeErrors = errors.filter(e => e.message.includes('Format de fichier non supporté'))
            expect(typeErrors.length).toBeGreaterThan(0)
          }
        ),
        { numRuns: 1 }
      )
    })

    it('should reject null or undefined files', () => {
      const nullErrors = validateFile(null)
      expect(nullErrors.some(e => e.message.includes('Fichier requis'))).toBe(true)
      
      const undefinedErrors = validateFile(undefined)
      expect(undefinedErrors.some(e => e.message.includes('Fichier requis'))).toBe(true)
    })
  })

  describe('Validation result consistency', () => {
    it('should create consistent validation results', () => {
      fc.assert(
        fc.property(
          fc.array(fc.record({
            field: fc.string(),
            message: fc.string(),
            value: fc.anything()
          }), { maxLength: 5 }),
          (errorData) => {
            const errors = errorData.map(e => new ValidationError(e.field, e.message, e.value))
            const result = createValidationResult(errors)
            
            expect(result.isValid).toBe(errors.length === 0)
            expect(result.errors).toEqual(errors)
            expect(result.getAllMessages()).toEqual(errors.map(e => e.message))
            
            // Test field-specific error retrieval
            const uniqueFields = [...new Set(errors.map(e => e.field))]
            uniqueFields.forEach(field => {
              const fieldErrors = result.getErrorsByField(field)
              const expectedFieldErrors = errors.filter(e => e.field === field)
              expect(fieldErrors).toEqual(expectedFieldErrors)
              
              const firstError = result.getFirstError(field)
              expect(firstError).toEqual(expectedFieldErrors[0] || undefined)
            })
          }
        ),
        { numRuns: 1 }
      )
    })
  })
})

/**
 * Validates: Requirements 2.2
 * 
 * This property-based test ensures that:
 * 1. Valid student data is always accepted when all required fields are present and valid
 * 2. Invalid student data is consistently rejected with appropriate error messages
 * 3. Duplicate detection works correctly for both CEF and email fields
 * 4. Excel import validation properly handles file format, duplicates, and conflicts
 * 5. File validation correctly enforces size and type restrictions
 * 6. Validation results provide consistent and accurate error reporting
 */