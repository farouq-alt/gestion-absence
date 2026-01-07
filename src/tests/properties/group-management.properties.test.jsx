import fc from 'fast-check'
import { 
  validateGroup,
  ValidationError
} from '../../utils/validation'
import { 
  checkGroupIntegrity,
  checkReferentialIntegrity,
  getCascadeDeletePreview,
  safeDelete,
  ReferentialIntegrityError
} from '../../utils/referentialIntegrity'

// Mock data structures for testing
const MOCK_SECTEURS = [
  { id: 1, nom: 'IA & Digital' },
  { id: 2, nom: 'Industriel' },
  { id: 3, nom: 'AGC' },
  { id: 4, nom: 'BTP' }
]

const MOCK_FILIERES = [
  { id: 1, nom: 'Développement Digital', secteurId: 1 },
  { id: 2, nom: 'Infrastructure Digitale', secteurId: 1 },
  { id: 3, nom: 'Électromécanique', secteurId: 2 },
  { id: 4, nom: 'Fabrication Mécanique', secteurId: 2 },
  { id: 5, nom: 'Gestion des Entreprises', secteurId: 3 },
  { id: 6, nom: 'Comptabilité', secteurId: 3 },
  { id: 7, nom: 'Génie Civil', secteurId: 4 }
]

// Generators for property-based testing
const validGroupNameGenerator = fc.string({ minLength: 2, maxLength: 20 })
  .filter(s => /^[A-Z0-9]{2,20}$/i.test(s.trim()))
  .map(s => s.trim())

const invalidGroupNameGenerator = fc.oneof(
  fc.constant(''), // Empty
  fc.string({ minLength: 1, maxLength: 1 }).filter(s => /^[A-Z0-9]$/i.test(s)), // Too short
  fc.string({ minLength: 21, maxLength: 50 }).filter(s => /^[A-Z0-9]+$/i.test(s)) // Too long
)

const validFiliereIdGenerator = fc.constantFrom(...MOCK_FILIERES.map(f => f.id))

const invalidFiliereIdGenerator = fc.oneof(
  fc.constant(null),
  fc.constant(undefined),
  fc.constant(''),
  fc.integer({ min: 100, max: 999 }) // Non-existent filiere ID
)

const groupGenerator = fc.record({
  id: fc.option(fc.integer({ min: 1, max: 1000 }), { nil: undefined }),
  nom: fc.string({ minLength: 2, maxLength: 20 })
    .filter(s => /^[A-Z0-9]{2,20}$/i.test(s))
    .map(s => s.toUpperCase()),
  filiereId: validFiliereIdGenerator
})

const studentGenerator = fc.record({
  id: fc.integer({ min: 1, max: 1000 }),
  cef: fc.string({ minLength: 6, maxLength: 12 }).map(s => s.toUpperCase()),
  nom: fc.string({ minLength: 2, maxLength: 50 }),
  email: fc.emailAddress(),
  groupeId: fc.integer({ min: 1, max: 100 }),
  noteDiscipline: fc.float({ min: 0, max: 20 })
})

const absenceGenerator = fc.record({
  id: fc.integer({ min: 1, max: 1000 }),
  stagiaireId: fc.integer({ min: 1, max: 100 }),
  date: fc.date({ min: new Date('2024-01-01'), max: new Date('2024-12-31') })
    .filter(d => !isNaN(d.getTime()))
    .map(d => d.toISOString().split('T')[0]),
  duree: fc.constantFrom(2.5, 5, 1, 3, 4),
  etat: fc.constantFrom('J', 'NJ'),
  recordedBy: fc.string({ minLength: 3, maxLength: 20 }),
  recordedAt: fc.date().filter(d => !isNaN(d.getTime())).map(d => d.toISOString())
})

// Helper function to create mock data structure
const createMockData = (groups = [], students = [], absences = []) => ({
  secteurs: MOCK_SECTEURS,
  filieres: MOCK_FILIERES,
  groups,
  students,
  absences
})

