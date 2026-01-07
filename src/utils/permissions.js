// Permission constants
export const PERMISSIONS = {
  // Student management permissions
  STUDENT_MANAGEMENT: 'student_management',
  GROUP_MANAGEMENT: 'group_management',
  EXCEL_IMPORT: 'excel_import',
  
  // Absence management permissions
  MARK_ABSENCES: 'mark_absences',
  ROLLBACK_ABSENCES: 'rollback_absences',
  
  // View permissions
  VIEW_ALL_GROUPS: 'view_all_groups',
  VIEW_ASSIGNED_GROUPS: 'view_assigned_groups',
  
  // System permissions
  SYSTEM_REPORTS: 'system_reports',
  USER_MANAGEMENT: 'user_management'
}

// Role-based permission mappings
export const ROLE_PERMISSIONS = {
  Administrateur: [
    PERMISSIONS.STUDENT_MANAGEMENT,
    PERMISSIONS.GROUP_MANAGEMENT,
    PERMISSIONS.EXCEL_IMPORT,
    PERMISSIONS.MARK_ABSENCES,
    PERMISSIONS.ROLLBACK_ABSENCES,
    PERMISSIONS.VIEW_ALL_GROUPS,
    PERMISSIONS.SYSTEM_REPORTS,
    PERMISSIONS.USER_MANAGEMENT
  ],
  Formateur: [
    PERMISSIONS.MARK_ABSENCES,
    PERMISSIONS.ROLLBACK_ABSENCES,
    PERMISSIONS.VIEW_ASSIGNED_GROUPS
  ]
}

// Permission checking functions
export const hasPermission = (userPermissions, requiredPermission) => {
  if (!userPermissions || !Array.isArray(userPermissions)) {
    return false
  }
  return userPermissions.includes(requiredPermission)
}

export const hasAnyPermission = (userPermissions, requiredPermissions) => {
  if (!userPermissions || !Array.isArray(userPermissions)) {
    return false
  }
  return requiredPermissions.some(permission => userPermissions.includes(permission))
}

export const hasAllPermissions = (userPermissions, requiredPermissions) => {
  if (!userPermissions || !Array.isArray(userPermissions)) {
    return false
  }
  return requiredPermissions.every(permission => userPermissions.includes(permission))
}

// Get permissions for a role
export const getPermissionsForRole = (role) => {
  return ROLE_PERMISSIONS[role] || []
}

// Check if user can access a feature
export const canAccessFeature = (userRole, userPermissions, feature) => {
  const featurePermissions = {
    'student-management': [PERMISSIONS.STUDENT_MANAGEMENT],
    'group-management': [PERMISSIONS.GROUP_MANAGEMENT],
    'excel-import': [PERMISSIONS.EXCEL_IMPORT],
    'mark-absences': [PERMISSIONS.MARK_ABSENCES],
    'consult-absences': [PERMISSIONS.VIEW_ALL_GROUPS, PERMISSIONS.VIEW_ASSIGNED_GROUPS],
    'rollback-absences': [PERMISSIONS.ROLLBACK_ABSENCES],
    'system-reports': [PERMISSIONS.SYSTEM_REPORTS],
    'user-management': [PERMISSIONS.USER_MANAGEMENT]
  }

  const requiredPermissions = featurePermissions[feature]
  if (!requiredPermissions) {
    return false
  }

  return hasAnyPermission(userPermissions, requiredPermissions)
}