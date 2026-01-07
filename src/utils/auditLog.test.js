import {
  AuditEntry,
  AuditLogger,
  auditLogger,
  logStudentCreate,
  logStudentUpdate,
  logStudentDelete,
  logAbsenceRollback
} from './auditLog.js'

// Mock localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn()
}
global.localStorage = localStorageMock

describe('Audit Logging System', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    localStorageMock.getItem.mockReturnValue(null)
  })

  describe('AuditEntry', () => {
    it('creates audit entry with required fields', () => {
      const entry = new AuditEntry('CREATE', 'student', 1, 'user123', { test: 'data' })
      
      expect(entry.id).toBeDefined()
      expect(entry.timestamp).toBeDefined()
      expect(entry.action).toBe('CREATE')
      expect(entry.entityType).toBe('student')
      expect(entry.entityId).toBe(1)
      expect(entry.userId).toBe('user123')
      expect(entry.details).toEqual({ test: 'data' })
      expect(entry.sessionId).toBeDefined()
    })

    it('generates unique IDs', () => {
      const entry1 = new AuditEntry('CREATE', 'student', 1, 'user123')
      const entry2 = new AuditEntry('CREATE', 'student', 2, 'user123')
      
      expect(entry1.id).not.toBe(entry2.id)
    })

    it('sets timestamp to current time', () => {
      const before = new Date()
      const entry = new AuditEntry('CREATE', 'student', 1, 'user123')
      const after = new Date()
      
      const entryTime = new Date(entry.timestamp)
      expect(entryTime.getTime()).toBeGreaterThanOrEqual(before.getTime())
      expect(entryTime.getTime()).toBeLessThanOrEqual(after.getTime())
    })
  })

  describe('AuditLogger', () => {
    let logger

    beforeEach(() => {
      logger = new AuditLogger()
    })

    describe('getAuditLog', () => {
      it('returns empty array when no log exists', () => {
        localStorageMock.getItem.mockReturnValue(null)
        const log = logger.getAuditLog()
        expect(log).toEqual([])
      })

      it('returns parsed log from localStorage', () => {
        const mockLog = [{ id: '1', action: 'CREATE' }]
        localStorageMock.getItem.mockReturnValue(JSON.stringify(mockLog))
        const log = logger.getAuditLog()
        expect(log).toEqual(mockLog)
      })

      it('returns empty array on parse error', () => {
        localStorageMock.getItem.mockReturnValue('invalid json')
        const log = logger.getAuditLog()
        expect(log).toEqual([])
      })
    })

    describe('log', () => {
      it('creates and stores audit entry', () => {
        localStorageMock.getItem.mockReturnValue('[]')
        
        const entry = logger.log('CREATE', 'student', 1, 'user123', { test: 'data' })
        
        expect(entry).toBeInstanceOf(AuditEntry)
        expect(entry.action).toBe('CREATE')
        expect(entry.entityType).toBe('student')
        expect(entry.entityId).toBe(1)
        expect(entry.userId).toBe('user123')
        expect(entry.details).toEqual({ test: 'data' })
        
        expect(localStorageMock.setItem).toHaveBeenCalledWith(
          'ofppt_audit_log',
          expect.stringContaining('"action":"CREATE"')
        )
      })

      it('trims log when exceeding maximum entries', () => {
        const existingLog = Array(10000).fill({ id: 'old' })
        localStorageMock.getItem.mockReturnValue(JSON.stringify(existingLog))
        
        logger.log('CREATE', 'student', 1, 'user123')
        
        const savedData = JSON.parse(localStorageMock.setItem.mock.calls[0][1])
        expect(savedData).toHaveLength(10000) // Should maintain max size
      })

      it('returns null on error', () => {
        localStorageMock.getItem.mockImplementation(() => {
          throw new Error('Storage error')
        })
        
        const entry = logger.log('CREATE', 'student', 1, 'user123')
        expect(entry).toBeNull()
      })
    })

    describe('student logging methods', () => {
      beforeEach(() => {
        localStorageMock.getItem.mockReturnValue('[]')
      })

      it('logs student creation', () => {
        const student = { id: 1, cef: 'CEF001', nom: 'Test', email: 'test@ofppt.ma', groupeId: 1 }
        const entry = logger.logStudentCreate(student, 'user123')
        
        expect(entry.action).toBe('CREATE')
        expect(entry.entityType).toBe('student')
        expect(entry.entityId).toBe(1)
        expect(entry.details.cef).toBe('CEF001')
        expect(entry.details.nom).toBe('Test')
      })

      it('logs student update with changes', () => {
        const oldData = { id: 1, nom: 'Old Name', email: 'old@ofppt.ma' }
        const newData = { id: 1, nom: 'New Name', email: 'new@ofppt.ma' }
        
        const entry = logger.logStudentUpdate(1, oldData, newData, 'user123')
        
        expect(entry.action).toBe('UPDATE')
        expect(entry.entityType).toBe('student')
        expect(entry.details.changes.nom.from).toBe('Old Name')
        expect(entry.details.changes.nom.to).toBe('New Name')
        expect(entry.details.changes.email.from).toBe('old@ofppt.ma')
        expect(entry.details.changes.email.to).toBe('new@ofppt.ma')
      })

      it('logs student deletion', () => {
        const student = { id: 1, cef: 'CEF001', nom: 'Test', email: 'test@ofppt.ma', groupeId: 1 }
        const entry = logger.logStudentDelete(student, 'user123')
        
        expect(entry.action).toBe('DELETE')
        expect(entry.entityType).toBe('student')
        expect(entry.entityId).toBe(1)
        expect(entry.details.cef).toBe('CEF001')
      })
    })

    describe('absence logging methods', () => {
      beforeEach(() => {
        localStorageMock.getItem.mockReturnValue('[]')
      })

      it('logs absence rollback', () => {
        const absence = {
          id: 1,
          stagiaireId: 1,
          date: '2025-01-15',
          duree: 2.5,
          etat: 'NJ',
          recordedBy: 'teacher1',
          recordedAt: '2025-01-15T10:00:00Z'
        }
        
        const entry = logger.logAbsenceRollback(absence, 'teacher1')
        
        expect(entry.action).toBe('ROLLBACK')
        expect(entry.entityType).toBe('absence')
        expect(entry.entityId).toBe(1)
        expect(entry.details.stagiaireId).toBe(1)
        expect(entry.details.originalRecordedBy).toBe('teacher1')
      })
    })

    describe('bulk operation logging', () => {
      beforeEach(() => {
        localStorageMock.getItem.mockReturnValue('[]')
      })

      it('logs bulk import', () => {
        const entry = logger.logBulkImport('student', 50, 'user123', { fileName: 'students.xlsx' })
        
        expect(entry.action).toBe('IMPORT')
        expect(entry.entityType).toBe('student')
        expect(entry.entityId).toBe('bulk')
        expect(entry.details.count).toBe(50)
        expect(entry.details.fileName).toBe('students.xlsx')
      })

      it('logs bulk export', () => {
        const entry = logger.logBulkExport('absence', 100, 'user123', { format: 'excel' })
        
        expect(entry.action).toBe('EXPORT')
        expect(entry.entityType).toBe('absence')
        expect(entry.details.count).toBe(100)
        expect(entry.details.format).toBe('excel')
      })
    })

    describe('query methods', () => {
      const mockEntries = [
        { id: '1', userId: 'user1', entityType: 'student', action: 'CREATE', timestamp: '2025-01-15T10:00:00Z' },
        { id: '2', userId: 'user2', entityType: 'absence', action: 'UPDATE', timestamp: '2025-01-16T10:00:00Z' },
        { id: '3', userId: 'user1', entityType: 'student', action: 'DELETE', timestamp: '2025-01-17T10:00:00Z' }
      ]

      beforeEach(() => {
        localStorageMock.getItem.mockReturnValue(JSON.stringify(mockEntries))
      })

      it('filters entries by user', () => {
        const entries = logger.getEntriesByUser('user1')
        expect(entries).toHaveLength(2)
        expect(entries.every(e => e.userId === 'user1')).toBe(true)
      })

      it('filters entries by entity', () => {
        const entries = logger.getEntriesByEntity('student', 'entityId')
        expect(entries).toHaveLength(2)
        expect(entries.every(e => e.entityType === 'student')).toBe(true)
      })

      it('filters entries by action', () => {
        const entries = logger.getEntriesByAction('CREATE')
        expect(entries).toHaveLength(1)
        expect(entries[0].action).toBe('CREATE')
      })

      it('filters entries by date range', () => {
        const entries = logger.getEntriesByDateRange('2025-01-15', '2025-01-16')
        expect(entries).toHaveLength(2)
      })
    })

    describe('statistics', () => {
      const mockEntries = [
        { action: 'CREATE', entityType: 'student', userId: 'user1', timestamp: '2025-01-15T10:00:00Z' },
        { action: 'CREATE', entityType: 'student', userId: 'user1', timestamp: '2025-01-15T11:00:00Z' },
        { action: 'UPDATE', entityType: 'absence', userId: 'user2', timestamp: '2025-01-16T10:00:00Z' }
      ]

      beforeEach(() => {
        localStorageMock.getItem.mockReturnValue(JSON.stringify(mockEntries))
      })

      it('calculates statistics', () => {
        const stats = logger.getStatistics()
        
        expect(stats.totalEntries).toBe(3)
        expect(stats.byAction.CREATE).toBe(2)
        expect(stats.byAction.UPDATE).toBe(1)
        expect(stats.byEntityType.student).toBe(2)
        expect(stats.byEntityType.absence).toBe(1)
        expect(stats.byUser.user1).toBe(2)
        expect(stats.byUser.user2).toBe(1)
        expect(stats.byDate['2025-01-15']).toBe(2)
        expect(stats.byDate['2025-01-16']).toBe(1)
      })
    })

    describe('cleanup methods', () => {
      it('clears old entries', () => {
        const oldDate = new Date()
        oldDate.setDate(oldDate.getDate() - 400) // 400 days ago
        
        const mockEntries = [
          { timestamp: oldDate.toISOString() },
          { timestamp: new Date().toISOString() }
        ]
        
        localStorageMock.getItem.mockReturnValue(JSON.stringify(mockEntries))
        
        const removed = logger.clearOldEntries(365)
        expect(removed).toBe(1)
        
        const savedData = JSON.parse(localStorageMock.setItem.mock.calls[0][1])
        expect(savedData).toHaveLength(1)
      })

      it('clears all entries', () => {
        const result = logger.clearAllEntries()
        expect(result).toBe(true)
        expect(localStorageMock.removeItem).toHaveBeenCalledWith('ofppt_audit_log')
      })
    })

    describe('export methods', () => {
      const mockEntries = [
        { id: '1', action: 'CREATE', entityType: 'student', timestamp: '2025-01-15T10:00:00Z', details: { test: 'data' } }
      ]

      beforeEach(() => {
        localStorageMock.getItem.mockReturnValue(JSON.stringify(mockEntries))
      })

      it('exports as JSON', () => {
        const exported = logger.exportAuditLog('json')
        const parsed = JSON.parse(exported)
        expect(parsed).toEqual(mockEntries)
      })

      it('exports as CSV', () => {
        const exported = logger.exportAuditLog('csv')
        expect(exported).toContain('ID,Timestamp,Action,Entity Type')
        expect(exported).toContain('1,2025-01-15T10:00:00Z,CREATE,student')
      })

      it('throws error for unsupported format', () => {
        expect(() => {
          logger.exportAuditLog('xml')
        }).toThrow('Unsupported export format: xml')
      })
    })

    describe('helper methods', () => {
      it('calculates changes between objects', () => {
        const oldData = { name: 'Old', email: 'old@test.com', unchanged: 'same' }
        const newData = { name: 'New', email: 'new@test.com', unchanged: 'same' }
        
        const changes = logger.getChanges(oldData, newData)
        
        expect(changes.name.from).toBe('Old')
        expect(changes.name.to).toBe('New')
        expect(changes.email.from).toBe('old@test.com')
        expect(changes.email.to).toBe('new@test.com')
        expect(changes.unchanged).toBeUndefined()
      })

      it('sanitizes sensitive data', () => {
        const data = { name: 'Test', password: 'secret', hashedPassword: 'hash' }
        const sanitized = logger.sanitizeData(data)
        
        expect(sanitized.name).toBe('Test')
        expect(sanitized.password).toBeUndefined()
        expect(sanitized.hashedPassword).toBeUndefined()
      })
    })
  })

  describe('convenience functions', () => {
    beforeEach(() => {
      localStorageMock.getItem.mockReturnValue('[]')
    })

    it('logs student creation using convenience function', () => {
      const student = { id: 1, cef: 'CEF001', nom: 'Test', email: 'test@ofppt.ma', groupeId: 1 }
      const entry = logStudentCreate(student, 'user123')
      
      expect(entry.action).toBe('CREATE')
      expect(entry.entityType).toBe('student')
    })

    it('logs student update using convenience function', () => {
      const entry = logStudentUpdate(1, { nom: 'Old' }, { nom: 'New' }, 'user123')
      
      expect(entry.action).toBe('UPDATE')
      expect(entry.entityType).toBe('student')
    })

    it('logs student deletion using convenience function', () => {
      const student = { id: 1, cef: 'CEF001' }
      const entry = logStudentDelete(student, 'user123')
      
      expect(entry.action).toBe('DELETE')
      expect(entry.entityType).toBe('student')
    })

    it('logs absence rollback using convenience function', () => {
      const absence = { id: 1, stagiaireId: 1, date: '2025-01-15' }
      const entry = logAbsenceRollback(absence, 'user123')
      
      expect(entry.action).toBe('ROLLBACK')
      expect(entry.entityType).toBe('absence')
    })
  })
})