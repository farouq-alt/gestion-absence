import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import RollbackManager from './RollbackManager'

describe('RollbackManager', () => {
  const mockAbsences = [
    {
      id: 1,
      stagiaireId: 1,
      date: new Date().toISOString().split('T')[0], // Today
      duree: 2.5,
      etat: 'NJ',
      recordedBy: 'teacher1',
      recordedAt: new Date(Date.now() - 10 * 60 * 1000).toISOString() // 10 minutes ago
    },
    {
      id: 2,
      stagiaireId: 2,
      date: new Date().toISOString().split('T')[0], // Today
      duree: 5,
      etat: 'J',
      recordedBy: 'teacher1',
      recordedAt: new Date(Date.now() - 45 * 60 * 1000).toISOString() // 45 minutes ago (expired)
    },
    {
      id: 3,
      stagiaireId: 3,
      date: new Date().toISOString().split('T')[0], // Today
      duree: 3.5,
      etat: 'NJ',
      recordedBy: 'teacher2', // Different teacher
      recordedAt: new Date(Date.now() - 5 * 60 * 1000).toISOString() // 5 minutes ago
    }
  ]

  const mockOnRollback = jest.fn()

  beforeEach(() => {
    jest.clearAllMocks()
    global.alert = jest.fn()
  })

  afterEach(() => {
    jest.restoreAllMocks()
  })

  it('renders rollback manager with header and info', () => {
    render(
      <RollbackManager 
        absences={[]} 
        onRollback={mockOnRollback} 
        currentUser="teacher1" 
      />
    )

    expect(screen.getByText('Annuler des Absences')).toBeInTheDocument()
    expect(screen.getByText(/Vous pouvez annuler les absences/)).toBeInTheDocument()
  })

  it('shows empty state when no rollbackable absences', () => {
    render(
      <RollbackManager 
        absences={[]} 
        onRollback={mockOnRollback} 
        currentUser="teacher1" 
      />
    )

    expect(screen.getByText('Aucune absence à annuler')).toBeInTheDocument()
    expect(screen.getByText(/Les absences peuvent être annulées/)).toBeInTheDocument()
  })

  it('shows rollbackable absences for current user', () => {
    render(
      <RollbackManager 
        absences={mockAbsences} 
        onRollback={mockOnRollback} 
        currentUser="teacher1" 
      />
    )

    // Should show the recent absence (10 minutes ago) but not the expired one (45 minutes ago)
    expect(screen.getByText('1 absence(s) annulable(s)')).toBeInTheDocument()
    expect(screen.getByText('CEF001')).toBeInTheDocument()
    expect(screen.getByText('ALAMI Mohammed')).toBeInTheDocument()
  })

  it('does not show absences from other teachers', () => {
    render(
      <RollbackManager 
        absences={mockAbsences} 
        onRollback={mockOnRollback} 
        currentUser="teacher2" 
      />
    )

    // Should show only teacher2's absence
    expect(screen.getByText('1 absence(s) annulable(s)')).toBeInTheDocument()
    expect(screen.getByText('CEF003')).toBeInTheDocument()
    expect(screen.getByText('CHAKIR Ahmed')).toBeInTheDocument()
  })

  it('shows confirmation dialog when rollback is requested', async () => {
    render(
      <RollbackManager 
        absences={mockAbsences} 
        onRollback={mockOnRollback} 
        currentUser="teacher1" 
      />
    )

    // Click rollback button
    const rollbackButton = screen.getByText('Annuler')
    fireEvent.click(rollbackButton)

    // Should show confirmation dialog
    await waitFor(() => {
      expect(screen.getByRole('heading', { name: 'Confirmer l\'annulation' })).toBeInTheDocument()
    })

    expect(screen.getByText('Êtes-vous sûr de vouloir annuler cette absence ?')).toBeInTheDocument()
    expect(screen.getByText('ALAMI Mohammed (CEF001)')).toBeInTheDocument()
  })

  it('calls onRollback when confirmed', async () => {
    render(
      <RollbackManager 
        absences={mockAbsences} 
        onRollback={mockOnRollback} 
        currentUser="teacher1" 
      />
    )

    // Click rollback button
    const rollbackButton = screen.getByText('Annuler')
    fireEvent.click(rollbackButton)

    // Wait for dialog and confirm
    await waitFor(() => {
      expect(screen.getByRole('heading', { name: 'Confirmer l\'annulation' })).toBeInTheDocument()
    })

    const confirmButton = screen.getByRole('button', { name: 'Confirmer l\'annulation' })
    fireEvent.click(confirmButton)

    // Should call onRollback with absence id
    expect(mockOnRollback).toHaveBeenCalledWith(1)
  })

  it('cancels rollback when cancel is clicked', async () => {
    render(
      <RollbackManager 
        absences={mockAbsences} 
        onRollback={mockOnRollback} 
        currentUser="teacher1" 
      />
    )

    // Click rollback button
    const rollbackButton = screen.getByText('Annuler')
    fireEvent.click(rollbackButton)

    // Wait for dialog and cancel
    await waitFor(() => {
      expect(screen.getByRole('heading', { name: 'Confirmer l\'annulation' })).toBeInTheDocument()
    })

    const cancelButtons = screen.getAllByText('Annuler')
    const modalCancelButton = cancelButtons.find(button => 
      button.className.includes('btn-secondary')
    )
    fireEvent.click(modalCancelButton)

    // Should not call onRollback
    expect(mockOnRollback).not.toHaveBeenCalled()
    
    // Dialog should be closed
    await waitFor(() => {
      expect(screen.queryByRole('heading', { name: 'Confirmer l\'annulation' })).not.toBeInTheDocument()
    })
  })

  it('formats duration correctly', () => {
    render(
      <RollbackManager 
        absences={mockAbsences} 
        onRollback={mockOnRollback} 
        currentUser="teacher1" 
      />
    )

    // Should show formatted duration
    expect(screen.getByText('2h30 (1 séance)')).toBeInTheDocument()
  })

  it('shows remaining time for rollback', () => {
    render(
      <RollbackManager 
        absences={mockAbsences} 
        onRollback={mockOnRollback} 
        currentUser="teacher1" 
      />
    )

    // Should show remaining time (approximately 20 minutes for 10-minute-old absence)
    const remainingTimeElements = screen.getAllByText(/\d+ min/)
    expect(remainingTimeElements.length).toBeGreaterThan(0)
  })
})