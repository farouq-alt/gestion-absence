import { useState, useMemo } from 'react'
import { useAppState } from '../hooks/useAppState'
import { useAuth } from '../contexts/AuthContext'
import { 
  DISCIPLINE_RULES, 
  AUTORITE_LABELS, 
  calculateDisciplineStatus 
} from '../utils/disciplineRules'
import { MdWarning, MdCheckCircle, MdGavel, MdPerson, MdFilterList } from 'react-icons/md'
import '../styles/DisciplineReports.css'

function DisciplineReports() {
  const { disciplineReports, stagiaires, groupes, absences, updateDisciplineReport } = useAppState()
  const { username } = useAuth()
  
  const [statusFilter, setStatusFilter] = useState('')
  const [groupeFilter, setGroupeFilter] = useState('')
  const [selectedReport, setSelectedReport] = useState(null)

  // Get all stagiaires with their discipline status
  const stagiairesWithStatus = useMemo(() => {
    return stagiaires.map(stagiaire => {
      const status = calculateDisciplineStatus(stagiaire.id, absences)
      const groupe = groupes.find(g => g.id === stagiaire.groupeId)
      return {
        ...stagiaire,
        groupe,
        disciplineStatus: status
      }
    }).filter(s => s.disciplineStatus.points > 0) // Only show those with points
      .sort((a, b) => b.disciplineStatus.points - a.disciplineStatus.points) // Sort by points desc
  }, [stagiaires, absences, groupes])

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
                    <td>
                      <button 
                        className="btn-action"
                        onClick={() => setSelectedReport(report)}
                      >
                        Gérer
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
              {selectedReport.status === 'acknowledged' && (
                <button 
                  className="btn-primary"
                  onClick={() => handleUpdateStatus(selectedReport.id, 'executed')}
                >
                  Marquer comme exécuté
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
    </div>
  )
}

export default DisciplineReports
