# Requirements Document

## Introduction

This document specifies the requirements for enhancing the OFPPT Absence system with role-based authentication, comprehensive student management capabilities, rollback functionality, and visual absence analytics. The system will support two user roles: Formateur (Teacher) and Administrateur (Administrator), each with distinct permissions and capabilities.

## Glossary

- **System**: The OFPPT Absence management application
- **Formateur**: Teacher user role with permissions to mark absences and view student data
- **Administrateur**: Administrator user role with full system permissions including student management
- **Stagiaire**: Student/trainee in the system
- **Groupe**: Class group containing multiple students
- **Absence_Record**: Individual absence entry with date, duration, and justification status
- **Excel_Import**: Process of importing student data from Excel spreadsheet files
- **Rollback_Operation**: Action to undo previously recorded absence entries
- **Absence_History**: Complete record of a student's absences over time
- **Analytics_Graph**: Visual representation of absence data over time

## Requirements

### Requirement 1: Role-Based Authentication

**User Story:** As a user, I want to select my role (Formateur or Administrateur) during login, so that I can access the appropriate features for my position.

#### Acceptance Criteria

1. WHEN the application launches, THE System SHALL display a role selection interface before the login form
2. WHEN a user selects "Formateur" role, THE System SHALL present the teacher login interface
3. WHEN a user selects "Administrateur" role, THE System SHALL present the administrator login interface
4. WHEN authentication is successful, THE System SHALL grant access based on the selected role
5. WHEN authentication fails, THE System SHALL display appropriate error messages and allow role reselection

### Requirement 2: Administrator Student Management

**User Story:** As an administrator, I want comprehensive student management capabilities, so that I can maintain accurate student records and group assignments.

#### Acceptance Criteria

1. WHEN an administrator accesses student management, THE System SHALL display options to add individual students or import from Excel
2. WHEN adding an individual student, THE System SHALL require CEF, name, email, and group assignment
3. WHEN importing from Excel, THE System SHALL validate file format and student data before import
4. WHEN Excel import contains invalid data, THE System SHALL display specific error messages and reject the import
5. WHEN Excel import is successful, THE System SHALL add all valid students to the specified groups
6. WHEN managing groups, THE System SHALL allow administrators to create, edit, and delete groups
7. WHEN deleting a group with students, THE System SHALL require confirmation and handle student reassignment

### Requirement 3: Administrator Absence Consultation

**User Story:** As an administrator, I want to view absence records for any group, so that I can monitor attendance across the institution.

#### Acceptance Criteria

1. WHEN an administrator selects absence consultation, THE System SHALL display all available groups for selection
2. WHEN a group is selected, THE System SHALL show all absence records for that group with filtering options
3. WHEN filtering by date range, THE System SHALL display only absences within the specified period
4. WHEN viewing group absences, THE System SHALL show student details, absence dates, duration, and justification status
5. WHEN viewing group absences, THE System SHALL provide export and print options for the displayed data
6. WHEN exporting absence records, THE System SHALL generate reports in PDF and Excel formats
7. WHEN printing absence records, THE System SHALL format the data appropriately for paper output with proper headers and group information

### Requirement 4: Individual Duration Absence Marking

**User Story:** As a teacher, I want to mark different absence durations for individual students in the same session, so that I can accurately record varying absence periods.

#### Acceptance Criteria

1. WHEN marking absences for multiple students, THE System SHALL allow individual duration selection for each student
2. WHEN a student is selected for absence, THE System SHALL provide duration options (2.5 hours, 5 hours, or custom duration)
3. WHEN custom duration is selected, THE System SHALL validate the input and ensure it's within acceptable ranges
4. WHEN saving multiple absences, THE System SHALL record each student's specific duration independently
5. WHEN reviewing marked absences, THE System SHALL display the individual duration for each student clearly

### Requirement 5: Rollback Functionality for Teachers

**User Story:** As a teacher, I want to undo accidentally recorded absences, so that I can correct mistakes without administrator intervention.

#### Acceptance Criteria

1. WHEN a teacher records an absence, THE System SHALL provide an immediate rollback option for a limited time period
2. WHEN a teacher accesses recent records, THE System SHALL display rollback options for absences recorded in the current session
3. WHEN a rollback is requested, THE System SHALL require confirmation before removing the absence record
4. WHEN a rollback is completed, THE System SHALL remove the absence record and update all related statistics
5. WHEN the rollback time limit expires, THE System SHALL disable the rollback option for that record

### Requirement 6: Student Absence History Analytics

**User Story:** As a user (administrator or teacher), I want to view a student's absence history as a graph, so that I can identify attendance patterns and trends.

#### Acceptance Criteria

1. WHEN viewing a student's profile, THE System SHALL provide an option to display absence history
2. WHEN absence history is requested, THE System SHALL generate a graph showing absences over time
3. WHEN displaying the graph, THE System SHALL differentiate between justified and unjustified absences
4. WHEN the graph is displayed, THE System SHALL include date ranges, absence frequency, and trend indicators
5. WHEN no absence data exists, THE System SHALL display an appropriate message indicating perfect attendance
6. WHEN the graph covers multiple months, THE System SHALL provide zoom and filter capabilities for detailed analysis

### Requirement 7: Excel Import Data Validation

**User Story:** As an administrator, I want robust Excel import validation, so that I can ensure data integrity when bulk importing students.

#### Acceptance Criteria

1. WHEN an Excel file is uploaded, THE System SHALL validate the file format and required columns
2. WHEN validating student data, THE System SHALL check for duplicate CEF numbers within the import
3. WHEN validating student data, THE System SHALL verify email format and uniqueness
4. WHEN validation fails, THE System SHALL provide detailed error reports with row numbers and specific issues
5. WHEN validation succeeds, THE System SHALL display a preview of students to be imported before final confirmation

### Requirement 8: Enhanced Permission System

**User Story:** As the system, I want to enforce role-based permissions, so that users can only access features appropriate to their role.

#### Acceptance Criteria

1. WHEN a Formateur is logged in, THE System SHALL restrict access to student management features
2. WHEN a Formateur is logged in, THE System SHALL allow access to absence marking and consultation for assigned groups only
3. WHEN an Administrateur is logged in, THE System SHALL provide access to all system features
4. WHEN unauthorized access is attempted, THE System SHALL display permission denied messages and redirect appropriately
5. WHEN session expires, THE System SHALL require re-authentication with role selection

### Requirement 9: Data Persistence and Integrity

**User Story:** As the system, I want to maintain data consistency across all operations, so that absence records and student information remain accurate.

#### Acceptance Criteria

1. WHEN any data modification occurs, THE System SHALL validate data integrity before committing changes
2. WHEN rollback operations are performed, THE System SHALL ensure related statistics and reports are updated
3. WHEN students are deleted or reassigned, THE System SHALL handle existing absence records appropriately
4. WHEN Excel imports are processed, THE System SHALL maintain referential integrity with existing groups and sectors
5. WHEN concurrent users modify the same data, THE System SHALL handle conflicts gracefully and notify users of changes