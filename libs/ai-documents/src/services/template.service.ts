/**
 * Template Service
 * Manages document templates, rendering, and PDF generation
 */

import { v4 as uuidv4 } from 'uuid';
import Handlebars from 'handlebars';
import {
  Template,
  TemplateField,
  TemplateVariable,
  TemplateVersion,
  TemplateFieldType,
  FieldValidation,
  PageSettings,
  RenderOptions,
  OperationResult,
  ValidationError
} from '../types';

/**
 * Context interface for operations
 */
export interface OperationContext {
  tenantId: string;
  userId: string;
  userEmail?: string;
}

/**
 * Template repository interface
 */
export interface ITemplateRepository {
  create(template: Template): Promise<Template>;
  update(id: string, data: Partial<Template>): Promise<Template>;
  findById(id: string): Promise<Template | null>;
  findByCode(tenantId: string, code: string): Promise<Template | null>;
  findByCategory(tenantId: string, category: string): Promise<Template[]>;
  findAll(tenantId: string): Promise<Template[]>;
  delete(id: string): Promise<void>;

  // Versions
  createVersion(version: TemplateVersion): Promise<TemplateVersion>;
  getVersions(templateId: string): Promise<TemplateVersion[]>;
  getActiveVersion(templateId: string): Promise<TemplateVersion | null>;
}

/**
 * PDF generator interface
 */
export interface IPDFGenerator {
  generateFromHtml(html: string, options?: PDFGeneratorOptions): Promise<Buffer>;
}

/**
 * PDF generator options
 */
export interface PDFGeneratorOptions {
  format?: 'A4' | 'A3' | 'Letter' | 'Legal';
  orientation?: 'portrait' | 'landscape';
  margins?: { top: number; right: number; bottom: number; left: number };
  headerTemplate?: string;
  footerTemplate?: string;
  pageNumbers?: boolean;
  displayHeaderFooter?: boolean;
}

/**
 * Template validation result
 */
export interface TemplateValidationResult {
  isValid: boolean;
  errors: ValidationError[];
  warnings: string[];
  missingFields: string[];
  extraFields: string[];
}

/**
 * Render result
 */
export interface RenderResult {
  content: string | Buffer;
  format: 'html' | 'pdf' | 'docx';
  metadata: {
    templateId: string;
    templateCode: string;
    versionNumber: number;
    renderedAt: Date;
    pageCount?: number;
  };
}

/**
 * Template Service Class
 */
export class TemplateService {
  private repository: ITemplateRepository;
  private pdfGenerator: IPDFGenerator;
  private compiledTemplates: Map<string, HandlebarsTemplateDelegate>;
  private handlebars: typeof Handlebars;

  constructor(repository: ITemplateRepository, pdfGenerator: IPDFGenerator) {
    this.repository = repository;
    this.pdfGenerator = pdfGenerator;
    this.compiledTemplates = new Map();
    this.handlebars = Handlebars.create();
    this.registerHelpers();
  }

  // ============================================================================
  // TEMPLATE CRUD OPERATIONS
  // ============================================================================

