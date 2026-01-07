// Data validation utilities for CRUD operations

// Validation error class
export class ValidationError extends Error {
  constructor(field, message, value = null) {
    super(message)
    this.name = 'ValidationError'
    this.field = field
    this.value = value
  }
}

// Student validation rules
export const validateStudent = (student, existingStudents = []) => {
  const errors = []

  // CEF validation
  if (!student.cef) {
    errors.push(new ValidationError('cef', 'CEF est requis'))
  } else if (!/^[A-Z0-9]{6,12}$/i.test(student.cef)) {
    errors.push(new ValidationError('cef', 'CEF doit contenir 6-12 caractères alphanumériques', student.cef))
  } else {
    // Check uniqueness
    const duplicate = existingStudents.find(s => 
      s.cef.toLowerCase() === student.cef.toLowerCase() && s.id !== student.id
    )
    if (duplicate) {
      errors.push(new ValidationError('cef', 'CEF doit être unique', student.cef))
    }
  }

  // Name validation
  if (!student.nom) {
    errors.push(new ValidationError('nom', 'Nom est requis'))
  } else if (student.nom.length < 2 || student.nom.length > 50) {
    errors.push(new ValidationError('nom', 'Nom doit contenir 2-50 caractères', student.nom))
  } else if (!/^[a-zA-ZÀ-ÿ\s'-]+$/u.test(student.nom)) {
    errors.push(new ValidationError('nom', 'Nom ne peut contenir que des lettres, espaces, apostrophes et tirets', student.nom))
  }

  // Email validation
  if (!student.email) {
    errors.push(new ValidationError('email', 'Email est requis'))
  } else {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(student.email)) {
      errors.push(new ValidationError('email', 'Format email invalide', student.email))
    } else {
      // Check uniqueness
      const duplicate = existingStudents.find(s => 
        s.email.toLowerCase() === student.email.toLowerCase() && s.id !== student.id
      )
      if (duplicate) {
        errors.push(new ValidationError('email', 'Email doit être unique', student.email))
      }
    }
  }

  // Group validation
  if (!student.groupeId) {
    errors.push(new ValidationError('groupeId', 'Groupe est requis'))
  }

  // Discipline score validation
  if (student.noteDiscipline !== undefined && student.noteDiscipline !== null) {
    const score = parseFloat(student.noteDiscipline)
    if (isNaN(score) || score < 0 || score > 20) {
      errors.push(new ValidationError('noteDiscipline', 'Note discipline doit être entre 0 et 20', student.noteDiscipline))
    }
  }

  return errors
}

// Group validation rules
export const validateGroup = (group, existingGroups = [], existingStudents = []) => {
  const errors = []

  // Name validation
  if (!group.nom) {
    errors.push(new ValidationError('nom', 'Nom du groupe est requis'))
  } else if (group.nom.length < 2 || group.nom.length > 20) {
    errors.push(new ValidationError('nom', 'Nom du groupe doit contenir 2-20 caractères', group.nom))
  } else {
    // Check uniqueness within the same filiere
    const duplicate = existingGroups.find(g => 
      g.nom.toLowerCase() === group.nom.toLowerCase() && 
      g.filiereId === group.filiereId && 
      g.id !== group.id
    )
    if (duplicate) {
      errors.push(new ValidationError('nom', 'Nom du groupe doit être unique dans la filière', group.nom))
    }
  }

  // Filiere validation
  if (!group.filiereId) {
    errors.push(new ValidationError('filiereId', 'Filière est requise'))
  }

  // Check if group has students when trying to delete
  if (group._isDeleting) {
    const studentsInGroup = existingStudents.filter(s => s.groupeId === group.id)
    if (studentsInGroup.length > 0) {
      errors.push(new ValidationError('students', `Impossible de supprimer le groupe: ${studentsInGroup.length} étudiant(s) assigné(s)`, studentsInGroup.length))
    }
  }

  return errors
}

// Absence validation rules
export const validateAbsence = (absence, existingAbsences = []) => {
  const errors = []

  // Student validation
  if (!absence.stagiaireId) {
    errors.push(new ValidationError('stagiaireId', 'Stagiaire est requis'))
  }

  // Date validation
  if (!absence.date) {
    errors.push(new ValidationError('date', 'Date est requise'))
  } else {
    const absenceDate = new Date(absence.date)
    const today = new Date()
    const currentYear = today.getFullYear()
    const academicYearStart = new Date(currentYear, 8, 1) // September 1st
    const academicYearEnd = new Date(currentYear + 1, 6, 31) // July 31st next year
    
    // Adjust for academic year (if current date is before September, use previous academic year)
    if (today.getMonth() < 8) {
      academicYearStart.setFullYear(currentYear - 1)
      academicYearEnd.setFullYear(currentYear)
    }

    if (absenceDate > today) {
      errors.push(new ValidationError('date', 'Date ne peut pas être dans le futur', absence.date))
    } else if (absenceDate < academicYearStart || absenceDate > academicYearEnd) {
      errors.push(new ValidationError('date', 'Date doit être dans l\'année académique courante', absence.date))
    }
  }

  // Duration validation
  if (absence.duree === undefined || absence.duree === null) {
    errors.push(new ValidationError('duree', 'Durée est requise'))
  } else {
    const duration = parseFloat(absence.duree)
    if (isNaN(duration) || duration < 0.5 || duration > 8) {
      errors.push(new ValidationError('duree', 'Durée doit être entre 0.5 et 8 heures', absence.duree))
    }
  }

  // State validation
  if (!absence.etat || !['J', 'NJ'].includes(absence.etat)) {
    errors.push(new ValidationError('etat', 'État doit être J (Justifiée) ou NJ (Non justifiée)', absence.etat))
  }

  // Check for duplicate absence on same date
  if (absence.stagiaireId && absence.date) {
    const duplicate = existingAbsences.find(a => 
      a.stagiaireId === absence.stagiaireId && 
      a.date === absence.date && 
      a.id !== absence.id
    )
    if (duplicate) {
      errors.push(new ValidationError('duplicate', 'Absence déjà enregistrée pour ce stagiaire à cette date'))
    }
  }

  return errors
}

