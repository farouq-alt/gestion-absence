import { useState, useMemo } from 'react'

// Mock data - in a real app this would come from a backend
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

const initialGroupes = [
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

function StudentManager() {
  const [stagiaires, setStagiaires] = useState(initialStagiaires)
  const [groupes, setGroupes] = useState(initialGroupes)
  const [activeTab, setActiveTab] = useState('students') // 'students' or 'groups'
  const [showStudentForm, setShowStudentForm] = useState(false)
  const [showGroupForm, setShowGroupForm] = useState(false)
  const [editingStudent, setEditingStudent] = useState(null)
  const [editingGroup, setEditingGroup] = useState(null)
  
  // Search and filter states
  const [searchTerm, setSearchTerm] = useState('')
  const [filterGroup, setFilterGroup] = useState('')
  
  // Student form states
  const [studentForm, setStudentForm] = useState({
    cef: '',
    nom: '',
    email: '',
    groupeId: '',
    noteDiscipline: 20
  })
  
  // Group form states
  const [groupForm, setGroupForm] = useState({
    nom: '',
    filiereId: ''
  })

  // Filtered students
  const filteredStagiaires = useMemo(() => {
    let filtered = stagiaires
    
    if (searchTerm) {
      filtered = filtered.filter(s => 
        s.nom.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.cef.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.email.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }
    
    if (filterGroup) {
      filtered = filtered.filter(s => s.groupeId === parseInt(filterGroup))
    }
    
    return filtered
  }, [stagiaires, searchTerm, filterGroup])

  // Student CRUD operations
  const handleAddStudent = () => {
    setEditingStudent(null)
    setStudentForm({
      cef: '',
      nom: '',
      email: '',
      groupeId: '',
      noteDiscipline: 20
    })
    setShowStudentForm(true)
  }

  const handleEditStudent = (student) => {
    setEditingStudent(student)
    setStudentForm({
      cef: student.cef,
      nom: student.nom,
      email: student.email,
      groupeId: student.groupeId.toString(),
      noteDiscipline: student.noteDiscipline
    })
    setShowStudentForm(true)
  }

  const handleDeleteStudent = (studentId) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer ce stagiaire ?')) {
      setStagiaires(prev => prev.filter(s => s.id !== studentId))
    }
  }

  const handleSaveStudent = (e) => {
    e.preventDefault()
    
    // Validation
    if (!studentForm.cef || !studentForm.nom || !studentForm.email || !studentForm.groupeId) {
      alert('Tous les champs sont obligatoires')
      return
    }
    
    // Check for duplicate CEF (excluding current student if editing)
    const existingCef = stagiaires.find(s => 
      s.cef === studentForm.cef && s.id !== editingStudent?.id
    )
    if (existingCef) {
      alert('Ce CEF existe déjà')
      return
    }
    
    // Check for duplicate email (excluding current student if editing)
    const existingEmail = stagiaires.find(s => 
      s.email === studentForm.email && s.id !== editingStudent?.id
    )
    if (existingEmail) {
      alert('Cet email existe déjà')
      return
    }
    
    if (editingStudent) {
      // Update existing student
      setStagiaires(prev => prev.map(s => 
        s.id === editingStudent.id 
          ? { ...s, ...studentForm, groupeId: parseInt(studentForm.groupeId) }
          : s
      ))
    } else {
      // Add new student
      const newStudent = {
        id: Math.max(...stagiaires.map(s => s.id)) + 1,
        ...studentForm,
        groupeId: parseInt(studentForm.groupeId)
      }
      setStagiaires(prev => [...prev, newStudent])
    }
    
    setShowStudentForm(false)
    setEditingStudent(null)
  }

  // Group CRUD operations
  const handleAddGroup = () => {
    setEditingGroup(null)
    setGroupForm({
      nom: '',
      filiereId: ''
    })
    setShowGroupForm(true)
  }

  const handleEditGroup = (group) => {
    setEditingGroup(group)
    setGroupForm({
      nom: group.nom,
      filiereId: group.filiereId.toString()
    })
    setShowGroupForm(true)
  }

  const handleDeleteGroup = (groupId) => {
    // Check if group has students
    const studentsInGroup = stagiaires.filter(s => s.groupeId === groupId)
    if (studentsInGroup.length > 0) {
      if (!window.confirm(`Ce groupe contient ${studentsInGroup.length} stagiaire(s). Êtes-vous sûr de vouloir le supprimer ? Les stagiaires devront être réassignés.`)) {
        return
      }
      // In a real app, you would handle student reassignment here
      // For now, we'll just remove the group and leave students orphaned
    }
    
    setGroupes(prev => prev.filter(g => g.id !== groupId))
  }

  const handleSaveGroup = (e) => {
    e.preventDefault()
    
    // Validation
    if (!groupForm.nom || !groupForm.filiereId) {
      alert('Tous les champs sont obligatoires')
      return
    }
    
    // Check for duplicate group name
    const existingGroup = groupes.find(g => 
      g.nom === groupForm.nom && g.id !== editingGroup?.id
    )
    if (existingGroup) {
      alert('Ce nom de groupe existe déjà')
      return
    }
    
    if (editingGroup) {
      // Update existing group
      setGroupes(prev => prev.map(g => 
        g.id === editingGroup.id 
          ? { ...g, ...groupForm, filiereId: parseInt(groupForm.filiereId) }
          : g
      ))
    } else {
      // Add new group
      const newGroup = {
        id: Math.max(...groupes.map(g => g.id)) + 1,
        ...groupForm,
        filiereId: parseInt(groupForm.filiereId)
      }
      setGroupes(prev => [...prev, newGroup])
    }
    
    setShowGroupForm(false)
    setEditingGroup(null)
  }

  const getGroupName = (groupeId) => {
    const group = groupes.find(g => g.id === groupeId)
    return group ? group.nom : 'Groupe inconnu'
  }

  const getFiliereName = (filiereId) => {
    const filiere = FILIERES.find(f => f.id === filiereId)
    return filiere ? filiere.nom : 'Filière inconnue'
  }

  return (
    <div className="student-manager">
      <div className="student-manager-header">
        <h2>Gestion des Stagiaires et Groupes</h2>
        <div className="tab-buttons">
          <button 
            className={`tab-button ${activeTab === 'students' ? 'active' : ''}`}
            onClick={() => setActiveTab('students')}
          >
            Stagiaires ({stagiaires.length})
          </button>
          <button 
            className={`tab-button ${activeTab === 'groups' ? 'active' : ''}`}
            onClick={() => setActiveTab('groups')}
          >
            Groupes ({groupes.length})
          </button>
        </div>
      </div>

      {activeTab === 'students' ? (
        <div className="students-tab">
          {/* Students Controls */}
          <div className="controls-section">
            <div className="search-controls">
              <input
                type="text"
                placeholder="Rechercher par nom, CEF ou email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="search-input"
              />
              <select
                value={filterGroup}
                onChange={(e) => setFilterGroup(e.target.value)}
                className="filter-select"
              >
                <option value="">Tous les groupes</option>
                {groupes.map(g => (
                  <option key={g.id} value={g.id}>{g.nom}</option>
                ))}
              </select>
            </div>
            <button className="btn-primary" onClick={handleAddStudent}>
              Ajouter Stagiaire
            </button>
          </div>

          {/* Students Table */}
          <div className="table-section">
            <div className="table-section-header">
              <span className="table-section-title">Liste des Stagiaires</span>
              <span className="table-section-count">{filteredStagiaires.length} stagiaire(s)</span>
            </div>
            <div className="table-container">
              {filteredStagiaires.length > 0 ? (
                <table>
                  <thead>
                    <tr>
                      <th className="th-cef">CEF</th>
                      <th>Nom</th>
                      <th>Email</th>
                      <th>Groupe</th>
                      <th className="th-note">Note Discipline</th>
                      <th className="th-actions">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredStagiaires.map(s => (
                      <tr key={s.id}>
                        <td>{s.cef}</td>
                        <td>{s.nom}</td>
                        <td>{s.email}</td>
                        <td>{getGroupName(s.groupeId)}</td>
                        <td>{s.noteDiscipline}</td>
                        <td>
                          <button 
                            className="btn-secondary btn-small"
                            onClick={() => handleEditStudent(s)}
                          >
                            Modifier
                          </button>
                          <button 
                            className="btn-danger btn-small"
                            onClick={() => handleDeleteStudent(s.id)}
                          >
                            Supprimer
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <div className="empty-state">
                  Aucun stagiaire trouvé pour les critères sélectionnés.
                </div>
              )}
            </div>
          </div>
        </div>
      ) : (
        <div className="groups-tab">
          {/* Groups Controls */}
          <div className="controls-section">
            <button className="btn-primary" onClick={handleAddGroup}>
              Ajouter Groupe
            </button>
          </div>

          {/* Groups Table */}
          <div className="table-section">
            <div className="table-section-header">
              <span className="table-section-title">Liste des Groupes</span>
              <span className="table-section-count">{groupes.length} groupe(s)</span>
            </div>
            <div className="table-container">
              {groupes.length > 0 ? (
                <table>
                  <thead>
                    <tr>
                      <th>Nom du Groupe</th>
                      <th>Filière</th>
                      <th>Nombre de Stagiaires</th>
                      <th className="th-actions">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {groupes.map(g => (
                      <tr key={g.id}>
                        <td>{g.nom}</td>
                        <td>{getFiliereName(g.filiereId)}</td>
                        <td>{stagiaires.filter(s => s.groupeId === g.id).length}</td>
                        <td>
                          <button 
                            className="btn-secondary btn-small"
                            onClick={() => handleEditGroup(g)}
                          >
                            Modifier
                          </button>
                          <button 
                            className="btn-danger btn-small"
                            onClick={() => handleDeleteGroup(g.id)}
                          >
                            Supprimer
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <div className="empty-state">
                  Aucun groupe trouvé.
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Student Form Modal */}
      {showStudentForm && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h3>{editingStudent ? 'Modifier Stagiaire' : 'Ajouter Stagiaire'}</h3>
              <button 
                className="modal-close"
                onClick={() => setShowStudentForm(false)}
              >
                ×
              </button>
            </div>
            <form onSubmit={handleSaveStudent} className="modal-form">
              <div className="form-group">
                <label htmlFor="student-cef">CEF *</label>
                <input
                  id="student-cef"
                  type="text"
                  value={studentForm.cef}
                  onChange={(e) => setStudentForm(prev => ({ ...prev, cef: e.target.value }))}
                  required
                  maxLength="12"
                />
              </div>
              <div className="form-group">
                <label htmlFor="student-nom">Nom *</label>
                <input
                  id="student-nom"
                  type="text"
                  value={studentForm.nom}
                  onChange={(e) => setStudentForm(prev => ({ ...prev, nom: e.target.value }))}
                  required
                  maxLength="50"
                />
              </div>
              <div className="form-group">
                <label htmlFor="student-email">Email *</label>
                <input
                  id="student-email"
                  type="email"
                  value={studentForm.email}
                  onChange={(e) => setStudentForm(prev => ({ ...prev, email: e.target.value }))}
                  required
                />
              </div>
              <div className="form-group">
                <label htmlFor="student-groupe">Groupe *</label>
                <select
                  id="student-groupe"
                  value={studentForm.groupeId}
                  onChange={(e) => setStudentForm(prev => ({ ...prev, groupeId: e.target.value }))}
                  required
                >
                  <option value="">-- Sélectionner un groupe --</option>
                  {groupes.map(g => (
                    <option key={g.id} value={g.id}>{g.nom}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label htmlFor="student-note">Note Discipline</label>
                <input
                  id="student-note"
                  type="number"
                  min="0"
                  max="20"
                  value={studentForm.noteDiscipline}
                  onChange={(e) => setStudentForm(prev => ({ ...prev, noteDiscipline: parseInt(e.target.value) }))}
                />
              </div>
              <div className="modal-actions">
                <button type="button" className="btn-secondary" onClick={() => setShowStudentForm(false)}>
                  Annuler
                </button>
                <button type="submit" className="btn-primary">
                  {editingStudent ? 'Modifier' : 'Ajouter'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Group Form Modal */}
      {showGroupForm && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h3>{editingGroup ? 'Modifier Groupe' : 'Ajouter Groupe'}</h3>
              <button 
                className="modal-close"
                onClick={() => setShowGroupForm(false)}
              >
                ×
              </button>
            </div>
            <form onSubmit={handleSaveGroup} className="modal-form">
              <div className="form-group">
                <label htmlFor="group-nom">Nom du Groupe *</label>
                <input
                  id="group-nom"
                  type="text"
                  value={groupForm.nom}
                  onChange={(e) => setGroupForm(prev => ({ ...prev, nom: e.target.value }))}
                  required
                  maxLength="20"
                />
              </div>
              <div className="form-group">
                <label htmlFor="group-filiere">Filière *</label>
                <select
                  id="group-filiere"
                  value={groupForm.filiereId}
                  onChange={(e) => setGroupForm(prev => ({ ...prev, filiereId: e.target.value }))}
                  required
                >
                  <option value="">-- Sélectionner une filière --</option>
                  {FILIERES.map(f => (
                    <option key={f.id} value={f.id}>{f.nom}</option>
                  ))}
                </select>
              </div>
              <div className="modal-actions">
                <button type="button" className="btn-secondary" onClick={() => setShowGroupForm(false)}>
                  Annuler
                </button>
                <button type="submit" className="btn-primary">
                  {editingGroup ? 'Modifier' : 'Ajouter'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default StudentManager