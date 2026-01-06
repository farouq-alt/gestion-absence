import { useState, useMemo } from 'react'
import './App.css'

// Login Component with role selection
function LoginPage({ onLogin }) {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [role, setRole] = useState('formateur')

  const handleSubmit = (e) => {
    e.preventDefault()
    if (username && password) {
      onLogin(role)
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
          <span className="logo-text">FPPT</span>
        </div>
        <div className="login-subtitle">Attendance Management</div>
        
        <form onSubmit={handleSubmit} className="login-form">
          <div className="login-field">
            <label>Type de compte</label>
            <select value={role} onChange={(e) => setRole(e.target.value)} className="login-select">
              <option value="formateur">Formateur</option>
              <option value="admin">Administrateur</option>
            </select>
          </div>
          <div className="login-field">
            <label>Username</label>
            <input 
              type="text" 
              placeholder="Enter username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
            />
          </div>
          <div className="login-field">
            <label>Password</label>
            <input 
              type="password" 
              placeholder="Enter password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          <button type="submit" className="login-btn">Login</button>
        </form>
      </div>
    </div>
  )
}

// Mock Data
const SECTEURS = [
  { id: 1, nom: 'IA & Digital' },
  { id: 2, nom: 'Industriel' },
  { id: 3, nom: 'AGC' },
  { id: 4, nom: 'BTP' },
]

const FILIERES = [
  { id: 1, nom: 'Développement Digital', secteurId: 1 },
  { id: 2, nom: 'Infrastructure Digitale', secteurId: 1 },
  { id: 3, nom: 'Électromécanique', secteurId: 2 },
  { id: 4, nom: 'Fabrication Mécanique', secteurId: 2 },
  { id: 5, nom: 'Gestion des Entreprises', secteurId: 3 },
  { id: 6, nom: 'Comptabilité', secteurId: 3 },
  { id: 7, nom: 'Génie Civil', secteurId: 4 },
]

const GROUPES = [
  { id: 1, nom: 'DEV101', filiereId: 1 },
  { id: 2, nom: 'DEV102', filiereId: 1 },
  { id: 3, nom: 'INF101', filiereId: 2 },
  { id: 4, nom: 'ELM101', filiereId: 3 },
  { id: 5, nom: 'GE101', filiereId: 5 },
  { id: 6, nom: 'CPT101', filiereId: 6 },
]

const initialStagiaires = [
  { id: 1, cef: 'CEF001', nom: 'ALAMI Mohammed', email: 'alami.m@ofppt.ma', groupeId: 1, noteDiscipline: 20 },
  { id: 2, cef: 'CEF002', nom: 'BENALI Fatima', email: 'benali.f@ofppt.ma', groupeId: 1, noteDiscipline: 18 },
  { id: 3, cef: 'CEF003', nom: 'CHAKIR Ahmed', email: 'chakir.a@ofppt.ma', groupeId: 1, noteDiscipline: 20 },
  { id: 4, cef: 'CEF004', nom: 'DAHBI Sara', email: 'dahbi.s@ofppt.ma', groupeId: 1, noteDiscipline: 16 },
  { id: 5, cef: 'CEF005', nom: 'EL FASSI Youssef', email: 'elfassi.y@ofppt.ma', groupeId: 1, noteDiscipline: 20 },
  { id: 6, cef: 'CEF006', nom: 'FILALI Khadija', email: 'filali.k@ofppt.ma', groupeId: 2, noteDiscipline: 19 },
  { id: 7, cef: 'CEF007', nom: 'GHALI Omar', email: 'ghali.o@ofppt.ma', groupeId: 2, noteDiscipline: 20 },
  { id: 8, cef: 'CEF008', nom: 'HAMIDI Laila', email: 'hamidi.l@ofppt.ma', groupeId: 3, noteDiscipline: 17 },
  { id: 9, cef: 'CEF009', nom: 'IDRISSI Rachid', email: 'idrissi.r@ofppt.ma', groupeId: 4, noteDiscipline: 20 },
  { id: 10, cef: 'CEF010', nom: 'JABRI Amina', email: 'jabri.a@ofppt.ma', groupeId: 5, noteDiscipline: 20 },
]

const initialAbsences = [
  { id: 1, stagiaireId: 1, date: '2025-01-15', duree: 1, etat: 'NJ' },
  { id: 2, stagiaireId: 2, date: '2025-01-15', duree: 2, etat: 'J' },
  { id: 3, stagiaireId: 3, date: '2025-01-16', duree: 1, etat: 'NJ' },
  { id: 4, stagiaireId: 1, date: '2025-01-20', duree: 2, etat: 'J' },
]

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [userRole, setUserRole] = useState('')
  const [currentView, setCurrentView] = useState('marquer')
  const [absences, setAbsences] = useState(initialAbsences)
  const [stagiaires, setStagiaires] = useState(initialStagiaires)
  
  // Filter states
  const [selectedSecteur, setSelectedSecteur] = useState('')
  const [selectedFiliere, setSelectedFiliere] = useState('')
  const [selectedGroupe, setSelectedGroupe] = useState('')
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0])
  
  // Selection states
  const [selectedStagiaires, setSelectedStagiaires] = useState([])
  const [absenceDuree, setAbsenceDuree] = useState('1')
  const [absenceEtat, setAbsenceEtat] = useState('NJ')
  
  // Consult view states
  const [consultDate, setConsultDate] = useState('')
  const [consultGroupe, setConsultGroupe] = useState('')

  // Filtered data
  const filteredFilieres = useMemo(() => {
    if (!selectedSecteur) return []
    return FILIERES.filter(f => f.secteurId === parseInt(selectedSecteur))
  }, [selectedSecteur])

  const filteredGroupes = useMemo(() => {
    if (!selectedFiliere) return []
    return GROUPES.filter(g => g.filiereId === parseInt(selectedFiliere))
  }, [selectedFiliere])

  const filteredStagiaires = useMemo(() => {
    if (!selectedGroupe) return []
    return stagiaires.filter(s => s.groupeId === parseInt(selectedGroupe))
  }, [selectedGroupe, stagiaires])

  // Handlers
  const handleLogin = (role) => {
    setUserRole(role)
    setIsLoggedIn(true)
    setCurrentView(role === 'admin' ? 'consulter' : 'marquer')
  }

  const handleSecteurChange = (e) => {
    setSelectedSecteur(e.target.value)
    setSelectedFiliere('')
    setSelectedGroupe('')
    setSelectedStagiaires([])
  }

  const handleFiliereChange = (e) => {
    setSelectedFiliere(e.target.value)
    setSelectedGroupe('')
    setSelectedStagiaires([])
  }

  const handleGroupeChange = (e) => {
    setSelectedGroupe(e.target.value)
    setSelectedStagiaires([])
  }

  const handleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedStagiaires(filteredStagiaires.map(s => s.id))
    } else {
      setSelectedStagiaires([])
    }
  }

  const handleSelectStagiaire = (id) => {
    setSelectedStagiaires(prev => 
      prev.includes(id) 
        ? prev.filter(s => s !== id)
        : [...prev, id]
    )
  }

  // Mark absence - affects discipline note for NJ absences (-0.5 per session)
  const handleMarquerAbsence = () => {
    if (selectedStagiaires.length === 0 || !selectedDate) return
    
    const duree = parseInt(absenceDuree)
    const newAbsences = selectedStagiaires.map((stagiaireId, index) => ({
      id: absences.length + index + 1,
      stagiaireId,
      date: selectedDate,
      duree,
      etat: absenceEtat
    }))
    
    // Update discipline notes for NJ absences (-0.5 per session)
    if (absenceEtat === 'NJ') {
      setStagiaires(prev => prev.map(s => {
        if (selectedStagiaires.includes(s.id)) {
          const penalty = duree * 0.5
          return { ...s, noteDiscipline: Math.max(0, s.noteDiscipline - penalty) }
        }
        return s
      }))
    }
    
    setAbsences(prev => [...prev, ...newAbsences])
    setSelectedStagiaires([])
    alert(`${newAbsences.length} absence(s) marquée(s) avec succès.${absenceEtat === 'NJ' ? ` Note discipline: -${duree * 0.5} points.` : ''}`)
  }

  // Toggle absence state (J <=> NJ) - Admin only
  const handleToggleEtat = (absenceId) => {
    const absence = absences.find(a => a.id === absenceId)
    if (!absence) return
    
    const newEtat = absence.etat === 'J' ? 'NJ' : 'J'
    const penalty = absence.duree * 0.5
    
    // Update stagiaire discipline note
    setStagiaires(prev => prev.map(s => {
      if (s.id === absence.stagiaireId) {
        if (newEtat === 'NJ') {
          // Changed from J to NJ: subtract points
          return { ...s, noteDiscipline: Math.max(0, s.noteDiscipline - penalty) }
        } else {
          // Changed from NJ to J: restore points
          return { ...s, noteDiscipline: Math.min(20, s.noteDiscipline + penalty) }
        }
      }
      return s
    }))
    
    setAbsences(prev => prev.map(a => 
      a.id === absenceId ? { ...a, etat: newEtat } : a
    ))
  }

  // Consult absences data
  const consultAbsences = useMemo(() => {
    let filtered = absences
    if (consultDate) {
      filtered = filtered.filter(a => a.date === consultDate)
    }
    if (consultGroupe) {
      const groupeStagiaires = stagiaires.filter(s => s.groupeId === parseInt(consultGroupe)).map(s => s.id)
      filtered = filtered.filter(a => groupeStagiaires.includes(a.stagiaireId))
    }
    return filtered.map(a => {
      const stagiaire = stagiaires.find(s => s.id === a.stagiaireId)
      return { ...a, stagiaire }
    })
  }, [absences, consultDate, consultGroupe, stagiaires])

  // Statistics calculations
  const statistics = useMemo(() => {
    const totalAbsences = absences.length
    const totalNJ = absences.filter(a => a.etat === 'NJ').length
    const totalJ = absences.filter(a => a.etat === 'J').length
    const totalSeances = absences.reduce((sum, a) => sum + a.duree, 0)
    
    // Per group stats
    const groupStats = GROUPES.map(g => {
      const groupStagiaires = stagiaires.filter(s => s.groupeId === g.id).map(s => s.id)
      const groupAbsences = absences.filter(a => groupStagiaires.includes(a.stagiaireId))
      const njCount = groupAbsences.filter(a => a.etat === 'NJ').length
      const jCount = groupAbsences.filter(a => a.etat === 'J').length
      const seances = groupAbsences.reduce((sum, a) => sum + a.duree, 0)
      return { ...g, total: groupAbsences.length, nj: njCount, j: jCount, seances }
    }).filter(g => g.total > 0)
    
    // Top absent stagiaires
    const stagiaireAbsences = stagiaires.map(s => {
      const sAbsences = absences.filter(a => a.stagiaireId === s.id)
      const njCount = sAbsences.filter(a => a.etat === 'NJ').length
      const totalSeances = sAbsences.reduce((sum, a) => sum + a.duree, 0)
      return { ...s, absenceCount: sAbsences.length, njCount, totalSeances }
    }).filter(s => s.absenceCount > 0).sort((a, b) => b.totalSeances - a.totalSeances).slice(0, 5)
    
    return { totalAbsences, totalNJ, totalJ, totalSeances, groupStats, stagiaireAbsences }
  }, [absences, stagiaires])

  const handleLogout = () => {
    setIsLoggedIn(false)
    setUserRole('')
    setCurrentView('marquer')
  }

  if (!isLoggedIn) {
    return <LoginPage onLogin={handleLogin} />
  }

  return (
    <div className="app-container">
      {/* Left Sidebar */}
      <aside className="sidebar">
        <div className="sidebar-header">
          <h2>OFPPT</h2>
          <span className="role-badge">{userRole === 'admin' ? 'Admin' : 'Formateur'}</span>
        </div>
        <nav className="sidebar-nav">
          {userRole === 'formateur' && (
            <button 
              className={`nav-item ${currentView === 'marquer' ? 'active' : ''}`}
              onClick={() => setCurrentView('marquer')}
            >
              Marquer Absence
            </button>
          )}
          <button 
            className={`nav-item ${currentView === 'consulter' ? 'active' : ''}`}
            onClick={() => setCurrentView('consulter')}
          >
            Consulter Absences
          </button>
          {userRole === 'admin' && (
            <button 
              className={`nav-item ${currentView === 'statistiques' ? 'active' : ''}`}
              onClick={() => setCurrentView('statistiques')}
            >
              Statistiques
            </button>
          )}
          <button className="nav-item nav-item-logout" onClick={handleLogout}>
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
            Connecté en tant que: <span>{userRole === 'admin' ? 'Administrateur' : 'Formateur'}</span>
          </div>
        </header>

        {/* Main Content */}
        <main className="main-content">
          {currentView === 'marquer' && userRole === 'formateur' && (
            <>
              {/* Filter Section */}
              <section className="filter-section">
                <div className="filter-section-title">Filtres de sélection</div>
                <div className="filter-row">
                  <div className="filter-group">
                    <label>Secteur</label>
                    <select value={selectedSecteur} onChange={handleSecteurChange}>
                      <option value="">-- Sélectionner --</option>
                      {SECTEURS.map(s => (
                        <option key={s.id} value={s.id}>{s.nom}</option>
                      ))}
                    </select>
                  </div>
                  <div className="filter-group">
                    <label>Filière</label>
                    <select 
                      value={selectedFiliere} 
                      onChange={handleFiliereChange}
                      disabled={!selectedSecteur}
                    >
                      <option value="">-- Sélectionner --</option>
                      {filteredFilieres.map(f => (
                        <option key={f.id} value={f.id}>{f.nom}</option>
                      ))}
                    </select>
                  </div>
                  <div className="filter-group">
                    <label>Groupe</label>
                    <select 
                      value={selectedGroupe} 
                      onChange={handleGroupeChange}
                      disabled={!selectedFiliere}
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
                            />
                          </th>
                          <th className="th-cef">CEF</th>
                          <th>Nom du stagiaire</th>
                          <th>Email</th>
                          <th className="th-note">Note discipline</th>
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
                              />
                            </td>
                            <td>{s.cef}</td>
                            <td>{s.nom}</td>
                            <td>{s.email}</td>
                            <td className={s.noteDiscipline < 15 ? 'note-low' : ''}>{s.noteDiscipline.toFixed(1)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  ) : (
                    <div className="empty-state">
                      Sélectionnez un secteur, une filière et un groupe pour afficher les stagiaires.
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
                    <select value={absenceDuree} onChange={(e) => setAbsenceDuree(e.target.value)}>
                      <option value="1">1 séance (2h30)</option>
                      <option value="2">2 séances (5h00)</option>
                    </select>
                  </div>
                  <div className="action-group">
                    <label>État</label>
                    <select value={absenceEtat} onChange={(e) => setAbsenceEtat(e.target.value)}>
                      <option value="J">Justifiée</option>
                      <option value="NJ">Non justifiée</option>
                    </select>
                  </div>
                  <button 
                    className="btn-primary"
                    onClick={handleMarquerAbsence}
                    disabled={selectedStagiaires.length === 0}
                  >
                    Marquer absence pour les stagiaires sélectionnés
                  </button>
                </div>
                <div className="action-note">
                  Note: Une absence non justifiée entraîne -0.5 point de discipline par séance.
                </div>
              </section>
            </>
          )}

          {currentView === 'consulter' && (
            /* Consult Absences View */
            <div className="consult-section">
              <section className="consult-filter">
                <div className="filter-section-title">Rechercher les absences</div>
                <div className="filter-row">
                  <div className="filter-group">
                    <label>Date</label>
                    <input 
                      type="date" 
                      value={consultDate}
                      onChange={(e) => setConsultDate(e.target.value)}
                    />
                  </div>
                  <div className="filter-group">
                    <label>Groupe</label>
                    <select 
                      value={consultGroupe} 
                      onChange={(e) => setConsultGroupe(e.target.value)}
                    >
                      <option value="">-- Tous les groupes --</option>
                      {GROUPES.map(g => (
                        <option key={g.id} value={g.id}>{g.nom}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </section>

              <section className="consult-results">
                <div className="table-section-header">
                  <span className="table-section-title">Résultats</span>
                  <span className="table-section-count">{consultAbsences.length} absence(s)</span>
                </div>
                <div className="table-container">
                  {consultAbsences.length > 0 ? (
                    <table>
                      <thead>
                        <tr>
                          <th>Date</th>
                          <th className="th-cef">CEF</th>
                          <th>Nom</th>
                          <th>Durée absence</th>
                          <th>État</th>
                          <th>Note discipline</th>
                          {userRole === 'admin' && <th>Action</th>}
                        </tr>
                      </thead>
                      <tbody>
                        {consultAbsences.map(a => (
                          <tr key={a.id}>
                            <td>{a.date}</td>
                            <td>{a.stagiaire?.cef}</td>
                            <td>{a.stagiaire?.nom}</td>
                            <td>{a.duree === 1 ? '2h30 (1 séance)' : '5h00 (2 séances)'}</td>
                            <td className={a.etat === 'J' ? 'status-j' : 'status-nj'}>
                              {a.etat === 'J' ? 'Justifiée' : 'Non justifiée'}
                            </td>
                            <td className={a.stagiaire?.noteDiscipline < 15 ? 'note-low' : ''}>
                              {a.stagiaire?.noteDiscipline.toFixed(1)}
                            </td>
                            {userRole === 'admin' && (
                              <td>
                                <button 
                                  className="btn-toggle"
                                  onClick={() => handleToggleEtat(a.id)}
                                >
                                  {a.etat === 'J' ? 'Marquer NJ' : 'Marquer J'}
                                </button>
                              </td>
                            )}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  ) : (
                    <div className="empty-state">
                      Aucune absence trouvée pour les critères sélectionnés.
                    </div>
                  )}
                </div>
              </section>
            </div>
          )}

          {currentView === 'statistiques' && userRole === 'admin' && (
            /* Statistics View */
            <div className="stats-section">
              {/* Summary Cards */}
              <div className="stats-cards">
                <div className="stat-card">
                  <div className="stat-value">{statistics.totalAbsences}</div>
                  <div className="stat-label">Total Absences</div>
                </div>
                <div className="stat-card">
                  <div className="stat-value stat-nj">{statistics.totalNJ}</div>
                  <div className="stat-label">Non Justifiées</div>
                </div>
                <div className="stat-card">
                  <div className="stat-value stat-j">{statistics.totalJ}</div>
                  <div className="stat-label">Justifiées</div>
                </div>
                <div className="stat-card">
                  <div className="stat-value">{statistics.totalSeances}</div>
                  <div className="stat-label">Total Séances</div>
                </div>
              </div>

              {/* Group Stats */}
              <section className="stats-table-section">
                <div className="table-section-header">
                  <span className="table-section-title">Absences par Groupe</span>
                </div>
                <div className="table-container">
                  {statistics.groupStats.length > 0 ? (
                    <table>
                      <thead>
                        <tr>
                          <th>Groupe</th>
                          <th>Total Absences</th>
                          <th>Non Justifiées</th>
                          <th>Justifiées</th>
                          <th>Total Séances</th>
                        </tr>
                      </thead>
                      <tbody>
                        {statistics.groupStats.map(g => (
                          <tr key={g.id}>
                            <td>{g.nom}</td>
                            <td>{g.total}</td>
                            <td className="status-nj">{g.nj}</td>
                            <td className="status-j">{g.j}</td>
                            <td>{g.seances}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  ) : (
                    <div className="empty-state">Aucune donnée disponible.</div>
                  )}
                </div>
              </section>

              {/* Top Absent Stagiaires */}
              <section className="stats-table-section">
                <div className="table-section-header">
                  <span className="table-section-title">Top 5 Stagiaires les plus absents</span>
                </div>
                <div className="table-container">
                  {statistics.stagiaireAbsences.length > 0 ? (
                    <table>
                      <thead>
                        <tr>
                          <th>CEF</th>
                          <th>Nom</th>
                          <th>Absences</th>
                          <th>Non Justifiées</th>
                          <th>Séances manquées</th>
                          <th>Note Discipline</th>
                        </tr>
                      </thead>
                      <tbody>
                        {statistics.stagiaireAbsences.map(s => (
                          <tr key={s.id}>
                            <td>{s.cef}</td>
                            <td>{s.nom}</td>
                            <td>{s.absenceCount}</td>
                            <td className="status-nj">{s.njCount}</td>
                            <td>{s.totalSeances}</td>
                            <td className={s.noteDiscipline < 15 ? 'note-low' : ''}>{s.noteDiscipline.toFixed(1)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  ) : (
                    <div className="empty-state">Aucune donnée disponible.</div>
                  )}
                </div>
              </section>
            </div>
          )}
        </main>
      </div>
    </div>
  )
}

export default App
