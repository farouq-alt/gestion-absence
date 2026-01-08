import { useMemo } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { useAppState } from '../hooks/useAppState'
import './AdminDashboard.css'

function AdminDashboard({ currentView, setCurrentView }) {
  const { username, logout } = useAuth()
  const { stagiaires, absences, groupes } = useAppState()

  // Calculate key metrics
  const metrics = useMemo(() => {
    const today = new Date().toISOString().split('T')[0]
    
    const totalStagiaires = stagiaires.length
    const absencesToday = absences.filter(a => a.date === today).length
    
    // Pending justifications (unjustified absences)
    const pendingJustifications = absences.filter(a => a.etat === 'NJ').length
    
    // At-risk students (those with low discipline scores or many absences)
    const absenceCountByStudent = absences.reduce((acc, a) => {
      acc[a.stagiaireId] = (acc[a.stagiaireId] || 0) + 1
      return acc
    }, {})
    
    const atRiskStudents = stagiaires.filter(s => {
      const absenceCount = absenceCountByStudent[s.id] || 0
      return s.noteDiscipline < 10 || absenceCount >= 3
    })

    return {
      totalStagiaires,
      absencesToday,
      pendingJustifications,
      atRiskCount: atRiskStudents.length,
      atRiskStudents
    }
  }, [stagiaires, absences])

  // Get at-risk students with details
  const atRiskStudentsData = useMemo(() => {
    const absenceCountByStudent = absences.reduce((acc, a) => {
      acc[a.stagiaireId] = (acc[a.stagiaireId] || 0) + 1
      return acc
    }, {})

    return metrics.atRiskStudents.map(s => {
      const groupe = groupes.find(g => g.id === s.groupeId)
      const absenceCount = absenceCountByStudent[s.id] || 0
      const status = s.noteDiscipline < 5 || absenceCount >= 5 ? 'danger' : 'warning'
      
      return {
        ...s,
        groupeName: groupe?.nom || 'N/A',
        pointsRestants: s.noteDiscipline,
        absenceCount,
        status
      }
    }).slice(0, 10) // Show top 10
  }, [metrics.atRiskStudents, groupes, absences])

  // Get pending justifications
  const pendingJustificationsData = useMemo(() => {
    return absences
      .filter(a => a.etat === 'NJ')
      .map(a => {
        const stagiaire = stagiaires.find(s => s.id === a.stagiaireId)
        return {
          ...a,
          stagiaireNom: stagiaire?.nom || 'Inconnu',
          module: 'Module général' // Placeholder - would come from real data
        }
      })
      .slice(0, 10) // Show top 10
  }, [absences, stagiaires])

  const handleLogout = () => {
    logout()
  }

  return (
    <div className="admin-dashboard">
      {/* Top Bar */}
      <header className="admin-topbar">
        <div className="topbar-title">OFPPT – Gestion des Absences</div>
        <div className="topbar-user">
          <span className="user-name">{username}</span>
          <button className="topbar-logout" onClick={handleLogout}>
            Déconnexion
          </button>
        </div>
      </header>

      <div className="admin-layout">
        {/* Left Sidebar */}
        <aside className="admin-sidebar">
          <nav className="admin-nav">
            <button
              className={`admin-nav-item ${currentView === 'dashboard' ? 'active' : ''}`}
              onClick={() => setCurrentView('dashboard')}
            >
              Tableau de bord
            </button>
            <button
              className={`admin-nav-item ${currentView === 'marquer' ? 'active' : ''}`}
              onClick={() => setCurrentView('marquer')}
            >
              Marquer absence
            </button>
            <button
              className={`admin-nav-item ${currentView === 'consulter' ? 'active' : ''}`}
              onClick={() => setCurrentView('consulter')}
            >
              Consulter absences
              {metrics.absencesToday > 0 && (
                <span className="nav-badge">{metrics.absencesToday}</span>
              )}
            </button>
            <button
              className={`admin-nav-item ${currentView === 'gestion-stagiaires' ? 'active' : ''}`}
              onClick={() => setCurrentView('gestion-stagiaires')}
            >
              Gestion stagiaires
            </button>
            <button
              className={`admin-nav-item ${currentView === 'import-excel' ? 'active' : ''}`}
              onClick={() => setCurrentView('import-excel')}
            >
              Import Excel
            </button>
            <button
              className={`admin-nav-item ${currentView === 'rapports' ? 'active' : ''}`}
              onClick={() => setCurrentView('rapports')}
            >
              Rapports
            </button>
            <button
              className="admin-nav-item nav-logout"
              onClick={handleLogout}
            >
              Déconnexion
            </button>
          </nav>
        </aside>

        {/* Main Content */}
        <main className="admin-main">
          {/* Key Numbers Row */}
          <section className="metrics-row">
            <div 
              className="metric-card clickable"
              onClick={() => setCurrentView('gestion-stagiaires')}
            >
              <div className="metric-number">{metrics.totalStagiaires}</div>
              <div className="metric-label">Total stagiaires</div>
            </div>
            <div 
              className="metric-card clickable"
              onClick={() => setCurrentView('consulter')}
            >
              <div className="metric-number">{metrics.absencesToday}</div>
              <div className="metric-label">Absences aujourd'hui</div>
            </div>
            <div 
              className="metric-card clickable warning"
              onClick={() => setCurrentView('consulter')}
            >
              <div className="metric-number">{metrics.pendingJustifications}</div>
              <div className="metric-label">Justifications en attente</div>
            </div>
            <div 
              className="metric-card clickable danger"
              onClick={() => setCurrentView('gestion-stagiaires')}
            >
              <div className="metric-number">{metrics.atRiskCount}</div>
              <div className="metric-label">Stagiaires à risque</div>
            </div>
          </section>

          {/* Work Area - Two Columns */}
          <section className="work-area">
            {/* Left Column - Tables */}
            <div className="work-column-left">
              {/* At-Risk Students Table */}
              <div className="work-block">
                <h3 className="block-title">Stagiaires à risque</h3>
                <div className="table-wrapper">
                  <table className="admin-table">
                    <thead>
                      <tr>
                        <th>Nom</th>
                        <th>Groupe</th>
                        <th>Points restants</th>
                        <th>Statut</th>
                      </tr>
                    </thead>
                    <tbody>
                      {atRiskStudentsData.length > 0 ? (
                        atRiskStudentsData.map(student => (
                          <tr key={student.id}>
                            <td>{student.nom}</td>
                            <td>{student.groupeName}</td>
                            <td>{student.pointsRestants}</td>
                            <td>
                              <span className={`status-badge ${student.status}`}>
                                {student.status === 'danger' ? 'Danger' : 'Attention'}
                              </span>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan="4" className="empty-row">
                            Aucun stagiaire à risque
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Pending Justifications Table */}
              <div className="work-block">
                <h3 className="block-title">Justifications en attente</h3>
                <div className="table-wrapper">
                  <table className="admin-table">
                    <thead>
                      <tr>
                        <th>Nom</th>
                        <th>Date</th>
                        <th>Module</th>
                        <th>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {pendingJustificationsData.length > 0 ? (
                        pendingJustificationsData.map(absence => (
                          <tr key={absence.id}>
                            <td>{absence.stagiaireNom}</td>
                            <td>{absence.date}</td>
                            <td>{absence.module}</td>
                            <td>
                              <button 
                                className="action-link"
                                onClick={() => setCurrentView('consulter')}
                              >
                                Voir
                              </button>
                              <button className="action-link approve">
                                Approuver
                              </button>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan="4" className="empty-row">
                            Aucune justification en attente
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* Right Column - Actions */}
            <div className="work-column-right">
              <div className="actions-block">
                <button 
                  className="action-btn primary"
                  onClick={() => setCurrentView('marquer')}
                >
                  Marquer absence
                </button>
                <button 
                  className="action-btn secondary"
                  onClick={() => setCurrentView('import-excel')}
                >
                  Importer Excel
                </button>
                <button 
                  className="action-btn secondary"
                  onClick={() => setCurrentView('rapports')}
                >
                  Générer rapports
                </button>
              </div>
            </div>
          </section>
        </main>
      </div>
    </div>
  )
}

export default AdminDashboard
