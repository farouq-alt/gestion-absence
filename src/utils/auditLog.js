// Audit logging system for tracking data modifications

// Audit log entry structure
export class AuditEntry {
  constructor(action, entityType, entityId, userId, details = {}) {
    this.id = generateAuditId()
    this.timestamp = new Date().toISOString()
    this.action = action // CREATE, UPDATE, DELETE, IMPORT, EXPORT, ROLLBACK
    this.entityType = entityType // student, group, absence, filiere, secteur
    this.entityId = entityId
    this.userId = userId
    this.details = details
    this.sessionId = getCurrentSessionId()
  }
}

// Generate unique audit ID
const generateAuditId = () => {
  return `audit_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
}

// Get current session ID (from localStorage or generate new one)
const getCurrentSessionId = () => {
  let sessionId = localStorage.getItem('audit_session_id')
  if (!sessionId) {
    sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    localStorage.setItem('audit_session_id', sessionId)
  }
  return sessionId
}

// Audit logger class
export class AuditLogger {
  constructor() {
    this.storageKey = 'ofppt_audit_log'
    this.maxEntries = 10000 // Maximum number of audit entries to keep
  }

  // Get all audit entries
  getAuditLog() {
    try {
      const log = localStorage.getItem(this.storageKey)
      return log ? JSON.parse(log) : []
    } catch (error) {
      console.error('Error reading audit log:', error)
      return []
    }
  }

  // Add audit entry
  log(action, entityType, entityId, userId, details = {}) {
    try {
      const entry = new AuditEntry(action, entityType, entityId, userId, details)
      const auditLog = this.getAuditLog()
      
      // Add new entry
      auditLog.push(entry)
      
      // Trim log if it exceeds maximum entries
      if (auditLog.length > this.maxEntries) {
        auditLog.splice(0, auditLog.length - this.maxEntries)
      }
      
      // Save to localStorage
      localStorage.setItem(this.storageKey, JSON.stringify(auditLog))
      
      return entry
    } catch (error) {
      console.error('Error logging audit entry:', error)
      return null
    }
  }

  // Log student operations
  logStudentCreate(student, userId) {
    return this.log('CREATE', 'student', student.id, userId, {
      cef: student.cef,
      nom: student.nom,
      email: student.email,
      groupeId: student.groupeId
    })
  }

  logStudentUpdate(studentId, oldData, newData, userId) {
    const changes = this.getChanges(oldData, newData)
    return this.log('UPDATE', 'student', studentId, userId, {
      changes,
      oldData: this.sanitizeData(oldData),
      newData: this.sanitizeData(newData)
    })
  }

  logStudentDelete(student, userId) {
    return this.log('DELETE', 'student', student.id, userId, {
      cef: student.cef,
      nom: student.nom,
      email: student.email,
      groupeId: student.groupeId
    })
  }

  // Log group operations
  logGroupCreate(group, userId) {
    return this.log('CREATE', 'group', group.id, userId, {
      nom: group.nom,
      filiereId: group.filiereId
    })
  }

  logGroupUpdate(groupId, oldData, newData, userId) {
    const changes = this.getChanges(oldData, newData)
    return this.log('UPDATE', 'group', groupId, userId, {
      changes,
      oldData: this.sanitizeData(oldData),
      newData: this.sanitizeData(newData)
    })
  }

  logGroupDelete(group, userId) {
    return this.log('DELETE', 'group', group.id, userId, {
      nom: group.nom,
      filiereId: group.filiereId
    })
  }

  // Log absence operations
  logAbsenceCreate(absence, userId) {
    return this.log('CREATE', 'absence', absence.id, userId, {
      stagiaireId: absence.stagiaireId,
      date: absence.date,
      duree: absence.duree,
      etat: absence.etat
    })
  }

  logAbsenceUpdate(absenceId, oldData, newData, userId) {
    const changes = this.getChanges(oldData, newData)
    return this.log('UPDATE', 'absence', absenceId, userId, {
      changes,
      oldData: this.sanitizeData(oldData),
      newData: this.sanitizeData(newData)
    })
  }

  logAbsenceDelete(absence, userId) {
    return this.log('DELETE', 'absence', absence.id, userId, {
      stagiaireId: absence.stagiaireId,
      date: absence.date,
      duree: absence.duree,
      etat: absence.etat
    })
  }

  logAbsenceRollback(absence, userId) {
    return this.log('ROLLBACK', 'absence', absence.id, userId, {
      stagiaireId: absence.stagiaireId,
      date: absence.date,
      duree: absence.duree,
      etat: absence.etat,
      originalRecordedBy: absence.recordedBy,
      originalRecordedAt: absence.recordedAt
    })
  }

  // Log bulk operations
  logBulkImport(entityType, count, userId, details = {}) {
    return this.log('IMPORT', entityType, 'bulk', userId, {
      count,
      ...details
    })
  }

  logBulkExport(entityType, count, userId, details = {}) {
    return this.log('EXPORT', entityType, 'bulk', userId, {
      count,
      ...details
    })
  }

  // Log system operations
  logLogin(userId, role) {
    return this.log('LOGIN', 'user', userId, userId, {
      role,
      timestamp: new Date().toISOString()
    })
  }

  logLogout(userId) {
    return this.log('LOGOUT', 'user', userId, userId, {
      timestamp: new Date().toISOString()
    })
  }

  // Helper methods
  getChanges(oldData, newData) {
    const changes = {}
    const allKeys = new Set([...Object.keys(oldData), ...Object.keys(newData)])
    
    for (const key of allKeys) {
      if (oldData[key] !== newData[key]) {
        changes[key] = {
          from: oldData[key],
          to: newData[key]
        }
      }
    }
    
    return changes
  }

  sanitizeData(data) {
    // Remove sensitive information from audit logs
    const sanitized = { ...data }
    delete sanitized.password
    delete sanitized.hashedPassword
    return sanitized
  }

  // Query methods
  getEntriesByUser(userId) {
    return this.getAuditLog().filter(entry => entry.userId === userId)
  }

  getEntriesByEntity(entityType, entityId) {
    return this.getAuditLog().filter(entry => 
      entry.entityType === entityType && entry.entityId === entityId
    )
  }

  getEntriesByAction(action) {
    return this.getAuditLog().filter(entry => entry.action === action)
  }

  getEntriesByDateRange(startDate, endDate) {
    const start = new Date(startDate).toISOString()
    const end = new Date(endDate).toISOString()
    
    return this.getAuditLog().filter(entry => 
      entry.timestamp >= start && entry.timestamp <= end
    )
  }

  getEntriesBySession(sessionId) {
    return this.getAuditLog().filter(entry => entry.sessionId === sessionId)
  }

  // Statistics methods
  getStatistics() {
    const entries = this.getAuditLog()
    const stats = {
      totalEntries: entries.length,
      byAction: {},
      byEntityType: {},
      byUser: {},
      byDate: {}
    }

    entries.forEach(entry => {
      // Count by action
      stats.byAction[entry.action] = (stats.byAction[entry.action] || 0) + 1
      
      // Count by entity type
      stats.byEntityType[entry.entityType] = (stats.byEntityType[entry.entityType] || 0) + 1
      
      // Count by user
      stats.byUser[entry.userId] = (stats.byUser[entry.userId] || 0) + 1
      
      // Count by date (day)
      const date = entry.timestamp.split('T')[0]
      stats.byDate[date] = (stats.byDate[date] || 0) + 1
    })

    return stats
  }

  // Cleanup methods
  clearOldEntries(daysToKeep = 365) {
    const cutoffDate = new Date()
    cutoffDate.setDate(cutoffDate.getDate() - daysToKeep)
    const cutoffISO = cutoffDate.toISOString()
    
    const entries = this.getAuditLog()
    const filteredEntries = entries.filter(entry => entry.timestamp >= cutoffISO)
    
    localStorage.setItem(this.storageKey, JSON.stringify(filteredEntries))
    
    return entries.length - filteredEntries.length // Number of entries removed
  }

  clearAllEntries() {
    localStorage.removeItem(this.storageKey)
    return true
  }

  // Export audit log
  exportAuditLog(format = 'json') {
    const entries = this.getAuditLog()
    
    if (format === 'json') {
      return JSON.stringify(entries, null, 2)
    } else if (format === 'csv') {
      if (entries.length === 0) return ''
      
      const headers = ['ID', 'Timestamp', 'Action', 'Entity Type', 'Entity ID', 'User ID', 'Session ID', 'Details']
      const csvRows = [headers.join(',')]
      
      entries.forEach(entry => {
        const row = [
          entry.id,
          entry.timestamp,
          entry.action,
          entry.entityType,
          entry.entityId,
          entry.userId,
          entry.sessionId,
          JSON.stringify(entry.details).replace(/"/g, '""')
        ]
        csvRows.push(row.join(','))
      })
      
      return csvRows.join('\n')
    }
    
    throw new Error(`Unsupported export format: ${format}`)
  }
}

// Create singleton instance
export const auditLogger = new AuditLogger()

// Convenience functions
export const logStudentCreate = (student, userId) => auditLogger.logStudentCreate(student, userId)
export const logStudentUpdate = (studentId, oldData, newData, userId) => auditLogger.logStudentUpdate(studentId, oldData, newData, userId)
export const logStudentDelete = (student, userId) => auditLogger.logStudentDelete(student, userId)

export const logGroupCreate = (group, userId) => auditLogger.logGroupCreate(group, userId)
export const logGroupUpdate = (groupId, oldData, newData, userId) => auditLogger.logGroupUpdate(groupId, oldData, newData, userId)
export const logGroupDelete = (group, userId) => auditLogger.logGroupDelete(group, userId)

export const logAbsenceCreate = (absence, userId) => auditLogger.logAbsenceCreate(absence, userId)
export const logAbsenceUpdate = (absenceId, oldData, newData, userId) => auditLogger.logAbsenceUpdate(absenceId, oldData, newData, userId)
export const logAbsenceDelete = (absence, userId) => auditLogger.logAbsenceDelete(absence, userId)
export const logAbsenceRollback = (absence, userId) => auditLogger.logAbsenceRollback(absence, userId)

export const logBulkImport = (entityType, count, userId, details) => auditLogger.logBulkImport(entityType, count, userId, details)
export const logBulkExport = (entityType, count, userId, details) => auditLogger.logBulkExport(entityType, count, userId, details)

export const logLogin = (userId, role) => auditLogger.logLogin(userId, role)
export const logLogout = (userId) => auditLogger.logLogout(userId)