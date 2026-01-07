import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { AuthProvider } from '../../contexts/AuthContext'
import { ToastProvider } from '../../components/Toast'
import RoleSelector from '../../components/RoleSelector'
import AuthenticationForm from '../../components/AuthenticationForm'

// Test wrapper with all providers
function TestWrapper({ children }) {
  return (
    <AuthProvider>
      <ToastProvider>
        {children}
      </ToastProvider>
    </AuthProvider>
  )
}

describe('Integration and Final Wiring Tests', () => {
  beforeEach(() => {
    // Clear localStorage before each test
    localStorage.clear()
  })

  describe('Authentication Flow Integration', () => {
    test('role selector integrates with authentication form', async () => {
      let selectedRole = null
      const handleRoleSelected = (role) => {
        selectedRole = role
      }

      const { rerender } = render(
        <TestWrapper>
          <RoleSelector onRoleSelected={handleRoleSelected} />
        </TestWrapper>
      )

      // Select administrator role
      const adminButton = screen.getByText('Administrateur')
      fireEvent.click(adminButton)

      expect(selectedRole).toBe('Administrateur')

      // Now render authentication form with selected role
      const handleBack = jest.fn()
      
      rerender(
        <TestWrapper>
          <AuthenticationForm 
            selectedRole="Administrateur" 
            onBack={handleBack}
          />
        </TestWrapper>
      )

      expect(screen.getByText('Connexion Administrateur')).toBeInTheDocument()
      expect(screen.getByPlaceholderText(/nom d'utilisateur/i)).toBeInTheDocument()
      expect(screen.getByPlaceholderText(/mot de passe/i)).toBeInTheDocument()

      // Test back button
      const backButton = screen.getByText('Retour')
      fireEvent.click(backButton)
      expect(handleBack).toHaveBeenCalled()
    })

    test('authentication form handles login process', async () => {
      render(
        <TestWrapper>
          <AuthenticationForm 
            selectedRole="Administrateur" 
            onBack={() => {}}
          />
        </TestWrapper>
      )

      const usernameInput = screen.getByPlaceholderText(/nom d'utilisateur/i)
      const passwordInput = screen.getByPlaceholderText(/mot de passe/i)
      const loginButton = screen.getByRole('button', { name: /se connecter/i })

      // Test with valid credentials
      fireEvent.change(usernameInput, { target: { value: 'admin' } })
      fireEvent.change(passwordInput, { target: { value: 'admin123' } })
      fireEvent.click(loginButton)

      // Should show loading state
      await waitFor(() => {
        expect(screen.getByText('Connexion...')).toBeInTheDocument()
      })
    })

    test('authentication form handles invalid credentials', async () => {
      render(
        <TestWrapper>
          <AuthenticationForm 
            selectedRole="Formateur" 
            onBack={() => {}}
          />
        </TestWrapper>
      )

      const usernameInput = screen.getByPlaceholderText(/nom d'utilisateur/i)
      const passwordInput = screen.getByPlaceholderText(/mot de passe/i)
      const loginButton = screen.getByRole('button', { name: /se connecter/i })

      // Test with invalid credentials
      fireEvent.change(usernameInput, { target: { value: 'invalid' } })
      fireEvent.change(passwordInput, { target: { value: 'invalid' } })
      fireEvent.click(loginButton)

      // Should show error message
      await waitFor(() => {
        expect(screen.getByText(/nom d'utilisateur ou mot de passe incorrect/i)).toBeInTheDocument()
      })
    })
  })

  describe('Toast Notification Integration', () => {
    test('toast notifications display and can be dismissed', async () => {
      let showToast = null

      const TestComponent = () => {
        const { showSuccess, showError } = require('../../components/Toast').useToast()
        showToast = { showSuccess, showError }
        
        return (
          <div>
            <button onClick={() => showSuccess('Success message')}>
              Show Success
            </button>
            <button onClick={() => showError('Error message')}>
              Show Error
            </button>
          </div>
        )
      }

      render(
        <TestWrapper>
          <TestComponent />
        </TestWrapper>
      )

      // Test success toast
      const successButton = screen.getByText('Show Success')
      fireEvent.click(successButton)

      await waitFor(() => {
        expect(screen.getByText('Success message')).toBeInTheDocument()
      })

      // Test error toast
      const errorButton = screen.getByText('Show Error')
      fireEvent.click(errorButton)

      await waitFor(() => {
        expect(screen.getByText('Error message')).toBeInTheDocument()
      })
    })
  })

  describe('Loading States Integration', () => {
    test('loading spinner displays correctly', () => {
      const LoadingSpinner = require('../../components/LoadingSpinner').default

      render(
        <LoadingSpinner 
          message="Test loading message" 
          size="medium"
        />
      )

      expect(screen.getByText('Test loading message')).toBeInTheDocument()
    })

    test('loading overlay displays correctly', () => {
      const LoadingSpinner = require('../../components/LoadingSpinner').default

      render(
        <LoadingSpinner 
          overlay={true}
          message="Loading overlay test" 
          size="large"
        />
      )

      expect(screen.getByText('Loading overlay test')).toBeInTheDocument()
    })
  })

  describe('State Management Integration', () => {
    test('app state hook manages data correctly', () => {
      const { useAppState } = require('../../hooks/useAppState')
      
      let appState = null
      
      const TestComponent = () => {
        appState = useAppState()
        return <div>Test Component</div>
      }

      render(<TestComponent />)

      expect(appState).toBeDefined()
      expect(appState.secteurs).toBeDefined()
      expect(appState.filieres).toBeDefined()
      expect(appState.absences).toBeDefined()
      expect(appState.stagiaires).toBeDefined()
      expect(appState.groupes).toBeDefined()
      expect(typeof appState.addAbsences).toBe('function')
      expect(typeof appState.removeAbsence).toBe('function')
      expect(typeof appState.setLoading).toBe('function')
    })
  })

  describe('Permission System Integration', () => {
    test('protected routes work with authentication context', async () => {
      const ProtectedRoute = require('../../components/ProtectedRoute').default
      const { PERMISSIONS } = require('../../utils/permissions')

      render(
        <TestWrapper>
          <ProtectedRoute 
            requiredPermission={PERMISSIONS.STUDENT_MANAGEMENT}
            fallback={<div>Access Denied</div>}
          >
            <div>Protected Content</div>
          </ProtectedRoute>
        </TestWrapper>
      )

      // Should show access denied when not authenticated
      expect(screen.getByText('Access Denied')).toBeInTheDocument()
    })
  })
})