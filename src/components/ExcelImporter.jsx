import { useState, useRef } from 'react'
import * as XLSX from 'xlsx'

// Mock data for validation
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

// Existing students for duplicate checking
const EXISTING_STUDENTS = [
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

// Mock absence data for export
const ABSENCES = [
  { id: 1, stagiaireId: 1, date: '2025-01-15', duree: 1, etat: 'NJ' },
  { id: 2, stagiaireId: 2, date: '2025-01-15', duree: 2, etat: 'J' },
  { id: 3, stagiaireId: 3, date: '2025-01-16', duree: 1, etat: 'NJ' },
  { id: 4, stagiaireId: 1, date: '2025-01-20', duree: 2, etat: 'J' },
]

function ExcelImporter() {
  const [activeTab, setActiveTab] = useState('import') // 'import' or 'export'
  const [file, setFile] = useState(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [importProgress, setImportProgress] = useState(0)
  const [exportProgress, setExportProgress] = useState(0)
  const [validationResults, setValidationResults] = useState(null)
  const [importPreview, setImportPreview] = useState([])
  const [importErrors, setImportErrors] = useState([])
  const [showPreview, setShowPreview] = useState(false)
  const fileInputRef = useRef(null)

  // Constants
  const MAX_FILE_SIZE = 5 * 1024 * 1024 // 5MB
  const MAX_ROWS = 1000
  const REQUIRED_COLUMNS = ['CEF', 'Nom', 'Email', 'Groupe']

  // Validation functions
  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email)
  }

  const validateCEF = (cef) => {
    if (!cef || typeof cef !== 'string') return false
    const cleanCef = cef.toString().trim()
    return cleanCef.length >= 6 && cleanCef.length <= 12 && /^[a-zA-Z0-9]+$/.test(cleanCef)
  }

  const validateName = (name) => {
    if (!name || typeof name !== 'string') return false
    const cleanName = name.toString().trim()
    return cleanName.length >= 2 && cleanName.length <= 50 && /^[a-zA-ZÀ-ÿ\s]+$/.test(cleanName)
  }

  const validateGroup = (groupName) => {
    if (!groupName) return false
    return GROUPES.some(g => g.nom.toLowerCase() === groupName.toString().toLowerCase())
  }

  const getGroupByName = (groupName) => {
    return GROUPES.find(g => g.nom.toLowerCase() === groupName.toString().toLowerCase())
  }

  // File handling
  const handleFileSelect = (event) => {
    const selectedFile = event.target.files[0]
    if (!selectedFile) return

    // Reset previous state
    setValidationResults(null)
    setImportPreview([])
    setImportErrors([])
    setShowPreview(false)

    // Validate file type
    const allowedTypes = [
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
      'application/vnd.ms-excel' // .xls
    ]
    
    if (!allowedTypes.includes(selectedFile.type)) {
      alert('Format de fichier non supporté. Veuillez sélectionner un fichier Excel (.xlsx ou .xls)')
      return
    }

    // Validate file size
    if (selectedFile.size > MAX_FILE_SIZE) {
      alert(`Le fichier est trop volumineux. Taille maximale autorisée: ${MAX_FILE_SIZE / (1024 * 1024)}MB`)
      return
    }

    setFile(selectedFile)
  }

  // Excel processing
  const processExcelFile = async () => {
    if (!file) return

    setIsProcessing(true)
    setImportProgress(0)

    try {
      // Simulate progress
      setImportProgress(20)

      const data = await file.arrayBuffer()
      const workbook = XLSX.read(data, { type: 'array' })
      const sheetName = workbook.SheetNames[0]
      const worksheet = workbook.Sheets[sheetName]
      
      setImportProgress(40)

      // Convert to JSON
      const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 })
      
      if (jsonData.length === 0) {
        throw new Error('Le fichier Excel est vide')
      }

      if (jsonData.length > MAX_ROWS + 1) { // +1 for header
        throw new Error(`Trop de lignes dans le fichier. Maximum autorisé: ${MAX_ROWS}`)
      }

      setImportProgress(60)

      // Validate structure
      const headers = jsonData[0]
      const missingColumns = REQUIRED_COLUMNS.filter(col => 
        !headers.some(header => header && header.toString().toLowerCase() === col.toLowerCase())
      )

      if (missingColumns.length > 0) {
        throw new Error(`Colonnes manquantes: ${missingColumns.join(', ')}`)
      }

      setImportProgress(80)

      // Process and validate data
      const results = validateImportData(jsonData)
      setValidationResults(results)
      setImportPreview(results.validStudents)
      setImportErrors(results.errors)
      setShowPreview(true)

      setImportProgress(100)

    } catch (error) {
      alert(`Erreur lors du traitement du fichier: ${error.message}`)
      setValidationResults(null)
    } finally {
      setIsProcessing(false)
      setTimeout(() => setImportProgress(0), 2000)
    }
  }

  // Data validation
  const validateImportData = (jsonData) => {
    const headers = jsonData[0]
    const rows = jsonData.slice(1)
    
    // Find column indices
    const cefIndex = headers.findIndex(h => h && h.toString().toLowerCase() === 'cef')
    const nomIndex = headers.findIndex(h => h && h.toString().toLowerCase() === 'nom')
    const emailIndex = headers.findIndex(h => h && h.toString().toLowerCase() === 'email')
    const groupeIndex = headers.findIndex(h => h && h.toString().toLowerCase() === 'groupe')

    const validStudents = []
    const errors = []
    const seenCefs = new Set()
    const seenEmails = new Set()

    rows.forEach((row, index) => {
      const rowNumber = index + 2 // +2 because we start from row 2 (after header)
      const student = {
        cef: row[cefIndex]?.toString().trim() || '',
        nom: row[nomIndex]?.toString().trim() || '',
        email: row[emailIndex]?.toString().trim() || '',
        groupe: row[groupeIndex]?.toString().trim() || ''
      }

      // Skip empty rows
      if (!student.cef && !student.nom && !student.email && !student.groupe) {
        return
      }

      const rowErrors = []

      // Validate CEF
      if (!validateCEF(student.cef)) {
        rowErrors.push('CEF invalide (6-12 caractères alphanumériques requis)')
      } else {
        // Check for duplicates within file
        if (seenCefs.has(student.cef.toUpperCase())) {
          rowErrors.push('CEF dupliqué dans le fichier')
        } else {
          seenCefs.add(student.cef.toUpperCase())
          // Check against existing students
          if (EXISTING_STUDENTS.some(s => s.cef.toUpperCase() === student.cef.toUpperCase())) {
            rowErrors.push('CEF existe déjà dans le système')
          }
        }
      }

      // Validate name
      if (!validateName(student.nom)) {
        rowErrors.push('Nom invalide (2-50 caractères, lettres et espaces uniquement)')
      }

      // Validate email
      if (!validateEmail(student.email)) {
        rowErrors.push('Format email invalide')
      } else {
        // Check for duplicates within file
        if (seenEmails.has(student.email.toLowerCase())) {
          rowErrors.push('Email dupliqué dans le fichier')
        } else {
          seenEmails.add(student.email.toLowerCase())
          // Check against existing students
          if (EXISTING_STUDENTS.some(s => s.email.toLowerCase() === student.email.toLowerCase())) {
            rowErrors.push('Email existe déjà dans le système')
          }
        }
      }

      // Validate group
      if (!validateGroup(student.groupe)) {
        rowErrors.push('Groupe inexistant')
      }

      if (rowErrors.length > 0) {
        errors.push({
          row: rowNumber,
          student,
          errors: rowErrors
        })
      } else {
        const group = getGroupByName(student.groupe)
        validStudents.push({
          ...student,
          groupeId: group.id,
          noteDiscipline: 20 // Default value
        })
      }
    })

    return {
      totalRows: rows.length,
      validStudents,
      errors,
      success: errors.length === 0
    }
  }

  // Import confirmation
  const confirmImport = () => {
    if (!validationResults || validationResults.validStudents.length === 0) return

    // In a real app, this would send data to backend
    alert(`${validationResults.validStudents.length} stagiaire(s) importé(s) avec succès!`)
    
    // Reset state
    setFile(null)
    setValidationResults(null)
    setImportPreview([])
    setImportErrors([])
    setShowPreview(false)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  // Export functions
  const exportStudentData = async () => {
    setExportProgress(0)
    setIsProcessing(true)

    try {
      setExportProgress(25)

      // Prepare student data with group information
      const exportData = EXISTING_STUDENTS.map(student => {
        const group = GROUPES.find(g => g.id === student.groupeId)
        const filiere = FILIERES.find(f => f.id === group?.filiereId)
        const secteur = SECTEURS.find(s => s.id === filiere?.secteurId)

        return {
          CEF: student.cef,
          Nom: student.nom,
          Email: student.email,
          Groupe: group?.nom || 'N/A',
          Filière: filiere?.nom || 'N/A',
          Secteur: secteur?.nom || 'N/A',
          'Note Discipline': student.noteDiscipline
        }
      })

      setExportProgress(50)

      // Create workbook
      const ws = XLSX.utils.json_to_sheet(exportData)
      const wb = XLSX.utils.book_new()
      XLSX.utils.book_append_sheet(wb, ws, 'Stagiaires')

      setExportProgress(75)

      // Generate file
      const fileName = `stagiaires_${new Date().toISOString().split('T')[0]}.xlsx`
      XLSX.writeFile(wb, fileName)

      setExportProgress(100)
      alert('Export des stagiaires terminé avec succès!')

    } catch (error) {
      alert(`Erreur lors de l'export: ${error.message}`)
    } finally {
      setIsProcessing(false)
      setTimeout(() => setExportProgress(0), 2000)
    }
  }

  const exportAbsenceData = async () => {
    setExportProgress(0)
    setIsProcessing(true)

    try {
      setExportProgress(25)

      // Prepare absence data with student information
      const exportData = ABSENCES.map(absence => {
        const student = EXISTING_STUDENTS.find(s => s.id === absence.stagiaireId)
        const group = GROUPES.find(g => g.id === student?.groupeId)

        return {
          Date: absence.date,
          CEF: student?.cef || 'N/A',
          Nom: student?.nom || 'N/A',
          Groupe: group?.nom || 'N/A',
          'Durée (séances)': absence.duree,
          'Durée (heures)': absence.duree === 1 ? '2h30' : '5h00',
          État: absence.etat === 'J' ? 'Justifiée' : 'Non justifiée'
        }
      })

      setExportProgress(50)

      // Create workbook
      const ws = XLSX.utils.json_to_sheet(exportData)
      const wb = XLSX.utils.book_new()
      XLSX.utils.book_append_sheet(wb, ws, 'Absences')

      setExportProgress(75)

      // Generate file
      const fileName = `absences_${new Date().toISOString().split('T')[0]}.xlsx`
      XLSX.writeFile(wb, fileName)

      setExportProgress(100)
      alert('Export des absences terminé avec succès!')

    } catch (error) {
      alert(`Erreur lors de l'export: ${error.message}`)
    } finally {
      setIsProcessing(false)
      setTimeout(() => setExportProgress(0), 2000)
    }
  }

  return (
    <div className="excel-importer">
      <div className="excel-importer-header">
        <h2>Import/Export Excel</h2>
        <div className="tab-buttons">
          <button 
            className={`tab-button ${activeTab === 'import' ? 'active' : ''}`}
            onClick={() => setActiveTab('import')}
          >
            Import
          </button>
          <button 
            className={`tab-button ${activeTab === 'export' ? 'active' : ''}`}
            onClick={() => setActiveTab('export')}
          >
            Export
          </button>
        </div>
      </div>

      {activeTab === 'import' ? (
        <div className="import-tab">
          {/* File Upload Section */}
          <div className="upload-section">
            <div className="upload-section-title">Importer des stagiaires depuis Excel</div>
            <div className="upload-info">
              <p><strong>Format requis:</strong></p>
              <ul>
                <li>Fichier Excel (.xlsx ou .xls)</li>
                <li>Taille maximale: 5MB</li>
                <li>Maximum 1000 lignes</li>
                <li>Colonnes requises: CEF, Nom, Email, Groupe</li>
              </ul>
            </div>
            
            <div className="file-input-container">
              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx,.xls"
                onChange={handleFileSelect}
                className="file-input"
                disabled={isProcessing}
              />
              {file && (
                <div className="file-info">
                  <span>Fichier sélectionné: {file.name}</span>
                  <span>Taille: {(file.size / 1024).toFixed(1)} KB</span>
                </div>
              )}
            </div>

            <div className="upload-actions">
              <button 
                className="btn-primary"
                onClick={processExcelFile}
                disabled={!file || isProcessing}
              >
                {isProcessing ? 'Traitement en cours...' : 'Valider et Prévisualiser'}
              </button>
            </div>

            {/* Progress Bar */}
            {isProcessing && importProgress > 0 && (
              <div className="progress-container">
                <div className="progress-bar">
                  <div 
                    className="progress-fill" 
                    style={{ width: `${importProgress}%` }}
                  ></div>
                </div>
                <span className="progress-text">{importProgress}%</span>
              </div>
            )}
          </div>

          {/* Validation Results */}
          {validationResults && (
            <div className="validation-results">
              <div className="validation-summary">
                <h3>Résultats de la validation</h3>
                <div className="validation-stats">
                  <div className="stat-item success">
                    <span className="stat-number">{validationResults.validStudents.length}</span>
                    <span className="stat-label">Stagiaires valides</span>
                  </div>
                  <div className="stat-item error">
                    <span className="stat-number">{validationResults.errors.length}</span>
                    <span className="stat-label">Erreurs détectées</span>
                  </div>
                  <div className="stat-item">
                    <span className="stat-number">{validationResults.totalRows}</span>
                    <span className="stat-label">Total lignes</span>
                  </div>
                </div>
              </div>

              {/* Errors */}
              {importErrors.length > 0 && (
                <div className="error-section">
                  <h4>Erreurs détectées ({importErrors.length})</h4>
                  <div className="error-list">
                    {importErrors.map((error, index) => (
                      <div key={index} className="error-item">
                        <div className="error-header">
                          <strong>Ligne {error.row}:</strong> {error.student.nom || 'Nom manquant'} ({error.student.cef || 'CEF manquant'})
                        </div>
                        <ul className="error-details">
                          {error.errors.map((err, errIndex) => (
                            <li key={errIndex}>{err}</li>
                          ))}
                        </ul>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Preview */}
              {showPreview && importPreview.length > 0 && (
                <div className="preview-section">
                  <h4>Aperçu des stagiaires à importer ({importPreview.length})</h4>
                  <div className="table-container">
                    <table>
                      <thead>
                        <tr>
                          <th>CEF</th>
                          <th>Nom</th>
                          <th>Email</th>
                          <th>Groupe</th>
                        </tr>
                      </thead>
                      <tbody>
                        {importPreview.slice(0, 10).map((student, index) => (
                          <tr key={index}>
                            <td>{student.cef}</td>
                            <td>{student.nom}</td>
                            <td>{student.email}</td>
                            <td>{student.groupe}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    {importPreview.length > 10 && (
                      <div className="preview-note">
                        ... et {importPreview.length - 10} autres stagiaires
                      </div>
                    )}
                  </div>

                  <div className="preview-actions">
                    <button 
                      className="btn-primary"
                      onClick={confirmImport}
                      disabled={validationResults.errors.length > 0}
                    >
                      Confirmer l'import ({importPreview.length} stagiaires)
                    </button>
                    <button 
                      className="btn-secondary"
                      onClick={() => {
                        setShowPreview(false)
                        setValidationResults(null)
                        setFile(null)
                        if (fileInputRef.current) {
                          fileInputRef.current.value = ''
                        }
                      }}
                    >
                      Annuler
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      ) : (
        <div className="export-tab">
          <div className="export-section">
            <div className="export-section-title">Exporter les données</div>
            
            <div className="export-options">
              <div className="export-option">
                <h3>Export des Stagiaires</h3>
                <p>Exporter la liste complète des stagiaires avec leurs informations (CEF, nom, email, groupe, filière, secteur, note discipline)</p>
                <button 
                  className="btn-primary"
                  onClick={exportStudentData}
                  disabled={isProcessing}
                >
                  {isProcessing ? 'Export en cours...' : 'Exporter Stagiaires'}
                </button>
              </div>

              <div className="export-option">
                <h3>Export des Absences</h3>
                <p>Exporter toutes les absences enregistrées avec les détails des stagiaires</p>
                <button 
                  className="btn-primary"
                  onClick={exportAbsenceData}
                  disabled={isProcessing}
                >
                  {isProcessing ? 'Export en cours...' : 'Exporter Absences'}
                </button>
              </div>
            </div>

            {/* Progress Bar for Export */}
            {isProcessing && exportProgress > 0 && (
              <div className="progress-container">
                <div className="progress-bar">
                  <div 
                    className="progress-fill" 
                    style={{ width: `${exportProgress}%` }}
                  ></div>
                </div>
                <span className="progress-text">{exportProgress}%</span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export default ExcelImporter