describe('Property 5: Group management with referential integrity', () => {
  
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('Group validation properties', () => {
    /**
     * Feature: enhanced-user-management, Property 5: Group management with referential integrity
     * Validates: Requirements 2.7, 9.3
     */
    it('should accept valid group data with proper referential integrity', () => {
      fc.assert(
        fc.property(
          groupGenerator,
          fc.array(groupGenerator, { maxLength: 5 }),
          fc.array(studentGenerator, { maxLength: 3 }),
          (group, existingGroups, existingStudents) => {
            // Ensure unique group name within same filiere and proper ID
            const uniqueGroup = {
              ...group,
              id: group.id || 1,
              nom: group.nom + '_UNIQUE_' + Math.random().toString(36).substr(2, 5)
            }
            
            // Filter existing groups to avoid conflicts
            const filteredExistingGroups = existingGroups.filter(g => 
              g.filiereId !== uniqueGroup.filiereId || g.nom !== uniqueGroup.nom
            )
            
            const errors = validateGroup(uniqueGroup, filteredExistingGroups, existingStudents)
            expect(errors).toHaveLength(0)
            
            // Check referential integrity for CREATE operation
            const mockData = createMockData(filteredExistingGroups, existingStudents)
            const integrityResult = checkReferentialIntegrity(uniqueGroup, 'group', 'CREATE', mockData)
            expect(integrityResult.isValid).toBe(true)
            expect(integrityResult.conflicts).toHaveLength(0)
          }
        ),
        { numRuns: 100 }
      )
    })

    it('should reject groups with invalid names', () => {
      fc.assert(
        fc.property(
          invalidGroupNameGenerator,
          validFiliereIdGenerator,
          (invalidName, filiereId) => {
            const group = { nom: invalidName, filiereId }
            const errors = validateGroup(group, [], [])
            
            const nameErrors = errors.filter(e => e.field === 'nom')
            expect(nameErrors.length).toBeGreaterThan(0)
            
            if (invalidName === '') {
              expect(nameErrors.some(e => e.message.includes('requis'))).toBe(true)
            } else {
              expect(nameErrors.some(e => e.message.includes('2-20 caractères'))).toBe(true)
            }
          }
        ),
        { numRuns: 100 }
      )
    })

    it('should reject groups with invalid filiere references', () => {
      fc.assert(
        fc.property(
          validGroupNameGenerator,
          invalidFiliereIdGenerator,
          (nom, invalidFiliereId) => {
            const group = { nom, filiereId: invalidFiliereId }
            
            if (invalidFiliereId === null || invalidFiliereId === undefined || invalidFiliereId === '') {
              // Test validation errors
              const errors = validateGroup(group, [], [])
              const filiereErrors = errors.filter(e => e.field === 'filiereId')
              expect(filiereErrors.length).toBeGreaterThan(0)
              expect(filiereErrors.some(e => e.message.includes('requise'))).toBe(true)
            } else {
              // Test referential integrity errors for non-existent filiere
              const mockData = createMockData()
              const integrityResult = checkReferentialIntegrity(group, 'group', 'CREATE', mockData)
              expect(integrityResult.isValid).toBe(false)
              expect(integrityResult.conflicts.some(c => c.type === 'MISSING_REFERENCE')).toBe(true)
            }
          }
        ),
        { numRuns: 100 }
      )
    })

    it('should detect duplicate group names within same filiere', () => {
      fc.assert(
        fc.property(
          groupGenerator,
          groupGenerator,
          (group1, group2) => {
            // Make both groups have same name and filiere but different IDs
            const duplicateGroup = {
              ...group2,
              id: group1.id + 1000, // Ensure different ID
              nom: group1.nom,
              filiereId: group1.filiereId
            }
            
            const errors = validateGroup(duplicateGroup, [group1], [])
            
            const nameErrors = errors.filter(e => e.field === 'nom')
            expect(nameErrors.some(e => e.message.includes('unique'))).toBe(true)
          }
        ),
        { numRuns: 100 }
      )
    })

    it('should allow same group names in different filieres', () => {
      fc.assert(
        fc.property(
          groupGenerator,
          validFiliereIdGenerator,
          (group1, differentFiliereId) => {
            // Ensure different filiere
            const actualDifferentFiliereId = differentFiliereId === group1.filiereId 
              ? MOCK_FILIERES.find(f => f.id !== group1.filiereId)?.id || differentFiliereId + 1
              : differentFiliereId
            
            const sameNameDifferentFiliere = {
              ...group1,
              id: group1.id + 1000, // Different ID
              filiereId: actualDifferentFiliereId
            }
            
            const errors = validateGroup(sameNameDifferentFiliere, [group1], [])
            
            // Should not have uniqueness errors since they're in different filieres
            const nameErrors = errors.filter(e => e.field === 'nom' && e.message.includes('unique'))
            expect(nameErrors).toHaveLength(0)
          }
        ),
        { numRuns: 100 }
      )
    })
  })

  describe('Group deletion with referential integrity', () => {
    it('should prevent deletion of groups with assigned students', () => {
      fc.assert(
        fc.property(
          groupGenerator,
          fc.array(studentGenerator, { minLength: 1, maxLength: 5 }),
          (group, students) => {
            // Assign all students to this group
            const assignedStudents = students.map(s => ({ ...s, groupeId: group.id }))
            
            const mockData = createMockData([group], assignedStudents)
            const integrityResult = checkReferentialIntegrity(group, 'group', 'DELETE', mockData)
            
            expect(integrityResult.isValid).toBe(false)
            expect(integrityResult.hasBlockingConflicts()).toBe(true)
            
            const dependentConflicts = integrityResult.getConflictsByType('DEPENDENT_RECORDS')
            expect(dependentConflicts.length).toBeGreaterThan(0)
            expect(dependentConflicts.some(c => c.field === 'students')).toBe(true)
          }
        ),
        { numRuns: 100 }
      )
    })

    it('should prevent deletion of groups with students who have absence records', () => {
      fc.assert(
        fc.property(
          groupGenerator,
          fc.array(studentGenerator, { minLength: 1, maxLength: 3 }),
          fc.array(absenceGenerator, { minLength: 1, maxLength: 5 }),
          (group, students, absences) => {
            // Assign students to this group
            const assignedStudents = students.map(s => ({ ...s, groupeId: group.id }))
            
            // Assign absences to these students
            const assignedAbsences = absences.map((a, index) => ({
              ...a,
              stagiaireId: assignedStudents[index % assignedStudents.length].id
            }))
            
            const mockData = createMockData([group], assignedStudents, assignedAbsences)
            const integrityResult = checkReferentialIntegrity(group, 'group', 'DELETE', mockData)
            
            expect(integrityResult.isValid).toBe(false)
            expect(integrityResult.hasBlockingConflicts()).toBe(true)
            
            // Should have conflicts for both students and absences
            const dependentConflicts = integrityResult.getConflictsByType('DEPENDENT_RECORDS')
            expect(dependentConflicts.length).toBeGreaterThan(0)
            expect(dependentConflicts.some(c => c.field === 'students')).toBe(true)
          }
        ),
        { numRuns: 100 }
      )
    })

    it('should allow deletion of empty groups', () => {
      fc.assert(
        fc.property(
          groupGenerator,
          fc.array(studentGenerator, { maxLength: 5 }),
          (group, otherStudents) => {
            // Ensure no students are assigned to this group
            const studentsInOtherGroups = otherStudents.map(s => ({
              ...s,
              groupeId: s.groupeId === group.id ? group.id + 1000 : s.groupeId
            }))
            
            const mockData = createMockData([group], studentsInOtherGroups)
            const integrityResult = checkReferentialIntegrity(group, 'group', 'DELETE', mockData)
            
            expect(integrityResult.isValid).toBe(true)
            expect(integrityResult.conflicts).toHaveLength(0)
          }
        ),
        { numRuns: 100 }
      )
    })

    it('should provide cascade delete preview for groups with dependencies', () => {
      fc.assert(
        fc.property(
          groupGenerator,
          fc.array(studentGenerator, { minLength: 1, maxLength: 3 }),
          fc.array(absenceGenerator, { minLength: 1, maxLength: 5 }),
          (group, students, absences) => {
            // Assign students to this group
            const assignedStudents = students.map(s => ({ ...s, groupeId: group.id }))
            
            // Assign absences to these students
            const assignedAbsences = absences.map((a, index) => ({
              ...a,
              stagiaireId: assignedStudents[index % assignedStudents.length].id
            }))
            
            const mockData = createMockData([group], assignedStudents, assignedAbsences)
            const cascadePreview = getCascadeDeletePreview(group, 'group', mockData)
            
            // Should include the group itself
            expect(cascadePreview.group).toContain(group)
            
            // Should include all assigned students
            expect(cascadePreview.students).toHaveLength(assignedStudents.length)
            assignedStudents.forEach(student => {
              expect(cascadePreview.students).toContainEqual(student)
            })
            
            // Should include all related absences
            expect(cascadePreview.absences).toHaveLength(assignedAbsences.length)
            
            // Should have appropriate warnings
            expect(cascadePreview.warnings.length).toBeGreaterThan(0)
            expect(cascadePreview.warnings.some(w => w.includes('étudiant'))).toBe(true)
            expect(cascadePreview.warnings.some(w => w.includes('absence'))).toBe(true)
          }
        ),
        { numRuns: 100 }
      )
    })

    it('should handle safe delete operations correctly', () => {
      fc.assert(
        fc.property(
          groupGenerator,
          fc.array(studentGenerator, { maxLength: 3 }),
          fc.boolean(),
          fc.boolean(),
          (group, students, hasStudents, forceDelete) => {
            // Ensure group has an ID for proper testing
            const groupWithId = { ...group, id: group.id || 1 }
            
            const assignedStudents = hasStudents 
              ? students.map(s => ({ ...s, groupeId: groupWithId.id }))
              : students.map(s => ({ ...s, groupeId: groupWithId.id + 1000 }))
            
            const mockData = createMockData([groupWithId], assignedStudents)
            
            if (hasStudents && assignedStudents.length > 0 && !forceDelete) {
              // Should throw referential integrity error
              expect(() => {
                safeDelete(groupWithId, 'group', mockData, { force: false })
              }).toThrow(ReferentialIntegrityError)
            } else if (hasStudents && assignedStudents.length > 0 && forceDelete) {
              // Should allow deletion with warnings
              const result = safeDelete(groupWithId, 'group', mockData, { force: true })
              expect(result.allowed).toBe(true)
              expect(result.warnings.length).toBeGreaterThan(0)
            } else {
              // Should allow deletion without issues
              const result = safeDelete(groupWithId, 'group', mockData, { force: false })
              expect(result.allowed).toBe(true)
            }
          }
        ),
        { numRuns: 100 }
      )
    })
  })

  describe('Group update with referential integrity', () => {
    it('should maintain referential integrity when updating group filiere', () => {
      fc.assert(
        fc.property(
          groupGenerator,
          validFiliereIdGenerator,
          fc.array(studentGenerator, { maxLength: 3 }),
          (group, newFiliereId, students) => {
            // Ensure different filiere
            const actualNewFiliereId = newFiliereId === group.filiereId 
              ? MOCK_FILIERES.find(f => f.id !== group.filiereId)?.id || newFiliereId + 1
              : newFiliereId
            
            const updatedGroup = { ...group, filiereId: actualNewFiliereId }
            const assignedStudents = students.map(s => ({ ...s, groupeId: group.id }))
            
            const mockData = createMockData([group], assignedStudents)
            const integrityResult = checkReferentialIntegrity(updatedGroup, 'group', 'UPDATE', mockData)
            
            // Should be valid since filiere exists in mock data
            expect(integrityResult.isValid).toBe(true)
            expect(integrityResult.conflicts).toHaveLength(0)
          }
        ),
        { numRuns: 100 }
      )
    })

    it('should reject group updates with non-existent filiere references', () => {
      fc.assert(
        fc.property(
          groupGenerator,
          fc.integer({ min: 1000, max: 9999 }), // Non-existent filiere ID
          (group, nonExistentFiliereId) => {
            const updatedGroup = { ...group, filiereId: nonExistentFiliereId }
            
            const mockData = createMockData([group])
            const integrityResult = checkReferentialIntegrity(updatedGroup, 'group', 'UPDATE', mockData)
            
            expect(integrityResult.isValid).toBe(false)
            expect(integrityResult.conflicts.some(c => 
              c.type === 'MISSING_REFERENCE' && c.field === 'filiereId'
            )).toBe(true)
          }
        ),
        { numRuns: 100 }
      )
    })
  })

  describe('Cross-entity referential integrity', () => {
    it('should maintain integrity across secteur-filiere-group-student hierarchy', () => {
      fc.assert(
        fc.property(
          groupGenerator,
          fc.array(studentGenerator, { minLength: 1, maxLength: 3 }),
          (group, students) => {
            const assignedStudents = students.map(s => ({ ...s, groupeId: group.id }))
            
            // Find the filiere and secteur for this group
            const filiere = MOCK_FILIERES.find(f => f.id === group.filiereId)
            const secteur = MOCK_SECTEURS.find(s => s.id === filiere?.secteurId)
            
            expect(filiere).toBeDefined()
            expect(secteur).toBeDefined()
            
            const mockData = createMockData([group], assignedStudents)
            
            // Check group integrity
            const groupIntegrity = checkReferentialIntegrity(group, 'group', 'CREATE', mockData)
            expect(groupIntegrity.isValid).toBe(true)
            
            // Check student integrity
            assignedStudents.forEach(student => {
              const studentIntegrity = checkReferentialIntegrity(student, 'student', 'CREATE', mockData)
              expect(studentIntegrity.isValid).toBe(true)
            })
          }
        ),
        { numRuns: 100 }
      )
    })

    it('should detect broken references in the hierarchy', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 1000, max: 9999 }), // Non-existent filiere ID
          validGroupNameGenerator,
          (nonExistentFiliereId, groupName) => {
            const groupWithBrokenRef = {
              id: 1,
              nom: groupName,
              filiereId: nonExistentFiliereId
            }
            
            const mockData = createMockData()
            const integrityResult = checkReferentialIntegrity(groupWithBrokenRef, 'group', 'CREATE', mockData)
            
            expect(integrityResult.isValid).toBe(false)
            expect(integrityResult.conflicts.some(c => 
              c.type === 'MISSING_REFERENCE' && c.field === 'filiereId'
            )).toBe(true)
          }
        ),
        { numRuns: 100 }
      )
    })
  })
})

/**
 * Validates: Requirements 2.7, 9.3
 * 
 * This property-based test ensures that:
 * 1. Group creation and updates maintain proper referential integrity with filieres
 * 2. Group deletion is prevented when students are assigned to the group
 * 3. Group deletion is prevented when assigned students have absence records
 * 4. Duplicate group names are only prevented within the same filiere
 * 5. Cascade delete operations provide accurate previews of dependent records
 * 6. Safe delete operations respect referential integrity constraints
 * 7. Cross-entity relationships (secteur-filiere-group-student) are maintained
 * 8. Broken references in the hierarchy are properly detected and reported
 */