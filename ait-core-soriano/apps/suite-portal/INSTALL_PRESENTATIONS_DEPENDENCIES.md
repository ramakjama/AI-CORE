# Presentations Module - Dependencies Installation

This guide helps you install all required dependencies for the Presentations module.

## Required Dependencies

The Presentations module requires the following packages:

### Core Dependencies (Already Installed)
- `next` (^14.2.3)
- `react` (^18.3.1)
- `react-dom` (^18.3.1)
- `@tanstack/react-query` (^5.32.0)
- `framer-motion` (^11.1.7)
- `lucide-react` (^0.376.0)

### Presentations-Specific Dependencies

#### 1. Reveal.js
Already listed in package.json. If not installed:
```bash
pnpm add reveal.js@^5.1.0
```

#### 2. Chart.js (for chart elements)
```bash
pnpm add chart.js@^4.4.0
```

#### 3. Type Definitions
```bash
pnpm add -D @types/reveal.js
```

## Installation

### Quick Install (Recommended)
Run this command from the `apps/suite-portal` directory:

```bash
pnpm add reveal.js@^5.1.0 chart.js@^4.4.0
pnpm add -D @types/reveal.js
```

### Verify Installation
After installation, verify the packages are installed:

```bash
pnpm list reveal.js chart.js
```

## Post-Installation

### 1. Import Reveal.js Styles
The main page already imports the necessary CSS:
```typescript
import 'reveal.js/dist/reveal.css';
import 'reveal.js/dist/theme/black.css';
```

### 2. TypeScript Configuration
The type definitions file is already created at:
`src/types/reveal.d.ts`

### 3. Test the Module
1. Start the development server:
   ```bash
   pnpm dev
   ```

2. Navigate to: `http://localhost:3001/presentations`

3. Verify that:
   - Page loads without errors
   - You can create slides
   - Themes work correctly
   - Transitions work
   - Presenter mode opens

## Optional Dependencies

### For Enhanced Features

#### 1. React Beautiful DnD (for drag-and-drop slide reordering)
Already in package.json (^13.1.1)

#### 2. HTML to Canvas (for PDF export)
```bash
pnpm add html2canvas jspdf
```

#### 3. Additional Chart.js Plugins
```bash
pnpm add chartjs-plugin-datalabels
pnpm add chartjs-plugin-annotation
```

## Troubleshooting

### Issue: Module not found 'reveal.js'
**Solution**:
```bash
pnpm install
pnpm add reveal.js@^5.1.0
```

### Issue: TypeScript errors with Reveal
**Solution**: The custom type definition in `src/types/reveal.d.ts` should resolve this. If not:
```bash
pnpm add -D @types/reveal.js
```

### Issue: Chart.js not rendering
**Solution**:
```bash
pnpm add chart.js@^4.4.0
```

### Issue: Styles not loading
**Solution**: Ensure CSS imports are at the top of the component:
```typescript
import 'reveal.js/dist/reveal.css';
import 'reveal.js/dist/theme/black.css';
```

### Issue: Build errors
**Solution**: Clear cache and rebuild:
```bash
rm -rf .next node_modules
pnpm install
pnpm build
```

## CDN Alternative (Not Recommended for Production)

If you prefer not to install packages, you can use CDN links (development only):

```html
<!-- In your HTML head -->
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/reveal.js@5.1.0/dist/reveal.css">
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/reveal.js@5.1.0/dist/theme/black.css">
<script src="https://cdn.jsdelivr.net/npm/reveal.js@5.1.0/dist/reveal.js"></script>
<script src="https://cdn.jsdelivr.net/npm/chart.js@4.4.0/dist/chart.umd.js"></script>
```

## Package.json Verification

Ensure your `package.json` includes:

```json
{
  "dependencies": {
    "reveal.js": "^5.1.0",
    "chart.js": "^4.4.0",
    "@tanstack/react-query": "^5.32.0",
    "framer-motion": "^11.1.7",
    "lucide-react": "^0.376.0"
  },
  "devDependencies": {
    "@types/reveal.js": "^5.0.0"
  }
}
```

## Next Steps

After installation:

1. Read the [README.md](./README.md) for usage instructions
2. Explore the example templates
3. Create your first presentation
4. Test presenter mode
5. Try exporting to PDF/PPTX

## Support

If you encounter issues:

1. Check the browser console for errors
2. Verify all dependencies are installed
3. Clear browser cache
4. Restart development server
5. Check TypeScript compilation errors

## Dependencies Summary

| Package | Version | Purpose |
|---------|---------|---------|
| reveal.js | ^5.1.0 | Presentation engine |
| chart.js | ^4.4.0 | Charts and graphs |
| @tanstack/react-query | ^5.32.0 | Data fetching |
| framer-motion | ^11.1.7 | Animations |
| lucide-react | ^0.376.0 | Icons |

All other dependencies (React, Next.js, etc.) are part of the base suite-portal setup.
