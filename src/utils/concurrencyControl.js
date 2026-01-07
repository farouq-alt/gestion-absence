// Concurrent modification conflict detection and resolution

// Concurrency conflict error class
export class ConcurrencyConflictError extends Error {
  constructor(entity, conflicts) {
    super(`Concurrent modification detected for ${entity}`)
    this.name = 'ConcurrencyConflictError'
    this.entity = entity
    this.conflicts = conflicts
  }
}

// Version tracking for entities
export class EntityVersion {
  constructor(entityType, entityId, version = 1, lastModified = new Date(), lastModifiedBy = null) {
    this.entityType = entityType
    this.entityId = entityId
    this.version = version
    this.lastModified = lastModified instanceof Date ? lastModified : new Date(lastModified)
    this.lastModifiedBy = lastModifiedBy
  }

  increment(userId) {
    this.version += 1
    this.lastModified = new Date()
    this.lastModifiedBy = userId
    return this
  }

  isNewerThan(otherVersion) {
    return this.version > otherVersion.version || 
           (this.version === otherVersion.version && this.lastModified > otherVersion.lastModified)
  }
}

// Concurrency control manager
export class ConcurrencyManager {
  constructor() {
    this.storageKey = 'ofppt_entity_versions'
    this.lockStorageKey = 'ofppt_entity_locks'
    this.lockTimeout = 5 * 60 * 1000 // 5 minutes in milliseconds
  }

  // Get all entity versions
  getEntityVersions() {
    try {
      const versions = localStorage.getItem(this.storageKey)
      const parsed = versions ? JSON.parse(versions) : {}
      
      // Convert to EntityVersion objects
      const result = {}
      for (const [key, data] of Object.entries(parsed)) {
        result[key] = new EntityVersion(
          data.entityType,
          data.entityId,
          data.version,
          data.lastModified,
          data.lastModifiedBy
        )
      }
      
      return result
    } catch (error) {
      console.error('Error reading entity versions:', error)
      return {}
    }
  }

