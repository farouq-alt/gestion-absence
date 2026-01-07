import fc from 'fast-check'
import { AuthProvider, useAuth } from '../../contexts/AuthContext'
import { renderHook, act } from '@testing-library/react'

// Feature: enhanced-user-management, Property 1: Role-based authentication consistency
describe('Property 1: Role-based authentication consistency', () => {
  const validCredentials = [
    { username: 'admin', password: 'admin123', role: 'Administrateur' },
    { username: 'teacher', password: 'teacher123', role: 'Formateur' },
    { username: 'formateur1', password: 'form123', role: 'Formateur' }
  ]

  const invalidCredentials = [
    { username: 'admin', password: 'wrong', role: 'Administrateur' },
    { username: 'wrong', password: 'admin123', role: 'Administrateur' },
    { username: 'admin', password: 'admin123', role: 'Formateur' }, // Wrong role
    { username: 'teacher', password: 'teacher123', role: 'Administrateur' }, // Wrong role
    { username: '', password: '', role: 'Formateur' },
    { username: 'nonexistent', password: 'password', role: 'Formateur' }
  ]

  beforeEach(() => {
    localStorage.clear()
    jest.clearAllMocks()
  })

  it('should grant access for valid credentials and role combinations', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.constantFrom(...validCredentials),
        async (credentials) => {
          // Clear localStorage before each property test iteration
          localStorage.clear()
          
          const wrapper = ({ children }) => <AuthProvider>{children}</AuthProvider>
          const { result } = renderHook(() => useAuth(), { wrapper })
          
          // Initially not authenticated
          expect(result.current.isAuthenticated).toBe(false)
          expect(result.current.userRole).toBe(null)
          
          // Attempt login
          let loginResult
          await act(async () => {
            loginResult = await result.current.login(
              credentials.username, 
              credentials.password, 
              credentials.role
            )
          })
          
          // Should succeed
          expect(loginResult).toBe(true)
          expect(result.current.isAuthenticated).toBe(true)
          expect(result.current.userRole).toBe(credentials.role)
          expect(result.current.username).toBe(credentials.username)
          
          // Should have appropriate permissions based on role
          if (credentials.role === 'Administrateur') {
            expect(result.current.checkPermission('student_management')).toBe(true)
            expect(result.current.checkPermission('view_all_groups')).toBe(true)
          } else if (credentials.role === 'Formateur') {
            expect(result.current.checkPermission('mark_absences')).toBe(true)
            expect(result.current.checkPermission('student_management')).toBe(false)
          }
        }
      ),
      { numRuns: 100 }
    )
  })

  it('should deny access for invalid credentials and display appropriate errors', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.constantFrom(...invalidCredentials),
        async (credentials) => {
          // Clear localStorage before each property test iteration
          localStorage.clear()
          
          const wrapper = ({ children }) => <AuthProvider>{children}</AuthProvider>
          const { result } = renderHook(() => useAuth(), { wrapper })
          
          // Initially not authenticated
          expect(result.current.isAuthenticated).toBe(false)
          
          // Attempt login
          let loginResult
          await act(async () => {
            loginResult = await result.current.login(
              credentials.username, 
              credentials.password, 
              credentials.role
            )
          })
          
          // Should fail
          expect(loginResult).toBe(false)
          expect(result.current.isAuthenticated).toBe(false)
          expect(result.current.userRole).toBe(null)
          expect(result.current.username).toBe(null)
          
          // Should not have any permissions
          expect(result.current.checkPermission('student_management')).toBe(false)
          expect(result.current.checkPermission('mark_absences')).toBe(false)
        }
      ),
      { numRuns: 100 }
    )
  })

  it('should maintain role selection state during authentication flow', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.constantFrom('Administrateur', 'Formateur'),
        fc.string({ minLength: 1, maxLength: 20 }),
        fc.string({ minLength: 1, maxLength: 20 }),
        async (selectedRole, username, password) => {
          // Clear localStorage before each property test iteration
          localStorage.clear()
          
          const wrapper = ({ children }) => <AuthProvider>{children}</AuthProvider>
          const { result } = renderHook(() => useAuth(), { wrapper })
          
          // Set selected role
          act(() => {
            result.current.setSelectedRole(selectedRole)
          })
          
          expect(result.current.selectedRole).toBe(selectedRole)
          
          // Attempt login (will likely fail for random credentials)
          await act(async () => {
            await result.current.login(username, password, selectedRole)
          })
          
          // Selected role should be maintained regardless of login success/failure
          expect(result.current.selectedRole).toBe(selectedRole)
        }
      ),
      { numRuns: 100 }
    )
  })

  it('should handle session persistence correctly', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.constantFrom(...validCredentials),
        async (credentials) => {
          // Clear localStorage before each property test iteration
          localStorage.clear()
          
          const wrapper = ({ children }) => <AuthProvider>{children}</AuthProvider>
          const { result } = renderHook(() => useAuth(), { wrapper })
          
          // Login successfully
          await act(async () => {
            await result.current.login(
              credentials.username, 
              credentials.password, 
              credentials.role
            )
          })
          
          expect(result.current.isAuthenticated).toBe(true)
          
          // Check that session is saved to localStorage
          const savedAuth = localStorage.getItem('ofppt_auth')
          expect(savedAuth).toBeTruthy()
          
          const parsedAuth = JSON.parse(savedAuth)
          expect(parsedAuth.isAuthenticated).toBe(true)
          expect(parsedAuth.userRole).toBe(credentials.role)
          expect(parsedAuth.username).toBe(credentials.username)
          expect(parsedAuth.loginTime).toBeDefined()
          
          // Logout should clear session
          act(() => {
            result.current.logout()
          })
          
          expect(result.current.isAuthenticated).toBe(false)
          expect(localStorage.getItem('ofppt_auth')).toBe(null)
        }
      ),
      { numRuns: 100 }
    )
  })
})

/**
 * Validates: Requirements 1.4, 1.5
 * 
 * This property-based test ensures that:
 * 1. Valid username/password/role combinations grant appropriate access
 * 2. Invalid combinations are properly rejected with error handling
 * 3. Role selection state is maintained during authentication flow
 * 4. Session persistence works correctly for both login and logout
 * 5. Permissions are correctly assigned based on authenticated role
 */