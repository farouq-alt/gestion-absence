import { useState, useEffect } from 'react'

function LoadingSpinner({ 
  size = 'medium', 
  message = 'Chargement...', 
  overlay = false,
  showMessage = true,
  delay = 0 
}) {
  const [show, setShow] = useState(delay === 0)

  useEffect(() => {
    if (delay > 0) {
      const timer = setTimeout(() => setShow(true), delay)
      return () => clearTimeout(timer)
    }
  }, [delay])

  if (!show) return null

  const sizeClass = {
    small: 'loading-spinner-small',
    medium: 'loading-spinner-medium', 
    large: 'loading-spinner-large'
  }[size]

  const content = (
    <div className={`loading-spinner ${sizeClass}`}>
      <div className="spinner-circle"></div>
      {showMessage && <div className="loading-message">{message}</div>}
    </div>
  )

  if (overlay) {
    return (
      <div className="loading-overlay">
        {content}
      </div>
    )
  }

  return content
}

export default LoadingSpinner