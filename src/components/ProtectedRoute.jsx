import { useAuth } from '../contexts/AuthContext'
import { hasPermission, hasAnyPermission } from '../utils/permissions'

function ProtectedRoute({ 
  children, 
  requiredPermission, 
  requiredPermissions, 
  requireAll = false,
  fallback = null,
  showError = true 
}) {
  const { permissions, userRole } = useAuth()

  // Check single permission
  if (requiredPermission) {
    if (!hasPermission(permissions, requiredPermission)) {
      return fallback || (showError ? (
        <div className="permission-denied">
          <div className="permission-denied-icon">🔒</div>
          <h3>Accès refusé</h3>
          <p>Vous n'avez pas les permissions nécessaires pour accéder à cette fonctionnalité.</p>
          <p>Rôle requis: {requiredPermission}</p>
          <p>Votre rôle: {userRole}</p>
        </div>
      ) : null)
    }
  }

  // Check multiple permissions
  if (requiredPermissions && Array.isArray(requiredPermissions)) {
    const hasAccess = requireAll 
      ? requiredPermissions.every(perm => hasPermission(permissions, perm))
      : hasAnyPermission(permissions, requiredPermissions)

    if (!hasAccess) {
      return fallback || (showError ? (
        <div className="permission-denied">
          <div className="permission-denied-icon">🔒</div>
          <h3>Accès refusé</h3>
          <p>Vous n'avez pas les permissions nécessaires pour accéder à cette fonctionnalité.</p>
          <p>Permissions requises: {requiredPermissions.join(', ')}</p>
          <p>Votre rôle: {userRole}</p>
        </div>
      ) : null)
    }
  }

  return children
}

export default ProtectedRoute