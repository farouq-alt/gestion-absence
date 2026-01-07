import { useState, useEffect, useMemo } from 'react'

// Mock data - in a real app this would come from props or context
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

const GROUPES = [
  { id: 1, nom: 'DEV101', filiereId: 1 },
  { id: 2, nom: 'DEV102', filiereId: 1 },
  { id: 3, nom: 'INF101', filiereId: 2 },
  { id: 4, nom: 'ELM101', filiereId: 3 },
  { id: 5, nom: 'GE101', filiereId: 5 },
  { id: 6, nom: 'CPT101', filiereId: 6 },
]

function RollbackManager({ absences = [], onRollback, currentUser = 'teacher1' }) {
  const [selectedAbsence, setSelectedAbsence] = useState(null)
  const [showConfirmDialog, setShowConfirmDialog] = useState(false)
  const [currentTime, setCurrentTime] = useState(new Date())
  
  // Rollback time limit in minutes (configurable)
  const ROLLBACK_TIME_LIMIT = 30 // 30 minutes
  
  // Update current time every minute to refresh rollback availability
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date())
    }, 60000) // Update every minute
    
    return () => clearInterval(interval)
  }, [])

  // Helper functions
  const canRollback = (absence) => {
    if (!absence.recordedAt) return false
    
    const recordedTime = new Date(absence.recordedAt)
    const timeDiff = (currentTime - recordedTime) / (1000 * 60) // Difference in minutes
    
    return timeDiff <= ROLLBACK_TIME_LIMIT && absence.recordedBy === currentUser
  }

  const getRemainingTime = (absence) => {
    if (!absence.recordedAt) return 0
    
    const recordedTime = new Date(absence.recordedAt)
    const timeDiff = (currentTime - recordedTime) / (1000 * 60) // Difference in minutes
    const remaining = ROLLBACK_TIME_LIMIT - timeDiff
    
    return Math.max(0, Math.ceil(remaining))
  }

  const formatDuration = (duration) => {
    if (typeof duration === 'number') {
      if (duration === 2.5) {
        return '2h30 (1 séance)'
      } else if (duration === 5) {
        return '5h00 (2 séances)'
      } else {
        return `${duration}h (personnalisée)`
      }
    } else {
      return duration === 1 ? '2h30 (1 séance)' : '5h00 (2 séances)'
    }
  }

  const getStudentName = (stagiaireId) => {
    const student = STAGIAIRES.find(s => s.id === stagiaireId)
    return student ? student.nom : 'Stagiaire inconnu'
  }

  const getStudentCef = (stagiaireId) => {
    const student = STAGIAIRES.find(s => s.id === stagiaireId)
    return student ? student.cef : 'N/A'
  }

  const getGroupName = (stagiaireId) => {
    const student = STAGIAIRES.find(s => s.id === stagiaireId)
    if (!student) return 'N/A'
    
    const group = GROUPES.find(g => g.id === student.groupeId)
    return group ? group.nom : 'N/A'
  }

  // Get rollbackable absences (recorded in current session by current user)
  const rollbackableAbsences = useMemo(() => {
    const today = new Date().toISOString().split('T')[0]
    
    return absences
      .filter(absence => {
        // Only show absences from today that can be rolled back
        if (!absence.date === today || absence.recordedBy !== currentUser) {
          return false
        }
        
        // Check if rollback is still possible
        if (!absence.recordedAt) return false
        
        const recordedTime = new Date(absence.recordedAt)
        const timeDiff = (currentTime - recordedTime) / (1000 * 60) // Difference in minutes
        
        return timeDiff <= ROLLBACK_TIME_LIMIT
      })
      .sort((a, b) => new Date(b.recordedAt) - new Date(a.recordedAt)) // Most recent first
  }, [absences, currentUser, currentTime, ROLLBACK_TIME_LIMIT])

  // Handle rollback request
  const handleRollbackRequest = (absence) => {
    setSelectedAbsence(absence)
    setShowConfirmDialog(true)
  }

  const handleConfirmRollback = () => {
    if (selectedAbsence && onRollback) {
      onRollback(selectedAbsence.id)
      setShowConfirmDialog(false)
      setSelectedAbsence(null)
    }
  }

  const handleCancelRollback = () => {
    setShowConfirmDialog(false)
    setSelectedAbsence(null)
  }

  return (
    <div className="rollback-manager">
      <div className="rollback-manager-header">
        <h2>Annuler des Absences</h2>
        <p className="rollback-info">
          Vous pouvez annuler les absences que vous avez enregistrées dans les {ROLLBACK_TIME_LIMIT} dernières minutes.
        </p>
      </div>

      <div className="rollback-content">
        {rollbackableAbsences.length > 0 ? (
          <div className="rollback-section">
            <div className="rollback-section-header">
              <span className="rollback-section-title">Absences récentes</span>
              <span className="rollback-section-count">{rollbackableAbsences.length} absence(s) annulable(s)</span>
            </div>
            
            <div className="rollback-table-container">
              <table className="rollback-table">
                <thead>
                  <tr>
                    <th>Heure d'enregistrement</th>
                    <th>CEF</th>
                    <th>Nom</th>
                    <th>Groupe</th>
                    <th>Durée</th>
                    <th>État</th>
                    <th>Temps restant</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {rollbackableAbsences.map(absence => (
                    <tr key={absence.id}>
                      <td>
                        {absence.recordedAt 
                          ? new Date(absence.recordedAt).toLocaleTimeString('fr-FR', { 
                              hour: '2-digit', 
                              minute: '2-digit' 
                            })
                          : 'N/A'
                        }
                      </td>
                      <td>{getStudentCef(absence.stagiaireId)}</td>
                      <td>{getStudentName(absence.stagiaireId)}</td>
                      <td>{getGroupName(absence.stagiaireId)}</td>
                      <td>{formatDuration(absence.duree)}</td>
                      <td className={absence.etat === 'J' ? 'status-j' : 'status-nj'}>
                        {absence.etat === 'J' ? 'Justifiée' : 'Non justifiée'}
                      </td>
                      <td className="remaining-time">
                        {getRemainingTime(absence)} min
                      </td>
                      <td>
                        <button
                          className="btn-rollback"
                          onClick={() => handleRollbackRequest(absence)}
                          disabled={!canRollback(absence)}
                        >
                          Annuler
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <div className="rollback-empty-state">
            <div className="empty-state-icon">⏰</div>
            <h3>Aucune absence à annuler</h3>
            <p>
              Les absences peuvent être annulées dans les {ROLLBACK_TIME_LIMIT} minutes suivant leur enregistrement.
            </p>
            <p>
              Seules les absences que vous avez enregistrées aujourd'hui sont affichées ici.
            </p>
          </div>
        )}
      </div>

      {/* Confirmation Dialog */}
      {showConfirmDialog && selectedAbsence && (
        <div className="modal-overlay">
          <div className="modal rollback-modal">
            <div className="modal-header">
              <h3>Confirmer l'annulation</h3>
              <button 
                className="modal-close"
                onClick={handleCancelRollback}
              >
                ×
              </button>
            </div>
            
            <div className="modal-content">
              <div className="rollback-confirmation">
                <div className="confirmation-icon">⚠️</div>
                <p>
                  Êtes-vous sûr de vouloir annuler cette absence ?
                </p>
                
                <div className="absence-details">
                  <div className="detail-row">
                    <span className="detail-label">Stagiaire:</span>
                    <span className="detail-value">
                      {getStudentName(selectedAbsence.stagiaireId)} ({getStudentCef(selectedAbsence.stagiaireId)})
                    </span>
                  </div>
                  <div className="detail-row">
                    <span className="detail-label">Date:</span>
                    <span className="detail-value">{selectedAbsence.date}</span>
                  </div>
                  <div className="detail-row">
                    <span className="detail-label">Durée:</span>
                    <span className="detail-value">{formatDuration(selectedAbsence.duree)}</span>
                  </div>
                  <div className="detail-row">
                    <span className="detail-label">État:</span>
                    <span className={`detail-value ${selectedAbsence.etat === 'J' ? 'status-j' : 'status-nj'}`}>
                      {selectedAbsence.etat === 'J' ? 'Justifiée' : 'Non justifiée'}
                    </span>
                  </div>
                </div>
                
                <div className="confirmation-warning">
                  <strong>Attention:</strong> Cette action est irréversible. L'absence sera définitivement supprimée.
                </div>
              </div>
            </div>
            
            <div className="modal-actions">
              <button 
                className="btn-secondary"
                onClick={handleCancelRollback}
              >
                Annuler
              </button>
              <button 
                className="btn-danger"
                onClick={handleConfirmRollback}
              >
                Confirmer l'annulation
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default RollbackManager