import {
  EntityVersion,
  ConcurrencyManager,
  concurrencyManager,
  getCurrentVersion,
  updateVersion,
  checkConcurrentModification,
  acquireLock,
  releaseLock,
  ConcurrencyConflictError
} from './concurrencyControl.js'

// Mock localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn()
}
global.localStorage = localStorageMock

describe('Concurrency Control System', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    localStorageMock.getItem.mockReturnValue(null)
  })

  describe('EntityVersion', () => {
    it('creates version with default values', () => {
      const version = new EntityVersion('student', 1)
      
      expect(version.entityType).toBe('student')
      expect(version.entityId).toBe(1)
      expect(version.version).toBe(1)
      expect(version.lastModified).toBeInstanceOf(Date)
      expect(version.lastModifiedBy).toBeNull()
    })

    it('creates version with provided values', () => {
      const date = new Date('2025-01-15T10:00:00Z')
      const version = new EntityVersion('student', 1, 5, date, 'user123')
      
      expect(version.version).toBe(5)
      expect(version.lastModified).toEqual(date)
      expect(version.lastModifiedBy).toBe('user123')
    })

    it('increments version', () => {
      const version = new EntityVersion('student', 1, 1)
      const originalDate = version.lastModified
      
      // Wait a bit to ensure different timestamp
      setTimeout(() => {
        const updated = version.increment('user123')
        
        expect(updated.version).toBe(2)
        expect(updated.lastModifiedBy).toBe('user123')
        expect(updated.lastModified.getTime()).toBeGreaterThan(originalDate.getTime())
        expect(updated).toBe(version) // Should return same instance
      }, 1)
    })

    it('compares versions correctly', () => {
      const version1 = new EntityVersion('student', 1, 1, new Date('2025-01-15T10:00:00Z'))
      const version2 = new EntityVersion('student', 1, 2, new Date('2025-01-15T10:00:00Z'))
      const version3 = new EntityVersion('student', 1, 1, new Date('2025-01-15T11:00:00Z'))
      
      expect(version2.isNewerThan(version1)).toBe(true)
      expect(version1.isNewerThan(version2)).toBe(false)
      expect(version3.isNewerThan(version1)).toBe(true)
      expect(version1.isNewerThan(version3)).toBe(false)
    })
  })

  describe('ConcurrencyManager', () => {
    let manager

    beforeEach(() => {
      manager = new ConcurrencyManager()
    })

    describe('entity versions', () => {
      it('returns empty versions when none exist', () => {
        localStorageMock.getItem.mockReturnValue(null)
        const versions = manager.getEntityVersions()
        expect(versions).toEqual({})
      })

      it('loads and converts stored versions', () => {
        const storedData = {
          'student_1': {
            entityType: 'student',
            entityId: 1,
            version: 2,
            lastModified: '2025-01-15T10:00:00Z',
            lastModifiedBy: 'user123'
          }
        }
        localStorageMock.getItem.mockReturnValue(JSON.stringify(storedData))
        
        const versions = manager.getEntityVersions()
        expect(versions['student_1']).toBeInstanceOf(EntityVersion)
        expect(versions['student_1'].version).toBe(2)
        expect(versions['student_1'].lastModifiedBy).toBe('user123')
      })

      it('handles storage errors gracefully', () => {
        localStorageMock.getItem.mockImplementation(() => {
          throw new Error('Storage error')
        })
        
        const versions = manager.getEntityVersions()
        expect(versions).toEqual({})
      })

      it('saves versions to storage', () => {
        const versions = {
          'student_1': new EntityVersion('student', 1, 2, new Date(), 'user123')
        }
        
        manager.saveEntityVersions(versions)
        
        expect(localStorageMock.setItem).toHaveBeenCalledWith(
          'ofppt_entity_versions',
          expect.stringContaining('"version":2')
        )
      })
    })

    describe('version management', () => {
      it('gets current version for new entity', () => {
        localStorageMock.getItem.mockReturnValue('{}')
        
        const version = manager.getCurrentVersion('student', 1)
        expect(version).toBeInstanceOf(EntityVersion)
        expect(version.entityType).toBe('student')
        expect(version.entityId).toBe(1)
        expect(version.version).toBe(1)
      })

      it('gets current version for existing entity', () => {
        const existingVersions = {
          'student_1': new EntityVersion('student', 1, 3, new Date(), 'user123')
        }
        localStorageMock.getItem.mockReturnValue(JSON.stringify(existingVersions))
        
        const version = manager.getCurrentVersion('student', 1)
        expect(version.version).toBe(3)
        expect(version.lastModifiedBy).toBe('user123')
      })

      it('updates version for entity', () => {
        localStorageMock.getItem.mockReturnValue('{}')
        
        const version = manager.updateVersion('student', 1, 'user456')
        
        expect(version.version).toBe(1)
        expect(version.lastModifiedBy).toBe('user456')
        expect(localStorageMock.setItem).toHaveBeenCalled()
      })

      it('increments existing version', () => {
        const existingVersions = {
          'student_1': {
            entityType: 'student',
            entityId: 1,
            version: 2,
            lastModified: new Date().toISOString(),
            lastModifiedBy: 'user123'
          }
        }
        localStorageMock.getItem.mockReturnValue(JSON.stringify(existingVersions))
        
        const version = manager.updateVersion('student', 1, 'user456')
        
        expect(version.version).toBe(3)
        expect(version.lastModifiedBy).toBe('user456')
      })
    })

    describe('concurrent modification detection', () => {
      it('detects no conflicts when versions match', () => {
        const currentVersion = new EntityVersion('student', 1, 2, new Date(), 'user123')
        localStorageMock.getItem.mockReturnValue(JSON.stringify({
          'student_1': currentVersion
        }))
        
        const result = manager.checkConcurrentModification('student', 1, currentVersion, {})
        
        expect(result.hasConflicts).toBe(false)
        expect(result.canProceed).toBe(true)
        expect(result.conflicts).toHaveLength(0)
      })

      it('detects version mismatch', () => {
        const expectedVersion = new EntityVersion('student', 1, 2, new Date(), 'user123')
        const currentVersion = new EntityVersion('student', 1, 3, new Date(), 'user456')
        
        localStorageMock.getItem.mockReturnValue(JSON.stringify({
          'student_1': currentVersion
        }))
        
        const result = manager.checkConcurrentModification('student', 1, expectedVersion, {})
        
        expect(result.hasConflicts).toBe(true)
        expect(result.canProceed).toBe(false)
        expect(result.conflicts).toHaveLength(1)
        expect(result.conflicts[0].type).toBe('VERSION_MISMATCH')
      })

      it('detects recent modification by different user', () => {
        const now = new Date()
        const recentTime = new Date(now.getTime() - 10000) // 10 seconds ago
        
        const expectedVersion = new EntityVersion('student', 1, 2, recentTime, 'user123')
        const currentVersion = new EntityVersion('student', 1, 2, now, 'user456')
        
        localStorageMock.getItem.mockReturnValue(JSON.stringify({
          'student_1': currentVersion
        }))
        
        const result = manager.checkConcurrentModification('student', 1, expectedVersion, {})
        
        expect(result.hasConflicts).toBe(true)
        expect(result.canProceed).toBe(true) // Recent modification doesn't block
        expect(result.conflicts).toHaveLength(1)
        expect(result.conflicts[0].type).toBe('RECENT_MODIFICATION')
      })
    })

    describe('entity locking', () => {
      beforeEach(() => {
        localStorageMock.getItem.mockReturnValue('{}')
      })

      it('acquires lock successfully', () => {
        const result = manager.acquireLock('student', 1, 'user123')
        
        expect(result.success).toBe(true)
        expect(result.message).toBe('Verrou acquis avec succès')
        expect(result.expiresAt).toBeInstanceOf(Date)
        expect(localStorageMock.setItem).toHaveBeenCalled()
      })

      it('prevents acquiring lock when already locked by another user', () => {
        const existingLocks = {
          'student_1': {
            entityType: 'student',
            entityId: 1,
            userId: 'user456',
            timestamp: new Date().toISOString()
          }
        }
        localStorageMock.getItem.mockReturnValue(JSON.stringify(existingLocks))
        
        const result = manager.acquireLock('student', 1, 'user123')
        
        expect(result.success).toBe(false)
        expect(result.message).toContain('Entité verrouillée par user456')
        expect(result.lockedBy).toBe('user456')
      })

      it('allows renewing own lock', () => {
        const existingLocks = {
          'student_1': {
            entityType: 'student',
            entityId: 1,
            userId: 'user123',
            timestamp: new Date().toISOString()
          }
        }
        localStorageMock.getItem.mockReturnValue(JSON.stringify(existingLocks))
        
        const result = manager.acquireLock('student', 1, 'user123')
        
        expect(result.success).toBe(true)
      })

      it('acquires lock when existing lock is expired', () => {
        const expiredTime = new Date(Date.now() - 10 * 60 * 1000) // 10 minutes ago
        const existingLocks = {
          'student_1': {
            entityType: 'student',
            entityId: 1,
            userId: 'user456',
            timestamp: expiredTime.toISOString()
          }
        }
        localStorageMock.getItem.mockReturnValue(JSON.stringify(existingLocks))
        
        const result = manager.acquireLock('student', 1, 'user123')
        
        expect(result.success).toBe(true)
      })

      it('releases lock successfully', () => {
        const existingLocks = {
          'student_1': {
            entityType: 'student',
            entityId: 1,
            userId: 'user123',
            timestamp: new Date().toISOString()
          }
        }
        localStorageMock.getItem.mockReturnValue(JSON.stringify(existingLocks))
        
        const result = manager.releaseLock('student', 1, 'user123')
        
        expect(result.success).toBe(true)
        expect(result.message).toBe('Verrou libéré')
        expect(localStorageMock.setItem).toHaveBeenCalled()
      })

      it('fails to release lock owned by another user', () => {
        const existingLocks = {
          'student_1': {
            entityType: 'student',
            entityId: 1,
            userId: 'user456',
            timestamp: new Date().toISOString()
          }
        }
        localStorageMock.getItem.mockReturnValue(JSON.stringify(existingLocks))
        
        const result = manager.releaseLock('student', 1, 'user123')
        
        expect(result.success).toBe(false)
        expect(result.message).toContain('Aucun verrou à libérer')
      })

      it('checks if entity is locked', () => {
        const existingLocks = {
          'student_1': {
            entityType: 'student',
            entityId: 1,
            userId: 'user456',
            timestamp: new Date().toISOString()
          }
        }
        localStorageMock.getItem.mockReturnValue(JSON.stringify(existingLocks))
        
        const result = manager.isLocked('student', 1, 'user123')
        
        expect(result.locked).toBe(true)
        expect(result.lockedBy).toBe('user456')
        expect(result.isOwnLock).toBe(false)
        expect(result.expiresAt).toBeInstanceOf(Date)
      })

      it('returns not locked for non-existent lock', () => {
        const result = manager.isLocked('student', 1)
        
        expect(result.locked).toBe(false)
      })

      it('cleans up expired locks', () => {
        const expiredTime = new Date(Date.now() - 10 * 60 * 1000)
        const validTime = new Date()
        
        const existingLocks = {
          'student_1': {
            userId: 'user1',
            timestamp: expiredTime.toISOString()
          },
          'student_2': {
            userId: 'user2',
            timestamp: validTime.toISOString()
          }
        }
        localStorageMock.getItem.mockReturnValue(JSON.stringify(existingLocks))
        
        const cleaned = manager.cleanupExpiredLocks()
        
        expect(cleaned).toBe(1)
        expect(localStorageMock.setItem).toHaveBeenCalled()
      })
    })

    describe('optimistic locking workflow', () => {
      it('performs successful optimistic update', async () => {
        localStorageMock.getItem.mockReturnValue('{}')
        
        const updateFn = jest.fn().mockReturnValue({ success: true, data: 'updated' })
        
        const result = await manager.optimisticUpdate('student', 1, updateFn, 'user123')
        
        expect(result.success).toBe(true)
        expect(result.data).toBe('updated')
        expect(updateFn).toHaveBeenCalledTimes(1)
      })

      it('retries on conflict and eventually succeeds', async () => {
        let callCount = 0
        const updateFn = jest.fn().mockImplementation(() => {
          callCount++
          if (callCount === 1) {
            // Simulate conflict on first call
            throw new ConcurrencyConflictError('student:1', [])
          }
          return { success: true, data: 'updated' }
        })
        
        localStorageMock.getItem.mockReturnValue('{}')
        
        const result = await manager.optimisticUpdate('student', 1, updateFn, 'user123', 2)
        
        expect(result.success).toBe(true)
        expect(updateFn).toHaveBeenCalledTimes(2)
      })

      it('throws error after max retries', async () => {
        const updateFn = jest.fn().mockImplementation(() => {
          throw new ConcurrencyConflictError('student:1', [])
        })
        
        localStorageMock.getItem.mockReturnValue('{}')
        
        await expect(
          manager.optimisticUpdate('student', 1, updateFn, 'user123', 2)
        ).rejects.toThrow(ConcurrencyConflictError)
        
        expect(updateFn).toHaveBeenCalledTimes(2)
      })
    })

    describe('conflict resolution', () => {
      const localData = { name: 'Local Name', email: 'local@test.com' }
      const remoteData = { name: 'Remote Name', email: 'remote@test.com' }

      it('resolves with local wins strategy', () => {
        const result = manager.resolveConflict('VERSION_MISMATCH', localData, remoteData, 'local_wins')
        
        expect(result.resolved).toBe(true)
        expect(result.data).toEqual(localData)
        expect(result.message).toBe('Modifications locales conservées')
      })

      it('resolves with remote wins strategy', () => {
        const result = manager.resolveConflict('VERSION_MISMATCH', localData, remoteData, 'remote_wins')
        
        expect(result.resolved).toBe(true)
        expect(result.data).toEqual(remoteData)
        expect(result.message).toBe('Modifications distantes acceptées')
      })

      it('resolves with merge strategy', () => {
        const localPartial = { name: 'Local Name' }
        const remotePartial = { email: 'remote@test.com', other: 'value' }
        
        const result = manager.resolveConflict('VERSION_MISMATCH', localPartial, remotePartial, 'merge')
        
        expect(result.resolved).toBe(true)
        expect(result.data.name).toBe('Local Name')
        expect(result.data.email).toBe('remote@test.com')
        expect(result.data.other).toBe('value')
      })

      it('requires manual resolution by default', () => {
        const result = manager.resolveConflict('VERSION_MISMATCH', localData, remoteData, 'manual')
        
        expect(result.resolved).toBe(false)
        expect(result.localData).toEqual(localData)
        expect(result.remoteData).toEqual(remoteData)
        expect(result.message).toBe('Résolution manuelle requise')
      })

      it('gets conflict resolution options', () => {
        const options = manager.getConflictResolutionOptions('student', [])
        
        expect(options).toHaveLength(4)
        expect(options[0].strategy).toBe('local_wins')
        expect(options[1].strategy).toBe('remote_wins')
        expect(options[2].strategy).toBe('merge')
        expect(options[3].strategy).toBe('manual')
      })
    })
  })

  describe('convenience functions', () => {
    beforeEach(() => {
      localStorageMock.getItem.mockReturnValue('{}')
    })

    it('gets current version using convenience function', () => {
      const version = getCurrentVersion('student', 1)
      expect(version).toBeInstanceOf(EntityVersion)
    })

    it('updates version using convenience function', () => {
      const version = updateVersion('student', 1, 'user123')
      expect(version.lastModifiedBy).toBe('user123')
    })

    it('checks concurrent modification using convenience function', () => {
      const expectedVersion = new EntityVersion('student', 1, 1)
      const result = checkConcurrentModification('student', 1, expectedVersion, {})
      expect(result.hasConflicts).toBe(false)
    })

    it('acquires lock using convenience function', () => {
      const result = acquireLock('student', 1, 'user123')
      expect(result.success).toBe(true)
    })

    it('releases lock using convenience function', () => {
      // First acquire a lock
      acquireLock('student', 1, 'user123')
      
      const result = releaseLock('student', 1, 'user123')
      expect(result.success).toBe(true)
    })
  })

  describe('ConcurrencyConflictError', () => {
    it('creates error with entity and conflicts', () => {
      const conflicts = [{ type: 'VERSION_MISMATCH', message: 'Version conflict' }]
      const error = new ConcurrencyConflictError('student:1', conflicts)
      
      expect(error.name).toBe('ConcurrencyConflictError')
      expect(error.entity).toBe('student:1')
      expect(error.conflicts).toEqual(conflicts)
      expect(error.message).toBe('Concurrent modification detected for student:1')
    })
  })
})