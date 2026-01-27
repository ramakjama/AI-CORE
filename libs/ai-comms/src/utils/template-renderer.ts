/**
 * Template Renderer
 * Handlebars-based template rendering with helpers
 */

import Handlebars from 'handlebars';
import { format, formatDistance, formatRelative, parseISO, isValid } from 'date-fns';
import { es, enUS } from 'date-fns/locale';

export interface RenderOptions {
  locale?: string;
  timezone?: string;
  escapeHtml?: boolean;
  strict?: boolean;
}

export interface TemplateRenderResult {
  success: boolean;
  output?: string;
  errors?: string[];
}

export interface CompiledTemplate {
  id: string;
  template: Handlebars.TemplateDelegate;
  variables: string[];
  compiledAt: Date;
}

const localeMap: Record<string, Locale> = {
  es: es,
  en: enUS
};

/**
 * Template Renderer Class
 * Provides Handlebars template rendering with custom helpers
 */
export class TemplateRenderer {
  private handlebars: typeof Handlebars;
  private compiledTemplates: Map<string, CompiledTemplate> = new Map();
  private defaultOptions: RenderOptions;

  constructor(options: RenderOptions = {}) {
    this.handlebars = Handlebars.create();
    this.defaultOptions = {
      locale: 'es',
      escapeHtml: true,
      strict: false,
      ...options
    };
    this.registerHelpers();
  }

