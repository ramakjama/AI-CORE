# Shadcn UI Components - Quick Start Guide

This guide will help you get started with the Shadcn UI components in under 5 minutes.

## Step 1: Install Dependencies

```bash
pnpm add @radix-ui/react-avatar @radix-ui/react-dialog @radix-ui/react-dropdown-menu @radix-ui/react-slot @radix-ui/react-tooltip class-variance-authority clsx lucide-react tailwind-merge
pnpm add -D tailwindcss-animate
```

## Step 2: Configure TypeScript

Ensure your `tsconfig.json` has the path alias configured:

```json
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"]
    }
  }
}
```

## Step 3: Configure Tailwind CSS

Update your `tailwind.config.js`:

```js
module.exports = {
  darkMode: ["class"],
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};
```

## Step 4: Add CSS Variables

Add these to your global CSS file (e.g., `globals.css` or `app/globals.css`):

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  :root {
    --background: 0 0% 100%;
    --foreground: 222.2 84% 4.9%;
    --card: 0 0% 100%;
    --card-foreground: 222.2 84% 4.9%;
    --popover: 0 0% 100%;
    --popover-foreground: 222.2 84% 4.9%;
    --primary: 222.2 47.4% 11.2%;
    --primary-foreground: 210 40% 98%;
    --secondary: 210 40% 96.1%;
    --secondary-foreground: 222.2 47.4% 11.2%;
    --muted: 210 40% 96.1%;
    --muted-foreground: 215.4 16.3% 46.9%;
    --accent: 210 40% 96.1%;
    --accent-foreground: 222.2 47.4% 11.2%;
    --destructive: 0 84.2% 60.2%;
    --destructive-foreground: 210 40% 98%;
    --border: 214.3 31.8% 91.4%;
    --input: 214.3 31.8% 91.4%;
    --ring: 222.2 84% 4.9%;
    --radius: 0.5rem;
  }

  .dark {
    --background: 222.2 84% 4.9%;
    --foreground: 210 40% 98%;
    --card: 222.2 84% 4.9%;
    --card-foreground: 210 40% 98%;
    --popover: 222.2 84% 4.9%;
    --popover-foreground: 210 40% 98%;
    --primary: 210 40% 98%;
    --primary-foreground: 222.2 47.4% 11.2%;
    --secondary: 217.2 32.6% 17.5%;
    --secondary-foreground: 210 40% 98%;
    --muted: 217.2 32.6% 17.5%;
    --muted-foreground: 215 20.2% 65.1%;
    --accent: 217.2 32.6% 17.5%;
    --accent-foreground: 210 40% 98%;
    --destructive: 0 62.8% 30.6%;
    --destructive-foreground: 210 40% 98%;
    --border: 217.2 32.6% 17.5%;
    --input: 217.2 32.6% 17.5%;
    --ring: 212.7 26.8% 83.9%;
  }
}

@layer base {
  * {
    @apply border-border;
  }
  body {
    @apply bg-background text-foreground;
  }
}
```

## Step 5: Start Using Components

### Basic Button Example

```tsx
import { Button } from '@/components/ui/button';

export default function MyPage() {
  return (
    <Button onClick={() => console.log('clicked!')}>
      Click Me
    </Button>
  );
}
```

### Form with Input

```tsx
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export default function LoginForm() {
  return (
    <form className="space-y-4 max-w-md">
      <div>
        <label className="block text-sm font-medium mb-2">Email</label>
        <Input type="email" placeholder="you@example.com" />
      </div>
      <div>
        <label className="block text-sm font-medium mb-2">Password</label>
        <Input type="password" placeholder="••••••••" />
      </div>
      <Button className="w-full">Sign In</Button>
    </form>
  );
}
```

### Dialog Example

```tsx
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

export default function MyDialog() {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button>Open Dialog</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Confirmation</DialogTitle>
          <DialogDescription>
            Are you sure you want to continue?
          </DialogDescription>
        </DialogHeader>
      </DialogContent>
    </Dialog>
  );
}
```

### User Menu with Avatar

```tsx
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';

export default function UserMenu() {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="relative h-10 w-10 rounded-full">
          <Avatar>
            <AvatarImage src="/avatar.jpg" alt="User" />
            <AvatarFallback>JD</AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuLabel>My Account</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem>Profile</DropdownMenuItem>
        <DropdownMenuItem>Settings</DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem>Log out</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
```

## Step 6: Dark Mode (Optional)

To enable dark mode switching, add this to your layout:

```tsx
'use client';

import { ThemeProvider } from 'next-themes';

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
```

Install the theme provider:
```bash
pnpm add next-themes
```

## Common Import Patterns

```tsx
// Import multiple components at once
import {
  Button,
  Input,
  Dialog,
  DialogTrigger,
  DialogContent,
} from '@/components/ui';

// Or import individually
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
```

## Next Steps

- Check `EXAMPLES.tsx` for comprehensive usage examples
- See `README.md` for detailed documentation
- Review `DEPENDENCIES.md` for all required packages

## Troubleshooting

### Path alias not working?

Make sure your bundler (Next.js, Vite, etc.) is configured to resolve the `@/` alias. For Next.js 13+, this should work by default if `tsconfig.json` is configured correctly.

### Dark mode not working?

Ensure you've:
1. Added the CSS variables for `.dark` class
2. Installed `next-themes` or similar dark mode solution
3. Added `suppressHydrationWarning` to your `<html>` tag
4. Set Tailwind's `darkMode: ["class"]` config

### Animations not working?

Make sure you've installed `tailwindcss-animate` and added it to your Tailwind plugins array.

## Support

For more examples and detailed documentation, see:
- `README.md` - Full documentation
- `EXAMPLES.tsx` - Working code examples
- `DEPENDENCIES.md` - Required packages

Components are based on Shadcn UI patterns and follow the same conventions.
