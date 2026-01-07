# Project Structure

```
ofppt-absence/
├── src/
│   ├── main.jsx          # App entry point, renders root component
│   ├── App.jsx           # Main application component (all logic currently here)
│   ├── App.css           # Application styles
│   ├── index.css         # Global/reset styles
│   └── assets/           # Static assets (images, SVGs)
├── public/               # Public static files served as-is
├── index.html            # HTML entry point
├── vite.config.js        # Vite build configuration
├── eslint.config.js      # ESLint configuration
└── package.json          # Project dependencies and scripts
```

## Current Architecture

- **Single-file component structure**: All components and logic in `App.jsx`
- **Mock data**: Static arrays for sectors, fields, groups, and trainees
- **Local state management**: React `useState` and `useMemo` hooks
- **No routing library**: View switching via state (`currentView`)
- **No external state management**: All state in App component

## Component Organization (in App.jsx)

- `LoginPage` - Authentication form component
- `App` - Main dashboard with sidebar navigation and content views

## Styling

- Component-specific CSS in `App.css`
- Global styles in `index.css`
- No CSS framework or preprocessor
