import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import ExcelImporter from './ExcelImporter'
import * as XLSX from 'xlsx'

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

// Mock File API
global.File = class MockFile {
  constructor(parts, filename, properties = {}) {
    this.parts = parts
    this.name = filename
    this.size = properties.size || 1024
    this.type = properties.type || 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  }

  arrayBuffer() {
    return Promise.resolve(new ArrayBuffer(8))
  }
}

describe('ExcelImporter Integration', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    // Mock alert
    global.alert = jest.fn()
  })

  afterEach(() => {
    jest.restoreAllMocks()
  })

  it('processes valid Excel file successfully', async () => {
    // Mock XLSX functions
    XLSX.read.mockReturnValue({
      SheetNames: ['Sheet1'],
      Sheets: {
        Sheet1: {}
      }
    })

    XLSX.utils.sheet_to_json.mockReturnValue([
      ['CEF', 'Nom', 'Email', 'Groupe'],
      ['CEF011', 'NOUVEAU Stagiaire', 'nouveau@ofppt.ma', 'DEV101'],
      ['CEF012', 'AUTRE Stagiaire', 'autre@ofppt.ma', 'DEV102']
    ])

    render(<ExcelImporter />)

    // Create a mock file
    const file = new File(['mock content'], 'students.xlsx', {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      size: 1024
    })

    // Get file input and simulate file selection
    const fileInput = document.querySelector('input[type="file"]')
    Object.defineProperty(fileInput, 'files', {
      value: [file],
      writable: false
    })

    fireEvent.change(fileInput)

    // Click process button
    const processButton = screen.getByText('Valider et Prévisualiser')
    fireEvent.click(processButton)

    // Wait for processing to complete
    await waitFor(() => {
      expect(screen.getByText('Résultats de la validation')).toBeInTheDocument()
    }, { timeout: 3000 })

    // Verify validation results are displayed
    expect(screen.getByText('Stagiaires valides')).toBeInTheDocument()
    expect(screen.getByText('Résultats de la validation')).toBeInTheDocument()
  })

  it('handles invalid file format', async () => {
    render(<ExcelImporter />)

    // Create a mock file with invalid type
    const file = new File(['mock content'], 'document.txt', {
      type: 'text/plain',
      size: 1024
    })

    // Get file input and simulate file selection
    const fileInput = document.querySelector('input[type="file"]')
    Object.defineProperty(fileInput, 'files', {
      value: [file],
      writable: false
    })

    fireEvent.change(fileInput)

    // Verify alert was called with error message
    expect(global.alert).toHaveBeenCalledWith(
      'Format de fichier non supporté. Veuillez sélectionner un fichier Excel (.xlsx ou .xls)'
    )
  })

  it('handles file size limit', async () => {
    render(<ExcelImporter />)

    // Create a mock file that's too large (6MB)
    const file = new File(['mock content'], 'large.xlsx', {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      size: 6 * 1024 * 1024
    })

    // Get file input and simulate file selection
    const fileInput = document.querySelector('input[type="file"]')
    Object.defineProperty(fileInput, 'files', {
      value: [file],
      writable: false
    })

    fireEvent.change(fileInput)

    // Verify alert was called with size error message
    expect(global.alert).toHaveBeenCalledWith(
      'Le fichier est trop volumineux. Taille maximale autorisée: 5MB'
    )
  })

  it('exports student data successfully', async () => {
    // Mock XLSX functions for export
    const mockWorksheet = {}
    const mockWorkbook = {}
    
    XLSX.utils.json_to_sheet.mockReturnValue(mockWorksheet)
    XLSX.utils.book_new.mockReturnValue(mockWorkbook)
    XLSX.utils.book_append_sheet.mockImplementation(() => {})
    XLSX.writeFile.mockImplementation(() => {})

    render(<ExcelImporter />)

    // Switch to export tab
    const exportTab = screen.getByText('Export')
    fireEvent.click(exportTab)

    // Click export students button
    const exportButton = screen.getByText('Exporter Stagiaires')
    fireEvent.click(exportButton)

    // Wait for export to complete
    await waitFor(() => {
      expect(global.alert).toHaveBeenCalledWith('Export des stagiaires terminé avec succès!')
    }, { timeout: 3000 })

    // Verify XLSX functions were called
    expect(XLSX.utils.json_to_sheet).toHaveBeenCalled()
    expect(XLSX.utils.book_new).toHaveBeenCalled()
    expect(XLSX.utils.book_append_sheet).toHaveBeenCalled()
    expect(XLSX.writeFile).toHaveBeenCalled()
  })

  it('exports absence data successfully', async () => {
    // Mock XLSX functions for export
    const mockWorksheet = {}
    const mockWorkbook = {}
    
    XLSX.utils.json_to_sheet.mockReturnValue(mockWorksheet)
    XLSX.utils.book_new.mockReturnValue(mockWorkbook)
    XLSX.utils.book_append_sheet.mockImplementation(() => {})
    XLSX.writeFile.mockImplementation(() => {})

    render(<ExcelImporter />)

    // Switch to export tab
    const exportTab = screen.getByText('Export')
    fireEvent.click(exportTab)

    // Click export absences button
    const exportButton = screen.getByText('Exporter Absences')
    fireEvent.click(exportButton)

    // Wait for export to complete
    await waitFor(() => {
      expect(global.alert).toHaveBeenCalledWith('Export des absences terminé avec succès!')
    }, { timeout: 3000 })

    // Verify XLSX functions were called
    expect(XLSX.utils.json_to_sheet).toHaveBeenCalled()
    expect(XLSX.utils.book_new).toHaveBeenCalled()
    expect(XLSX.utils.book_append_sheet).toHaveBeenCalled()
    expect(XLSX.writeFile).toHaveBeenCalled()
  })
})