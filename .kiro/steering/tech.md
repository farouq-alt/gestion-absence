# Tech Stack

## Core Technologies

- **React 19** - UI framework using functional components and hooks
- **Vite 7** - Build tool and dev server
- **JavaScript (ES Modules)** - No TypeScript, uses `.jsx` extension for React components

## Development Tools

- **ESLint 9** - Linting with flat config format
  - `eslint-plugin-react-hooks` - React hooks rules
  - `eslint-plugin-react-refresh` - Fast refresh compatibility
- **ECMAScript 2020** target

## Common Commands

```bash
# Start development server
npm run dev

# Build for production
npm run build

# Run linter
npm run lint

# Preview production build
npm run preview
```

## Configuration Files

- `vite.config.js` - Vite configuration with React plugin
- `eslint.config.js` - ESLint flat config
- `package.json` - Dependencies and scripts

## Key Conventions

- ES modules (`"type": "module"` in package.json)
- Browser globals environment for ESLint
- Unused variables allowed if capitalized or prefixed with underscore
- `dist/` folder ignored by ESLint
