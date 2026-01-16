import { useState, useEffect, useCallback } from 'react'

// Initial data - moved from App.jsx for better organization
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

const initialAbsences = [
  { 
    id: 1, 
    stagiaireId: 1, 
    date: '2025-01-15', 
    duree: 2.5, 
    etat: 'NJ',
    recordedBy: 'teacher1',
    recordedAt: new Date('2025-01-15T10:30:00').toISOString()
  },
  { 
    id: 2, 
    stagiaireId: 2, 
    date: '2025-01-15', 
    duree: 5, 
    etat: 'J',
    recordedBy: 'teacher1',
    recordedAt: new Date('2025-01-15T10:30:00').toISOString()
  },
  { 
    id: 3, 
    stagiaireId: 3, 
    date: '2025-01-16', 
    duree: 2.5, 
    etat: 'NJ',
    recordedBy: 'teacher2',
    recordedAt: new Date('2025-01-16T14:15:00').toISOString()
  },
  { 
    id: 4, 
    stagiaireId: 1, 
    date: '2025-01-20', 
    duree: 5, 
    etat: 'J',
    recordedBy: 'teacher1',
    recordedAt: new Date('2025-01-20T09:45:00').toISOString()
  },
]

// Local storage keys
const STORAGE_KEYS = {
  ABSENCES: 'ofppt_absences',
  STAGIAIRES: 'ofppt_stagiaires',
  GROUPES: 'ofppt_groupes',
  AUDIT_LOG: 'ofppt_audit_log',
  DISCIPLINE_REPORTS: 'ofppt_discipline_reports'
}

