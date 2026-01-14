import { useMemo } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { useAppState } from '../hooks/useAppState'
import { PERMISSIONS } from '../utils/permissions'
import ProtectedRoute from './ProtectedRoute'
import { MdCheckCircle, MdDashboard, MdUndo, MdLogout, MdGroup, MdWarning } from 'react-icons/md'
import '../styles/TeacherDashboard.css'

function TeacherDashboard({ currentView, setCurrentView }) {
  const { username, logout, checkPermission } = useAuth()
  const { absences, groupes } = useAppState()

  // Calculate key metrics
  const metrics = useMemo(() => {
    const today = new Date().toISOString().split('T')[0]
    
    const absencesToday = absences.filter(a => a.date === today).length
    const totalAbsences = absences.length
    const justifiedAbsences = absences.filter(a => a.etat === 'J').length
    const unjustifiedAbsences = absences.filter(a => a.etat === 'NJ').length

    return {
      absencesToday,
      totalAbsences,
      justifiedAbsences,
      unjustifiedAbsences,
      groupCount: groupes.length
    }
  }, [absences, groupes])

  const teacherMenuItems = [
    {
      id: 'marquer',
      label: 'Marquer Absence',
      icon: MdCheckCircle,
      permission: PERMISSIONS.MARK_ABSENCES,
      description: 'Marquer les absences de vos stagiaires'
    },
    {
      id: 'consulter',
      label: 'Consulter Absences',
      icon: MdDashboard,
      permission: PERMISSIONS.VIEW_ASSIGNED_GROUPS,
      description: 'Consulter les absences de vos groupes'
    },
    {
      id: 'rollback',
      label: 'Annuler Absences',
      icon: MdUndo,
      permission: PERMISSIONS.ROLLBACK_ABSENCES,
      description: 'Annuler des absences récemment marquées'
    }
  ]

  const availableMenuItems = teacherMenuItems.filter(item => 
    checkPermission(item.permission)
  )

  const handleLogout = () => {
    logout()
  }

  return (
    <div className="teacher-dashboard">
      {/* Top Bar */}
      <header className="teacher-topbar">
        <div className="topbar-title">Tableau de Bord Formateur</div>
        <div className="topbar-user">
          <span className="user-name">{username}</span>
          <button className="topbar-logout" onClick={handleLogout}>
            Déconnexion
          </button>
        </div>
      </header>

      <div className="teacher-layout">
        {/* Left Sidebar */}
        <aside className="teacher-sidebar">
          <nav className="teacher-nav">
            {availableMenuItems.map(item => {
              const IconComponent = item.icon
              return (
                <ProtectedRoute 
                  key={item.id}
                  requiredPermission={item.permission}
                  showError={false}
                >
                  <button
                    className={`teacher-nav-item ${currentView === item.id ? 'active' : ''}`}
                    onClick={() => setCurrentView(item.id)}
                  >
                    <span className="nav-icon">
                      <IconComponent size={20} />
                    </span>
                    <span className="nav-label">{item.label}</span>
                  </button>
                </ProtectedRoute>
              )
            })}
            <button
              className="teacher-nav-item nav-logout"
              onClick={handleLogout}
            >
              <span className="nav-icon">
                <MdLogout size={20} />
              </span>
              <span className="nav-label">Déconnexion</span>
            </button>
          </nav>
        </aside>

        {/* Main Content */}
        <main className="teacher-main">
          {/* Key Numbers Row */}
          <section className="teacher-metrics-row">
            <div 
              className="teacher-metric-card"
              onClick={() => setCurrentView('consulter')}
            >
              <div className="metric-icon">
                <MdDashboard size={28} />
              </div>
              <div className="metric-content">
                <div className="metric-number">{metrics.absencesToday}</div>
                <div className="metric-label">Absences Aujourd'hui</div>
              </div>
            </div>
            <div className="teacher-metric-card">
              <div className="metric-icon">
                <MdGroup size={28} />
              </div>
              <div className="metric-content">
                <div className="metric-number">{metrics.groupCount}</div>
                <div className="metric-label">Mes Groupes</div>
              </div>
            </div>
            <div className="teacher-metric-card success">
              <div className="metric-icon">
                <MdCheckCircle size={28} />
              </div>
              <div className="metric-content">
                <div className="metric-number">{metrics.justifiedAbsences}</div>
                <div className="metric-label">Justifiées</div>
              </div>
            </div>
            <div className="teacher-metric-card warning">
              <div className="metric-icon">
                <MdWarning size={28} />
              </div>
              <div className="metric-content">
                <div className="metric-number">{metrics.unjustifiedAbsences}</div>
                <div className="metric-label">Non Justifiées</div>
              </div>
            </div>
          </section>

          {/* Quick Actions */}
          <section className="teacher-quick-actions">
            <h3>Actions Rapides</h3>
            <div className="quick-actions-grid">
              <ProtectedRoute requiredPermission={PERMISSIONS.MARK_ABSENCES} showError={false}>
                <button 
                  className="quick-action-btn primary"
                  onClick={() => setCurrentView('marquer')}
                >
                  <MdCheckCircle size={20} />
                  Marquer Absence
                </button>
              </ProtectedRoute>
              <ProtectedRoute requiredPermission={PERMISSIONS.VIEW_ASSIGNED_GROUPS} showError={false}>
                <button 
                  className="quick-action-btn secondary"
                  onClick={() => setCurrentView('consulter')}
                >
                  <MdDashboard size={20} />
                  Consulter Absences
                </button>
              </ProtectedRoute>
              <ProtectedRoute requiredPermission={PERMISSIONS.ROLLBACK_ABSENCES} showError={false}>
                <button 
                  className="quick-action-btn secondary"
                  onClick={() => setCurrentView('rollback')}
                >
                  <MdUndo size={20} />
                  Annuler Absence
                </button>
              </ProtectedRoute>
            </div>
          </section>

          {/* Menu Cards */}
          <section className="teacher-menu-cards">
            <h3>Fonctionnalités</h3>
            <div className="menu-cards-grid">
              {availableMenuItems.map(item => {
                const IconComponent = item.icon
                return (
                  <ProtectedRoute 
                    key={item.id}
                    requiredPermission={item.permission}
                    showError={false}
                  >
                    <div 
                      className={`menu-card ${currentView === item.id ? 'active' : ''}`}
                      onClick={() => setCurrentView(item.id)}
                    >
                      <div className="menu-card-icon">
                        <IconComponent size={28} />
                      </div>
                      <div className="menu-card-content">
                        <h4>{item.label}</h4>
                        <p>{item.description}</p>
                      </div>
                    </div>
                  </ProtectedRoute>
                )
              })}
            </div>
          </section>
        </main>
      </div>
    </div>
  )
}

export default TeacherDashboard