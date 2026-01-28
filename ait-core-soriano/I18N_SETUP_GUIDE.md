# i18n Setup Guide - AIT-CORE Soriano

Complete internationalization (i18n) setup for Spanish (es-ES) and English (en-US) locales.

## Table of Contents

- [Overview](#overview)
- [Installation](#installation)
- [Web App (Next.js) Setup](#web-app-nextjs-setup)
- [API (NestJS) Setup](#api-nestjs-setup)
- [Usage Examples](#usage-examples)
- [File Structure](#file-structure)
- [Best Practices](#best-practices)

## Overview

This project uses:
- **Next.js App**: `next-intl` for client and server-side translations
- **NestJS API**: Custom i18n service for API responses
- **Supported Locales**: Spanish (es-ES) and English (en-US)
- **Default Locale**: Spanish (es-ES)

## Installation

### Web App Dependencies

```bash
cd apps/web
pnpm add next-intl @formatjs/intl-localematcher negotiator
pnpm add -D @types/negotiator
```

### API Dependencies

No additional dependencies needed. Custom i18n service included.

## Web App (Next.js) Setup

### 1. Configuration Files

**`apps/web/i18n.config.ts`** - Main i18n configuration
```typescript
export type Locale = 'es-ES' | 'en-US';
export const defaultLocale: Locale = 'es-ES';
export const locales: Locale[] = ['es-ES', 'en-US'];
```

**`apps/web/src/i18n/request.ts`** - Request configuration for next-intl

### 2. Translation Files

Located in `apps/web/src/locales/`:
- `es-ES.json` - Spanish translations
- `en-US.json` - English translations

### 3. Middleware

The middleware handles:
- Locale detection from cookies
- Automatic redirect to locale-prefixed URLs
- Setting locale cookie

### 4. Next.js Configuration

**Update `apps/web/next.config.js`** to use the next-intl plugin:

```javascript
import createNextIntlPlugin from 'next-intl/plugin';

const withNextIntl = createNextIntlPlugin('./src/i18n/request.ts');

export default withNextIntl(nextConfig);
```

### 5. App Structure

Update your app structure to support locales:

```
apps/web/src/app/
  [locale]/
    layout.tsx
    page.tsx
    dashboard/
      page.tsx
```

**Example `[locale]/layout.tsx`**:

```typescript
import { NextIntlClientProvider } from 'next-intl';
import { getMessages } from 'next-intl/server';

export default async function LocaleLayout({
  children,
  params: { locale }
}: {
  children: React.ReactNode;
  params: { locale: string };
}) {
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

## API (NestJS) Setup

### 1. Import I18nModule

**Update `apps/api/src/app.module.ts`**:

```typescript
import { I18nModule } from './i18n/i18n.module';

@Module({
  imports: [
    I18nModule,
    // ... other modules
  ],
})
export class AppModule {}
```

### 2. Add Middleware

**Update `apps/api/src/main.ts`**:

```typescript
import { I18nMiddleware } from './middleware/i18n.middleware';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Apply i18n middleware
  app.use(I18nMiddleware);

  await app.listen(3001);
}
```

### 3. Translation Files

Located in `apps/api/src/i18n/translations/`:
- `es-ES.json` - Spanish API messages
- `en-US.json` - English API messages

## Usage Examples

### Web App (Next.js)

#### Using Translations in Server Components

```typescript
import { useTranslations } from 'next-intl';

export default function HomePage() {
  const t = useTranslations('common');

  return (
    <div>
      <h1>{t('welcome')}</h1>
      <p>{t('appName')}</p>
    </div>
  );
}
```

#### Using Translations in Client Components

```typescript
'use client';

import { useTranslations } from 'next-intl';

export function LoginForm() {
  const t = useTranslations('auth');

  return (
    <form>
      <input placeholder={t('email')} />
      <input placeholder={t('password')} />
      <button>{t('signIn')}</button>
    </form>
  );
}
```

#### Using the Formatter Hook

```typescript
'use client';

import { useFormatter } from '@/hooks/use-formatter';

export function PriceDisplay({ amount }: { amount: number }) {
  const format = useFormatter();

  return (
    <div>
      <p>{format.currency(amount)}</p>
      <p>{format.date(new Date())}</p>
      <p>{format.number(1234.56)}</p>
    </div>
  );
}
```

#### Using the Locale Switcher

```typescript
import { LocaleSwitcher } from '@/components/i18n/locale-switcher';

export function Header() {
  return (
    <header>
      <LocaleSwitcher />
    </header>
  );
}
```

#### Using LocaleLink

```typescript
import { LocaleLink } from '@/components/i18n/locale-link';

export function Navigation() {
  return (
    <nav>
      <LocaleLink href="/dashboard">Dashboard</LocaleLink>
      <LocaleLink href="/settings">Settings</LocaleLink>
    </nav>
  );
}
```

### API (NestJS)

#### Using in Controllers

```typescript
import { Controller, Get } from '@nestjs/common';
import { Locale } from '@/decorators/i18n.decorator';
import { I18nService } from '@/i18n/i18n.service';

@Controller('users')
export class UsersController {
  constructor(private readonly i18nService: I18nService) {}

  @Get()
  findAll(@Locale() locale: Locale) {
    return {
      message: this.i18nService.translate('common.success', locale),
      data: [],
    };
  }

  @Post()
  create(@Body() dto: CreateUserDto, @Locale() locale: Locale) {
    // ... create user
    return {
      message: this.i18nService.translate('auth.registerSuccess', locale),
      data: user,
    };
  }
}
```

#### Using with Parameters

```typescript
@Post('reset-password')
resetPassword(@Body() dto: ResetPasswordDto, @Locale() locale: Locale) {
  // ... reset password logic

  return {
    message: this.i18nService.translate('auth.passwordChanged', locale),
  };
}

@Get(':id')
findOne(@Param('id') id: string, @Locale() locale: Locale) {
  const user = await this.usersService.findOne(id);

  if (!user) {
    throw new NotFoundException(
      this.i18nService.translate('auth.userNotFound', locale)
    );
  }

  return user;
}
```

#### Using with Validation Errors

```typescript
@Post()
async create(@Body() dto: CreateUserDto, @Locale() locale: Locale) {
  // Check if email exists
  const exists = await this.usersService.findByEmail(dto.email);

  if (exists) {
    throw new ConflictException(
      this.i18nService.translate('auth.emailAlreadyExists', locale)
    );
  }

  return this.usersService.create(dto);
}
```

#### With Translation Parameters

```typescript
@Get('modules/:id')
async getModule(@Param('id') id: string, @Locale() locale: Locale) {
  const module = await this.modulesService.findOne(id);

  if (!module.dependency) {
    throw new BadRequestException(
      this.i18nService.translate('modules.dependencyMissing', locale, {
        dependency: module.requiredDependency
      })
    );
  }

  return module;
}
```

## File Structure

```
C:/Users/rsori/codex/ait-core-soriano/
├── apps/
│   ├── web/
│   │   ├── i18n.config.ts                    # Main i18n config
│   │   ├── src/
│   │   │   ├── i18n/
│   │   │   │   └── request.ts                # next-intl request config
│   │   │   ├── locales/
│   │   │   │   ├── es-ES.json                # Spanish web translations
│   │   │   │   └── en-US.json                # English web translations
│   │   │   ├── lib/
│   │   │   │   └── i18n/
│   │   │   │       ├── utils.ts              # i18n utilities
│   │   │   │       └── formatters.ts         # Formatting functions
│   │   │   ├── hooks/
│   │   │   │   ├── use-locale.ts             # Locale hook
│   │   │   │   └── use-formatter.ts          # Formatter hook
│   │   │   ├── components/
│   │   │   │   └── i18n/
│   │   │   │       ├── locale-switcher.tsx   # Locale switcher component
│   │   │   │       └── locale-link.tsx       # Locale-aware link
│   │   │   └── middleware.ts                 # i18n middleware
│   │   └── next.config.mjs                   # Next.js config with i18n
│   │
│   └── api/
│       └── src/
│           ├── i18n/
│           │   ├── i18n.config.ts            # API i18n config
│           │   ├── i18n.service.ts           # i18n service
│           │   ├── i18n.module.ts            # i18n module
│           │   └── translations/
│           │       ├── es-ES.json            # Spanish API messages
│           │       └── en-US.json            # English API messages
│           ├── decorators/
│           │   └── i18n.decorator.ts         # i18n decorators
│           └── middleware/
│               └── i18n.middleware.ts        # API i18n middleware
│
└── I18N_SETUP_GUIDE.md                       # This file
```

## Best Practices

### 1. Translation Keys

Use namespaced keys for better organization:

```typescript
// Good
t('auth.loginSuccess')
t('dashboard.welcome')
t('insurance.policyCreated')

// Avoid
t('loginSuccess')
t('welcome')
```

### 2. Parameter Interpolation

Use parameters for dynamic content:

```typescript
// Translation file
{
  "validation": {
    "minLength": "Must be at least {min} characters"
  }
}

// Usage
t('validation.minLength', { min: 8 })
```

### 3. Pluralization

For count-based translations:

```typescript
// Translation file
{
  "items": {
    "one": "{count} item",
    "other": "{count} items"
  }
}

// Usage (next-intl handles pluralization)
t('items', { count: 1 })  // "1 item"
t('items', { count: 5 })  // "5 items"
```

### 4. Date and Number Formatting

Always use formatters for locale-specific formatting:

```typescript
const format = useFormatter();

// Date formatting
format.date(new Date(), 'medium')          // es-ES: "28 ene 2026"
                                           // en-US: "Jan 28, 2026"

// Currency formatting
format.currency(1234.56)                   // es-ES: "1.234,56 €"
                                           // en-US: "$1,234.56"

// Number formatting
format.number(1234.56)                     // es-ES: "1.234,56"
                                           // en-US: "1,234.56"
```

### 5. Loading Translations

Keep translation files organized and split by feature:

```json
{
  "common": { ... },
  "auth": { ... },
  "dashboard": { ... },
  "insurance": { ... }
}
```

### 6. Error Messages

Always provide translated error messages:

```typescript
// API
throw new NotFoundException(
  this.i18nService.translate('common.notFound', locale)
);

// Web
const t = useTranslations('errors');
toast.error(t('networkError'));
```

### 7. SEO Considerations

Use locale in metadata:

```typescript
// app/[locale]/layout.tsx
export async function generateMetadata({ params: { locale } }) {
  return {
    title: locale === 'es-ES' ? 'Mi Aplicación' : 'My Application',
    description: locale === 'es-ES'
      ? 'Descripción en español'
      : 'English description',
  };
}
```

### 8. Locale Persistence

The locale is persisted via:
- Cookie: `NEXT_LOCALE` (web) / `LOCALE` (API)
- URL: `/es-ES/dashboard` (web)
- HTTP Header: `Accept-Language` (fallback)

### 9. Testing i18n

Test with different locales:

```typescript
// Test Spanish
document.cookie = 'NEXT_LOCALE=es-ES';

// Test English
document.cookie = 'NEXT_LOCALE=en-US';
```

### 10. Adding New Locales

To add a new locale:

1. Update `i18n.config.ts`:
```typescript
export const locales: Locale[] = ['es-ES', 'en-US', 'fr-FR'];
```

2. Create translation files:
   - `apps/web/src/locales/fr-FR.json`
   - `apps/api/src/i18n/translations/fr-FR.json`

3. Add to formatters if needed:
```typescript
const localeMap = {
  'es-ES': es,
  'en-US': enUS,
  'fr-FR': fr,
};
```

## Environment Variables

No additional environment variables required for i18n setup.

## Troubleshooting

### Translations Not Updating

1. Clear Next.js cache: `rm -rf .next`
2. Restart dev server
3. Check translation file syntax (valid JSON)

### Locale Not Detected

1. Check middleware configuration
2. Verify cookie name matches configuration
3. Check Accept-Language header format

### Formatting Issues

1. Verify `date-fns` locale import
2. Check locale format (e.g., 'es-ES' not 'es')
3. Ensure formatters are using correct locale

## Additional Resources

- [next-intl Documentation](https://next-intl-docs.vercel.app/)
- [Date-fns Documentation](https://date-fns.org/)
- [MDN Intl API](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl)

## Support

For issues or questions, contact the development team.

---

**Last Updated**: January 28, 2026
**Version**: 1.0.0
