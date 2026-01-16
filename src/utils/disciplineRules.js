// Discipline rules based on OFPPT attendance policy
// 1 retard (absence) = 2h30 = 1 séance

export const DISCIPLINE_RULES = [
  { minPoints: 1, maxPoints: 1, sanction: '1ère mise en garde', autorite: 'SG', code: 'MG1' },
  { minPoints: 2, maxPoints: 2, sanction: '2ème mise en garde', autorite: 'SG', code: 'MG2' },
  { minPoints: 3, maxPoints: 3, sanction: '1er avertissement', autorite: 'R', code: 'AV1' },
  { minPoints: 4, maxPoints: 4, sanction: '2ème avertissement', autorite: 'R', code: 'AV2' },
  { minPoints: 5, maxPoints: 5, sanction: 'Exclusion', autorite: 'CD', code: 'EX0' },
  { minPoints: 6, maxPoints: 6, sanction: 'Exclusion (1 jour)', autorite: 'CD', code: 'EX1' },
  { minPoints: 7, maxPoints: 7, sanction: 'Exclusion (2 jours)', autorite: 'CD', code: 'EX2' },
  { minPoints: 8, maxPoints: 8, sanction: 'Exclusion (3 jours)', autorite: 'CD', code: 'EX3' },
  { minPoints: 9, maxPoints: 9, sanction: 'Conseil de discipline', autorite: 'CD', code: 'CDD' },
  { minPoints: 10, maxPoints: Infinity, sanction: 'Exclusion définitive', autorite: 'CD', code: 'EXD' }
]

// Authority codes
export const AUTORITE_LABELS = {
  'SG': 'Surveillant Général',
  'R': 'Responsable',
  'CD': 'Conseil de Discipline'
}

// Calculate points from unjustified absences
// 4 retards (sessions) = 1 point
export const calculateDisciplinePoints = (unjustifiedAbsences) => {
  // Count total sessions from unjustified absences
  let totalSessions = 0
  
  unjustifiedAbsences.forEach(absence => {
    // Convert duration to sessions
    if (absence.duree === 2.5 || absence.dureSessions === 1) {
      totalSessions += 1
    } else if (absence.duree === 5 || absence.dureSessions === 2) {
      totalSessions += 2
    } else if (typeof absence.duree === 'number') {
      // Custom duration: convert hours to sessions (1 session = 2.5h)
      totalSessions += Math.ceil(absence.duree / 2.5)
    }
  })
  
  // 4 retards (sessions) = 1 point
  return Math.floor(totalSessions / 4)
}

// Get sanction for given points
export const getSanctionForPoints = (points) => {
  if (points <= 0) return null
  
  const rule = DISCIPLINE_RULES.find(r => points >= r.minPoints && points <= r.maxPoints)
  return rule || DISCIPLINE_RULES[DISCIPLINE_RULES.length - 1] // Return last rule if beyond max
}

// Calculate discipline status for a stagiaire
export const calculateDisciplineStatus = (stagiaireId, absences) => {
  const stagiaireAbsences = absences.filter(a => a.stagiaireId === stagiaireId)
  const unjustifiedAbsences = stagiaireAbsences.filter(a => a.etat === 'NJ')
  const justifiedAbsences = stagiaireAbsences.filter(a => a.etat === 'J')
  
  // Count sessions
  const countSessions = (absenceList) => {
    return absenceList.reduce((total, absence) => {
      if (absence.duree === 2.5 || absence.dureSessions === 1) return total + 1
      if (absence.duree === 5 || absence.dureSessions === 2) return total + 2
      if (typeof absence.duree === 'number') return total + Math.ceil(absence.duree / 2.5)
      return total
    }, 0)
  }
  
  const unjustifiedSessions = countSessions(unjustifiedAbsences)
  const justifiedSessions = countSessions(justifiedAbsences)
  const totalSessions = unjustifiedSessions + justifiedSessions
  
  const points = Math.floor(unjustifiedSessions / 4)
  const sanction = getSanctionForPoints(points)
  
  return {
    stagiaireId,
    totalAbsences: stagiaireAbsences.length,
    unjustifiedAbsences: unjustifiedAbsences.length,
    justifiedAbsences: justifiedAbsences.length,
    totalSessions,
    unjustifiedSessions,
    justifiedSessions,
    points,
    sanction,
    sessionsUntilNextPoint: 4 - (unjustifiedSessions % 4),
    isAtRisk: points >= 3, // At risk if has received warnings
    isExcluded: points >= 10
  }
}

// Generate discipline report for a sanction
export const generateDisciplineReport = (stagiaire, sanction, absences, recordedBy) => {
  return {
    id: Date.now() + Math.random(),
    stagiaireId: stagiaire.id,
    stagiaireCef: stagiaire.cef,
    stagiaireNom: stagiaire.nom,
    sanctionCode: sanction.code,
    sanctionLabel: sanction.sanction,
    autorite: sanction.autorite,
    autoriteLabel: AUTORITE_LABELS[sanction.autorite],
    points: sanction.minPoints,
    relatedAbsences: absences.map(a => a.id),
    createdAt: new Date().toISOString(),
    createdBy: recordedBy,
    status: 'pending', // pending, acknowledged, executed
    notes: ''
  }
}

// Check if new sanction should be applied after adding absences
export const checkForNewSanction = (stagiaireId, absencesBefore, absencesAfter) => {
  const statusBefore = calculateDisciplineStatus(stagiaireId, absencesBefore)
  const statusAfter = calculateDisciplineStatus(stagiaireId, absencesAfter)
  
  // If points increased and there's a new sanction level
  if (statusAfter.points > statusBefore.points && statusAfter.sanction) {
    return {
      shouldApply: true,
      previousPoints: statusBefore.points,
      newPoints: statusAfter.points,
      sanction: statusAfter.sanction
    }
  }
  
  return { shouldApply: false }
}
