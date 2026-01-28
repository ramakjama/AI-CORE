# Required Dependencies

## NPM/PNPM Packages

Add these dependencies to your `package.json`:

```json
{
  "dependencies": {
    "@radix-ui/react-avatar": "^1.0.4",
    "@radix-ui/react-dialog": "^1.0.5",
    "@radix-ui/react-dropdown-menu": "^2.0.6",
    "@radix-ui/react-slot": "^1.0.2",
    "@radix-ui/react-tooltip": "^1.0.7",
    "class-variance-authority": "^0.7.0",
    "clsx": "^2.1.0",
    "lucide-react": "^0.309.0",
    "tailwind-merge": "^2.2.0"
  },
  "devDependencies": {
    "tailwindcss": "^3.4.1",
    "tailwindcss-animate": "^1.0.7"
  }
}
```

## Installation Commands

### Using npm:
```bash
npm install @radix-ui/react-avatar @radix-ui/react-dialog @radix-ui/react-dropdown-menu @radix-ui/react-slot @radix-ui/react-tooltip
npm install class-variance-authority clsx lucide-react tailwind-merge
npm install -D tailwindcss-animate
```

### Using pnpm:
```bash
pnpm add @radix-ui/react-avatar @radix-ui/react-dialog @radix-ui/react-dropdown-menu @radix-ui/react-slot @radix-ui/react-tooltip
pnpm add class-variance-authority clsx lucide-react tailwind-merge
pnpm add -D tailwindcss-animate
```

### Using yarn:
```bash
yarn add @radix-ui/react-avatar @radix-ui/react-dialog @radix-ui/react-dropdown-menu @radix-ui/react-slot @radix-ui/react-tooltip
yarn add class-variance-authority clsx lucide-react tailwind-merge
yarn add -D tailwindcss-animate
```

## Package Details

### Radix UI Primitives
- `@radix-ui/react-avatar` - Accessible avatar component
- `@radix-ui/react-dialog` - Accessible modal dialog
- `@radix-ui/react-dropdown-menu` - Accessible dropdown menu
- `@radix-ui/react-slot` - Composition utility for polymorphic components
- `@radix-ui/react-tooltip` - Accessible tooltip component

### Styling Utilities
- `class-variance-authority` - CVA for managing component variants
- `clsx` - Utility for constructing className strings conditionally
- `tailwind-merge` - Merge Tailwind CSS classes without style conflicts

### Icons
- `lucide-react` - Beautiful & consistent icon library

### Animation
- `tailwindcss-animate` - Tailwind CSS plugin for animations

## TypeScript Configuration

Ensure your `tsconfig.json` includes:

```json
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"]
    },
    "jsx": "react-jsx",
    "lib": ["dom", "dom.iterable", "esnext"],
    "allowJs": true,
    "skipLibCheck": true,
    "strict": true,
    "forceConsistentCasingInFileNames": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true
  }
}
```

## Next.js Configuration (if applicable)

If you're using Next.js, ensure your `next.config.js` transpiles the Radix packages:

```js
/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: [
    '@radix-ui/react-avatar',
    '@radix-ui/react-dialog',
    '@radix-ui/react-dropdown-menu',
    '@radix-ui/react-slot',
    '@radix-ui/react-tooltip'
  ]
}

module.exports = nextConfig
```
