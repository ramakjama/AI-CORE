# i18n Setup - AIT-CORE Soriano

Complete internationalization setup for Spanish (es-ES) and English (en-US).

## 🌍 Overview

This project includes a production-ready i18n implementation for both the Next.js web application and NestJS API, supporting:

- **Spanish (es-ES)** - Default locale
- **English (en-US)** - Secondary locale

## 📚 Documentation

| Document | Description |
|----------|-------------|
| [**I18N_INSTALLATION.md**](./I18N_INSTALLATION.md) | Step-by-step installation guide |
| [**I18N_SETUP_GUIDE.md**](./I18N_SETUP_GUIDE.md) | Complete usage guide and API reference |
| [**I18N_QUICK_REFERENCE.md**](./I18N_QUICK_REFERENCE.md) | Quick reference and cheat sheet |

## 🚀 Quick Start

### 1. Install Dependencies

```bash
cd apps/web
pnpm add next-intl @formatjs/intl-localematcher negotiator date-fns
pnpm add -D @types/negotiator
```

### 2. Use in Components

**Web App:**
```typescript
import { useTranslations } from 'next-intl';

export function MyComponent() {
  const t = useTranslations('common');
  return <h1>{t('welcome')}</h1>;
}
```

**API:**
```typescript
import { Locale } from '@/decorators/i18n.decorator';
import { I18nService } from '@/i18n/i18n.service';

@Get()
getData(@Locale() locale: Locale) {
  return {
    message: this.i18nService.translate('common.success', locale)
  };
}
```

## 📁 File Structure

```
ait-core-soriano/
├── apps/
│   ├── web/
│   │   ├── i18n.config.ts                    # Main config
│   │   ├── src/
│   │   │   ├── i18n/request.ts               # Next-intl config
│   │   │   ├── locales/
│   │   │   │   ├── es-ES.json                # Spanish translations
│   │   │   │   └── en-US.json                # English translations
│   │   │   ├── lib/i18n/
│   │   │   │   ├── utils.ts                  # Utilities
│   │   │   │   └── formatters.ts             # Formatters
│   │   │   ├── hooks/
│   │   │   │   ├── use-locale.ts             # Locale hook
│   │   │   │   └── use-formatter.ts          # Formatter hook
│   │   │   └── components/i18n/
│   │   │       ├── locale-switcher.tsx       # Switcher component
│   │   │       └── locale-link.tsx           # Locale link
│   │   └── next.config.mjs                   # Next.js config
│   │
│   └── api/
│       └── src/
│           ├── i18n/
│           │   ├── i18n.config.ts            # API config
│           │   ├── i18n.service.ts           # i18n service
│           │   ├── i18n.module.ts            # i18n module
│           │   └── translations/
│           │       ├── es-ES.json            # Spanish API messages
│           │       └── en-US.json            # English API messages
│           ├── decorators/i18n.decorator.ts  # Decorators
│           └── middleware/i18n.middleware.ts # Middleware
│
├── I18N_README.md                            # This file
├── I18N_INSTALLATION.md                      # Installation guide
├── I18N_SETUP_GUIDE.md                       # Complete guide
└── I18N_QUICK_REFERENCE.md                   # Quick reference
```

## ✨ Features

### Web App (Next.js)
- ✅ Client and server-side translations
- ✅ Automatic locale detection
- ✅ URL-based locale routing (`/es-ES/dashboard`)
- ✅ Locale switcher component
- ✅ Date/number/currency formatters
- ✅ Relative time formatting
- ✅ Cookie-based locale persistence
- ✅ SEO-friendly with locale metadata

### API (NestJS)
- ✅ Custom i18n service
- ✅ Locale detection from headers/cookies/query
- ✅ Translated API responses
- ✅ Translated error messages
- ✅ Parameter interpolation
- ✅ Global i18n module
- ✅ Decorator-based locale access

## 🎯 Key Components

### Translation Files

**Web Translations** (`apps/web/src/locales/`):
- Comprehensive UI translations
- Form labels and buttons
- Validation messages
- Navigation items
- Dashboard content
- Module-specific translations

**API Translations** (`apps/api/src/i18n/translations/`):
- Success/error messages
- Authentication responses
- Validation errors
- Business logic messages
- System notifications

### Utilities

**Hooks:**
- `useLocale()` - Access and change locale
- `useFormatter()` - Format dates, numbers, currency

**Formatters:**
- Date formatting (short, medium, long, full)
- Time formatting
- Currency formatting (EUR, USD, GBP)
- Number formatting
- Percentage formatting
- File size formatting
- Phone number formatting
- Relative time formatting
- List formatting

**Components:**
- `LocaleSwitcher` - Dropdown to change locale
- `LocaleLink` - Locale-aware navigation link

### API Tools

**Service:**
- `I18nService` - Main translation service
- Automatic translation file loading
- Parameter interpolation
- Locale detection

**Decorators:**
- `@Locale()` - Get current locale in controllers
- `@Translate()` - Get translation function

**Middleware:**
- Automatic locale detection
- Content-Language header
- i18n service injection

## 📝 Translation Keys

Organized by feature namespace:

```typescript
common.*          // Common UI strings
auth.*            // Authentication
dashboard.*       // Dashboard
navigation.*      // Navigation items
insurance.*       // Insurance module
accounting.*      // Accounting module
crm.*             // CRM module
marketing.*       // Marketing module
reports.*         // Reports
settings.*        // Settings
notifications.*   // Notifications
validation.*      // Validation messages
errors.*          // Error messages
dates.*           // Date-related strings
units.*           // Units (currency, time, size)
```

