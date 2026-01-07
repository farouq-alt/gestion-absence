import { useState, useMemo, useEffect } from 'react'
import { useAuth } from './contexts/AuthContext'
import { useAppState } from './hooks/useAppState'
import { useToast } from './components/Toast'
import ErrorBoundary from './components/ErrorBoundary'
import LoadingSpinner from './components/LoadingSpinner'
import RoleSelector from './components/RoleSelector'
import AuthenticationForm from './components/AuthenticationForm'
import AdminDashboard from './components/AdminDashboard'
import TeacherDashboard from './components/TeacherDashboard'
import ProtectedRoute from './components/ProtectedRoute'
import StudentManager from './components/StudentManager'
import ExcelImporter from './components/ExcelImporter'
import RollbackManager from './components/RollbackManager'
import AbsenceAnalytics from './components/AbsenceAnalytics'
import EnhancedAbsenceConsultation from './components/EnhancedAbsenceConsultation'
import { PERMISSIONS } from './utils/permissions'
import './App.css'

function App() {
  const { isAuthenticated, userRole, username, logout } = useAuth()
  const { 
    secteurs, 
    filieres, 
    absences, 
    stagiaires, 
    groupes,
    isLoading,
    loadingMessage,
    setLoading,
    addAbsences,
    removeAbsence,
    logAction
  } = useAppState()
  const { showSuccess, showError, showWarning } = useToast()
  
  const [showRoleSelector, setShowRoleSelector] = useState(true)
  const [selectedRole, setSelectedRole] = useState(null)
  const [currentView, setCurrentView] = useState('dashboard')
  const [isOnline, setIsOnline] = useState(navigator.onLine)
  
  // Filter states
  const [selectedSecteur, setSelectedSecteur] = useState('')
  const [selectedFiliere, setSelectedFiliere] = useState('')
  const [selectedGroupe, setSelectedGroupe] = useState('')
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0])
  
  // Selection states
  const [selectedStagiaires, setSelectedStagiaires] = useState([])
  const [stagiairesDurations, setStagiairesDurations] = useState({}) // Individual durations for each student
  const [absenceDuree, setAbsenceDuree] = useState('1')
  const [absenceEtat, setAbsenceEtat] = useState('NJ')

  // Network status monitoring
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true)
      showSuccess('Connexion rétablie')
    }
    
    const handleOffline = () => {
      setIsOnline(false)
      showWarning('Connexion perdue - Mode hors ligne')
    }

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [showSuccess, showWarning])

  // Error handling for unhandled promise rejections
  useEffect(() => {
    const handleUnhandledRejection = (event) => {
      console.error('Unhandled promise rejection:', event.reason)
      showError('Une erreur inattendue s\'est produite')
    }

    window.addEventListener('unhandledrejection', handleUnhandledRejection)
    return () => window.removeEventListener('unhandledrejection', handleUnhandledRejection)
  }, [showError])

  // Filtered data with error handling
  const filteredFilieres = useMemo(() => {
    try {
      if (!selectedSecteur) return []
      return filieres.filter(f => f.secteurId === parseInt(selectedSecteur))
    } catch (error) {
      console.error('Error filtering filieres:', error)
      showError('Erreur lors du filtrage des filières')
      return []
    }
  }, [selectedSecteur, filieres, showError])

  const filteredGroupes = useMemo(() => {
    try {
      if (!selectedFiliere) return []
      return groupes.filter(g => g.filiereId === parseInt(selectedFiliere))
    } catch (error) {
      console.error('Error filtering groupes:', error)
      showError('Erreur lors du filtrage des groupes')
      return []
    }
  }, [selectedFiliere, groupes, showError])

  const filteredStagiaires = useMemo(() => {
    try {
      if (!selectedGroupe) return []
      return stagiaires.filter(s => s.groupeId === parseInt(selectedGroupe))
    } catch (error) {
      console.error('Error filtering stagiaires:', error)
      showError('Erreur lors du filtrage des stagiaires')
      return []
    }
  }, [selectedGroupe, stagiaires, showError])

  // Handlers with enhanced error handling and loading states
  const handleSecteurChange = async (e) => {
    try {
      setLoading(true, 'Chargement des filières...')
      setSelectedSecteur(e.target.value)
      setSelectedFiliere('')
      setSelectedGroupe('')
      setSelectedStagiaires([])
      setStagiairesDurations({}) // Clear durations when changing selection
      
      // Simulate async operation for better UX
      await new Promise(resolve => setTimeout(resolve, 100))
    } catch (error) {
      console.error('Error changing secteur:', error)
      showError('Erreur lors du changement de secteur')
    } finally {
      setLoading(false)
    }
  }

  const handleFiliereChange = async (e) => {
    try {
      setLoading(true, 'Chargement des groupes...')
      setSelectedFiliere(e.target.value)
      setSelectedGroupe('')
      setSelectedStagiaires([])
      setStagiairesDurations({}) // Clear durations when changing selection
      
      // Simulate async operation for better UX
      await new Promise(resolve => setTimeout(resolve, 100))
    } catch (error) {
      console.error('Error changing filiere:', error)
      showError('Erreur lors du changement de filière')
    } finally {
      setLoading(false)
    }
  }

  const handleGroupeChange = async (e) => {
    try {
      setLoading(true, 'Chargement des stagiaires...')
      setSelectedGroupe(e.target.value)
      setSelectedStagiaires([])
      setStagiairesDurations({}) // Clear durations when changing selection
      
      // Simulate async operation for better UX
      await new Promise(resolve => setTimeout(resolve, 100))
    } catch (error) {
      console.error('Error changing groupe:', error)
      showError('Erreur lors du changement de groupe')
    } finally {
      setLoading(false)
    }
  }

  const handleSelectAll = (e) => {
    if (e.target.checked) {
      const allIds = filteredStagiaires.map(s => s.id)
      setSelectedStagiaires(allIds)
      
      // Initialize durations for all selected students
      const initialDurations = {}
      allIds.forEach(id => {
        initialDurations[id] = absenceDuree
      })
      setStagiairesDurations(initialDurations)
    } else {
      setSelectedStagiaires([])
      setStagiairesDurations({}) // Clear all durations
    }
  }

  const handleSelectStagiaire = (id) => {
    setSelectedStagiaires(prev => {
      const newSelected = prev.includes(id) 
        ? prev.filter(s => s !== id)
        : [...prev, id]
      
      // Initialize duration for newly selected students
      if (!prev.includes(id) && newSelected.includes(id)) {
        setStagiairesDurations(prevDurations => ({
          ...prevDurations,
          [id]: absenceDuree // Use current default duration
        }))
      }
      
      // Clean up duration for deselected students
      if (prev.includes(id) && !newSelected.includes(id)) {
        setStagiairesDurations(prevDurations => {
          const { [id]: _removed, ...rest } = prevDurations
          return rest
        })
      }
      
      return newSelected
    })
  }

  const handleStagiaireDurationChange = (stagiaireId, duration) => {
    setStagiairesDurations(prev => ({
      ...prev,
      [stagiaireId]: duration
    }))
  }

  const handleCustomDurationChange = (stagiaireId, customDuration) => {
    // Validate custom duration (0.5 to 8 hours)
    const duration = parseFloat(customDuration)
    if (isNaN(duration) || duration < 0.5 || duration > 8) {
      return false // Invalid duration
    }
    
    setStagiairesDurations(prev => ({
      ...prev,
      [stagiaireId]: customDuration
    }))
    return true
  }

  const handleMarquerAbsence = async () => {
    if (selectedStagiaires.length === 0 || !selectedDate) {
      showWarning('Veuillez sélectionner au moins un stagiaire et une date')
      return
    }
    
    try {
      setLoading(true, 'Enregistrement des absences...')
      
      // Validate all custom durations before proceeding
      const invalidDurations = selectedStagiaires.filter(stagiaireId => {
        const duration = stagiairesDurations[stagiaireId] || absenceDuree
        if (duration === 'custom') return false // Custom should have been replaced with actual value
        const numDuration = parseFloat(duration)
        return isNaN(numDuration) || numDuration < 0.5 || numDuration > 8
      })
      
      if (invalidDurations.length > 0) {
        showError('Certaines durées sont invalides. Veuillez vérifier les durées personnalisées (0.5 à 8 heures).')
        return
      }
      
      const newAbsences = selectedStagiaires.map((stagiaireId, index) => {
        const individualDuration = stagiairesDurations[stagiaireId] || absenceDuree
        let finalDuration
        
        // Convert duration to hours for storage
        if (individualDuration === '1') {
          finalDuration = 2.5 // 1 session = 2.5 hours
        } else if (individualDuration === '2') {
          finalDuration = 5 // 2 sessions = 5 hours
        } else {
          finalDuration = parseFloat(individualDuration) // Custom duration in hours
        }
        
        return {
          id: Date.now() + index + Math.random(),
          stagiaireId,
          date: selectedDate,
          duree: finalDuration, // Store as hours
          dureSessions: individualDuration === '1' ? 1 : individualDuration === '2' ? 2 : 'custom', // Keep session info for display
          etat: absenceEtat,
          recordedBy: username || 'current_user', // Track who recorded the absence
          recordedAt: new Date().toISOString() // Track when it was recorded
        }
      })
      
      // Simulate network delay for better UX
      await new Promise(resolve => setTimeout(resolve, 500))
      
      addAbsences(newAbsences, username)
      setSelectedStagiaires([])
      setStagiairesDurations({}) // Clear individual durations
      
      showSuccess(`${newAbsences.length} absence(s) marquée(s) avec succès.`)
    } catch (error) {
      console.error('Error marking absences:', error)
      showError('Erreur lors de l\'enregistrement des absences')
    } finally {
      setLoading(false)
    }
  }

  const handleRollback = async (absenceId) => {
    try {
      setLoading(true, 'Annulation de l\'absence...')
      
      // Simulate network delay
      await new Promise(resolve => setTimeout(resolve, 300))
      
      removeAbsence(absenceId, username)
      showSuccess('Absence annulée avec succès.')
    } catch (error) {
      console.error('Error rolling back absence:', error)
      showError('Erreur lors de l\'annulation de l\'absence')
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = async () => {
    try {
      setLoading(true, 'Déconnexion...')
      
      // Log the logout action
      logAction('LOGOUT', { timestamp: new Date().toISOString() }, username)
      
      // Simulate logout delay
      await new Promise(resolve => setTimeout(resolve, 300))
      
      logout()
      setShowRoleSelector(true)
      setSelectedRole(null)
      setCurrentView('dashboard')
      
      showSuccess('Déconnexion réussie')
    } catch (error) {
      console.error('Error during logout:', error)
      showError('Erreur lors de la déconnexion')
    } finally {
      setLoading(false)
    }
  }

  const handleRoleSelected = (role) => {
    try {
      setSelectedRole(role)
      setShowRoleSelector(false)
      logAction('ROLE_SELECTED', { role }, 'anonymous')
    } catch (error) {
      console.error('Error selecting role:', error)
      showError('Erreur lors de la sélection du rôle')
    }
  }

  const handleBackToRoleSelection = () => {
    try {
      setShowRoleSelector(true)
      setSelectedRole(null)
    } catch (error) {
      console.error('Error going back to role selection:', error)
      showError('Erreur lors du retour à la sélection de rôle')
    }
  }

  // Show role selector if not authenticated and showRoleSelector is true
  if (!isAuthenticated && showRoleSelector) {
    return (
      <ErrorBoundary>
        <RoleSelector onRoleSelected={handleRoleSelected} />
      </ErrorBoundary>
    )
  }

  // Show authentication form if role is selected but not authenticated
  if (!isAuthenticated && selectedRole) {
    return (
      <ErrorBoundary>
        <AuthenticationForm 
          selectedRole={selectedRole} 
          onBack={handleBackToRoleSelection}
        />
      </ErrorBoundary>
    )
  }

  return (
    <ErrorBoundary>
      <div className="app-container">
        {/* Loading overlay */}
        {isLoading && (
          <LoadingSpinner 
            overlay={true} 
            message={loadingMessage} 
            size="large"
          />
        )}

        {/* Connection status indicator */}
        {!isOnline && (
          <div className="connection-status">
            <div className="connection-offline">
              Mode hors ligne - Certaines fonctionnalités peuvent être limitées
            </div>
          </div>
        )}

        {/* Left Sidebar */}
        <aside className="sidebar">
          <div className="sidebar-header">
            <h2>OFPPT</h2>
          </div>
          <nav className="sidebar-nav">
            <button 
              className={`nav-item ${currentView === 'dashboard' ? 'active' : ''}`}
              onClick={() => setCurrentView('dashboard')}
              disabled={isLoading}
            >
              Tableau de bord
            </button>
            
            <ProtectedRoute 
              requiredPermission={PERMISSIONS.MARK_ABSENCES}
              showError={false}
              fallback={null}
            >
              <button 
                className={`nav-item ${currentView === 'marquer' ? 'active' : ''}`}
                onClick={() => setCurrentView('marquer')}
                disabled={isLoading}
              >
                Marquer Absence
              </button>
            </ProtectedRoute>
            
            <ProtectedRoute 
              requiredPermissions={[PERMISSIONS.VIEW_ALL_GROUPS, PERMISSIONS.VIEW_ASSIGNED_GROUPS]}
              showError={false}
              fallback={null}
            >
              <button 
                className={`nav-item ${currentView === 'consulter' ? 'active' : ''}`}
                onClick={() => setCurrentView('consulter')}
                disabled={isLoading}
              >
                Consulter Absences
              </button>
            </ProtectedRoute>

            <ProtectedRoute 
              requiredPermission={PERMISSIONS.STUDENT_MANAGEMENT}
              showError={false}
              fallback={null}
            >
              <button 
                className={`nav-item ${currentView === 'gestion-stagiaires' ? 'active' : ''}`}
                onClick={() => setCurrentView('gestion-stagiaires')}
                disabled={isLoading}
              >
                Gestion Stagiaires
              </button>
            </ProtectedRoute>

            <ProtectedRoute 
              requiredPermission={PERMISSIONS.EXCEL_IMPORT}
              showError={false}
              fallback={null}
            >
              <button 
                className={`nav-item ${currentView === 'import-excel' ? 'active' : ''}`}
                onClick={() => setCurrentView('import-excel')}
                disabled={isLoading}
              >
                Import Excel
              </button>
            </ProtectedRoute>

            <ProtectedRoute 
              requiredPermission={PERMISSIONS.ROLLBACK_ABSENCES}
              showError={false}
              fallback={null}
            >
              <button 
                className={`nav-item ${currentView === 'rollback' ? 'active' : ''}`}
                onClick={() => setCurrentView('rollback')}
                disabled={isLoading}
              >
                Annuler Absences
              </button>
            </ProtectedRoute>

            <ProtectedRoute 
              requiredPermissions={[PERMISSIONS.VIEW_ALL_GROUPS, PERMISSIONS.VIEW_ASSIGNED_GROUPS]}
              showError={false}
              fallback={null}
            >
              <button 
                className={`nav-item ${currentView === 'analytics' ? 'active' : ''}`}
                onClick={() => setCurrentView('analytics')}
                disabled={isLoading}
              >
                Analyse Absences
              </button>
            </ProtectedRoute>

            <ProtectedRoute 
              requiredPermission={PERMISSIONS.SYSTEM_REPORTS}
              showError={false}
              fallback={null}
            >
              <button 
                className={`nav-item ${currentView === 'rapports' ? 'active' : ''}`}
                onClick={() => setCurrentView('rapports')}
                disabled={isLoading}
              >
                Rapports
              </button>
            </ProtectedRoute>

            <button 
              className="nav-item nav-item-logout" 
              onClick={handleLogout}
              disabled={isLoading}
            >
              Déconnexion
            </button>
          </nav>
        </aside>

        {/* Main Area */}
        <div className="main-area">
          {/* Header */}
          <header className="header">
            <h1 className="header-title">Gestion des Absences</h1>
            <div className="header-user">
              <div className="user-info">
                Connecté en tant que: <span>{userRole} ({username})</span>
              </div>
              {!isOnline && (
                <div className="status-indicator status-warning">
                  Hors ligne
                </div>
              )}
            </div>
          </header>

          {/* Main Content */}
          <main className="main-content">
            <ErrorBoundary>
              {currentView === 'dashboard' ? (
                userRole === 'Administrateur' ? (
                  <AdminDashboard currentView={currentView} setCurrentView={setCurrentView} />
                ) : (
                  <TeacherDashboard currentView={currentView} setCurrentView={setCurrentView} />
                )
              ) : currentView === 'marquer' ? (
                <ProtectedRoute requiredPermission={PERMISSIONS.MARK_ABSENCES}>
                  <>
                    {/* Filter Section */}
                    <section className="filter-section">
                      <div className="filter-section-title">Filtres de sélection</div>
                      <div className="filter-row">
                        <div className={`filter-group ${isLoading ? 'form-group-loading' : ''}`}>
                          <label>Secteur</label>
                          <select 
                            value={selectedSecteur} 
                            onChange={handleSecteurChange}
                            disabled={isLoading}
                          >
                            <option value="">-- Sélectionner --</option>
                            {secteurs.map(s => (
                              <option key={s.id} value={s.id}>{s.nom}</option>
                            ))}
                          </select>
                        </div>
                        <div className={`filter-group ${isLoading ? 'form-group-loading' : ''}`}>
                          <label>Filière</label>
                          <select 
                            value={selectedFiliere} 
                            onChange={handleFiliereChange}
                            disabled={!selectedSecteur || isLoading}
                          >
                            <option value="">-- Sélectionner --</option>
                            {filteredFilieres.map(f => (
                              <option key={f.id} value={f.id}>{f.nom}</option>
                            ))}
                          </select>
                        </div>
                        <div className={`filter-group ${isLoading ? 'form-group-loading' : ''}`}>
                          <label>Groupe</label>
                          <select 
                            value={selectedGroupe} 
                            onChange={handleGroupeChange}
                            disabled={!selectedFiliere || isLoading}
                          >
                            <option value="">-- Sélectionner --</option>
                            {filteredGroupes.map(g => (
                              <option key={g.id} value={g.id}>{g.nom}</option>
                            ))}
                          </select>
                        </div>
                        <div className="filter-group">
                          <label>Date absence</label>
                          <input 
                            type="date" 
                            value={selectedDate}
                            onChange={(e) => setSelectedDate(e.target.value)}
                            disabled={isLoading}
                          />
                        </div>
                      </div>
                    </section>

                    {/* Stagiaires Table */}
                    <section className="table-section">
                      <div className="table-section-header">
                        <span className="table-section-title">Liste des Stagiaires</span>
                        <span className="table-section-count">
                          {selectedStagiaires.length} sélectionné(s) sur {filteredStagiaires.length}
                        </span>
                      </div>
                      <div className="table-container">
                        {filteredStagiaires.length > 0 ? (
                          <table>
                            <thead>
                              <tr>
                                <th className="th-checkbox">
                                  <input 
                                    type="checkbox"
                                    checked={selectedStagiaires.length === filteredStagiaires.length && filteredStagiaires.length > 0}
                                    onChange={handleSelectAll}
                                    disabled={isLoading}
                                  />
                                </th>
                                <th className="th-cef">CEF</th>
                                <th>Nom du stagiaire</th>
                                <th>Email</th>
                                <th className="th-note">Note discipline</th>
                                <th className="th-duration">Durée absence</th>
                              </tr>
                            </thead>
                            <tbody>
                              {filteredStagiaires.map(s => (
                                <tr key={s.id}>
                                  <td>
                                    <input 
                                      type="checkbox"
                                      checked={selectedStagiaires.includes(s.id)}
                                      onChange={() => handleSelectStagiaire(s.id)}
                                      disabled={isLoading}
                                    />
                                  </td>
                                  <td>{s.cef}</td>
                                  <td>{s.nom}</td>
                                  <td>{s.email}</td>
                                  <td>{s.noteDiscipline}</td>
                                  <td>
                                    {selectedStagiaires.includes(s.id) ? (
                                      <div className="duration-selector">
                                        <select
                                          value={stagiairesDurations[s.id] || absenceDuree}
                                          onChange={(e) => handleStagiaireDurationChange(s.id, e.target.value)}
                                          className="duration-select"
                                          disabled={isLoading}
                                        >
                                          <option value="1">2h30 (1 séance)</option>
                                          <option value="2">5h00 (2 séances)</option>
                                          <option value="custom">Durée personnalisée</option>
                                        </select>
                                        {(stagiairesDurations[s.id] === 'custom') && (
                                          <input
                                            type="number"
                                            min="0.5"
                                            max="8"
                                            step="0.5"
                                            placeholder="Heures"
                                            className="custom-duration-input"
                                            disabled={isLoading}
                                            onChange={(e) => {
                                              if (!handleCustomDurationChange(s.id, e.target.value)) {
                                                e.target.setCustomValidity('Durée invalide (0.5 à 8 heures)')
                                              } else {
                                                e.target.setCustomValidity('')
                                              }
                                            }}
                                          />
                                        )}
                                      </div>
                                    ) : (
                                      <span className="duration-placeholder">-</span>
                                    )}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        ) : (
                          <div className="empty-state">
                            {isLoading ? (
                              <LoadingSpinner message="Chargement des stagiaires..." />
                            ) : (
                              'Sélectionnez un secteur, une filière et un groupe pour afficher les stagiaires.'
                            )}
                          </div>
                        )}
                      </div>
                    </section>

                    {/* Action Section */}
                    <section className="action-section">
                      <div className="action-section-title">Marquer l'absence</div>
                      <div className="action-row">
                        <div className="action-group">
                          <label>Durée</label>
                          <select 
                            value={absenceDuree} 
                            onChange={(e) => setAbsenceDuree(e.target.value)}
                            disabled={isLoading}
                          >
                            <option value="1">1 séance (2h30)</option>
                            <option value="2">2 séances (5h00)</option>
                          </select>
                        </div>
                        <div className="action-group">
                          <label>État</label>
                          <select 
                            value={absenceEtat} 
                            onChange={(e) => setAbsenceEtat(e.target.value)}
                            disabled={isLoading}
                          >
                            <option value="J">Justifiée</option>
                            <option value="NJ">Non justifiée</option>
                          </select>
                        </div>
                        <button 
                          className={`btn-primary ${isLoading ? 'btn-loading' : ''}`}
                          onClick={handleMarquerAbsence}
                          disabled={selectedStagiaires.length === 0 || isLoading}
                        >
                          {isLoading ? '' : 'Marquer absence pour les stagiaires sélectionnés'}
                        </button>
                      </div>
                    </section>
                  </>
                </ProtectedRoute>
              ) : currentView === 'consulter' ? (
                <ProtectedRoute requiredPermissions={[PERMISSIONS.VIEW_ALL_GROUPS, PERMISSIONS.VIEW_ASSIGNED_GROUPS]}>
                  <EnhancedAbsenceConsultation absences={absences} />
                </ProtectedRoute>
              ) : currentView === 'gestion-stagiaires' ? (
                <ProtectedRoute requiredPermission={PERMISSIONS.STUDENT_MANAGEMENT}>
                  <StudentManager />
                </ProtectedRoute>
              ) : currentView === 'import-excel' ? (
                <ProtectedRoute requiredPermission={PERMISSIONS.EXCEL_IMPORT}>
                  <ExcelImporter />
                </ProtectedRoute>
              ) : currentView === 'rollback' ? (
                <ProtectedRoute requiredPermission={PERMISSIONS.ROLLBACK_ABSENCES}>
                  <RollbackManager 
                    absences={absences}
                    onRollback={handleRollback}
                    currentUser={username}
                  />
                </ProtectedRoute>
              ) : currentView === 'analytics' ? (
                <ProtectedRoute requiredPermissions={[PERMISSIONS.VIEW_ALL_GROUPS, PERMISSIONS.VIEW_ASSIGNED_GROUPS]}>
                  <AbsenceAnalytics absences={absences} />
                </ProtectedRoute>
              ) : (
                <div className="feature-placeholder">
                  <h3>Fonctionnalité en développement</h3>
                  <p>Cette fonctionnalité sera disponible prochainement.</p>
                  <p>Vue actuelle: {currentView}</p>
                </div>
              )}
            </ErrorBoundary>
          </main>
        </div>
      </div>
    </ErrorBoundary>
  )
}

export default App