  /**
   * Register custom Handlebars helpers
   */
  private registerHelpers(): void {
    // Date formatting
    this.handlebars.registerHelper('formatDate', (date: string | Date, formatStr: string, options?: Handlebars.HelperOptions) => {
      const dateObj = typeof date === 'string' ? parseISO(date) : date;
      if (!isValid(dateObj)) return '';
      const locale = options?.hash?.locale || this.defaultOptions.locale;
      return format(dateObj, formatStr || 'dd/MM/yyyy', { locale: localeMap[locale!] || es });
    });

    this.handlebars.registerHelper('formatDateTime', (date: string | Date, options?: Handlebars.HelperOptions) => {
      const dateObj = typeof date === 'string' ? parseISO(date) : date;
      if (!isValid(dateObj)) return '';
      const locale = options?.hash?.locale || this.defaultOptions.locale;
      return format(dateObj, "dd/MM/yyyy 'a las' HH:mm", { locale: localeMap[locale!] || es });
    });

    this.handlebars.registerHelper('timeAgo', (date: string | Date, options?: Handlebars.HelperOptions) => {
      const dateObj = typeof date === 'string' ? parseISO(date) : date;
      if (!isValid(dateObj)) return '';
      const locale = options?.hash?.locale || this.defaultOptions.locale;
      return formatDistance(dateObj, new Date(), { addSuffix: true, locale: localeMap[locale!] || es });
    });

    this.handlebars.registerHelper('relativeDate', (date: string | Date, options?: Handlebars.HelperOptions) => {
      const dateObj = typeof date === 'string' ? parseISO(date) : date;
      if (!isValid(dateObj)) return '';
      const locale = options?.hash?.locale || this.defaultOptions.locale;
      return formatRelative(dateObj, new Date(), { locale: localeMap[locale!] || es });
    });

    // Number formatting
    this.handlebars.registerHelper('formatNumber', (num: number, options?: Handlebars.HelperOptions) => {
      if (typeof num !== 'number') return '';
      const decimals = options?.hash?.decimals ?? 2;
      const locale = options?.hash?.locale || this.defaultOptions.locale;
      return num.toLocaleString(locale === 'es' ? 'es-ES' : 'en-US', {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals
      });
    });

    this.handlebars.registerHelper('formatCurrency', (num: number, options?: Handlebars.HelperOptions) => {
      if (typeof num !== 'number') return '';
      const currency = options?.hash?.currency || 'EUR';
      const locale = options?.hash?.locale || this.defaultOptions.locale;
      return num.toLocaleString(locale === 'es' ? 'es-ES' : 'en-US', {
        style: 'currency',
        currency
      });
    });

    this.handlebars.registerHelper('formatPercent', (num: number, options?: Handlebars.HelperOptions) => {
      if (typeof num !== 'number') return '';
      const decimals = options?.hash?.decimals ?? 1;
      return `${(num * 100).toFixed(decimals)}%`;
    });

    // String helpers
    this.handlebars.registerHelper('uppercase', (str: string) => {
      return typeof str === 'string' ? str.toUpperCase() : '';
    });

    this.handlebars.registerHelper('lowercase', (str: string) => {
      return typeof str === 'string' ? str.toLowerCase() : '';
    });

    this.handlebars.registerHelper('capitalize', (str: string) => {
      if (typeof str !== 'string') return '';
      return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
    });

    this.handlebars.registerHelper('titleCase', (str: string) => {
      if (typeof str !== 'string') return '';
      return str.replace(/\w\S*/g, (txt) => txt.charAt(0).toUpperCase() + txt.slice(1).toLowerCase());
    });

    this.handlebars.registerHelper('truncate', (str: string, length: number, options?: Handlebars.HelperOptions) => {
      if (typeof str !== 'string') return '';
      const suffix = options?.hash?.suffix ?? '...';
      if (str.length <= length) return str;
      return str.substring(0, length) + suffix;
    });

    this.handlebars.registerHelper('padLeft', (str: string, length: number, char: string = ' ') => {
      return String(str).padStart(length, char);
    });

    this.handlebars.registerHelper('padRight', (str: string, length: number, char: string = ' ') => {
      return String(str).padEnd(length, char);
    });

    // Conditional helpers
    this.handlebars.registerHelper('eq', (a: unknown, b: unknown) => a === b);
    this.handlebars.registerHelper('neq', (a: unknown, b: unknown) => a !== b);
    this.handlebars.registerHelper('gt', (a: number, b: number) => a > b);
    this.handlebars.registerHelper('gte', (a: number, b: number) => a >= b);
    this.handlebars.registerHelper('lt', (a: number, b: number) => a < b);
    this.handlebars.registerHelper('lte', (a: number, b: number) => a <= b);

    this.handlebars.registerHelper('and', (...args: unknown[]) => {
      args.pop(); // Remove options object
      return args.every(Boolean);
    });

    this.handlebars.registerHelper('or', (...args: unknown[]) => {
      args.pop(); // Remove options object
      return args.some(Boolean);
    });

    this.handlebars.registerHelper('not', (value: unknown) => !value);

    this.handlebars.registerHelper('ifCond', function(v1: unknown, operator: string, v2: unknown, options: Handlebars.HelperOptions) {
      switch (operator) {
        case '==': return v1 == v2 ? options.fn(this) : options.inverse(this);
        case '===': return v1 === v2 ? options.fn(this) : options.inverse(this);
        case '!=': return v1 != v2 ? options.fn(this) : options.inverse(this);
        case '!==': return v1 !== v2 ? options.fn(this) : options.inverse(this);
        case '<': return (v1 as number) < (v2 as number) ? options.fn(this) : options.inverse(this);
        case '<=': return (v1 as number) <= (v2 as number) ? options.fn(this) : options.inverse(this);
        case '>': return (v1 as number) > (v2 as number) ? options.fn(this) : options.inverse(this);
        case '>=': return (v1 as number) >= (v2 as number) ? options.fn(this) : options.inverse(this);
        case '&&': return v1 && v2 ? options.fn(this) : options.inverse(this);
        case '||': return v1 || v2 ? options.fn(this) : options.inverse(this);
        default: return options.inverse(this);
      }
    });

    // Array helpers
    this.handlebars.registerHelper('first', (arr: unknown[]) => {
      return Array.isArray(arr) && arr.length > 0 ? arr[0] : undefined;
    });

    this.handlebars.registerHelper('last', (arr: unknown[]) => {
      return Array.isArray(arr) && arr.length > 0 ? arr[arr.length - 1] : undefined;
    });

    this.handlebars.registerHelper('length', (arr: unknown[] | string) => {
      if (Array.isArray(arr)) return arr.length;
      if (typeof arr === 'string') return arr.length;
      return 0;
    });

    this.handlebars.registerHelper('join', (arr: unknown[], separator: string = ', ') => {
      return Array.isArray(arr) ? arr.join(separator) : '';
    });

    this.handlebars.registerHelper('contains', (arr: unknown[], value: unknown) => {
      return Array.isArray(arr) && arr.includes(value);
    });

    this.handlebars.registerHelper('range', (from: number, to: number) => {
      const result = [];
      for (let i = from; i <= to; i++) {
        result.push(i);
      }
      return result;
    });

    // Object helpers
    this.handlebars.registerHelper('json', (obj: unknown, options?: Handlebars.HelperOptions) => {
      const spaces = options?.hash?.pretty ? 2 : 0;
      return JSON.stringify(obj, null, spaces);
    });

    this.handlebars.registerHelper('get', (obj: Record<string, unknown>, key: string) => {
      return obj && typeof obj === 'object' ? obj[key] : undefined;
    });

    // Default value helper
    this.handlebars.registerHelper('default', (value: unknown, defaultValue: unknown) => {
      return value ?? defaultValue;
    });

    // Pluralization helper
    this.handlebars.registerHelper('pluralize', (count: number, singular: string, plural?: string) => {
      const pluralForm = plural || `${singular}s`;
      return count === 1 ? singular : pluralForm;
    });

    // Spanish pluralization
    this.handlebars.registerHelper('pluralEs', (count: number, singular: string, plural: string) => {
      return count === 1 ? singular : plural;
    });

    // URL encoding
    this.handlebars.registerHelper('encodeUri', (str: string) => {
      return encodeURIComponent(str);
    });

    // Safe HTML output
    this.handlebars.registerHelper('safe', (str: string) => {
      return new Handlebars.SafeString(str);
    });

    // Line breaks to <br>
    this.handlebars.registerHelper('nl2br', (str: string) => {
      if (typeof str !== 'string') return '';
      return new Handlebars.SafeString(str.replace(/\n/g, '<br>'));
    });
  }

