import { useAuth } from '../contexts/AuthContext'
import { PERMISSIONS } from '../utils/permissions'
import ProtectedRoute from './ProtectedRoute'

function TeacherDashboard({ currentView, setCurrentView }) {
  const { username, checkPermission } = useAuth()

  const teacherMenuItems = [
    {
      id: 'marquer',
      label: 'Marquer Absence',
      icon: '✓',
      permission: PERMISSIONS.MARK_ABSENCES,
      description: 'Marquer les absences de vos stagiaires'
    },
    {
      id: 'consulter',
      label: 'Consulter Absences',
      icon: '📊',
      permission: PERMISSIONS.VIEW_ASSIGNED_GROUPS,
      description: 'Consulter les absences de vos groupes'
    },
    {
      id: 'rollback',
      label: 'Annuler Absences',
      icon: '↶',
      permission: PERMISSIONS.ROLLBACK_ABSENCES,
      description: 'Annuler des absences récemment marquées'
    }
  ]

  const availableMenuItems = teacherMenuItems.filter(item => 
    checkPermission(item.permission)
  )

  return (
    <div className="dashboard-container">
      <div className="dashboard-header">
        <h2>Tableau de bord Formateur</h2>
        <p>Bienvenue, {username}</p>
      </div>

      <div className="dashboard-grid teacher-grid">
        {availableMenuItems.map(item => (
          <ProtectedRoute 
            key={item.id}
            requiredPermission={item.permission}
            showError={false}
          >
            <div 
              className={`dashboard-card ${currentView === item.id ? 'active' : ''}`}
              onClick={() => setCurrentView(item.id)}
            >
              <div className="dashboard-card-icon">{item.icon}</div>
              <div className="dashboard-card-content">
                <h3>{item.label}</h3>
                <p>{item.description}</p>
              </div>
            </div>
          </ProtectedRoute>
        ))}
      </div>

      <div className="dashboard-quick-actions">
        <h3>Actions rapides</h3>
        <div className="quick-actions-grid">
          <ProtectedRoute requiredPermission={PERMISSIONS.MARK_ABSENCES} showError={false}>
            <button 
              className="quick-action-btn"
              onClick={() => setCurrentView('marquer')}
            >
              Marquer absence rapide
            </button>
          </ProtectedRoute>
          <ProtectedRoute requiredPermission={PERMISSIONS.VIEW_ASSIGNED_GROUPS} showError={false}>
            <button 
              className="quick-action-btn"
              onClick={() => setCurrentView('consulter')}
            >
              Voir absences du jour
            </button>
          </ProtectedRoute>
        </div>
      </div>

      <div className="dashboard-stats teacher-stats">
        <div className="stat-card">
          <div className="stat-number">--</div>
          <div className="stat-label">Mes Groupes</div>
        </div>
        <div className="stat-card">
          <div className="stat-number">--</div>
          <div className="stat-label">Absences Marquées</div>
        </div>
      </div>
    </div>
  )
}

export default TeacherDashboard