# OFPPT Absence Management System - Project Overview

## Project Description

OFPPT Absence is a web-based attendance management system designed for OFPPT (Office de la Formation Professionnelle et de la Promotion du Travail), Morocco's national vocational training organization. The application enables instructors (formateurs) to efficiently track and manage trainee absences across different training programs.

## Core Functionalities

### 1. Authentication System
- **Simple Login Interface**: Username and password authentication for instructors
- **Session Management**: Basic login state management with logout functionality
- **Visual Design**: Clean, professional login page with OFPPT branding and grid background

### 2. Absence Marking Workflow
- **Hierarchical Filtering**: Three-level selection system (Secteur → Filière → Groupe)
- **Trainee Selection**: Multi-select interface with "select all" functionality
- **Absence Configuration**: 
  - Date selection for absence occurrence
  - Duration options (1 session = 2h30, 2 sessions = 5h00)
  - Justification status (Justified/Unjustified)
- **Batch Processing**: Mark absences for multiple trainees simultaneously

### 3. Absence Consultation
- **Search & Filter**: Query absences by date and/or group
- **Results Display**: Tabular view showing trainee details, absence duration, and status
- **Status Visualization**: Color-coded display for justified (green) vs unjustified (red) absences

## Technical Architecture

### Frontend Stack
- **React 19**: Modern functional components with hooks
- **Vite 7**: Fast development server and build tool
- **JavaScript (ES Modules)**: No TypeScript, using .jsx extensions
- **CSS**: Custom styling without external frameworks

### Data Management
- **Mock Data Structure**: Static arrays simulating database entities
- **Local State**: React useState and useMemo for state management
- **No Backend**: Currently operates with in-memory data

### UI/UX Design
- **Responsive Layout**: Minimum 1366x768 resolution support
- **Sidebar Navigation**: 18% width sidebar with main content area
- **French Language**: All UI text in French for Moroccan users
- **Professional Styling**: Clean, form-focused design with OFPPT branding

## Domain Model

### Organizational Hierarchy
```
Secteur (Training Sector)
├── Filière (Field of Study)
    └── Groupe (Student Group)
        └── Stagiaire (Trainee)
```

### Core Entities

**Secteur**: Training sectors like "IA & Digital", "Industriel", "AGC", "BTP"

**Filière**: Specific fields within sectors (e.g., "Développement Digital", "Infrastructure Digitale")

**Groupe**: Student groups with alphanumeric codes (e.g., "DEV101", "INF101")

**Stagiaire**: Individual trainees with:
- CEF (unique identifier)
- Full name
- Email address (@ofppt.ma domain)
- Discipline score (0-20 scale)

**Absence**: Absence records containing:
- Associated trainee
- Date of absence
- Duration (1 or 2 sessions)
- Status (J = Justified, NJ = Not Justified)

## Current Data Sample

### Training Sectors (4 sectors)
- IA & Digital
- Industriel  
- AGC (Administration, Gestion et Commerce)
- BTP (Bâtiment et Travaux Publics)

### Sample Groups
- DEV101, DEV102 (Development)
- INF101 (Infrastructure)
- ELM101 (Electromechanical)
- GE101 (Business Management)
- CPT101 (Accounting)

### Sample Trainees (10 trainees)
All with Moroccan names, OFPPT email addresses, and discipline scores ranging from 16-20.

## User Interface Components

### Login Page
- Centered login form with OFPPT logo
- Grid background pattern with fade effect
- Username/password fields with validation
- Professional branding elements

### Main Dashboard
- **Left Sidebar** (18% width):
  - OFPPT header
  - Navigation menu (Mark Absence, Consult Absences)
  - Logout option at bottom

- **Main Content Area**:
  - Top header with page title and user info
  - Dynamic content based on selected view

### Mark Absence View
- **Filter Section**: Hierarchical dropdowns for selection
- **Trainee Table**: Scrollable list with checkboxes and trainee details
- **Action Section**: Absence configuration and submit button

### Consult Absence View
- **Search Filters**: Date and group selection
- **Results Table**: Absence records with color-coded status

## Key Features & Behaviors

### Smart Filtering
- Cascading dropdowns that filter based on parent selections
- Automatic clearing of child selections when parent changes
- Disabled states for dependent dropdowns

### Batch Operations
- Select all/none functionality for trainee lists
- Real-time counter showing selected vs total trainees
- Single action to mark multiple absences

### Data Validation
- Prevents marking absences without trainee selection
- Requires date selection for absence marking
- Form validation on login

### Visual Feedback
- Hover effects on interactive elements
- Active states for navigation items
- Color coding for absence status
- Empty states with helpful messages

## Development Workflow

### Available Commands
```bash
npm run dev      # Start development server
npm run build    # Build for production  
npm run lint     # Run ESLint
npm run preview  # Preview production build
```

### Code Organization
- Single-file component structure in `App.jsx`
- Separate CSS file for styling
- Mock data defined as constants
- Functional components with React hooks

## Future Enhancement Opportunities

### Backend Integration
- Replace mock data with API calls
- Implement proper authentication
- Add data persistence

### Feature Expansions
- Export absence reports
- Email notifications
- Advanced filtering options
- Absence statistics and analytics
- Multi-language support

### Technical Improvements
- Component separation and modularization
- State management library (Redux/Zustand)
- TypeScript migration
- Unit and integration testing
- Responsive design for mobile devices

## Project Status

The application is currently a functional prototype with:
- ✅ Complete UI implementation
- ✅ Mock data and business logic
- ✅ Core workflows (mark/consult absences)
- ✅ Professional styling and UX
- ⏳ Backend integration needed
- ⏳ Production deployment pending
- ⏳ Real data integration required

This system provides a solid foundation for OFPPT's attendance management needs and can be extended with additional features as requirements evolve.