  // Save entity versions
  saveEntityVersions(versions) {
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(versions))
    } catch (error) {
      console.error('Error saving entity versions:', error)
    }
  }

  // Get version key for entity
  getVersionKey(entityType, entityId) {
    return `${entityType}_${entityId}`
  }

  // Get current version for entity
  getCurrentVersion(entityType, entityId) {
    const versions = this.getEntityVersions()
    const key = this.getVersionKey(entityType, entityId)
    return versions[key] || new EntityVersion(entityType, entityId)
  }

  // Update version for entity
  updateVersion(entityType, entityId, userId) {
    const versions = this.getEntityVersions()
    const key = this.getVersionKey(entityType, entityId)
    
    if (versions[key]) {
      versions[key].increment(userId)
    } else {
      versions[key] = new EntityVersion(entityType, entityId, 1, new Date(), userId)
    }
    
    this.saveEntityVersions(versions)
    return versions[key]
  }

  // Check for concurrent modifications
  checkConcurrentModification(entityType, entityId, expectedVersion, currentData) {
    const currentVersion = this.getCurrentVersion(entityType, entityId)
    const conflicts = []

    // Version mismatch check
    if (expectedVersion && currentVersion.version !== expectedVersion.version) {
      conflicts.push({
        type: 'VERSION_MISMATCH',
        field: 'version',
        expected: expectedVersion.version,
        current: currentVersion.version,
        message: `Version attendue: ${expectedVersion.version}, version actuelle: ${currentVersion.version}`
      })
    }

    // Timestamp check (if modification happened within last few seconds by different user)
    if (expectedVersion && currentVersion.lastModifiedBy !== expectedVersion.lastModifiedBy) {
      const timeDiff = currentVersion.lastModified.getTime() - expectedVersion.lastModified.getTime()
      if (timeDiff > 0 && timeDiff < 30000) { // 30 seconds
        conflicts.push({
          type: 'RECENT_MODIFICATION',
          field: 'lastModified',
          expected: expectedVersion.lastModified,
          current: currentVersion.lastModified,
          expectedUser: expectedVersion.lastModifiedBy,
          currentUser: currentVersion.lastModifiedBy,
          message: `Modifié récemment par ${currentVersion.lastModifiedBy} à ${currentVersion.lastModified.toLocaleString()}`
        })
      }
    }

    return {
      hasConflicts: conflicts.length > 0,
      conflicts,
      currentVersion,
      canProceed: conflicts.length === 0 || conflicts.every(c => c.type !== 'VERSION_MISMATCH')
    }
  }

  // Entity locking system
  getLocks() {
    try {
      const locks = localStorage.getItem(this.lockStorageKey)
      return locks ? JSON.parse(locks) : {}
    } catch (error) {
      console.error('Error reading entity locks:', error)
      return {}
    }
  }

  saveLocks(locks) {
    try {
      localStorage.setItem(this.lockStorageKey, JSON.stringify(locks))
    } catch (error) {
      console.error('Error saving entity locks:', error)
    }
  }

  // Acquire lock on entity
  acquireLock(entityType, entityId, userId) {
    const locks = this.getLocks()
    const key = this.getVersionKey(entityType, entityId)
    const now = new Date()

    // Check if already locked
    if (locks[key]) {
      const lockTime = new Date(locks[key].timestamp)
      const isExpired = (now.getTime() - lockTime.getTime()) > this.lockTimeout
      
      if (!isExpired && locks[key].userId !== userId) {
        return {
          success: false,
          message: `Entité verrouillée par ${locks[key].userId} depuis ${lockTime.toLocaleString()}`,
          lockedBy: locks[key].userId,
          lockedAt: lockTime
        }
      }
    }

    // Acquire or renew lock
    locks[key] = {
      entityType,
      entityId,
      userId,
      timestamp: now.toISOString()
    }

    this.saveLocks(locks)
    
    return {
      success: true,
      message: 'Verrou acquis avec succès',
      expiresAt: new Date(now.getTime() + this.lockTimeout)
    }
  }

  // Release lock on entity
  releaseLock(entityType, entityId, userId) {
    const locks = this.getLocks()
    const key = this.getVersionKey(entityType, entityId)

    if (locks[key] && locks[key].userId === userId) {
      delete locks[key]
      this.saveLocks(locks)
      return { success: true, message: 'Verrou libéré' }
    }

    return { success: false, message: 'Aucun verrou à libérer ou verrou appartient à un autre utilisateur' }
  }

  // Check if entity is locked
  isLocked(entityType, entityId, userId = null) {
    const locks = this.getLocks()
    const key = this.getVersionKey(entityType, entityId)
    const now = new Date()

    if (!locks[key]) {
      return { locked: false }
    }

    const lockTime = new Date(locks[key].timestamp)
    const isExpired = (now.getTime() - lockTime.getTime()) > this.lockTimeout

    if (isExpired) {
      // Clean up expired lock
      delete locks[key]
      this.saveLocks(locks)
      return { locked: false }
    }

    return {
      locked: true,
      lockedBy: locks[key].userId,
      lockedAt: lockTime,
      isOwnLock: userId ? locks[key].userId === userId : false,
      expiresAt: new Date(lockTime.getTime() + this.lockTimeout)
    }
  }

  // Clean up expired locks
  cleanupExpiredLocks() {
    const locks = this.getLocks()
    const now = new Date()
    let cleaned = 0

    for (const [key, lock] of Object.entries(locks)) {
      const lockTime = new Date(lock.timestamp)
      const isExpired = (now.getTime() - lockTime.getTime()) > this.lockTimeout

      if (isExpired) {
        delete locks[key]
        cleaned++
      }
    }

    if (cleaned > 0) {
      this.saveLocks(locks)
    }

    return cleaned
  }

  // Optimistic locking workflow
  async optimisticUpdate(entityType, entityId, updateFn, userId, retryCount = 3) {
    for (let attempt = 1; attempt <= retryCount; attempt++) {
      try {
        // Get current version
        const currentVersion = this.getCurrentVersion(entityType, entityId)
        
        // Perform update
        const result = updateFn(currentVersion)
        
        // Check for conflicts before committing
        const conflictCheck = this.checkConcurrentModification(
          entityType, 
          entityId, 
          currentVersion, 
          result
        )

        if (conflictCheck.hasConflicts && !conflictCheck.canProceed) {
          if (attempt === retryCount) {
            throw new ConcurrencyConflictError(
              `${entityType}:${entityId}`, 
              conflictCheck.conflicts
            )
          }
          // Retry after short delay
          await new Promise(resolve => setTimeout(resolve, 100 * attempt))
          continue
        }

        // Update version and commit
        this.updateVersion(entityType, entityId, userId)
        return result

      } catch (error) {
        if (error instanceof ConcurrencyConflictError || attempt === retryCount) {
          throw error
        }
        // Retry on other errors
        await new Promise(resolve => setTimeout(resolve, 100 * attempt))
      }
    }
  }

  // Pessimistic locking workflow
  async pessimisticUpdate(entityType, entityId, updateFn, userId) {
    // Acquire lock
    const lockResult = this.acquireLock(entityType, entityId, userId)
    if (!lockResult.success) {
      throw new ConcurrencyConflictError(
        `${entityType}:${entityId}`, 
        [{ type: 'LOCKED', message: lockResult.message }]
      )
    }

    try {
      // Perform update
      const currentVersion = this.getCurrentVersion(entityType, entityId)
      const result = updateFn(currentVersion)
      
      // Update version
      this.updateVersion(entityType, entityId, userId)
      
      return result
    } finally {
      // Always release lock
      this.releaseLock(entityType, entityId, userId)
    }
  }

  // Conflict resolution strategies
  resolveConflict(conflictType, localData, remoteData, strategy = 'manual') {
    switch (strategy) {
      case 'local_wins':
        return {
          resolved: true,
          data: localData,
          message: 'Modifications locales conservées'
        }

      case 'remote_wins':
        return {
          resolved: true,
          data: remoteData,
          message: 'Modifications distantes acceptées'
        }

      case 'merge':
        // Simple merge strategy - combine non-conflicting fields
        const merged = { ...remoteData }
        for (const [key, value] of Object.entries(localData)) {
          if (remoteData[key] === undefined || remoteData[key] === localData[key]) {
            merged[key] = value
          }
        }
        return {
          resolved: true,
          data: merged,
          message: 'Modifications fusionnées automatiquement'
        }

      case 'manual':
      default:
        return {
          resolved: false,
          localData,
          remoteData,
          message: 'Résolution manuelle requise'
        }
    }
  }

  // Get conflict resolution options
  getConflictResolutionOptions(entityType, conflicts) {
    const options = [
      {
        strategy: 'local_wins',
        label: 'Conserver mes modifications',
        description: 'Ignorer les modifications externes et garder vos changements'
      },
      {
        strategy: 'remote_wins',
        label: 'Accepter les modifications externes',
        description: 'Abandonner vos modifications et accepter les changements externes'
      }
    ]

    // Add merge option for compatible entity types
    if (['student', 'group'].includes(entityType)) {
      options.push({
        strategy: 'merge',
        label: 'Fusionner automatiquement',
        description: 'Tenter de combiner les modifications non-conflictuelles'
      })
    }

    options.push({
      strategy: 'manual',
      label: 'Résolution manuelle',
      description: 'Examiner et résoudre chaque conflit individuellement'
    })

    return options
  }
}

// Create singleton instance
export const concurrencyManager = new ConcurrencyManager()

// Convenience functions
export const getCurrentVersion = (entityType, entityId) => 
  concurrencyManager.getCurrentVersion(entityType, entityId)

export const updateVersion = (entityType, entityId, userId) => 
  concurrencyManager.updateVersion(entityType, entityId, userId)

export const checkConcurrentModification = (entityType, entityId, expectedVersion, currentData) => 
  concurrencyManager.checkConcurrentModification(entityType, entityId, expectedVersion, currentData)

export const acquireLock = (entityType, entityId, userId) => 
  concurrencyManager.acquireLock(entityType, entityId, userId)

export const releaseLock = (entityType, entityId, userId) => 
  concurrencyManager.releaseLock(entityType, entityId, userId)

export const isLocked = (entityType, entityId, userId) => 
  concurrencyManager.isLocked(entityType, entityId, userId)

export const optimisticUpdate = (entityType, entityId, updateFn, userId, retryCount) => 
  concurrencyManager.optimisticUpdate(entityType, entityId, updateFn, userId, retryCount)

export const pessimisticUpdate = (entityType, entityId, updateFn, userId) => 
  concurrencyManager.pessimisticUpdate(entityType, entityId, updateFn, userId)