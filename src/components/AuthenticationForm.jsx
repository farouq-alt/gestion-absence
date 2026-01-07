import { useState } from 'react'
import { useAuth } from '../contexts/AuthContext'

function AuthenticationForm({ selectedRole, onBack }) {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  
  const { login } = useAuth()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    
    if (!username || !password) {
      setError('Veuillez saisir votre nom d\'utilisateur et mot de passe')
      return
    }

    setIsLoading(true)
    
    try {
      const success = await login(username, password, selectedRole)
      
      if (!success) {
        setError('Nom d\'utilisateur ou mot de passe incorrect pour ce rôle')
      }
    } catch (error) {
      setError('Erreur de connexion. Veuillez réessayer.')
      console.error('Login error:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const getRoleDisplayName = () => {
    return selectedRole === 'Administrateur' ? 'Administrateur' : 'Formateur'
  }

  const getRoleIcon = () => {
    if (selectedRole === 'Administrateur') {
      return (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M12 2L2 7l10 5 10-5-10-5z"/>
          <path d="M2 17l10 5 10-5"/>
          <path d="M2 12l10 5 10-5"/>
        </svg>
      )
    } else {
      return (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
          <circle cx="12" cy="7" r="4"/>
        </svg>
      )
    }
  }

  return (
    <div className="login-container">
      <div className="login-grid-bg"></div>
      <div className="login-box">
        <div className="login-logo">
          <svg className="logo-icon" viewBox="0 0 100 100" width="50" height="50">
            <circle cx="50" cy="50" r="45" fill="none" stroke="#1a1a1a" strokeWidth="6"/>
            <circle cx="50" cy="50" r="8" fill="#1a1a1a"/>
            <line x1="50" y1="5" x2="50" y2="25" stroke="#1a1a1a" strokeWidth="6"/>
            <line x1="50" y1="75" x2="50" y2="95" stroke="#1a1a1a" strokeWidth="6"/>
            <line x1="5" y1="50" x2="25" y2="50" stroke="#1a1a1a" strokeWidth="6"/>
            <line x1="75" y1="50" x2="95" y2="50" stroke="#1a1a1a" strokeWidth="6"/>
            <line x1="18" y1="18" x2="32" y2="32" stroke="#1a1a1a" strokeWidth="6"/>
            <line x1="68" y1="68" x2="82" y2="82" stroke="#1a1a1a" strokeWidth="6"/>
            <line x1="82" y1="18" x2="68" y2="32" stroke="#1a1a1a" strokeWidth="6"/>
            <line x1="32" y1="68" x2="18" y2="82" stroke="#1a1a1a" strokeWidth="6"/>
          </svg>
          <span className="logo-text">OFPPT</span>
        </div>
        
        <div className="login-subtitle">
          <div className="role-indicator">
            {getRoleIcon()}
            <span>Connexion {getRoleDisplayName()}</span>
          </div>
        </div>
        
        <form onSubmit={handleSubmit} className="login-form">
          {error && (
            <div className="login-error">
              {error}
            </div>
          )}
          
          <div className="login-field">
            <label>Nom d'utilisateur</label>
            <input 
              type="text" 
              placeholder="Entrez votre nom d'utilisateur"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              disabled={isLoading}
            />
          </div>
          
          <div className="login-field">
            <label>Mot de passe</label>
            <input 
              type="password" 
              placeholder="Entrez votre mot de passe"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={isLoading}
            />
          </div>
          
          <div className="login-actions">
            <button 
              type="button" 
              className="login-btn-secondary"
              onClick={onBack}
              disabled={isLoading}
            >
              Retour
            </button>
            <button 
              type="submit" 
              className="login-btn"
              disabled={isLoading}
            >
              {isLoading ? 'Connexion...' : 'Se connecter'}
            </button>
          </div>
        </form>

        <div className="login-demo-info">
          <p><strong>Comptes de démonstration:</strong></p>
          <p>Admin: admin / admin123</p>
          <p>Formateur: teacher / teacher123</p>
        </div>
      </div>
    </div>
  )
}

export default AuthenticationForm