import { useState, useMemo } from 'react'
import { useAppState } from '../hooks/useAppState'
import { useAuth } from '../contexts/AuthContext'
import { 
  DISCIPLINE_RULES, 
  AUTORITE_LABELS, 
  calculateDisciplineStatus 
} from '../utils/disciplineRules'
import { MdWarning, MdCheckCircle, MdGavel, MdPerson, MdFilterList, MdPrint, MdPlayArrow } from 'react-icons/md'
import jsPDF from 'jspdf'
import '../styles/DisciplineReports.css'

function DisciplineReports() {
  const { disciplineReports, stagiaires, groupes, filieres, secteurs, absences, updateDisciplineReport } = useAppState()
  const { username } = useAuth()
  
  const [statusFilter, setStatusFilter] = useState('')
  const [groupeFilter, setGroupeFilter] = useState('')
  const [selectedReport, setSelectedReport] = useState(null)
  const [showApplyModal, setShowApplyModal] = useState(false)
  const [applyingReport, setApplyingReport] = useState(null)

  // Get all stagiaires with their discipline status
  const stagiairesWithStatus = useMemo(() => {
    return stagiaires.map(stagiaire => {
      const status = calculateDisciplineStatus(stagiaire.id, absences)
      const groupe = groupes.find(g => g.id === stagiaire.groupeId)
      const filiere = filieres.find(f => f.id === groupe?.filiereId)
      const secteur = secteurs.find(s => s.id === filiere?.secteurId)
      return {
        ...stagiaire,
        groupe,
        filiere,
        secteur,
        disciplineStatus: status
      }
    }).filter(s => s.disciplineStatus.points > 0)
      .sort((a, b) => b.disciplineStatus.points - a.disciplineStatus.points)
  }, [stagiaires, absences, groupes, filieres, secteurs])

  // Filter reports
  const filteredReports = useMemo(() => {
    let filtered = [...disciplineReports]
    
    if (statusFilter) {
      filtered = filtered.filter(r => r.status === statusFilter)
    }
    
    if (groupeFilter) {
      const groupeStagiaires = stagiaires
        .filter(s => s.groupeId === parseInt(groupeFilter))
        .map(s => s.id)
      filtered = filtered.filter(r => groupeStagiaires.includes(r.stagiaireId))
    }
    
    return filtered.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
  }, [disciplineReports, statusFilter, groupeFilter, stagiaires])

  // Filter stagiaires at risk
  const filteredStagiaires = useMemo(() => {
    let filtered = stagiairesWithStatus
    
    if (groupeFilter) {
      filtered = filtered.filter(s => s.groupeId === parseInt(groupeFilter))
    }
    
    return filtered
  }, [stagiairesWithStatus, groupeFilter])

  const handleUpdateStatus = (reportId, newStatus) => {
    updateDisciplineReport(reportId, { 
      status: newStatus,
      updatedAt: new Date().toISOString(),
      updatedBy: username
    }, username)
    setSelectedReport(null)
  }

  // Apply sanction and generate PDF report
  const handleApplySanction = (report) => {
    const stagiaire = stagiairesWithStatus.find(s => s.id === report.stagiaireId)
    
    // Update report status to executed
    updateDisciplineReport(report.id, {
      status: 'executed',
      executedAt: new Date().toISOString(),
      executedBy: username
    }, username)

    // Generate professional PDF
    generateSanctionPDF(report, stagiaire)
    
    setShowApplyModal(false)
    setApplyingReport(null)
  }

  // Generate professional sanction PDF
  const generateSanctionPDF = (report, stagiaire) => {
    const doc = new jsPDF()
    const pageWidth = doc.internal.pageSize.getWidth()
    const today = new Date().toLocaleDateString('fr-FR', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    })

    // Header
    doc.setFontSize(12)
    doc.setFont('helvetica', 'bold')
    doc.text('ROYAUME DU MAROC', pageWidth / 2, 20, { align: 'center' })
    doc.setFontSize(10)
    doc.setFont('helvetica', 'normal')
    doc.text('Office de la Formation Professionnelle', pageWidth / 2, 26, { align: 'center' })
    doc.text('et de la Promotion du Travail', pageWidth / 2, 31, { align: 'center' })
    
    // Logo placeholder (line)
    doc.setDrawColor(0)
    doc.setLineWidth(0.5)
    doc.line(20, 38, pageWidth - 20, 38)

    // Title
    doc.setFontSize(16)
    doc.setFont('helvetica', 'bold')
    const title = getSanctionTitle(report.sanctionCode)
    doc.text(title, pageWidth / 2, 52, { align: 'center' })

    // Reference number
    doc.setFontSize(10)
    doc.setFont('helvetica', 'normal')
    doc.text(`Réf: DISC-${report.id.toString().slice(-8).toUpperCase()}`, 20, 65)
    doc.text(`Date: ${today}`, pageWidth - 20, 65, { align: 'right' })

    // Stagiaire info box
    doc.setDrawColor(100)
    doc.setFillColor(245, 245, 245)
    doc.roundedRect(20, 75, pageWidth - 40, 35, 3, 3, 'FD')
    
    doc.setFontSize(11)
    doc.setFont('helvetica', 'bold')
    doc.text('INFORMATIONS DU STAGIAIRE', 25, 83)
    
    doc.setFontSize(10)
    doc.setFont('helvetica', 'normal')
    doc.text(`Nom et Prénom: ${report.stagiaireNom}`, 25, 92)
    doc.text(`CEF: ${report.stagiaireCef}`, 120, 92)
    doc.text(`Groupe: ${stagiaire?.groupe?.nom || 'N/A'}`, 25, 100)
    doc.text(`Filière: ${stagiaire?.filiere?.nom || 'N/A'}`, 120, 100)

    // Sanction details
    doc.setFontSize(11)
    doc.setFont('helvetica', 'bold')
    doc.text('MOTIF DE LA SANCTION', 20, 125)
    
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(10)
    
    const motifText = `Suite au cumul de ${report.points * 4} retards non justifiés (${report.points} points de discipline), ` +
      `conformément au règlement intérieur de l'établissement et au barème des sanctions en vigueur, ` +
      `le stagiaire susmentionné fait l'objet de la sanction suivante:`
    
    const splitMotif = doc.splitTextToSize(motifText, pageWidth - 40)
    doc.text(splitMotif, 20, 135)

    // Sanction box
    doc.setDrawColor(200, 0, 0)
    doc.setFillColor(255, 240, 240)
    doc.roundedRect(20, 155, pageWidth - 40, 25, 3, 3, 'FD')
    
    doc.setFontSize(14)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(180, 0, 0)
    doc.text(report.sanctionLabel.toUpperCase(), pageWidth / 2, 170, { align: 'center' })
    doc.setTextColor(0)

    // Authority
    doc.setFontSize(10)
    doc.setFont('helvetica', 'normal')
    doc.text(`Autorité disciplinaire: ${report.autoriteLabel}`, 20, 195)

    // Consequences section
    doc.setFontSize(11)
    doc.setFont('helvetica', 'bold')
    doc.text('CONSÉQUENCES', 20, 210)
    
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(10)
    
    const consequences = getConsequencesText(report.sanctionCode)
    const splitConsequences = doc.splitTextToSize(consequences, pageWidth - 40)
    doc.text(splitConsequences, 20, 220)

    // Warning
    doc.setFontSize(9)
    doc.setFont('helvetica', 'italic')
    const warning = 'En cas de récidive, des sanctions plus sévères seront appliquées conformément au règlement intérieur, ' +
      'pouvant aller jusqu\'à l\'exclusion définitive de l\'établissement.'
    const splitWarning = doc.splitTextToSize(warning, pageWidth - 40)
    doc.text(splitWarning, 20, 245)

    // Signatures
    doc.setFontSize(10)
    doc.setFont('helvetica', 'normal')
    doc.text('Signature du Stagiaire:', 25, 270)
    doc.text('Cachet et Signature de l\'Autorité:', pageWidth - 80, 270)
    
    // Signature lines
    doc.line(25, 285, 80, 285)
    doc.line(pageWidth - 80, 285, pageWidth - 25, 285)

    // Footer
    doc.setFontSize(8)
    doc.setFont('helvetica', 'italic')
    doc.text('Document généré automatiquement par le système de gestion des absences OFPPT', pageWidth / 2, 295, { align: 'center' })

    // Save PDF
    const fileName = `Sanction_${report.stagiaireCef}_${new Date().toISOString().split('T')[0]}.pdf`
    doc.save(fileName)
  }

  const getSanctionTitle = (code) => {
    if (code.startsWith('MG')) return 'MISE EN GARDE'
    if (code.startsWith('AV')) return 'AVERTISSEMENT'
    if (code === 'EX0') return 'DÉCISION D\'EXCLUSION'
    if (code.startsWith('EX')) return 'DÉCISION D\'EXCLUSION TEMPORAIRE'
    if (code === 'CDD') return 'CONVOCATION AU CONSEIL DE DISCIPLINE'
    if (code === 'EXD') return 'DÉCISION D\'EXCLUSION DÉFINITIVE'
    return 'SANCTION DISCIPLINAIRE'
  }

  const getConsequencesText = (code) => {
    switch (code) {
      case 'MG1':
      case 'MG2':
        return 'Cette mise en garde sera inscrite dans le dossier disciplinaire du stagiaire. ' +
          'Le stagiaire est invité à améliorer son assiduité sous peine de sanctions plus sévères.'
      case 'AV1':
      case 'AV2':
        return 'Cet avertissement sera inscrit dans le dossier disciplinaire du stagiaire et communiqué aux parents/tuteurs. ' +
          'Une copie sera conservée dans le dossier administratif.'
      case 'EX0':
        return 'Le stagiaire est exclu des cours pour la journée en cours. ' +
          'Cette exclusion sera notifiée aux parents/tuteurs.'
      case 'EX1':
        return 'Le stagiaire est exclu des cours pour une durée de 1 jour. ' +
          'Cette exclusion prend effet immédiatement. Les parents/tuteurs seront informés.'
      case 'EX2':
        return 'Le stagiaire est exclu des cours pour une durée de 2 jours. ' +
          'Cette exclusion prend effet immédiatement. Les parents/tuteurs seront informés.'
      case 'EX3':
        return 'Le stagiaire est exclu des cours pour une durée de 3 jours. ' +
          'Cette exclusion prend effet immédiatement. Les parents/tuteurs seront informés.'
      case 'CDD':
        return 'Le stagiaire est convoqué devant le Conseil de Discipline de l\'établissement. ' +
          'La date et l\'heure de la convocation seront communiquées ultérieurement. ' +
          'La présence des parents/tuteurs est obligatoire.'
      case 'EXD':
        return 'Le stagiaire est définitivement exclu de l\'établissement. ' +
          'Cette décision est immédiate et irrévocable. ' +
          'Le stagiaire doit restituer tout matériel appartenant à l\'établissement.'
      default:
        return 'Cette sanction sera inscrite dans le dossier disciplinaire du stagiaire.'
    }
  }

  const getStatusBadge = (status) => {
    switch (status) {
      case 'pending':
        return <span className="status-badge pending">En attente</span>
      case 'acknowledged':
        return <span className="status-badge acknowledged">Notifié</span>
      case 'executed':
        return <span className="status-badge executed">Exécuté</span>
      default:
        return <span className="status-badge">{status}</span>
    }
  }

  const getSanctionSeverity = (code) => {
    if (code.startsWith('MG')) return 'low'
    if (code.startsWith('AV')) return 'medium'
    return 'high'
  }

  return (
    <div className="discipline-reports">
      <h2><MdGavel /> Rapports Disciplinaires</h2>
      
      {/* Filters */}
      <section className="discipline-filters">
        <div className="filter-row">
          <div className="filter-group">
            <label><MdFilterList /> Groupe</label>
            <select value={groupeFilter} onChange={e => setGroupeFilter(e.target.value)}>
              <option value="">Tous les groupes</option>
              {groupes.map(g => (
                <option key={g.id} value={g.id}>{g.nom}</option>
              ))}
            </select>
          </div>
          <div className="filter-group">
            <label>Statut du rapport</label>
            <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
              <option value="">Tous les statuts</option>
              <option value="pending">En attente</option>
              <option value="acknowledged">Notifié</option>
              <option value="executed">Exécuté</option>
            </select>
          </div>
        </div>
      </section>

      {/* Discipline Rules Reference */}
      <section className="discipline-rules-ref">
        <h3>Barème des sanctions</h3>
        <div className="rules-table-container">
          <table className="rules-table">
            <thead>
              <tr>
                <th>Cumul retards</th>
                <th>Points</th>
                <th>Sanction</th>
                <th>Autorité</th>
              </tr>
            </thead>
            <tbody>
              {DISCIPLINE_RULES.slice(0, 10).map((rule, idx) => (
                <tr key={idx} className={`severity-${getSanctionSeverity(rule.code)}`}>
                  <td>{(rule.minPoints) * 4} retards</td>
                  <td>{rule.minPoints}</td>
                  <td>{rule.sanction}</td>
                  <td>{AUTORITE_LABELS[rule.autorite]}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <p className="rules-note">
            <strong>Note:</strong> 1 retard = 2h30 = 1 séance. 4 retards non justifiés = 1 point.
          </p>
        </div>
      </section>

      {/* Stagiaires at Risk */}
      <section className="at-risk-section">
        <h3><MdWarning /> Stagiaires avec points de discipline ({filteredStagiaires.length})</h3>
        {filteredStagiaires.length > 0 ? (
          <div className="at-risk-grid">
            {filteredStagiaires.map(stagiaire => (
              <div 
                key={stagiaire.id} 
                className={`at-risk-card severity-${
                  stagiaire.disciplineStatus.points >= 5 ? 'high' : 
                  stagiaire.disciplineStatus.points >= 3 ? 'medium' : 'low'
                }`}
              >
                <div className="card-header">
                  <MdPerson size={24} />
                  <div>
                    <strong>{stagiaire.nom}</strong>
                    <span className="cef">{stagiaire.cef}</span>
                  </div>
                </div>
                <div className="card-body">
                  <div className="stat">
                    <span className="label">Groupe</span>
                    <span className="value">{stagiaire.groupe?.nom}</span>
                  </div>
                  <div className="stat">
                    <span className="label">Points</span>
                    <span className="value points">{stagiaire.disciplineStatus.points}</span>
                  </div>
                  <div className="stat">
                    <span className="label">Séances NJ</span>
                    <span className="value">{stagiaire.disciplineStatus.unjustifiedSessions}</span>
                  </div>
                  <div className="stat">
                    <span className="label">Prochaine sanction dans</span>
                    <span className="value">{stagiaire.disciplineStatus.sessionsUntilNextPoint} séances</span>
                  </div>
                </div>
                {stagiaire.disciplineStatus.sanction && (
                  <div className="card-footer">
                    <span className="current-sanction">
                      {stagiaire.disciplineStatus.sanction.sanction}
                    </span>
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="empty-state">
            <MdCheckCircle size={48} />
            <p>Aucun stagiaire avec des points de discipline</p>
          </div>
        )}
      </section>

      {/* Reports List */}
      <section className="reports-list-section">
        <h3>Historique des rapports ({filteredReports.length})</h3>
        {filteredReports.length > 0 ? (
          <div className="reports-table-container">
            <table className="reports-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Stagiaire</th>
                  <th>CEF</th>
                  <th>Sanction</th>
                  <th>Autorité</th>
                  <th>Points</th>
                  <th>Statut</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredReports.map(report => (
                  <tr key={report.id} className={`severity-${getSanctionSeverity(report.sanctionCode)}`}>
                    <td>{new Date(report.createdAt).toLocaleDateString('fr-FR')}</td>
                    <td>{report.stagiaireNom}</td>
                    <td>{report.stagiaireCef}</td>
                    <td>{report.sanctionLabel}</td>
                    <td>{report.autoriteLabel}</td>
                    <td>{report.points}</td>
                    <td>{getStatusBadge(report.status)}</td>
                    <td className="actions-cell">
                      {report.status !== 'executed' && (
                        <button 
                          className="btn-apply"
                          onClick={() => {
                            setApplyingReport(report)
                            setShowApplyModal(true)
                          }}
                          title="Appliquer la sanction et générer le rapport"
                        >
                          <MdPlayArrow size={16} />
                          Appliquer
                        </button>
                      )}
                      {report.status === 'executed' && (
                        <button 
                          className="btn-print"
                          onClick={() => {
                            const stagiaire = stagiairesWithStatus.find(s => s.id === report.stagiaireId)
                            generateSanctionPDF(report, stagiaire)
                          }}
                          title="Réimprimer le rapport"
                        >
                          <MdPrint size={16} />
                          Imprimer
                        </button>
                      )}
                      <button 
                        className="btn-action"
                        onClick={() => setSelectedReport(report)}
                      >
                        Détails
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="empty-state">
            <p>Aucun rapport disciplinaire trouvé</p>
          </div>
        )}
      </section>

      {/* Report Detail Modal */}
      {selectedReport && (
        <div className="modal-overlay" onClick={() => setSelectedReport(null)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <h3>Détails du rapport</h3>
            <div className="report-details">
              <p><strong>Stagiaire:</strong> {selectedReport.stagiaireNom} ({selectedReport.stagiaireCef})</p>
              <p><strong>Sanction:</strong> {selectedReport.sanctionLabel}</p>
              <p><strong>Autorité:</strong> {selectedReport.autoriteLabel}</p>
              <p><strong>Points:</strong> {selectedReport.points}</p>
              <p><strong>Date:</strong> {new Date(selectedReport.createdAt).toLocaleString('fr-FR')}</p>
              <p><strong>Créé par:</strong> {selectedReport.createdBy}</p>
              <p><strong>Statut actuel:</strong> {getStatusBadge(selectedReport.status)}</p>
              {selectedReport.executedAt && (
                <p><strong>Exécuté le:</strong> {new Date(selectedReport.executedAt).toLocaleString('fr-FR')} par {selectedReport.executedBy}</p>
              )}
            </div>
            <div className="modal-actions">
              {selectedReport.status === 'pending' && (
                <button 
                  className="btn-primary"
                  onClick={() => handleUpdateStatus(selectedReport.id, 'acknowledged')}
                >
                  Marquer comme notifié
                </button>
              )}
              {selectedReport.status !== 'executed' && (
                <button 
                  className="btn-apply-modal"
                  onClick={() => {
                    setApplyingReport(selectedReport)
                    setSelectedReport(null)
                    setShowApplyModal(true)
                  }}
                >
                  <MdPlayArrow size={18} />
                  Appliquer la sanction
                </button>
              )}
              {selectedReport.status === 'executed' && (
                <button 
                  className="btn-print-modal"
                  onClick={() => {
                    const stagiaire = stagiairesWithStatus.find(s => s.id === selectedReport.stagiaireId)
                    generateSanctionPDF(selectedReport, stagiaire)
                  }}
                >
                  <MdPrint size={18} />
                  Réimprimer le rapport
                </button>
              )}
              <button 
                className="btn-secondary"
                onClick={() => setSelectedReport(null)}
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Apply Sanction Confirmation Modal */}
      {showApplyModal && applyingReport && (
        <div className="modal-overlay" onClick={() => setShowApplyModal(false)}>
          <div className="modal-content apply-modal" onClick={e => e.stopPropagation()}>
            <h3><MdGavel /> Confirmer l'application de la sanction</h3>
            
            <div className="apply-warning">
              <MdWarning size={24} />
              <p>Vous êtes sur le point d'appliquer la sanction suivante:</p>
            </div>

            <div className="sanction-preview">
              <div className="preview-header">
                <strong>{applyingReport.sanctionLabel}</strong>
              </div>
              <div className="preview-body">
                <p><strong>Stagiaire:</strong> {applyingReport.stagiaireNom}</p>
                <p><strong>CEF:</strong> {applyingReport.stagiaireCef}</p>
                <p><strong>Points de discipline:</strong> {applyingReport.points}</p>
                <p><strong>Autorité:</strong> {applyingReport.autoriteLabel}</p>
              </div>
            </div>

            <div className="apply-info">
              <p>Cette action va:</p>
              <ul>
                <li>Marquer la sanction comme exécutée</li>
                <li>Générer un rapport PDF officiel à remettre au stagiaire</li>
                <li>Enregistrer l'action dans l'historique</li>
              </ul>
            </div>

            <div className="modal-actions">
              <button 
                className="btn-apply-confirm"
                onClick={() => handleApplySanction(applyingReport)}
              >
                <MdPlayArrow size={18} />
                Confirmer et générer le rapport
              </button>
              <button 
                className="btn-secondary"
                onClick={() => {
                  setShowApplyModal(false)
                  setApplyingReport(null)
                }}
              >
                Annuler
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default DisciplineReports
