import { render, screen, fireEvent } from '@testing-library/react'
import ExcelImporter from './ExcelImporter'

// Mock XLSX library
jest.mock('xlsx', () => ({
  read: jest.fn(),
  utils: {
    sheet_to_json: jest.fn(),
    json_to_sheet: jest.fn(),
    book_new: jest.fn(),
    book_append_sheet: jest.fn()
  },
  writeFile: jest.fn()
}))

describe('ExcelImporter', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('renders import tab by default', () => {
    render(<ExcelImporter />)
    
    expect(screen.getByText('Import/Export Excel')).toBeInTheDocument()
    expect(screen.getByText('Importer des stagiaires depuis Excel')).toBeInTheDocument()
    expect(screen.getByText('Format requis:')).toBeInTheDocument()
  })

  it('switches to export tab when clicked', () => {
    render(<ExcelImporter />)
    
    const exportTab = screen.getByText('Export')
    fireEvent.click(exportTab)
    
    expect(screen.getByText('Exporter les données')).toBeInTheDocument()
    expect(screen.getByText('Export des Stagiaires')).toBeInTheDocument()
    expect(screen.getByText('Export des Absences')).toBeInTheDocument()
  })

  it('shows file validation requirements', () => {
    render(<ExcelImporter />)
    
    expect(screen.getByText('Fichier Excel (.xlsx ou .xls)')).toBeInTheDocument()
    expect(screen.getByText('Taille maximale: 5MB')).toBeInTheDocument()
    expect(screen.getByText('Maximum 1000 lignes')).toBeInTheDocument()
    expect(screen.getByText('Colonnes requises: CEF, Nom, Email, Groupe')).toBeInTheDocument()
  })

  it('disables process button when no file is selected', () => {
    render(<ExcelImporter />)
    
    const processButton = screen.getByText('Valider et Prévisualiser')
    expect(processButton).toBeDisabled()
  })

  it('shows export options in export tab', () => {
    render(<ExcelImporter />)
    
    const exportTab = screen.getByText('Export')
    fireEvent.click(exportTab)
    
    expect(screen.getByText('Exporter Stagiaires')).toBeInTheDocument()
    expect(screen.getByText('Exporter Absences')).toBeInTheDocument()
  })
})