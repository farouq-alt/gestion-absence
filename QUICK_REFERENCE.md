# Quick Reference Guide

## Project Organization

### CSS Files Location
All CSS files are now centralized in `src/styles/`:
- `src/styles/App.css` - Main application styles (47 KB)
- `src/styles/AdminDashboard.css` - Admin dashboard styles (8.8 KB)
- `src/styles/index.css` - Global/reset styles (292 B)

### Import Paths
When importing CSS in JSX files:

**From src root (main.jsx, App.jsx):**
```javascript
import './styles/App.css'
import './styles/index.css'
```

**From components folder (AdminDashboard.jsx):**
```javascript
import '../styles/AdminDashboard.css'
```

## Theme Colors

### Primary Colors
- **Blue**: `#007bff` (primary action)
- **Dark Blue**: `#0056b3` (hover state)
- **Light Blue**: `#f0f8ff` (background)

### Neutral Colors
- **Dark**: `#1a1a1a` (text, headers)
- **Gray**: `#666` (secondary text)
- **Light Gray**: `#f5f5f5` (background)
- **White**: `#fff` (cards, surfaces)

### Status Colors
- **Success**: `#4caf50` (green)
- **Error**: `#ff6b6b` (red)
- **Warning**: `#ff9800` (orange)
- **Info**: `#2196f3` (blue)

## Common CSS Classes

### Layout
- `.app-container` - Main app wrapper
- `.sidebar` - Left navigation sidebar
- `.main-area` - Main content area
- `.header` - Top header bar

### Cards & Sections
- `.dashboard-card` - Dashboard card component
- `.stat-card` - Statistics card
- `.work-block` - Work area block
- `.modal` - Modal dialog

### Buttons
- `.btn-primary` - Primary action button
- `.btn-secondary` - Secondary button
- `.quick-action-btn` - Quick action button

### Tables
- `.admin-table` - Admin table styling
- `.table-section` - Table container

### Status & Badges
- `.status-badge` - Status indicator
- `.nav-badge` - Navigation badge
- `.role-badge` - Role indicator

## Responsive Breakpoints

- **Desktop**: 1024px and above
- **Tablet**: 768px to 1023px
- **Mobile**: Below 768px

## Development Commands

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

## File Structure

```
src/
├── styles/                    # All CSS files
│   ├── App.css               # Main styles
│   ├── AdminDashboard.css    # Admin dashboard
│   └── index.css             # Global styles
├── components/               # React components
├── contexts/                 # Context providers
├── hooks/                    # Custom hooks
├── utils/                    # Utilities
├── assets/                   # Static assets
├── tests/                    # Test files
├── App.jsx                   # Main app component
└── main.jsx                  # Entry point
```

## Adding New Styles

1. **For new component styles**: Add to `src/styles/App.css`
2. **For admin-specific styles**: Add to `src/styles/AdminDashboard.css`
3. **For global styles**: Add to `src/styles/index.css`

## Common Patterns

### Gradient Background
```css
background: linear-gradient(135deg, #007bff 0%, #0056b3 100%);
```

### Hover Effect with Lift
```css
transition: all 0.2s ease;
transform: translateY(-2px);
box-shadow: 0 4px 12px rgba(0, 123, 255, 0.4);
```

### Focus State
```css
outline: none;
border-color: #007bff;
box-shadow: 0 0 0 3px rgba(0, 123, 255, 0.1);
```

### Smooth Transition
```css
transition: all 0.2s ease;
```

## Troubleshooting

### Styles not loading?
1. Check import path is correct
2. Verify file exists in `src/styles/`
3. Clear browser cache and rebuild

### Import path errors?
1. From `src/` root: use `./styles/filename.css`
2. From `src/components/`: use `../styles/filename.css`
3. From nested folders: adjust `../` accordingly

### CSS not applying?
1. Check CSS selector specificity
2. Verify class names match in JSX
3. Check for conflicting styles
4. Use browser DevTools to inspect

## Resources

- **Documentation**: See COMPLETION_SUMMARY.md
- **Theme Details**: See DASHBOARD_UPDATES.md
- **Reorganization**: See STYLES_REORGANIZATION.md
- **Structure**: See .kiro/steering/structure.md
