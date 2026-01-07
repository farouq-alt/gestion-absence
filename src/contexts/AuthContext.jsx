import { createContext, useContext, useState } from 'react'
import { getPermissionsForRole } from '../utils/permissions'

const AuthContext = createContext()

// Mock users for demonstration
const MOCK_USERS = [
  {
    username: 'admin',
    password: 'admin123',
    role: 'Administrateur'
  },
  {
    username: 'teacher',
    password: 'teacher123', 
    role: 'Formateur'
  },
  {
    username: 'formateur1',
    password: 'form123',
    role: 'Formateur'
  }
]

export function AuthProvider({ children }) {
  const [authState, setAuthState] = useState(() => {
    // Initialize state from localStorage
    const savedAuth = localStorage.getItem('ofppt_auth')
    if (savedAuth) {
      try {
        const parsedAuth = JSON.parse(savedAuth)
        // Check if session is still valid (24 hours)
        const sessionAge = Date.now() - parsedAuth.loginTime
        if (sessionAge < 24 * 60 * 60 * 1000) {
          return parsedAuth
        } else {
          localStorage.removeItem('ofppt_auth')
        }
      } catch (error) {
        localStorage.removeItem('ofppt_auth')
        console.error('Auth state parsing error:', error)
      }
    }
    
    return {
      isAuthenticated: false,
      userRole: null,
      username: null,
      sessionId: null,
      permissions: [],
      selectedRole: null
    }
  })

  // No useEffect needed since we initialize state directly

  const login = async (username, password, role) => {
    // Find user with matching credentials and role
    const user = MOCK_USERS.find(u => 
      u.username === username && 
      u.password === password && 
      u.role === role
    )

    if (user) {
      const userPermissions = getPermissionsForRole(user.role)
      const newAuthState = {
        isAuthenticated: true,
        userRole: user.role,
        username: user.username,
        sessionId: `session_${Date.now()}`,
        permissions: userPermissions,
        selectedRole: role,
        loginTime: Date.now()
      }
      
      setAuthState(newAuthState)
      localStorage.setItem('ofppt_auth', JSON.stringify(newAuthState))
      return true
    }
    
    return false
  }

  const logout = () => {
    setAuthState({
      isAuthenticated: false,
      userRole: null,
      username: null,
      sessionId: null,
      permissions: [],
      selectedRole: null
    })
    localStorage.removeItem('ofppt_auth')
  }

  const checkPermission = (permission) => {
    return authState.permissions.includes(permission)
  }

  const setSelectedRole = (role) => {
    setAuthState(prev => ({ ...prev, selectedRole: role }))
  }

  const value = {
    ...authState,
    login,
    logout,
    checkPermission,
    setSelectedRole
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

// eslint-disable-next-line react-refresh/only-export-components