  /**
   * Create a new template
   */
  async create(
    name: string,
    content: string,
    fields: Partial<TemplateField>[],
    context: OperationContext,
    options: {
      code?: string;
      description?: string;
      category?: string;
      outputFormat?: 'pdf' | 'html' | 'docx' | 'xlsx' | 'txt';
      headerTemplate?: string;
      footerTemplate?: string;
      styles?: string;
      pageSettings?: PageSettings;
    } = {}
  ): Promise<OperationResult<Template>> {
    try {
      const templateId = uuidv4();
      const versionId = uuidv4();
      const code = options.code || this.generateCode(name);

      // Check if code already exists
      const existing = await this.repository.findByCode(context.tenantId, code);
      if (existing) {
        return { success: false, message: `Template with code '${code}' already exists` };
      }

      // Extract variables from content
      const variables = this.extractVariables(content);

      // Normalize fields
      const normalizedFields = this.normalizeFields(fields, templateId);

      // Compile and validate template
      const compilationResult = this.compileTemplate(content);
      if (!compilationResult.success) {
        return {
          success: false,
          message: 'Template compilation failed',
          errors: compilationResult.errors
        };
      }

      // Create version
      const version: TemplateVersion = {
        id: versionId,
        templateId,
        versionNumber: 1,
        content,
        compiledContent: compilationResult.compiled,
        fields: normalizedFields,
        variables,
        createdAt: new Date(),
        createdBy: context.userId,
        comment: 'Initial version',
        isActive: true
      };

      // Create template
      const template: Template = {
        id: templateId,
        tenantId: context.tenantId,
        code,
        name,
        description: options.description,
        category: options.category || 'general',
        outputFormat: options.outputFormat || 'pdf',
        content,
        compiledContent: compilationResult.compiled,
        fields: normalizedFields,
        variables,
        currentVersionId: versionId,
        currentVersionNumber: 1,
        versions: [version],
        headerTemplate: options.headerTemplate,
        footerTemplate: options.footerTemplate,
        styles: options.styles,
        pageSettings: options.pageSettings || this.getDefaultPageSettings(),
        isActive: true,
        isDefault: false,
        usageCount: 0,
        createdAt: new Date(),
        createdBy: context.userId,
        updatedAt: new Date(),
        updatedBy: context.userId
      };

      const savedTemplate = await this.repository.create(template);
      await this.repository.createVersion(version);

      // Cache compiled template
      this.compiledTemplates.set(code, compilationResult.template!);

      return {
        success: true,
        data: savedTemplate,
        message: 'Template created successfully'
      };
    } catch (error) {
      return {
        success: false,
        message: 'Failed to create template',
        errors: [(error as Error).message]
      };
    }
  }

  /**
   * Update an existing template
   */
  async update(
    templateId: string,
    changes: {
      name?: string;
      content?: string;
      fields?: Partial<TemplateField>[];
      description?: string;
      category?: string;
      headerTemplate?: string;
      footerTemplate?: string;
      styles?: string;
      pageSettings?: PageSettings;
      isActive?: boolean;
    },
    context: OperationContext,
    createNewVersion: boolean = true
  ): Promise<OperationResult<Template>> {
    try {
      const template = await this.repository.findById(templateId);
      if (!template) {
        return { success: false, message: 'Template not found' };
      }

      // If content changed, recompile and create new version
      if (changes.content && changes.content !== template.content) {
        const compilationResult = this.compileTemplate(changes.content);
        if (!compilationResult.success) {
          return {
            success: false,
            message: 'Template compilation failed',
            errors: compilationResult.errors
          };
        }

        if (createNewVersion) {
          const versionId = uuidv4();
          const newVersionNumber = template.currentVersionNumber + 1;

          // Extract new variables
          const variables = this.extractVariables(changes.content);
          const normalizedFields = changes.fields
            ? this.normalizeFields(changes.fields, templateId)
            : template.fields;

          // Create new version
          const version: TemplateVersion = {
            id: versionId,
            templateId,
            versionNumber: newVersionNumber,
            content: changes.content,
            compiledContent: compilationResult.compiled,
            fields: normalizedFields,
            variables,
            createdAt: new Date(),
            createdBy: context.userId,
            comment: `Version ${newVersionNumber}`,
            isActive: true
          };

          await this.repository.createVersion(version);

          changes = {
            ...changes,
            compiledContent: compilationResult.compiled
          } as typeof changes & { compiledContent: string };

          // Update template
          const updatedTemplate = await this.repository.update(templateId, {
            ...changes,
            variables,
            fields: normalizedFields,
            currentVersionId: versionId,
            currentVersionNumber: newVersionNumber,
            updatedAt: new Date(),
            updatedBy: context.userId
          });

          // Update cache
          this.compiledTemplates.set(template.code, compilationResult.template!);

          return {
            success: true,
            data: updatedTemplate,
            message: `Template updated to version ${newVersionNumber}`
          };
        }
      }

      // Simple update without version change
      const updatedTemplate = await this.repository.update(templateId, {
        ...changes,
        fields: changes.fields
          ? this.normalizeFields(changes.fields, templateId)
          : undefined,
        updatedAt: new Date(),
        updatedBy: context.userId
      });

      return {
        success: true,
        data: updatedTemplate,
        message: 'Template updated successfully'
      };
    } catch (error) {
      return {
        success: false,
        message: 'Failed to update template',
        errors: [(error as Error).message]
      };
    }
  }

