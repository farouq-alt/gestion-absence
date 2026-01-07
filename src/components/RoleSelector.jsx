import { useState } from 'react'
import { useAuth } from '../contexts/AuthContext'

function RoleSelector({ onRoleSelected }) {
  const [selectedRole, setSelectedRole] = useState('')
  const { setSelectedRole: setAuthSelectedRole } = useAuth()

  const roles = [
    {
      value: 'Formateur',
      label: 'Formateur',
      description: 'Enseignant - Marquer et consulter les absences'
    },
    {
      value: 'Administrateur', 
      label: 'Administrateur',
      description: 'Administrateur - Gestion complète du système'
    }
  ]

  const handleRoleSelect = (role) => {
    setSelectedRole(role)
    setAuthSelectedRole(role)
    onRoleSelected(role)
  }

  return (
    <div className="role-selector-container">
      <div className="role-selector-box">
        <div className="role-selector-header">
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
          <div className="role-selector-subtitle">Sélectionnez votre rôle</div>
        </div>

        <div className="role-options">
          {roles.map((role) => (
            <button
              key={role.value}
              className={`role-option ${selectedRole === role.value ? 'selected' : ''}`}
              onClick={() => handleRoleSelect(role.value)}
            >
              <div className="role-option-label">{role.label}</div>
              <div className="role-option-description">{role.description}</div>
            </button>
          ))}
        </div>

        <div className="role-selector-footer">
          <p>Choisissez le rôle correspondant à vos permissions d'accès</p>
        </div>
      </div>
    </div>
  )
}

export default RoleSelector