## 🔧 Configuration

### Supported Locales

```typescript
type Locale = 'es-ES' | 'en-US';
const defaultLocale = 'es-ES';
```

### Date Formats

| Locale | Short | Medium | Long |
|--------|-------|--------|------|
| es-ES | dd/MM/yyyy | dd MMM yyyy | dd MMMM yyyy |
| en-US | MM/dd/yyyy | MMM dd, yyyy | MMMM dd, yyyy |

### Number Formats

| Locale | Decimal | Thousands | Currency |
|--------|---------|-----------|----------|
| es-ES | , | . | EUR (€) |
| en-US | . | , | USD ($) |

### Locale Detection

**Web App Priority:**
1. URL path (`/es-ES/...`)
2. Cookie (`NEXT_LOCALE`)
3. Browser language
4. Default locale

**API Priority:**
1. Query parameter (`?locale=en-US`)
2. Cookie (`LOCALE`)
3. Accept-Language header
4. Default locale

## 📖 Usage Examples

### Basic Translation

```typescript
const t = useTranslations('common');
<button>{t('save')}</button>  // "Guardar" / "Save"
```

### With Parameters

```typescript
const t = useTranslations('validation');
t('minLength', { min: 8 })  // "Debe tener al menos 8 caracteres"
```

### Format Currency

```typescript
const format = useFormatter();
format.currency(1234.56)  // "1.234,56 €" (es-ES) / "$1,234.56" (en-US)
```

### Format Date

```typescript
format.date(new Date(), 'medium')  // "28 ene 2026" / "Jan 28, 2026"
```

### API Translation

```typescript
@Post()
create(@Locale() locale: Locale) {
  return {
    message: this.i18nService.translate('common.created', locale),
    data: result
  };
}
```

## 🧪 Testing

### Test Web App

```bash
# Terminal 1
cd apps/web
pnpm dev

# Visit http://localhost:3000
# Should redirect to http://localhost:3000/es-ES/

# Switch locale in UI or via cookie:
document.cookie = 'NEXT_LOCALE=en-US; path=/;'
location.reload()
```

### Test API

```bash
# Terminal 2
cd apps/api
pnpm start:dev

# Test Spanish
curl -H "Accept-Language: es-ES" http://localhost:3001/api/v1/health

# Test English
curl -H "Accept-Language: en-US" http://localhost:3001/api/v1/health
```

## 🎨 Best Practices

1. **Always use namespaced keys**: `auth.login` not `login`
2. **Use formatters**: Don't manually format dates/numbers
3. **Translate all UI strings**: No hardcoded text
4. **Use parameters**: For dynamic content
5. **Test both locales**: Before deploying
6. **Keep translations organized**: By feature
7. **Use LocaleLink**: For internal navigation
8. **Set locale in metadata**: For SEO

## 🔄 Adding New Translations

1. Add key to both translation files:
   - `apps/web/src/locales/es-ES.json`
   - `apps/web/src/locales/en-US.json`
   - `apps/api/src/i18n/translations/es-ES.json`
   - `apps/api/src/i18n/translations/en-US.json`

2. Use in code:
   ```typescript
   const t = useTranslations('namespace');
   t('newKey')
   ```

## 🌐 Adding New Locales

To add French (fr-FR):

1. Update `i18n.config.ts`:
   ```typescript
   export const locales = ['es-ES', 'en-US', 'fr-FR'];
   ```

2. Create translation files:
   - `apps/web/src/locales/fr-FR.json`
   - `apps/api/src/i18n/translations/fr-FR.json`

3. Add to formatters:
   ```typescript
   import { fr } from 'date-fns/locale';
   const localeMap = { 'es-ES': es, 'en-US': enUS, 'fr-FR': fr };
   ```

## 🐛 Troubleshooting

| Issue | Solution |
|-------|----------|
| Translations not loading | Clear `.next` cache, restart server |
| Locale not detected | Check cookie name, verify middleware |
| Format not working | Check locale format (es-ES not es) |
| TypeScript errors | Run `pnpm type-check` |
| Module not found | Clear node_modules, reinstall |

## 📚 Resources

- [Next.js i18n](https://nextjs.org/docs/app/building-your-application/routing/internationalization)
- [next-intl Documentation](https://next-intl-docs.vercel.app/)
- [date-fns Documentation](https://date-fns.org/)
- [Intl API Reference](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl)

## 📊 Statistics

- **Translation Keys**: 400+ (web) + 100+ (API)
- **Supported Locales**: 2 (es-ES, en-US)
- **Translation Files**: 4 total
- **Utility Functions**: 20+
- **Components**: 2
- **Hooks**: 2
- **Format Functions**: 10+

## 🎯 Production Ready

This i18n setup is production-ready with:

- ✅ Server-side rendering support
- ✅ SEO optimization
- ✅ Performance optimized
- ✅ Cookie-based persistence
- ✅ Type-safe
- ✅ Fully tested
- ✅ Comprehensive documentation
- ✅ Easy to maintain
- ✅ Scalable architecture
- ✅ Error handling

## 📞 Support

For questions or issues:

1. Check the documentation files
2. Review example code
3. Check console for errors
4. Contact development team

---

**Version**: 1.0.0
**Last Updated**: January 28, 2026
**Author**: AIN TECH - Soriano Mediadores
**License**: PROPRIETARY
