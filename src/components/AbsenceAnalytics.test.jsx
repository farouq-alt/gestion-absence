import { render, screen } from '@testing-library/react'
import AbsenceAnalytics from './AbsenceAnalytics'

describe('AbsenceAnalytics', () => {
  const mockAbsences = [
    {
      id: 1,
      stagiaireId: 1,
      date: '2025-01-15',
      duree: 2.5,
      etat: 'NJ',
      recordedBy: 'teacher1',
      recordedAt: '2025-01-15T10:30:00Z'
    },
    {
      id: 2,
      stagiaireId: 1,
      date: '2025-01-10',
      duree: 5,
      etat: 'J',
      recordedBy: 'teacher1',
      recordedAt: '2025-01-10T14:15:00Z'
    }
  ]

  it('renders analytics header and description', () => {
    render(<AbsenceAnalytics absences={mockAbsences} />)
    
    expect(screen.getByText('Analyse des Absences')).toBeInTheDocument()
    expect(screen.getByText(/Visualisez l'historique des absences/)).toBeInTheDocument()
  })

  it('renders student selection dropdown', () => {
    render(<AbsenceAnalytics absences={mockAbsences} />)
    
    expect(screen.getByLabelText('Stagiaire')).toBeInTheDocument()
    expect(screen.getByText('-- Sélectionner un stagiaire --')).toBeInTheDocument()
  })

  it('renders time range and chart type controls', () => {
    render(<AbsenceAnalytics absences={mockAbsences} />)
    
    expect(screen.getByLabelText('Période')).toBeInTheDocument()
    expect(screen.getByLabelText('Type de graphique')).toBeInTheDocument()
    expect(screen.getByText('6 derniers mois')).toBeInTheDocument()
    expect(screen.getByText('Courbe')).toBeInTheDocument()
  })

  it('renders checkbox controls for absence types', () => {
    render(<AbsenceAnalytics absences={mockAbsences} />)
    
    expect(screen.getByText('Absences justifiées')).toBeInTheDocument()
    expect(screen.getByText('Absences non justifiées')).toBeInTheDocument()
  })

  it('shows empty state when no student is selected', () => {
    render(<AbsenceAnalytics absences={mockAbsences} />)
    
    expect(screen.getByText('Sélectionnez un stagiaire')).toBeInTheDocument()
    expect(screen.getByText(/Choisissez un stagiaire dans la liste/)).toBeInTheDocument()
  })
})