import { useAuth } from '../contexts/AuthContext'
import { PERMISSIONS } from '../utils/permissions'
import ProtectedRoute from './ProtectedRoute'

function AdminDashboard({ currentView, setCurrentView }) {
  const { username, checkPermission } = useAuth()

  const adminMenuItems = [
    {
      id: 'marquer',
      label: 'Marquer Absence',
      icon: '✓',
      permission: PERMISSIONS.MARK_ABSENCES,
      description: 'Marquer les absences des stagiaires'
    },
    {
      id: 'consulter',
      label: 'Consulter Absences',
      icon: '📊',
      permission: PERMISSIONS.VIEW_ALL_GROUPS,
      description: 'Consulter toutes les absences'
    },
    {
      id: 'gestion-stagiaires',
      label: 'Gestion Stagiaires',
      icon: '👥',
      permission: PERMISSIONS.STUDENT_MANAGEMENT,
      description: 'Gérer les stagiaires et groupes'
    },
    {
      id: 'import-excel',
      label: 'Import Excel',
      icon: '📁',
      permission: PERMISSIONS.EXCEL_IMPORT,
      description: 'Importer des données depuis Excel'
    },
    {
      id: 'rapports',
      label: 'Rapports Système',
      icon: '📈',
      permission: PERMISSIONS.SYSTEM_REPORTS,
      description: 'Générer des rapports système'
    }
  ]

  const availableMenuItems = adminMenuItems.filter(item => 
    checkPermission(item.permission)
  )

  return (
    <div className="dashboard-container">
      <div className="dashboard-header">
        <h2>Tableau de bord Administrateur</h2>
        <p>Bienvenue, {username}</p>
      </div>

      <div className="dashboard-grid">
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

      <div className="dashboard-stats">
        <div className="stat-card">
          <div className="stat-number">--</div>
          <div className="stat-label">Stagiaires Total</div>
        </div>
        <div className="stat-card">
          <div className="stat-number">--</div>
          <div className="stat-label">Absences Aujourd'hui</div>
        </div>
        <div className="stat-card">
          <div className="stat-number">--</div>
          <div className="stat-label">Groupes Actifs</div>
        </div>
      </div>
    </div>
  )
}

export default AdminDashboard