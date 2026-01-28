# i18n Quick Reference

Quick reference for using internationalization in AIT-CORE Soriano.

## Quick Start

### Install Dependencies (Web)

```bash
cd apps/web
pnpm add next-intl @formatjs/intl-localematcher negotiator
pnpm add -D @types/negotiator
```

## Common Usage Patterns

### Web App (Next.js)

#### 1. Basic Translation

```typescript
import { useTranslations } from 'next-intl';

const t = useTranslations('common');
t('welcome')  // "Bienvenido" (es-ES) / "Welcome" (en-US)
```

#### 2. With Parameters

```typescript
const t = useTranslations('validation');
t('minLength', { min: 8 })  // "Debe tener al menos 8 caracteres"
```

#### 3. Format Currency

```typescript
import { useFormatter } from '@/hooks/use-formatter';

const format = useFormatter();
format.currency(1234.56)  // "1.234,56 €" (es-ES) / "$1,234.56" (en-US)
```

#### 4. Format Date

```typescript
format.date(new Date(), 'medium')  // "28 ene 2026" (es-ES) / "Jan 28, 2026" (en-US)
```

#### 5. Locale Switcher

```typescript
import { LocaleSwitcher } from '@/components/i18n/locale-switcher';

<LocaleSwitcher />
```

#### 6. Change Locale Programmatically

```typescript
import { useLocale } from '@/hooks/use-locale';

const { locale, changeLocale } = useLocale();
changeLocale('en-US');
```

### API (NestJS)

#### 1. Get Locale from Request

```typescript
import { Locale } from '@/decorators/i18n.decorator';

@Get()
findAll(@Locale() locale: Locale) {
  // locale is 'es-ES' or 'en-US'
}
```

#### 2. Translate API Response

```typescript
import { I18nService } from '@/i18n/i18n.service';

constructor(private readonly i18nService: I18nService) {}

@Post()
create(@Locale() locale: Locale) {
  return {
    message: this.i18nService.translate('common.created', locale)
  };
}
```

#### 3. Translate with Parameters

```typescript
this.i18nService.translate('validation.minLength', locale, { min: 8 })
```

#### 4. Translate Error Messages

```typescript
throw new NotFoundException(
  this.i18nService.translate('common.notFound', locale)
);
```

## Translation Keys Structure

```
common.{key}         // Common UI strings
auth.{key}           // Authentication
dashboard.{key}      // Dashboard
insurance.{key}      // Insurance module
accounting.{key}     // Accounting module
crm.{key}            // CRM module
validation.{key}     // Validation messages
errors.{key}         // Error messages
```

## Format Functions

```typescript
const format = useFormatter();

// Date & Time
format.date(date, 'short' | 'medium' | 'long' | 'full')
format.time(date, 'short' | 'medium' | 'long')
format.dateTime(date, dateFormat, timeFormat)
format.relativeTime(date)  // "hace 2 días" / "2 days ago"

// Numbers
format.number(1234.56)
format.currency(1234.56, 'EUR')
format.percentage(75)
format.fileSize(1024000)  // "1 MB"

// Other
format.phoneNumber('+34666777888')
format.list(['a', 'b', 'c'])  // "a, b y c" / "a, b and c"
```

## File Locations

### Web Translations
- Spanish: `apps/web/src/locales/es-ES.json`
- English: `apps/web/src/locales/en-US.json`

### API Translations
- Spanish: `apps/api/src/i18n/translations/es-ES.json`
- English: `apps/api/src/i18n/translations/en-US.json`

## Locale Detection Priority

### Web App
1. URL parameter: `/es-ES/dashboard`
2. Cookie: `NEXT_LOCALE`
3. Browser: `navigator.language`
4. Default: `es-ES`

### API
1. Query parameter: `?locale=en-US`
2. Cookie: `LOCALE`
3. Header: `Accept-Language`
4. Default: `es-ES`

## Common Patterns

### Protected Route with Locale

```typescript
// app/[locale]/dashboard/page.tsx
import { useTranslations } from 'next-intl';

export default function DashboardPage() {
  const t = useTranslations('dashboard');
  return <h1>{t('title')}</h1>;
}
```

### API Response with Translation

```typescript
@Get()
async findAll(@Locale() locale: Locale) {
  const data = await this.service.findAll();

  return {
    success: true,
    message: this.i18nService.translate('common.success', locale),
    data
  };
}
```

### Form Validation with i18n

```typescript
'use client';
import { useTranslations } from 'next-intl';

export function LoginForm() {
  const t = useTranslations('auth');
  const v = useTranslations('validation');

  const validateEmail = (email: string) => {
    if (!email) return v('required', { field: t('email') });
    if (!isValidEmail(email)) return v('email');
    return null;
  };
}
```

### Dynamic Metadata with Locale

```typescript
// app/[locale]/layout.tsx
export async function generateMetadata({ params: { locale } }) {
  const t = await getTranslations({ locale, namespace: 'common' });

  return {
    title: t('appName'),
    description: t('appDescription'),
  };
}
```

## Best Practices Checklist

- ✅ Use namespaced keys (`auth.login` not `login`)
- ✅ Use formatters for dates/numbers/currency
- ✅ Always translate error messages
- ✅ Use parameters for dynamic content
- ✅ Keep translation files organized
- ✅ Test both locales
- ✅ Use LocaleLink for internal navigation
- ✅ Set locale in metadata for SEO

## Cheat Sheet

| Task | Web (Next.js) | API (NestJS) |
|------|---------------|--------------|
| Get current locale | `useLocale()` | `@Locale()` |
| Translate text | `t('key')` | `i18nService.translate('key', locale)` |
| Format currency | `format.currency(100)` | N/A |
| Format date | `format.date(date)` | N/A |
| Change locale | `changeLocale('en-US')` | N/A |
| Get all translations | `useTranslations('namespace')` | `i18nService.getTranslations(locale)` |

## Quick Commands

```bash
# Add new translation key
# 1. Edit apps/web/src/locales/es-ES.json
# 2. Edit apps/web/src/locales/en-US.json
# 3. Edit apps/api/src/i18n/translations/es-ES.json
# 4. Edit apps/api/src/i18n/translations/en-US.json

# Clear Next.js cache
cd apps/web && rm -rf .next

# Test locale switching
# In browser console:
document.cookie = 'NEXT_LOCALE=en-US; path=/;'
location.reload()
```

---

**Quick Tip**: Use `Ctrl+F` to search for translation keys in JSON files!
