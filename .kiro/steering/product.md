# Product Overview

OFPPT Absence is an attendance management system for OFPPT (Office de la Formation Professionnelle et de la Promotion du Travail) - Morocco's vocational training organization.

## Core Features

- **Login Authentication**: Simple username/password login for instructors (formateurs)
- **Mark Absences**: Select trainees by sector → field → group hierarchy, then record absences with date, duration, and justification status
- **Consult Absences**: Search and view recorded absences filtered by date and group

## Domain Model

- **Secteur**: Training sector (e.g., IA & Digital, Industrial)
- **Filière**: Field of study within a sector
- **Groupe**: Student group within a field
- **Stagiaire**: Trainee with CEF (unique ID), name, email, and discipline score
- **Absence**: Record with date, duration (1 or 2 sessions), and status (Justified/Unjustified)

## User Interface

- French language UI
- Sidebar navigation with two main views
- Filter-based selection workflow for marking absences
- Tabular data display for trainee lists and absence records