  /**
   * Get active template by code
   */
  async getActive(
    templateCode: string,
    context: OperationContext
  ): Promise<OperationResult<Template>> {
    try {
      const template = await this.repository.findByCode(context.tenantId, templateCode);

      if (!template) {
        return { success: false, message: `Template '${templateCode}' not found` };
      }

      if (!template.isActive) {
        return { success: false, message: `Template '${templateCode}' is not active` };
      }

      return { success: true, data: template };
    } catch (error) {
      return {
        success: false,
        message: 'Failed to get template',
        errors: [(error as Error).message]
      };
    }
  }

  /**
   * List templates by category
   */
  async listByCategory(
    category: string,
    context: OperationContext
  ): Promise<OperationResult<Template[]>> {
    try {
      const templates = await this.repository.findByCategory(context.tenantId, category);
      return {
        success: true,
        data: templates.filter(t => t.isActive)
      };
    } catch (error) {
      return {
        success: false,
        message: 'Failed to list templates',
        errors: [(error as Error).message]
      };
    }
  }

  // ============================================================================
  // TEMPLATE RENDERING
  // ============================================================================

  /**
   * Render template with data
   */
  async render(
    templateCode: string,
    data: Record<string, unknown>,
    context: OperationContext,
    options: RenderOptions = {}
  ): Promise<OperationResult<RenderResult>> {
    try {
      const templateResult = await this.getActive(templateCode, context);
      if (!templateResult.success || !templateResult.data) {
        return { success: false, message: templateResult.message };
      }

      const template = templateResult.data;

      // Validate data against template fields
      const validationResult = await this.validateData(templateCode, data, context);
      if (!validationResult.success || !validationResult.data?.isValid) {
        return {
          success: false,
          message: 'Data validation failed',
          errors: validationResult.data?.errors.map(e => e.message) || []
        };
      }

      // Get or compile template
      let compiledTemplate = this.compiledTemplates.get(templateCode);
      if (!compiledTemplate) {
        const compilationResult = this.compileTemplate(template.content);
        if (!compilationResult.success) {
          return {
            success: false,
            message: 'Template compilation failed',
            errors: compilationResult.errors
          };
        }
        compiledTemplate = compilationResult.template!;
        this.compiledTemplates.set(templateCode, compiledTemplate);
      }

      // Prepare data with transformations
      const transformedData = this.transformData(data, template.variables);

      // Add common variables
      const renderData = {
        ...transformedData,
        _template: {
          code: template.code,
          name: template.name,
          version: template.currentVersionNumber
        },
        _meta: {
          generatedAt: new Date().toISOString(),
          generatedBy: context.userId
        },
        _page: {
          pageNumber: '{{pageNumber}}',
          totalPages: '{{totalPages}}'
        }
      };

      // Render HTML
      let html = compiledTemplate(renderData);

      // Add styles
      if (template.styles) {
        html = `<style>${template.styles}</style>${html}`;
      }

      // Determine output format
      const format = options.format || template.outputFormat || 'pdf';

      if (format === 'html') {
        return {
          success: true,
          data: {
            content: html,
            format: 'html',
            metadata: {
              templateId: template.id,
              templateCode: template.code,
              versionNumber: template.currentVersionNumber,
              renderedAt: new Date()
            }
          }
        };
      }

      // Generate PDF
      if (format === 'pdf') {
        // Render header and footer
        let headerHtml: string | undefined;
        let footerHtml: string | undefined;

        if (options.includeHeader !== false && template.headerTemplate) {
          const headerCompiled = this.handlebars.compile(template.headerTemplate);
          headerHtml = headerCompiled(renderData);
        }

        if (options.includeFooter !== false && template.footerTemplate) {
          const footerCompiled = this.handlebars.compile(template.footerTemplate);
          footerHtml = footerCompiled(renderData);
        }

        const pdfOptions: PDFGeneratorOptions = {
          format: template.pageSettings?.format || 'A4',
          orientation: template.pageSettings?.orientation || 'portrait',
          margins: template.pageSettings?.margins,
          headerTemplate: headerHtml,
          footerTemplate: footerHtml,
          pageNumbers: options.pageNumbers,
          displayHeaderFooter: !!(headerHtml || footerHtml || options.pageNumbers)
        };

        const pdfBuffer = await this.pdfGenerator.generateFromHtml(html, pdfOptions);

        // Increment usage count
        await this.repository.update(template.id, {
          usageCount: template.usageCount + 1
        });

        return {
          success: true,
          data: {
            content: pdfBuffer,
            format: 'pdf',
            metadata: {
              templateId: template.id,
              templateCode: template.code,
              versionNumber: template.currentVersionNumber,
              renderedAt: new Date()
            }
          }
        };
      }

      return {
        success: false,
        message: `Output format '${format}' not supported`
      };
    } catch (error) {
      return {
        success: false,
        message: 'Failed to render template',
        errors: [(error as Error).message]
      };
    }
  }

