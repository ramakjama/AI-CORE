# i18n Installation Instructions

Step-by-step installation guide for the i18n setup in AIT-CORE Soriano.

## Prerequisites

- Node.js >= 20.0.0
- pnpm >= 8.0.0
- Next.js 14+
- NestJS 10+

## Installation Steps

### Step 1: Install Web Dependencies

```bash
cd apps/web
pnpm add next-intl@latest @formatjs/intl-localematcher negotiator date-fns
pnpm add -D @types/negotiator
```

### Step 2: Update Next.js Configuration

The project already includes `next.config.mjs` with i18n setup. If you need to update it:

**File: `apps/web/next.config.mjs`**

Ensure it includes:

```javascript
import createNextIntlPlugin from 'next-intl/plugin';

const withNextIntl = createNextIntlPlugin('./src/i18n/request.ts');

// ... rest of config

export default withNextIntl(nextConfig);
```

### Step 3: Update package.json Scripts

**File: `apps/web/package.json`**

Add these scripts if not present:

```json
{
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "type-check": "tsc --noEmit"
  }
}
```

### Step 4: Update Middleware

The middleware in `apps/web/src/middleware.ts` already includes i18n handling. Verify it includes:

```typescript
import { locales, defaultLocale } from '../i18n.config';

// i18n locale detection and redirect logic
```

### Step 5: Restructure App Directory

If you haven't already, restructure your app to support locales:

```bash
cd apps/web/src/app

# Create locale directory structure
mkdir -p [locale]

# Move existing pages into [locale] directory
# Example:
mv page.tsx [locale]/page.tsx
mv layout.tsx [locale]/layout.tsx
mv dashboard [locale]/dashboard
```

### Step 6: Update Root Layout

**File: `apps/web/src/app/[locale]/layout.tsx`**

```typescript
import { NextIntlClientProvider } from 'next-intl';
import { getMessages } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { locales } from '../../../i18n.config';

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export default async function LocaleLayout({
  children,
  params: { locale }
}: {
  children: React.ReactNode;
  params: { locale: string };
}) {
  // Validate locale
  if (!locales.includes(locale as any)) {
    notFound();
  }

  const messages = await getMessages();

  return (
    <html lang={locale}>
      <body>
        <NextIntlClientProvider messages={messages}>
          {children}
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
```

### Step 7: Update API App Module

**File: `apps/api/src/app.module.ts`**

Add the I18nModule:

```typescript
import { Module, NestModule, MiddlewareConsumer } from '@nestjs/common';
import { I18nModule } from './i18n/i18n.module';
import { I18nMiddleware } from './middleware/i18n.middleware';

@Module({
  imports: [
    I18nModule,  // Add this
    // ... other modules
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(I18nMiddleware)
      .forRoutes('*');  // Apply to all routes
  }
}
```

### Step 8: Update TypeScript Configuration

**File: `apps/web/tsconfig.json`**

Ensure paths are configured:

```json
{
  "compilerOptions": {
    "paths": {
      "@/*": ["./src/*"]
    }
  }
}
```

### Step 9: Add Select Component (if not present)

The LocaleSwitcher uses a Select component from your UI library. Make sure you have Radix UI Select installed:

```bash
cd apps/web
pnpm add @radix-ui/react-select
```

### Step 10: Test the Installation

1. **Start the development servers:**

```bash
# Terminal 1 - Web App
cd apps/web
pnpm dev

# Terminal 2 - API
cd apps/api
pnpm start:dev
```

2. **Test Web App:**

Visit: http://localhost:3000

The app should automatically redirect to http://localhost:3000/es-ES/

Try switching locales using the LocaleSwitcher component.

3. **Test API:**

```bash
# Test Spanish
curl -H "Accept-Language: es-ES" http://localhost:3001/api/v1/health

# Test English
curl -H "Accept-Language: en-US" http://localhost:3001/api/v1/health
```

### Step 11: Verify File Structure

Ensure all files are in place:

```
✓ apps/web/i18n.config.ts
✓ apps/web/src/i18n/request.ts
✓ apps/web/src/locales/es-ES.json
✓ apps/web/src/locales/en-US.json
✓ apps/web/src/lib/i18n/utils.ts
✓ apps/web/src/lib/i18n/formatters.ts
✓ apps/web/src/hooks/use-locale.ts
✓ apps/web/src/hooks/use-formatter.ts
✓ apps/web/src/components/i18n/locale-switcher.tsx
✓ apps/web/src/components/i18n/locale-link.tsx
✓ apps/web/next.config.mjs
✓ apps/api/src/i18n/i18n.config.ts
✓ apps/api/src/i18n/i18n.service.ts
✓ apps/api/src/i18n/i18n.module.ts
✓ apps/api/src/i18n/translations/es-ES.json
✓ apps/api/src/i18n/translations/en-US.json
✓ apps/api/src/decorators/i18n.decorator.ts
✓ apps/api/src/middleware/i18n.middleware.ts
```

## Troubleshooting

### Issue: Module not found errors

**Solution:**
```bash
# Clear node_modules and reinstall
cd apps/web
rm -rf node_modules pnpm-lock.yaml
pnpm install

cd apps/api
rm -rf node_modules pnpm-lock.yaml
pnpm install
```

### Issue: Translations not loading

**Solution:**
1. Check JSON syntax in translation files
2. Verify file paths in configuration
3. Clear Next.js cache: `rm -rf .next`
4. Restart dev server

### Issue: Middleware not working

**Solution:**
1. Check middleware.ts matcher configuration
2. Verify locales are properly imported
3. Check that middleware is in the correct location: `apps/web/src/middleware.ts`

### Issue: TypeScript errors

**Solution:**
```bash
# Check types
cd apps/web
pnpm type-check

# Install missing type definitions
pnpm add -D @types/node @types/react @types/react-dom
```

### Issue: Locale not persisting

**Solution:**
1. Check that cookies are enabled in browser
2. Verify cookie name matches configuration
3. Check domain and path in cookie settings

## Verification Checklist

After installation, verify:

- [ ] Web app runs without errors: `pnpm dev`
- [ ] API runs without errors: `pnpm start:dev`
- [ ] Translations load correctly in web app
- [ ] Locale switcher works
- [ ] URL includes locale: `/es-ES/` or `/en-US/`
- [ ] API responds with correct locale
- [ ] Date/number formatting matches locale
- [ ] Currency formatting matches locale
- [ ] No TypeScript errors: `pnpm type-check`
- [ ] No console errors in browser
- [ ] Cookies are set correctly

## Next Steps

1. Review [I18N_SETUP_GUIDE.md](./I18N_SETUP_GUIDE.md) for detailed usage
2. Check [I18N_QUICK_REFERENCE.md](./I18N_QUICK_REFERENCE.md) for quick tips
3. Add custom translations to JSON files
4. Implement locale switching in your components
5. Add translated metadata for SEO

## Support

If you encounter issues not covered here:

1. Check the documentation files
2. Review the example code in the guide
3. Check Next.js and next-intl documentation
4. Contact the development team

## Rollback

If you need to rollback the installation:

```bash
# Remove dependencies
cd apps/web
pnpm remove next-intl @formatjs/intl-localematcher negotiator date-fns @types/negotiator

# Restore original next.config.js
git checkout apps/web/next.config.js

# Remove i18n files
rm -rf apps/web/src/i18n
rm -rf apps/web/src/locales
rm -rf apps/api/src/i18n
rm apps/web/i18n.config.ts

# Restore app structure
# Move files back from [locale] directory
```

---

**Installation Time**: ~15-30 minutes
**Last Updated**: January 28, 2026
**Version**: 1.0.0
