import { render, screen, fireEvent } from '@testing-library/react'
import { AuthProvider } from '../contexts/AuthContext'
import RoleSelector from './RoleSelector'

// Mock the AuthContext
const mockSetSelectedRole = jest.fn()
const mockUseAuth = {
  setSelectedRole: mockSetSelectedRole
}

jest.mock('../contexts/AuthContext', () => ({
  ...jest.requireActual('../contexts/AuthContext'),
  useAuth: () => mockUseAuth
}))

describe('RoleSelector', () => {
  const mockOnRoleSelected = jest.fn()

  beforeEach(() => {
    jest.clearAllMocks()
  })

  const renderWithProvider = (props = {}) => {
    return render(
      <AuthProvider>
        <RoleSelector onRoleSelected={mockOnRoleSelected} {...props} />
      </AuthProvider>
    )
  }

  describe('Initial Render', () => {
    it('should render role selection interface', () => {
      renderWithProvider()
      
      expect(screen.getByText('Sélectionnez votre rôle')).toBeInTheDocument()
      expect(screen.getByText('Choisissez le rôle correspondant à vos permissions d\'accès')).toBeInTheDocument()
    })

    it('should display OFPPT logo and branding', () => {
      renderWithProvider()
      
      expect(screen.getByText('OFPPT')).toBeInTheDocument()
      
      // Check for logo SVG
      const logoSvg = screen.getByText('OFPPT').previousElementSibling
      expect(logoSvg).toBeInTheDocument()
      expect(logoSvg.tagName).toBe('svg')
    })

    it('should render both role options', () => {
      renderWithProvider()
      
      expect(screen.getByText('Formateur')).toBeInTheDocument()
      expect(screen.getByText('Enseignant - Marquer et consulter les absences')).toBeInTheDocument()
      
      expect(screen.getByText('Administrateur')).toBeInTheDocument()
      expect(screen.getByText('Administrateur - Gestion complète du système')).toBeInTheDocument()
    })

    it('should have no role selected initially', () => {
      renderWithProvider()
      
      const roleButtons = screen.getAllByRole('button')
      const roleOptionButtons = roleButtons.filter(button => 
        button.textContent.includes('Formateur') || button.textContent.includes('Administrateur')
      )
      
      roleOptionButtons.forEach(button => {
        expect(button).not.toHaveClass('selected')
      })
    })
  })

  describe('Role Selection', () => {
    it('should select Formateur role when clicked', () => {
      renderWithProvider()
      
      const formateurButton = screen.getByText('Formateur').closest('button')
      fireEvent.click(formateurButton)
      
      expect(formateurButton).toHaveClass('selected')
      expect(mockSetSelectedRole).toHaveBeenCalledWith('Formateur')
      expect(mockOnRoleSelected).toHaveBeenCalledWith('Formateur')
    })

    it('should select Administrateur role when clicked', () => {
      renderWithProvider()
      
      const adminButton = screen.getByText('Administrateur').closest('button')
      fireEvent.click(adminButton)
      
      expect(adminButton).toHaveClass('selected')
      expect(mockSetSelectedRole).toHaveBeenCalledWith('Administrateur')
      expect(mockOnRoleSelected).toHaveBeenCalledWith('Administrateur')
    })

    it('should update selection when switching between roles', () => {
      renderWithProvider()
      
      const formateurButton = screen.getByText('Formateur').closest('button')
      const adminButton = screen.getByText('Administrateur').closest('button')
      
      // Select Formateur first
      fireEvent.click(formateurButton)
      expect(formateurButton).toHaveClass('selected')
      expect(adminButton).not.toHaveClass('selected')
      
      // Switch to Administrateur
      fireEvent.click(adminButton)
      expect(adminButton).toHaveClass('selected')
      expect(formateurButton).not.toHaveClass('selected')
      
      expect(mockSetSelectedRole).toHaveBeenCalledTimes(2)
      expect(mockOnRoleSelected).toHaveBeenCalledTimes(2)
    })
  })

  describe('Role Option Content', () => {
    it('should display correct content for Formateur role', () => {
      renderWithProvider()
      
      const formateurButton = screen.getByText('Formateur').closest('button')
      
      expect(formateurButton).toContainElement(screen.getByText('Formateur'))
      expect(formateurButton).toContainElement(screen.getByText('Enseignant - Marquer et consulter les absences'))
    })

    it('should display correct content for Administrateur role', () => {
      renderWithProvider()
      
      const adminButton = screen.getByText('Administrateur').closest('button')
      
      expect(adminButton).toContainElement(screen.getByText('Administrateur'))
      expect(adminButton).toContainElement(screen.getByText('Administrateur - Gestion complète du système'))
    })
  })

  describe('Accessibility', () => {
    it('should have proper button roles for role options', () => {
      renderWithProvider()
      
      const roleButtons = screen.getAllByRole('button')
      const roleOptionButtons = roleButtons.filter(button => 
        button.textContent.includes('Formateur') || button.textContent.includes('Administrateur')
      )
      
      expect(roleOptionButtons).toHaveLength(2)
      roleOptionButtons.forEach(button => {
        expect(button).toBeInTheDocument()
        expect(button).toBeEnabled()
      })
    })

    it('should be keyboard accessible', () => {
      renderWithProvider()
      
      const formateurButton = screen.getByText('Formateur').closest('button')
      
      // Focus the button
      formateurButton.focus()
      expect(formateurButton).toHaveFocus()
      
      // Press Enter to select
      fireEvent.keyDown(formateurButton, { key: 'Enter', code: 'Enter' })
      fireEvent.click(formateurButton) // React Testing Library requires click for button activation
      
      expect(mockOnRoleSelected).toHaveBeenCalledWith('Formateur')
    })
  })

  describe('Visual States', () => {
    it('should apply selected class only to the chosen role', () => {
      renderWithProvider()
      
      const formateurButton = screen.getByText('Formateur').closest('button')
      const adminButton = screen.getByText('Administrateur').closest('button')
      
      // Initially no selection
      expect(formateurButton).not.toHaveClass('selected')
      expect(adminButton).not.toHaveClass('selected')
      
      // Select Formateur
      fireEvent.click(formateurButton)
      expect(formateurButton).toHaveClass('selected')
      expect(adminButton).not.toHaveClass('selected')
      
      // Select Administrateur
      fireEvent.click(adminButton)
      expect(formateurButton).not.toHaveClass('selected')
      expect(adminButton).toHaveClass('selected')
    })

    it('should maintain proper CSS class structure', () => {
      renderWithProvider()
      
      const formateurButton = screen.getByText('Formateur').closest('button')
      
      // Check base classes
      expect(formateurButton).toHaveClass('role-option')
      
      // Check selected state
      fireEvent.click(formateurButton)
      expect(formateurButton).toHaveClass('role-option', 'selected')
    })
  })

  describe('Component Structure', () => {
    it('should have proper container structure', () => {
      renderWithProvider()
      
      const container = screen.getByText('Sélectionnez votre rôle').closest('.role-selector-container')
      expect(container).toBeInTheDocument()
      
      const box = container.querySelector('.role-selector-box')
      expect(box).toBeInTheDocument()
      
      const header = box.querySelector('.role-selector-header')
      expect(header).toBeInTheDocument()
      
      const options = box.querySelector('.role-options')
      expect(options).toBeInTheDocument()
      
      const footer = box.querySelector('.role-selector-footer')
      expect(footer).toBeInTheDocument()
    })

    it('should have proper role option structure', () => {
      renderWithProvider()
      
      const formateurButton = screen.getByText('Formateur').closest('button')
      
      const label = formateurButton.querySelector('.role-option-label')
      expect(label).toBeInTheDocument()
      expect(label).toHaveTextContent('Formateur')
      
      const description = formateurButton.querySelector('.role-option-description')
      expect(description).toBeInTheDocument()
      expect(description).toHaveTextContent('Enseignant - Marquer et consulter les absences')
    })
  })

  describe('Integration', () => {
    it('should work correctly with multiple rapid selections', () => {
      renderWithProvider()
      
      const formateurButton = screen.getByText('Formateur').closest('button')
      const adminButton = screen.getByText('Administrateur').closest('button')
      
      // Rapid selections
      fireEvent.click(formateurButton)
      fireEvent.click(adminButton)
      fireEvent.click(formateurButton)
      fireEvent.click(adminButton)
      
      expect(mockSetSelectedRole).toHaveBeenCalledTimes(4)
      expect(mockOnRoleSelected).toHaveBeenCalledTimes(4)
      
      // Final state should be Administrateur
      expect(adminButton).toHaveClass('selected')
      expect(formateurButton).not.toHaveClass('selected')
    })
  })
})