export function useAppState() {
  // Core data state
  const [absences, setAbsences] = useState(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.ABSENCES)
    return saved ? JSON.parse(saved) : initialAbsences
  })

  const [stagiaires, setStagiaires] = useState(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.STAGIAIRES)
    return saved ? JSON.parse(saved) : STAGIAIRES
  })

  const [groupes, setGroupes] = useState(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.GROUPES)
    return saved ? JSON.parse(saved) : GROUPES
  })

  const [auditLog, setAuditLog] = useState(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.AUDIT_LOG)
    return saved ? JSON.parse(saved) : []
  })

  const [disciplineReports, setDisciplineReports] = useState(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.DISCIPLINE_REPORTS)
    return saved ? JSON.parse(saved) : []
  })

  // Loading states
  const [isLoading, setIsLoading] = useState(false)
  const [loadingMessage, setLoadingMessage] = useState('')

  // Persist data to localStorage
  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.ABSENCES, JSON.stringify(absences))
  }, [absences])

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.STAGIAIRES, JSON.stringify(stagiaires))
  }, [stagiaires])

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.GROUPES, JSON.stringify(groupes))
  }, [groupes])

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.AUDIT_LOG, JSON.stringify(auditLog))
  }, [auditLog])

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.DISCIPLINE_REPORTS, JSON.stringify(disciplineReports))
  }, [disciplineReports])

  // Audit logging function
  const logAction = useCallback((action, details, userId) => {
    const logEntry = {
      id: Date.now() + Math.random(),
      action,
      details,
      userId,
      timestamp: new Date().toISOString()
    }
    setAuditLog(prev => [...prev, logEntry])
  }, [])

  // Absence operations
  const addAbsences = useCallback((newAbsences, userId) => {
    setAbsences(prev => {
      const updated = [...prev, ...newAbsences]
      logAction('ADD_ABSENCES', { count: newAbsences.length, absences: newAbsences }, userId)
      return updated
    })
  }, [logAction])

  const removeAbsence = useCallback((absenceId, userId) => {
    setAbsences(prev => {
      const absence = prev.find(a => a.id === absenceId)
      const updated = prev.filter(a => a.id !== absenceId)
      if (absence) {
        logAction('REMOVE_ABSENCE', { absence }, userId)
      }
      return updated
    })
  }, [logAction])

  // Student operations
  const addStagiaire = useCallback((stagiaire, userId) => {
    setStagiaires(prev => {
      const updated = [...prev, { ...stagiaire, id: Date.now() + Math.random() }]
      logAction('ADD_STAGIAIRE', { stagiaire }, userId)
      return updated
    })
  }, [logAction])

  const updateStagiaire = useCallback((stagiaireId, updates, userId) => {
    setStagiaires(prev => {
      const updated = prev.map(s => s.id === stagiaireId ? { ...s, ...updates } : s)
      logAction('UPDATE_STAGIAIRE', { stagiaireId, updates }, userId)
      return updated
    })
  }, [logAction])

  const removeStagiaire = useCallback((stagiaireId, userId) => {
    setStagiaires(prev => {
      const stagiaire = prev.find(s => s.id === stagiaireId)
      const updated = prev.filter(s => s.id !== stagiaireId)
      if (stagiaire) {
        logAction('REMOVE_STAGIAIRE', { stagiaire }, userId)
      }
      return updated
    })
  }, [logAction])

  // Group operations
  const addGroupe = useCallback((groupe, userId) => {
    setGroupes(prev => {
      const updated = [...prev, { ...groupe, id: Date.now() + Math.random() }]
      logAction('ADD_GROUPE', { groupe }, userId)
      return updated
    })
  }, [logAction])

  const updateGroupe = useCallback((groupeId, updates, userId) => {
    setGroupes(prev => {
      const updated = prev.map(g => g.id === groupeId ? { ...g, ...updates } : g)
      logAction('UPDATE_GROUPE', { groupeId, updates }, userId)
      return updated
    })
  }, [logAction])

  const removeGroupe = useCallback((groupeId, userId) => {
    setGroupes(prev => {
      const groupe = prev.find(g => g.id === groupeId)
      const updated = prev.filter(g => g.id !== groupeId)
      if (groupe) {
        logAction('REMOVE_GROUPE', { groupe }, userId)
      }
      return updated
    })
  }, [logAction])

  // Discipline report operations
  const addDisciplineReport = useCallback((report, userId) => {
    setDisciplineReports(prev => {
      const updated = [...prev, report]
      logAction('ADD_DISCIPLINE_REPORT', { report }, userId)
      return updated
    })
  }, [logAction])

  const updateDisciplineReport = useCallback((reportId, updates, userId) => {
    setDisciplineReports(prev => {
      const updated = prev.map(r => r.id === reportId ? { ...r, ...updates } : r)
      logAction('UPDATE_DISCIPLINE_REPORT', { reportId, updates }, userId)
      return updated
    })
  }, [logAction])

  // Justify an absence (change status from NJ to J)
  const justifyAbsence = useCallback((absenceId, justificationReason, userId) => {
    setAbsences(prev => {
      const absence = prev.find(a => a.id === absenceId)
      if (!absence) return prev
      
      const updated = prev.map(a => 
        a.id === absenceId 
          ? { 
              ...a, 
              etat: 'J', 
              justifiedAt: new Date().toISOString(),
              justifiedBy: userId,
              justificationReason 
            } 
          : a
      )
      logAction('JUSTIFY_ABSENCE', { absenceId, justificationReason }, userId)
      return updated
    })
  }, [logAction])

  // Loading state management
  const setLoading = useCallback((loading, message = '') => {
    setIsLoading(loading)
    setLoadingMessage(message)
  }, [])

  return {
    // Static data
    secteurs: SECTEURS,
    filieres: FILIERES,
    
    // Dynamic data
    absences,
    stagiaires,
    groupes,
    auditLog,
    disciplineReports,
    
    // Loading state
    isLoading,
    loadingMessage,
    setLoading,
    
    // Operations
    addAbsences,
    removeAbsence,
    justifyAbsence,
    addStagiaire,
    updateStagiaire,
    removeStagiaire,
    addGroupe,
    updateGroupe,
    removeGroupe,
    addDisciplineReport,
    updateDisciplineReport,
    logAction
  }
}