  /**
   * Preview template with sample data
   */
  async preview(
    templateCode: string,
    sampleData: Record<string, unknown>,
    context: OperationContext
  ): Promise<OperationResult<RenderResult>> {
    try {
      const templateResult = await this.getActive(templateCode, context);
      if (!templateResult.success || !templateResult.data) {
        return { success: false, message: templateResult.message };
      }

      const template = templateResult.data;

      // Generate sample data if not provided
      const data = Object.keys(sampleData).length > 0
        ? sampleData
        : this.generateSampleData(template.fields);

      // Render as HTML for preview
      return this.render(templateCode, data, context, { format: 'html' });
    } catch (error) {
      return {
        success: false,
        message: 'Failed to preview template',
        errors: [(error as Error).message]
      };
    }
  }

  // ============================================================================
  // DATA VALIDATION
  // ============================================================================

  /**
   * Validate data against template fields
   */
  async validateData(
    templateCode: string,
    data: Record<string, unknown>,
    context: OperationContext
  ): Promise<OperationResult<TemplateValidationResult>> {
    try {
      const templateResult = await this.getActive(templateCode, context);
      if (!templateResult.success || !templateResult.data) {
        return { success: false, message: templateResult.message };
      }

      const template = templateResult.data;
      const errors: ValidationError[] = [];
      const warnings: string[] = [];
      const missingFields: string[] = [];
      const extraFields: string[] = [];

      const fieldNames = new Set(template.fields.map(f => f.name));
      const dataKeys = new Set(Object.keys(data));

      // Check required fields
      for (const field of template.fields) {
        const value = data[field.name];

        if (field.isRequired && (value === undefined || value === null || value === '')) {
          errors.push({
            field: field.name,
            message: `Field '${field.label}' is required`
          });
          missingFields.push(field.name);
          continue;
        }

        // Skip validation for optional empty fields
        if (value === undefined || value === null) continue;

        // Type validation
        const typeError = this.validateFieldType(field, value);
        if (typeError) {
          errors.push(typeError);
        }

        // Custom validation
        if (field.validation) {
          const validationErrors = this.validateFieldRules(field, value);
          errors.push(...validationErrors);
        }
      }

      // Check for extra fields
      for (const key of dataKeys) {
        if (!fieldNames.has(key) && !key.startsWith('_')) {
          extraFields.push(key);
          warnings.push(`Unknown field '${key}' provided`);
        }
      }

      return {
        success: true,
        data: {
          isValid: errors.length === 0,
          errors,
          warnings,
          missingFields,
          extraFields
        }
      };
    } catch (error) {
      return {
        success: false,
        message: 'Failed to validate data',
        errors: [(error as Error).message]
      };
    }
  }

