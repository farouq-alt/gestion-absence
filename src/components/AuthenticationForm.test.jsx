import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { AuthProvider } from '../contexts/AuthContext'
import AuthenticationForm from './AuthenticationForm'

// Mock the AuthContext
const mockLogin = jest.fn()
const mockUseAuth = {
  login: mockLogin
}

jest.mock('../contexts/AuthContext', () => ({
  ...jest.requireActual('../contexts/AuthContext'),
  useAuth: () => mockUseAuth
}))

describe('AuthenticationForm', () => {
  const defaultProps = {
    selectedRole: 'Formateur',
    onBack: jest.fn()
  }

  beforeEach(() => {
    jest.clearAllMocks()
    mockLogin.mockResolvedValue(true)
  })

  const renderWithProvider = (props = {}) => {
    return render(
      <AuthProvider>
        <AuthenticationForm {...defaultProps} {...props} />
      </AuthProvider>
    )
  }

  describe('Role Display', () => {
    it('should display correct role name for Formateur', () => {
      renderWithProvider({ selectedRole: 'Formateur' })
      expect(screen.getByText('Connexion Formateur')).toBeInTheDocument()
    })

    it('should display correct role name for Administrateur', () => {
      renderWithProvider({ selectedRole: 'Administrateur' })
      expect(screen.getByText('Connexion Administrateur')).toBeInTheDocument()
    })

    it('should display correct icon for each role', () => {
      const { rerender } = renderWithProvider({ selectedRole: 'Formateur' })
      
      // Check for user icon (Formateur)
      let roleIndicator = screen.getByText('Connexion Formateur').closest('.role-indicator')
      expect(roleIndicator.querySelector('svg')).toBeInTheDocument()
      
      // Rerender with Admin role
      rerender(
        <AuthProvider>
          <AuthenticationForm selectedRole="Administrateur" onBack={defaultProps.onBack} />
        </AuthProvider>
      )
      
      // Check for admin icon (Administrateur)
      roleIndicator = screen.getByText('Connexion Administrateur').closest('.role-indicator')
      expect(roleIndicator.querySelector('svg')).toBeInTheDocument()
    })
  })

  describe('Form Validation', () => {
    it('should show error when username is empty', async () => {
      renderWithProvider()
      
      const passwordInput = screen.getByPlaceholderText('Entrez votre mot de passe')
      const submitButton = screen.getByRole('button', { name: 'Se connecter' })
      
      fireEvent.change(passwordInput, { target: { value: 'password123' } })
      fireEvent.click(submitButton)
      
      await waitFor(() => {
        expect(screen.getByText('Veuillez saisir votre nom d\'utilisateur et mot de passe')).toBeInTheDocument()
      })
      
      expect(mockLogin).not.toHaveBeenCalled()
    })

    it('should show error when password is empty', async () => {
      renderWithProvider()
      
      const usernameInput = screen.getByPlaceholderText('Entrez votre nom d\'utilisateur')
      const submitButton = screen.getByRole('button', { name: 'Se connecter' })
      
      fireEvent.change(usernameInput, { target: { value: 'testuser' } })
      fireEvent.click(submitButton)
      
      await waitFor(() => {
        expect(screen.getByText('Veuillez saisir votre nom d\'utilisateur et mot de passe')).toBeInTheDocument()
      })
      
      expect(mockLogin).not.toHaveBeenCalled()
    })

    it('should show error when both fields are empty', async () => {
      renderWithProvider()
      
      const submitButton = screen.getByRole('button', { name: 'Se connecter' })
      fireEvent.click(submitButton)
      
      await waitFor(() => {
        expect(screen.getByText('Veuillez saisir votre nom d\'utilisateur et mot de passe')).toBeInTheDocument()
      })
      
      expect(mockLogin).not.toHaveBeenCalled()
    })
  })

  describe('Form Submission', () => {
    it('should call login with correct parameters on valid submission', async () => {
      renderWithProvider({ selectedRole: 'Administrateur' })
      
      const usernameInput = screen.getByPlaceholderText('Entrez votre nom d\'utilisateur')
      const passwordInput = screen.getByPlaceholderText('Entrez votre mot de passe')
      const submitButton = screen.getByRole('button', { name: 'Se connecter' })
      
      fireEvent.change(usernameInput, { target: { value: 'admin' } })
      fireEvent.change(passwordInput, { target: { value: 'admin123' } })
      fireEvent.click(submitButton)
      
      await waitFor(() => {
        expect(mockLogin).toHaveBeenCalledWith('admin', 'admin123', 'Administrateur')
      })
    })

    it('should show loading state during submission', async () => {
      // Make login take some time
      mockLogin.mockImplementation(() => new Promise(resolve => setTimeout(() => resolve(true), 100)))
      
      renderWithProvider()
      
      const usernameInput = screen.getByPlaceholderText('Entrez votre nom d\'utilisateur')
      const passwordInput = screen.getByPlaceholderText('Entrez votre mot de passe')
      const submitButton = screen.getByRole('button', { name: 'Se connecter' })
      
      fireEvent.change(usernameInput, { target: { value: 'teacher' } })
      fireEvent.change(passwordInput, { target: { value: 'teacher123' } })
      fireEvent.click(submitButton)
      
      // Should show loading state
      expect(screen.getByText('Connexion...')).toBeInTheDocument()
      expect(submitButton).toBeDisabled()
      
      // Wait for completion
      await waitFor(() => {
        expect(screen.getByText('Se connecter')).toBeInTheDocument()
      })
    })

    it('should disable form inputs during loading', async () => {
      mockLogin.mockImplementation(() => new Promise(resolve => setTimeout(() => resolve(true), 100)))
      
      renderWithProvider()
      
      const usernameInput = screen.getByPlaceholderText('Entrez votre nom d\'utilisateur')
      const passwordInput = screen.getByPlaceholderText('Entrez votre mot de passe')
      const submitButton = screen.getByRole('button', { name: 'Se connecter' })
      const backButton = screen.getByRole('button', { name: 'Retour' })
      
      fireEvent.change(usernameInput, { target: { value: 'teacher' } })
      fireEvent.change(passwordInput, { target: { value: 'teacher123' } })
      fireEvent.click(submitButton)
      
      // All inputs should be disabled during loading
      expect(usernameInput).toBeDisabled()
      expect(passwordInput).toBeDisabled()
      expect(submitButton).toBeDisabled()
      expect(backButton).toBeDisabled()
      
      await waitFor(() => {
        expect(usernameInput).not.toBeDisabled()
      })
    })
  })

  describe('Error Handling', () => {
    it('should show error message when login fails', async () => {
      mockLogin.mockResolvedValue(false)
      
      renderWithProvider()
      
      const usernameInput = screen.getByPlaceholderText('Entrez votre nom d\'utilisateur')
      const passwordInput = screen.getByPlaceholderText('Entrez votre mot de passe')
      const submitButton = screen.getByRole('button', { name: 'Se connecter' })
      
      fireEvent.change(usernameInput, { target: { value: 'wronguser' } })
      fireEvent.change(passwordInput, { target: { value: 'wrongpass' } })
      fireEvent.click(submitButton)
      
      await waitFor(() => {
        expect(screen.getByText('Nom d\'utilisateur ou mot de passe incorrect pour ce rôle')).toBeInTheDocument()
      })
    })

    it('should show generic error message when login throws exception', async () => {
      mockLogin.mockRejectedValue(new Error('Network error'))
      
      renderWithProvider()
      
      const usernameInput = screen.getByPlaceholderText('Entrez votre nom d\'utilisateur')
      const passwordInput = screen.getByPlaceholderText('Entrez votre mot de passe')
      const submitButton = screen.getByRole('button', { name: 'Se connecter' })
      
      fireEvent.change(usernameInput, { target: { value: 'admin' } })
      fireEvent.change(passwordInput, { target: { value: 'admin123' } })
      fireEvent.click(submitButton)
      
      await waitFor(() => {
        expect(screen.getByText('Erreur de connexion. Veuillez réessayer.')).toBeInTheDocument()
      })
    })

    it('should clear error message on new submission attempt', async () => {
      mockLogin.mockResolvedValueOnce(false).mockResolvedValueOnce(true)
      
      renderWithProvider()
      
      const usernameInput = screen.getByPlaceholderText('Entrez votre nom d\'utilisateur')
      const passwordInput = screen.getByPlaceholderText('Entrez votre mot de passe')
      const submitButton = screen.getByRole('button', { name: 'Se connecter' })
      
      // First attempt - should fail
      fireEvent.change(usernameInput, { target: { value: 'wronguser' } })
      fireEvent.change(passwordInput, { target: { value: 'wrongpass' } })
      fireEvent.click(submitButton)
      
      await waitFor(() => {
        expect(screen.getByText('Nom d\'utilisateur ou mot de passe incorrect pour ce rôle')).toBeInTheDocument()
      })
      
      // Second attempt - error should be cleared
      fireEvent.change(usernameInput, { target: { value: 'admin' } })
      fireEvent.change(passwordInput, { target: { value: 'admin123' } })
      fireEvent.click(submitButton)
      
      await waitFor(() => {
        expect(screen.queryByText('Nom d\'utilisateur ou mot de passe incorrect pour ce rôle')).not.toBeInTheDocument()
      })
    })
  })

  describe('Navigation', () => {
    it('should call onBack when back button is clicked', () => {
      const mockOnBack = jest.fn()
      renderWithProvider({ onBack: mockOnBack })
      
      const backButton = screen.getByRole('button', { name: 'Retour' })
      fireEvent.click(backButton)
      
      expect(mockOnBack).toHaveBeenCalledTimes(1)
    })
  })

  describe('Demo Information', () => {
    it('should display demo account information', () => {
      renderWithProvider()
      
      expect(screen.getByText('Comptes de démonstration:')).toBeInTheDocument()
      expect(screen.getByText('Admin: admin / admin123')).toBeInTheDocument()
      expect(screen.getByText('Formateur: teacher / teacher123')).toBeInTheDocument()
    })
  })

  describe('UI Elements', () => {
    it('should render OFPPT logo and branding', () => {
      renderWithProvider()
      
      expect(screen.getByText('OFPPT')).toBeInTheDocument()
      
      // Check for logo SVG
      const logoSvg = screen.getByText('OFPPT').previousElementSibling
      expect(logoSvg).toBeInTheDocument()
      expect(logoSvg.tagName).toBe('svg')
    })

    it('should have proper form structure', () => {
      renderWithProvider()
      
      expect(screen.getByText('Nom d\'utilisateur')).toBeInTheDocument()
      expect(screen.getByText('Mot de passe')).toBeInTheDocument()
      expect(screen.getByPlaceholderText('Entrez votre nom d\'utilisateur')).toBeInTheDocument()
      expect(screen.getByPlaceholderText('Entrez votre mot de passe')).toBeInTheDocument()
    })
  })
})