  /**
   * Compile a template and cache it
   */
  compile(templateId: string, templateString: string): CompiledTemplate {
    const template = this.handlebars.compile(templateString, {
      strict: this.defaultOptions.strict
    });

    const variables = this.extractVariables(templateString);

    const compiled: CompiledTemplate = {
      id: templateId,
      template,
      variables,
      compiledAt: new Date()
    };

    this.compiledTemplates.set(templateId, compiled);
    return compiled;
  }

  /**
   * Extract variable names from template
   */
  extractVariables(templateString: string): string[] {
    const variableRegex = /\{\{(?!#|\/|!|>)([^}]+)\}\}/g;
    const variables = new Set<string>();
    let match;

    while ((match = variableRegex.exec(templateString)) !== null) {
      const variable = match[1].trim();
      // Extract just the variable name (before any helper or property access)
      const varName = variable.split(/[\s.|]/)[0];
      if (varName && !varName.startsWith('@') && !varName.startsWith('..')) {
        variables.add(varName);
      }
    }

    return Array.from(variables);
  }

  /**
   * Render a template with data
   */
  render(
    templateString: string,
    data: Record<string, unknown>,
    options?: RenderOptions
  ): TemplateRenderResult {
    try {
      const mergedOptions = { ...this.defaultOptions, ...options };

      const template = this.handlebars.compile(templateString, {
        strict: mergedOptions.strict
      });

      const output = template(data);

      return {
        success: true,
        output
      };
    } catch (error) {
      return {
        success: false,
        errors: [error instanceof Error ? error.message : String(error)]
      };
    }
  }

  /**
   * Render using a cached compiled template
   */
  renderCompiled(
    templateId: string,
    data: Record<string, unknown>
  ): TemplateRenderResult {
    const compiled = this.compiledTemplates.get(templateId);

    if (!compiled) {
      return {
        success: false,
        errors: [`Template not found: ${templateId}`]
      };
    }

    try {
      const output = compiled.template(data);
      return {
        success: true,
        output
      };
    } catch (error) {
      return {
        success: false,
        errors: [error instanceof Error ? error.message : String(error)]
      };
    }
  }

  /**
   * Validate template syntax
   */
  validate(templateString: string): { valid: boolean; errors: string[] } {
    try {
      this.handlebars.compile(templateString, { strict: true });
      return { valid: true, errors: [] };
    } catch (error) {
      return {
        valid: false,
        errors: [error instanceof Error ? error.message : String(error)]
      };
    }
  }

  /**
   * Validate data against template variables
   */
  validateData(
    templateString: string,
    data: Record<string, unknown>
  ): { valid: boolean; missingVariables: string[] } {
    const variables = this.extractVariables(templateString);
    const missingVariables: string[] = [];

    for (const variable of variables) {
      if (!(variable in data)) {
        missingVariables.push(variable);
      }
    }

    return {
      valid: missingVariables.length === 0,
      missingVariables
    };
  }

  /**
   * Register a custom helper
   */
  registerHelper(name: string, fn: Handlebars.HelperDelegate): void {
    this.handlebars.registerHelper(name, fn);
  }

  /**
   * Register a partial template
   */
  registerPartial(name: string, partial: string): void {
    this.handlebars.registerPartial(name, partial);
  }

  /**
   * Clear compiled template cache
   */
  clearCache(templateId?: string): void {
    if (templateId) {
      this.compiledTemplates.delete(templateId);
    } else {
      this.compiledTemplates.clear();
    }
  }

  /**
   * Get cache statistics
   */
  getCacheStats(): { size: number; templates: string[] } {
    return {
      size: this.compiledTemplates.size,
      templates: Array.from(this.compiledTemplates.keys())
    };
  }
}

// Default instance
export const templateRenderer = new TemplateRenderer();