  // ============================================================================
  // HELPER METHODS
  // ============================================================================

  /**
   * Register Handlebars helpers
   */
  private registerHelpers(): void {
    // Date formatting
    this.handlebars.registerHelper('formatDate', (date: Date | string, format: string) => {
      const d = new Date(date);
      if (isNaN(d.getTime())) return '';

      const formatters: Record<string, string> = {
        'YYYY-MM-DD': d.toISOString().split('T')[0],
        'DD/MM/YYYY': `${d.getDate().toString().padStart(2, '0')}/${(d.getMonth() + 1).toString().padStart(2, '0')}/${d.getFullYear()}`,
        'MM/DD/YYYY': `${(d.getMonth() + 1).toString().padStart(2, '0')}/${d.getDate().toString().padStart(2, '0')}/${d.getFullYear()}`,
        'long': d.toLocaleDateString('es-ES', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })
      };

      return formatters[format] || d.toLocaleDateString();
    });

    // Currency formatting
    this.handlebars.registerHelper('currency', (value: number, currency = 'EUR', locale = 'es-ES') => {
      if (typeof value !== 'number') return '';
      return new Intl.NumberFormat(locale, {
        style: 'currency',
        currency
      }).format(value);
    });

    // Number formatting
    this.handlebars.registerHelper('number', (value: number, decimals = 2, locale = 'es-ES') => {
      if (typeof value !== 'number') return '';
      return new Intl.NumberFormat(locale, {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals
      }).format(value);
    });

    // Percentage
    this.handlebars.registerHelper('percentage', (value: number, decimals = 2) => {
      if (typeof value !== 'number') return '';
      return `${(value * 100).toFixed(decimals)}%`;
    });

    // Uppercase
    this.handlebars.registerHelper('uppercase', (str: string) => {
      return typeof str === 'string' ? str.toUpperCase() : '';
    });

    // Lowercase
    this.handlebars.registerHelper('lowercase', (str: string) => {
      return typeof str === 'string' ? str.toLowerCase() : '';
    });

    // Capitalize
    this.handlebars.registerHelper('capitalize', (str: string) => {
      if (typeof str !== 'string') return '';
      return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
    });

    // Conditional equality
    this.handlebars.registerHelper('eq', (a: unknown, b: unknown) => a === b);
    this.handlebars.registerHelper('ne', (a: unknown, b: unknown) => a !== b);
    this.handlebars.registerHelper('gt', (a: number, b: number) => a > b);
    this.handlebars.registerHelper('gte', (a: number, b: number) => a >= b);
    this.handlebars.registerHelper('lt', (a: number, b: number) => a < b);
    this.handlebars.registerHelper('lte', (a: number, b: number) => a <= b);

    // And/Or
    this.handlebars.registerHelper('and', (...args: unknown[]) => {
      args.pop(); // Remove Handlebars options
      return args.every(Boolean);
    });

    this.handlebars.registerHelper('or', (...args: unknown[]) => {
      args.pop(); // Remove Handlebars options
      return args.some(Boolean);
    });

    // Default value
    this.handlebars.registerHelper('default', (value: unknown, defaultValue: unknown) => {
      return value ?? defaultValue;
    });

    // JSON stringify
    this.handlebars.registerHelper('json', (value: unknown) => {
      return JSON.stringify(value, null, 2);
    });

    // Array helpers
    this.handlebars.registerHelper('first', (arr: unknown[]) => {
      return Array.isArray(arr) ? arr[0] : undefined;
    });

