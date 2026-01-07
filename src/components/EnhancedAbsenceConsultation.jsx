import { useState, useMemo } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { PERMISSIONS, hasPermission } from '../utils/permissions'
import jsPDF from 'jspdf'
import 'jspdf-autotable'
import * as XLSX from 'xlsx'
import { saveAs } from 'file-saver'

// Mock data - in a real app, this would come from props or context
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

const STAGIAIRES = [
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

function EnhancedAbsenceConsultation({ absences = [] }) {
  const { userPermissions } = useAuth()
  
  // Filter states
  const [selectedGroupe, setSelectedGroupe] = useState('')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [justificationFilter, setJustificationFilter] = useState('') // '', 'J', 'NJ'
  
  // Check if user is administrator
  const isAdmin = hasPermission(userPermissions, PERMISSIONS.VIEW_ALL_GROUPS)
  
  // Get available groups based on user role
  const availableGroups = useMemo(() => {
    if (isAdmin) {
      // Administrators can see all groups
      return GROUPES
    } else {
      // Teachers can only see their assigned groups (for now, showing all - would be filtered in real app)
      return GROUPES
    }
  }, [isAdmin])

  // Filter absences based on selected criteria
  const filteredAbsences = useMemo(() => {
    let filtered = absences.map(absence => {
      const stagiaire = STAGIAIRES.find(s => s.id === absence.stagiaireId)
      const groupe = GROUPES.find(g => g.id === stagiaire?.groupeId)
      const filiere = FILIERES.find(f => f.id === groupe?.filiereId)
      const secteur = SECTEURS.find(s => s.id === filiere?.secteurId)
      
      return {
        ...absence,
        stagiaire,
        groupe,
        filiere,
        secteur
      }
    })

    // Filter by group
    if (selectedGroupe) {
      const groupeStagiaires = STAGIAIRES
        .filter(s => s.groupeId === parseInt(selectedGroupe))
        .map(s => s.id)
      filtered = filtered.filter(a => groupeStagiaires.includes(a.stagiaireId))
    }

    // Filter by date range
    if (dateFrom) {
      filtered = filtered.filter(a => a.date >= dateFrom)
    }
    if (dateTo) {
      filtered = filtered.filter(a => a.date <= dateTo)
    }

    // Filter by justification status
    if (justificationFilter) {
      filtered = filtered.filter(a => a.etat === justificationFilter)
    }

    return filtered
  }, [absences, selectedGroupe, dateFrom, dateTo, justificationFilter])

  // Format duration for display
  const formatDuration = (duree) => {
    if (typeof duree === 'number') {
      if (duree === 2.5) return '2h30 (1 séance)'
      if (duree === 5) return '5h00 (2 séances)'
      return `${duree}h (personnalisée)`
    }
    return duree === 1 ? '2h30 (1 séance)' : '5h00 (2 séances)'
  }

  // Export to Excel
  const exportToExcel = () => {
    const exportData = filteredAbsences.map(absence => ({
      'Date': absence.date,
      'CEF': absence.stagiaire?.cef || '',
      'Nom': absence.stagiaire?.nom || '',
      'Email': absence.stagiaire?.email || '',
      'Groupe': absence.groupe?.nom || '',
      'Filière': absence.filiere?.nom || '',
      'Secteur': absence.secteur?.nom || '',
      'Durée': formatDuration(absence.duree),
      'État': absence.etat === 'J' ? 'Justifiée' : 'Non justifiée',
      'Enregistré par': absence.recordedBy || '',
      'Date d\'enregistrement': absence.recordedAt ? new Date(absence.recordedAt).toLocaleString('fr-FR') : ''
    }))

    const worksheet = XLSX.utils.json_to_sheet(exportData)
    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Absences')
    
    // Set column widths
    const colWidths = [
      { wch: 12 }, // Date
      { wch: 10 }, // CEF
      { wch: 25 }, // Nom
      { wch: 30 }, // Email
      { wch: 10 }, // Groupe
      { wch: 25 }, // Filière
      { wch: 15 }, // Secteur
      { wch: 20 }, // Durée
      { wch: 15 }, // État
      { wch: 15 }, // Enregistré par
      { wch: 20 }  // Date d'enregistrement
    ]
    worksheet['!cols'] = colWidths

    const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' })
    const data = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
    
    const fileName = `absences_${selectedGroupe ? GROUPES.find(g => g.id === parseInt(selectedGroupe))?.nom : 'tous_groupes'}_${new Date().toISOString().split('T')[0]}.xlsx`
    saveAs(data, fileName)
  }

  // Export to PDF
  const exportToPDF = () => {
    const doc = new jsPDF()
    
    // Add title
    doc.setFontSize(16)
    doc.text('Rapport des Absences - OFPPT', 14, 22)
    
    // Add filters info
    doc.setFontSize(10)
    let yPos = 35
    
    if (selectedGroupe) {
      const groupe = GROUPES.find(g => g.id === parseInt(selectedGroupe))
      doc.text(`Groupe: ${groupe?.nom}`, 14, yPos)
      yPos += 7
    }
    
    if (dateFrom || dateTo) {
      const dateRange = `Période: ${dateFrom || 'Début'} - ${dateTo || 'Fin'}`
      doc.text(dateRange, 14, yPos)
      yPos += 7
    }
    
    if (justificationFilter) {
      const status = justificationFilter === 'J' ? 'Justifiées' : 'Non justifiées'
      doc.text(`État: ${status}`, 14, yPos)
      yPos += 7
    }
    
    doc.text(`Généré le: ${new Date().toLocaleString('fr-FR')}`, 14, yPos)
    doc.text(`Total: ${filteredAbsences.length} absence(s)`, 14, yPos + 7)
    
    // Prepare table data
    const tableData = filteredAbsences.map(absence => [
      absence.date,
      absence.stagiaire?.cef || '',
      absence.stagiaire?.nom || '',
      absence.groupe?.nom || '',
      formatDuration(absence.duree),
      absence.etat === 'J' ? 'Justifiée' : 'Non justifiée'
    ])

    // Add table
    doc.autoTable({
      head: [['Date', 'CEF', 'Nom', 'Groupe', 'Durée', 'État']],
      body: tableData,
      startY: yPos + 15,
      styles: { fontSize: 8 },
      headStyles: { fillColor: [41, 128, 185] },
      alternateRowStyles: { fillColor: [245, 245, 245] }
    })

    const fileName = `absences_${selectedGroupe ? GROUPES.find(g => g.id === parseInt(selectedGroupe))?.nom : 'tous_groupes'}_${new Date().toISOString().split('T')[0]}.pdf`
    doc.save(fileName)
  }

  // Print functionality
  const handlePrint = () => {
    const printWindow = window.open('', '_blank')
    const groupe = selectedGroupe ? GROUPES.find(g => g.id === parseInt(selectedGroupe)) : null
    
    const printContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Rapport des Absences - OFPPT</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 20px; }
          .header { text-align: center; margin-bottom: 30px; }
          .header h1 { color: #2980b9; margin-bottom: 10px; }
          .filters { margin-bottom: 20px; padding: 15px; background-color: #f8f9fa; border-radius: 5px; }
          .filters h3 { margin-top: 0; color: #2c3e50; }
          .filters p { margin: 5px 0; }
          table { width: 100%; border-collapse: collapse; margin-top: 20px; }
          th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
          th { background-color: #2980b9; color: white; }
          tr:nth-child(even) { background-color: #f2f2f2; }
          .status-j { color: #27ae60; font-weight: bold; }
          .status-nj { color: #e74c3c; font-weight: bold; }
          .footer { margin-top: 30px; text-align: center; font-size: 12px; color: #7f8c8d; }
          @media print {
            body { margin: 0; }
            .no-print { display: none; }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>Rapport des Absences</h1>
          <h2>Office de la Formation Professionnelle et de la Promotion du Travail</h2>
        </div>
        
        <div class="filters">
          <h3>Critères de filtrage</h3>
          ${groupe ? `<p><strong>Groupe:</strong> ${groupe.nom}</p>` : '<p><strong>Groupe:</strong> Tous les groupes</p>'}
          ${dateFrom || dateTo ? `<p><strong>Période:</strong> ${dateFrom || 'Début'} - ${dateTo || 'Fin'}</p>` : ''}
          ${justificationFilter ? `<p><strong>État:</strong> ${justificationFilter === 'J' ? 'Justifiées' : 'Non justifiées'}</p>` : ''}
          <p><strong>Total:</strong> ${filteredAbsences.length} absence(s)</p>
          <p><strong>Généré le:</strong> ${new Date().toLocaleString('fr-FR')}</p>
        </div>

        <table>
          <thead>
            <tr>
              <th>Date</th>
              <th>CEF</th>
              <th>Nom du stagiaire</th>
              <th>Groupe</th>
              <th>Durée</th>
              <th>État</th>
            </tr>
          </thead>
          <tbody>
            ${filteredAbsences.map(absence => `
              <tr>
                <td>${absence.date}</td>
                <td>${absence.stagiaire?.cef || ''}</td>
                <td>${absence.stagiaire?.nom || ''}</td>
                <td>${absence.groupe?.nom || ''}</td>
                <td>${formatDuration(absence.duree)}</td>
                <td class="${absence.etat === 'J' ? 'status-j' : 'status-nj'}">
                  ${absence.etat === 'J' ? 'Justifiée' : 'Non justifiée'}
                </td>
              </tr>
            `).join('')}
          </tbody>
        </table>

        <div class="footer">
          <p>Document généré automatiquement par le système de gestion des absences OFPPT</p>
        </div>
      </body>
      </html>
    `
    
    printWindow.document.write(printContent)
    printWindow.document.close()
    printWindow.focus()
    printWindow.print()
  }

  return (
    <div className="enhanced-consult-section">
      {/* Advanced Filter Section */}
      <section className="consult-filter">
        <div className="filter-section-title">
          Recherche avancée des absences
          {isAdmin && <span className="admin-badge">Mode Administrateur</span>}
        </div>
        
        <div className="filter-row">
          <div className="filter-group">
            <label>Groupe</label>
            <select 
              value={selectedGroupe} 
              onChange={(e) => setSelectedGroupe(e.target.value)}
            >
              <option value="">-- Tous les groupes --</option>
              {availableGroups.map(g => {
                const filiere = FILIERES.find(f => f.id === g.filiereId)
                const secteur = SECTEURS.find(s => s.id === filiere?.secteurId)
                return (
                  <option key={g.id} value={g.id}>
                    {g.nom} ({filiere?.nom} - {secteur?.nom})
                  </option>
                )
              })}
            </select>
          </div>
          
          <div className="filter-group">
            <label>Date de début</label>
            <input 
              type="date" 
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
            />
          </div>
          
          <div className="filter-group">
            <label>Date de fin</label>
            <input 
              type="date" 
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
            />
          </div>
          
          <div className="filter-group">
            <label>État de justification</label>
            <select 
              value={justificationFilter} 
              onChange={(e) => setJustificationFilter(e.target.value)}
            >
              <option value="">-- Tous les états --</option>
              <option value="J">Justifiées</option>
              <option value="NJ">Non justifiées</option>
            </select>
          </div>
        </div>
        
        {/* Clear filters button */}
        <div className="filter-actions">
          <button 
            className="btn-secondary"
            onClick={() => {
              setSelectedGroupe('')
              setDateFrom('')
              setDateTo('')
              setJustificationFilter('')
            }}
          >
            Effacer les filtres
          </button>
        </div>
      </section>

      {/* Results Section */}
      <section className="consult-results">
        <div className="table-section-header">
          <span className="table-section-title">Résultats de la recherche</span>
          <div className="results-info">
            <span className="table-section-count">{filteredAbsences.length} absence(s)</span>
            
            {/* Export and Print Actions */}
            {filteredAbsences.length > 0 && (
              <div className="export-actions">
                <button 
                  className="btn-export btn-excel"
                  onClick={exportToExcel}
                  title="Exporter vers Excel"
                >
                  📊 Excel
                </button>
                <button 
                  className="btn-export btn-pdf"
                  onClick={exportToPDF}
                  title="Exporter vers PDF"
                >
                  📄 PDF
                </button>
                <button 
                  className="btn-export btn-print"
                  onClick={handlePrint}
                  title="Imprimer"
                >
                  🖨️ Imprimer
                </button>
              </div>
            )}
          </div>
        </div>
        
        <div className="table-container">
          {filteredAbsences.length > 0 ? (
            <table>
              <thead>
                <tr>
                  <th>Date</th>
                  <th className="th-cef">CEF</th>
                  <th>Nom</th>
                  <th>Email</th>
                  <th>Groupe</th>
                  {isAdmin && <th>Filière</th>}
                  {isAdmin && <th>Secteur</th>}
                  <th>Durée</th>
                  <th>État</th>
                  {isAdmin && <th>Enregistré par</th>}
                  {isAdmin && <th>Date d'enregistrement</th>}
                </tr>
              </thead>
              <tbody>
                {filteredAbsences.map(absence => (
                  <tr key={absence.id}>
                    <td>{absence.date}</td>
                    <td>{absence.stagiaire?.cef}</td>
                    <td>{absence.stagiaire?.nom}</td>
                    <td>{absence.stagiaire?.email}</td>
                    <td>{absence.groupe?.nom}</td>
                    {isAdmin && <td>{absence.filiere?.nom}</td>}
                    {isAdmin && <td>{absence.secteur?.nom}</td>}
                    <td>{formatDuration(absence.duree)}</td>
                    <td className={absence.etat === 'J' ? 'status-j' : 'status-nj'}>
                      {absence.etat === 'J' ? 'Justifiée' : 'Non justifiée'}
                    </td>
                    {isAdmin && <td>{absence.recordedBy || 'N/A'}</td>}
                    {isAdmin && (
                      <td>
                        {absence.recordedAt 
                          ? new Date(absence.recordedAt).toLocaleString('fr-FR')
                          : 'N/A'
                        }
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="empty-state">
              <h3>Aucune absence trouvée</h3>
              <p>Aucune absence ne correspond aux critères sélectionnés.</p>
              <p>Essayez de modifier les filtres pour élargir votre recherche.</p>
            </div>
          )}
        </div>
      </section>
    </div>
  )
}

export default EnhancedAbsenceConsultation