// Excel import validation
export const validateExcelData = (data, existingStudents = []) => {
  const errors = []
  const processedCEFs = new Set()
  const processedEmails = new Set()

  if (!Array.isArray(data) || data.length === 0) {
    errors.push(new ValidationError('data', 'Aucune donnée à importer'))
    return errors
  }

  if (data.length > 1000) {
    errors.push(new ValidationError('data', 'Maximum 1000 lignes par import', data.length))
    return errors
  }

  data.forEach((row, index) => {
    const rowNumber = index + 2 // Excel row number (header is row 1)
    
    // Required columns check
    const requiredFields = ['CEF', 'Nom', 'Email', 'Groupe']
    requiredFields.forEach(field => {
      if (!row[field] || String(row[field]).trim() === '') {
        errors.push(new ValidationError(`row_${rowNumber}_${field}`, `Ligne ${rowNumber}: ${field} est requis`))
      }
    })

    if (row.CEF) {
      const cef = String(row.CEF).trim().toUpperCase()
      
      // Check format
      if (!/^[A-Z0-9]{6,12}$/i.test(cef)) {
        errors.push(new ValidationError(`row_${rowNumber}_CEF`, `Ligne ${rowNumber}: CEF format invalide (6-12 caractères alphanumériques)`, cef))
      }
      
      // Check duplicates within file
      if (processedCEFs.has(cef)) {
        errors.push(new ValidationError(`row_${rowNumber}_CEF`, `Ligne ${rowNumber}: CEF en double dans le fichier`, cef))
      } else {
        processedCEFs.add(cef)
      }
      
      // Check against existing students
      const existingStudent = existingStudents.find(s => s.cef.toLowerCase() === cef.toLowerCase())
      if (existingStudent) {
        errors.push(new ValidationError(`row_${rowNumber}_CEF`, `Ligne ${rowNumber}: CEF existe déjà dans le système`, cef))
      }
    }

    if (row.Email) {
      const email = String(row.Email).trim().toLowerCase()
      
      // Check format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!emailRegex.test(email)) {
        errors.push(new ValidationError(`row_${rowNumber}_Email`, `Ligne ${rowNumber}: Format email invalide`, email))
      }
      
      // Check duplicates within file
      if (processedEmails.has(email)) {
        errors.push(new ValidationError(`row_${rowNumber}_Email`, `Ligne ${rowNumber}: Email en double dans le fichier`, email))
      } else {
        processedEmails.add(email)
      }
      
      // Check against existing students
      const existingStudent = existingStudents.find(s => s.email.toLowerCase() === email)
      if (existingStudent) {
        errors.push(new ValidationError(`row_${rowNumber}_Email`, `Ligne ${rowNumber}: Email existe déjà dans le système`, email))
      }
    }

    if (row.Nom) {
      const nom = String(row.Nom).trim()
      if (nom.length < 2 || nom.length > 50) {
        errors.push(new ValidationError(`row_${rowNumber}_Nom`, `Ligne ${rowNumber}: Nom doit contenir 2-50 caractères`, nom))
      } else if (!/^[a-zA-ZÀ-ÿ\s'-]+$/u.test(nom)) {
        errors.push(new ValidationError(`row_${rowNumber}_Nom`, `Ligne ${rowNumber}: Nom contient des caractères invalides`, nom))
      }
    }
  })

  return errors
}

// File validation
export const validateFile = (file) => {
  const errors = []

  if (!file) {
    errors.push(new ValidationError('file', 'Fichier requis'))
    return errors
  }

  // File size validation (5MB max)
  const maxSize = 5 * 1024 * 1024 // 5MB in bytes
  if (file.size > maxSize) {
    errors.push(new ValidationError('file', 'Taille de fichier maximum: 5MB', `${(file.size / 1024 / 1024).toFixed(2)}MB`))
  }

  // File type validation
  const allowedTypes = [
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
    'application/vnd.ms-excel' // .xls
  ]
  
  if (!allowedTypes.includes(file.type)) {
    errors.push(new ValidationError('file', 'Format de fichier non supporté. Utilisez .xlsx ou .xls', file.type))
  }

  return errors
}

// Generic validation helper
export const validateRequired = (value, fieldName) => {
  if (value === null || value === undefined || String(value).trim() === '') {
    return new ValidationError(fieldName, `${fieldName} est requis`)
  }
  return null
}

// Validation result helper
export const createValidationResult = (errors = []) => {
  return {
    isValid: errors.length === 0,
    errors,
    getErrorsByField: (field) => errors.filter(e => e.field === field),
    getFirstError: (field) => errors.find(e => e.field === field),
    getAllMessages: () => errors.map(e => e.message)
  }
}