    this.handlebars.registerHelper('last', (arr: unknown[]) => {
      return Array.isArray(arr) ? arr[arr.length - 1] : undefined;
    });

    this.handlebars.registerHelper('length', (arr: unknown[] | string) => {
      return arr?.length || 0;
    });

    this.handlebars.registerHelper('sum', (arr: number[], key?: string) => {
      if (!Array.isArray(arr)) return 0;
      if (key && typeof key === 'string') {
        return arr.reduce((sum, item) => sum + (Number((item as Record<string, unknown>)[key]) || 0), 0);
      }
      return arr.reduce((sum, val) => sum + (Number(val) || 0), 0);
    });

    // Table row styling
    this.handlebars.registerHelper('rowClass', (index: number) => {
      return index % 2 === 0 ? 'even' : 'odd';
    });

    // Safe HTML output
    this.handlebars.registerHelper('safeHtml', (html: string) => {
      return new Handlebars.SafeString(html);
    });
  }

  /**
   * Compile template content
   */
  private compileTemplate(content: string): {
    success: boolean;
    template?: HandlebarsTemplateDelegate;
    compiled?: string;
    errors?: string[];
  } {
    try {
      const template = this.handlebars.compile(content);
      return {
        success: true,
        template,
        compiled: content // Store original for versioning
      };
    } catch (error) {
      return {
        success: false,
        errors: [(error as Error).message]
      };
    }
  }

  /**
   * Extract variables from template content
   */
  private extractVariables(content: string): TemplateVariable[] {
    const variables: TemplateVariable[] = [];
    const seen = new Set<string>();

    // Match Handlebars expressions: {{variable}}, {{object.property}}, etc.
    const regex = /\{\{(?!#|\/|>|!|else)([^}]+)\}\}/g;
    let match;

    while ((match = regex.exec(content)) !== null) {
      const expression = match[1].trim();

      // Skip helpers (contain spaces with arguments)
      if (expression.includes(' ') && !expression.startsWith('this.')) continue;

      // Extract variable path
      const path = expression.split(/\s+/)[0];
      const name = path.split('.')[0];

      if (!seen.has(name) && !name.startsWith('_') && name !== 'this') {
        seen.add(name);
        variables.push({
          name,
          path,
          type: TemplateFieldType.TEXT
        });
      }
    }

    return variables;
  }

  /**
   * Normalize template fields
   */
  private normalizeFields(
    fields: Partial<TemplateField>[],
    templateId: string
  ): TemplateField[] {
    return fields.map((field, index) => ({
      id: field.id || uuidv4(),
      templateId,
      name: field.name || `field_${index}`,
      label: field.label || field.name || `Field ${index}`,
      fieldType: field.fieldType || TemplateFieldType.TEXT,
      placeholder: field.placeholder,
      defaultValue: field.defaultValue,
      isRequired: field.isRequired ?? false,
      isReadonly: field.isReadonly ?? false,
      validation: field.validation,
      options: field.options,
      conditionalDisplay: field.conditionalDisplay,
      helpText: field.helpText,
      sortOrder: field.sortOrder ?? index,
      groupName: field.groupName,
      width: field.width
    }));
  }

  /**
   * Generate code from name
   */
  private generateCode(name: string): string {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '_')
      .replace(/^_|_$/g, '');
  }

  /**
   * Get default page settings
   */
  private getDefaultPageSettings(): PageSettings {
    return {
      format: 'A4',
      orientation: 'portrait',
      margins: {
        top: 20,
        right: 20,
        bottom: 20,
        left: 20
      }
    };
  }

  /**
   * Transform data according to variable configurations
   */
  private transformData(
    data: Record<string, unknown>,
    variables: TemplateVariable[]
  ): Record<string, unknown> {
    const transformed = { ...data };

    for (const variable of variables) {
      if (variable.transform && data[variable.name] !== undefined) {
        const value = data[variable.name];

        switch (variable.transform) {
          case 'uppercase':
            if (typeof value === 'string') {
              transformed[variable.name] = value.toUpperCase();
            }
            break;
          case 'lowercase':
            if (typeof value === 'string') {
              transformed[variable.name] = value.toLowerCase();
            }
            break;
          case 'capitalize':
            if (typeof value === 'string') {
              transformed[variable.name] = value.charAt(0).toUpperCase() + value.slice(1).toLowerCase();
            }
            break;
          case 'currency':
            if (typeof value === 'number') {
              transformed[variable.name] = new Intl.NumberFormat('es-ES', {
                style: 'currency',
                currency: 'EUR'
              }).format(value);
            }
            break;
          case 'date':
            if (value instanceof Date || typeof value === 'string') {
              transformed[variable.name] = new Date(value).toLocaleDateString('es-ES');
            }
            break;
          case 'number':
            if (typeof value === 'number') {
              transformed[variable.name] = new Intl.NumberFormat('es-ES').format(value);
            }
            break;
        }
      }

      // Apply default value
      if (transformed[variable.name] === undefined && variable.defaultValue !== undefined) {
        transformed[variable.name] = variable.defaultValue;
      }
    }

    return transformed;
  }

  /**
   * Validate field type
   */
  private validateFieldType(field: TemplateField, value: unknown): ValidationError | null {
    const type = field.fieldType;

    switch (type) {
      case TemplateFieldType.NUMBER:
      case TemplateFieldType.CURRENCY:
        if (typeof value !== 'number' && isNaN(Number(value))) {
          return {
            field: field.name,
            message: `Field '${field.label}' must be a number`,
            expectedType: 'number',
            actualValue: value
          };
        }
        break;

      case TemplateFieldType.DATE:
      case TemplateFieldType.DATETIME:
        const date = new Date(value as string);
        if (isNaN(date.getTime())) {
          return {
            field: field.name,
            message: `Field '${field.label}' must be a valid date`,
            expectedType: 'date',
            actualValue: value
          };
        }
        break;

      case TemplateFieldType.BOOLEAN:
        if (typeof value !== 'boolean') {
          return {
            field: field.name,
            message: `Field '${field.label}' must be a boolean`,
            expectedType: 'boolean',
            actualValue: value
          };
        }
        break;

      case TemplateFieldType.EMAIL:
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (typeof value !== 'string' || !emailRegex.test(value)) {
          return {
            field: field.name,
            message: `Field '${field.label}' must be a valid email`,
            expectedType: 'email',
            actualValue: value
          };
        }
        break;

      case TemplateFieldType.URL:
        try {
          new URL(value as string);
        } catch {
          return {
            field: field.name,
            message: `Field '${field.label}' must be a valid URL`,
            expectedType: 'url',
            actualValue: value
          };
        }
        break;

      case TemplateFieldType.SELECT:
        if (field.options && !field.options.some(o => o.value === value)) {
          return {
            field: field.name,
            message: `Field '${field.label}' must be one of the allowed values`,
            expectedType: 'select',
            actualValue: value
          };
        }
        break;

      case TemplateFieldType.MULTISELECT:
        if (!Array.isArray(value)) {
          return {
            field: field.name,
            message: `Field '${field.label}' must be an array`,
            expectedType: 'array',
            actualValue: value
          };
        }
        break;
    }

    return null;
  }

  /**
   * Validate field rules
   */
  private validateFieldRules(field: TemplateField, value: unknown): ValidationError[] {
    const errors: ValidationError[] = [];
    const validation = field.validation as FieldValidation;

    if (!validation) return errors;

    // String validations
    if (typeof value === 'string') {
      if (validation.minLength !== undefined && value.length < validation.minLength) {
        errors.push({
          field: field.name,
          message: `Field '${field.label}' must be at least ${validation.minLength} characters`
        });
      }

      if (validation.maxLength !== undefined && value.length > validation.maxLength) {
        errors.push({
          field: field.name,
          message: `Field '${field.label}' must be at most ${validation.maxLength} characters`
        });
      }

      if (validation.pattern) {
        const regex = new RegExp(validation.pattern);
        if (!regex.test(value)) {
          errors.push({
            field: field.name,
            message: validation.patternMessage || `Field '${field.label}' has invalid format`
          });
        }
      }
    }

    // Number validations
    if (typeof value === 'number') {
      if (validation.min !== undefined && value < validation.min) {
        errors.push({
          field: field.name,
          message: `Field '${field.label}' must be at least ${validation.min}`
        });
      }

      if (validation.max !== undefined && value > validation.max) {
        errors.push({
          field: field.name,
          message: `Field '${field.label}' must be at most ${validation.max}`
        });
      }
    }

    return errors;
  }

  /**
   * Generate sample data from fields
   */
  private generateSampleData(fields: TemplateField[]): Record<string, unknown> {
    const data: Record<string, unknown> = {};

    for (const field of fields) {
      switch (field.fieldType) {
        case TemplateFieldType.TEXT:
        case TemplateFieldType.TEXTAREA:
        case TemplateFieldType.RICH_TEXT:
          data[field.name] = field.defaultValue ?? `Sample ${field.label}`;
          break;
        case TemplateFieldType.NUMBER:
          data[field.name] = field.defaultValue ?? 12345;
          break;
        case TemplateFieldType.CURRENCY:
          data[field.name] = field.defaultValue ?? 1234.56;
          break;
        case TemplateFieldType.DATE:
        case TemplateFieldType.DATETIME:
          data[field.name] = field.defaultValue ?? new Date().toISOString();
          break;
        case TemplateFieldType.BOOLEAN:
          data[field.name] = field.defaultValue ?? true;
          break;
        case TemplateFieldType.EMAIL:
          data[field.name] = field.defaultValue ?? 'example@email.com';
          break;
        case TemplateFieldType.PHONE:
          data[field.name] = field.defaultValue ?? '+34 600 000 000';
          break;
        case TemplateFieldType.URL:
          data[field.name] = field.defaultValue ?? 'https://example.com';
          break;
        case TemplateFieldType.SELECT:
          data[field.name] = field.defaultValue ?? field.options?.[0]?.value ?? 'option1';
          break;
        case TemplateFieldType.MULTISELECT:
          data[field.name] = field.defaultValue ?? [field.options?.[0]?.value ?? 'option1'];
          break;
        default:
          data[field.name] = field.defaultValue ?? null;
      }
    }

    return data;
  }

  /**
   * Get template versions
   */
  async getVersions(
    templateId: string,
    context: OperationContext
  ): Promise<OperationResult<TemplateVersion[]>> {
    try {
      const template = await this.repository.findById(templateId);
      if (!template) {
        return { success: false, message: 'Template not found' };
      }

      const versions = await this.repository.getVersions(templateId);

      return {
        success: true,
        data: versions.sort((a, b) => b.versionNumber - a.versionNumber)
      };
    } catch (error) {
      return {
        success: false,
        message: 'Failed to get versions',
        errors: [(error as Error).message]
      };
    }
  }

  /**
   * Revert to a specific version
   */
  async revertToVersion(
    templateId: string,
    versionId: string,
    context: OperationContext
  ): Promise<OperationResult<Template>> {
    try {
      const template = await this.repository.findById(templateId);
      if (!template) {
        return { success: false, message: 'Template not found' };
      }

      const versions = await this.repository.getVersions(templateId);
      const targetVersion = versions.find(v => v.id === versionId);

      if (!targetVersion) {
        return { success: false, message: 'Version not found' };
      }

      // Create new version from target
      return this.update(
        templateId,
        {
          content: targetVersion.content,
          fields: targetVersion.fields
        },
        context,
        true
      );
    } catch (error) {
      return {
        success: false,
        message: 'Failed to revert version',
        errors: [(error as Error).message]
      };
    }
  }
}

export default TemplateService;
