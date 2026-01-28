/**
 * AIT-CONNECTOR - Module Validator
 * Validates module definitions, dependencies, and configurations
 */

import { Module, ValidationResult, ValidationError, ValidationWarning, ModuleStatus } from '../types';
import { ModuleRegistry } from './registry';

export class ModuleValidator {
  private registry: ModuleRegistry;

  constructor(registry: ModuleRegistry) {
    this.registry = registry;
  }

  /**
   * Validate a module
   */
  async validate(module: Module): Promise<ValidationResult> {
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];

    // Basic structure validation
    this.validateStructure(module, errors);

    // Dependency validation
    await this.validateDependencies(module, errors, warnings);

    // Configuration validation
    this.validateConfiguration(module, errors, warnings);

    // API validation
    this.validateAPIs(module, errors, warnings);

    // Circular dependency check
    this.checkCircularDependencies(module, errors);

    return {
      valid: errors.length === 0,
      errors,
      warnings
    };
  }

  /**
   * Validate module structure
   */
  private validateStructure(module: Module, errors: ValidationError[]): void {
    // Required fields
    if (!module.id) {
      errors.push({
        type: 'MISSING_FIELD',
        message: 'Module ID is required',
        field: 'id'
      });
    }

    if (!module.name) {
      errors.push({
        type: 'MISSING_FIELD',
        message: 'Module name is required',
        field: 'name'
      });
    }

    if (!module.version) {
      errors.push({
        type: 'MISSING_FIELD',
        message: 'Module version is required',
        field: 'version'
      });
    }

    // Version format validation (semver)
    if (module.version) {
      const versionRegex = /^\d+\.\d+\.\d+(-[a-zA-Z0-9.]+)?(\+[a-zA-Z0-9.]+)?$/;
      if (!versionRegex.test(module.version)) {
        errors.push({
          type: 'INVALID_FORMAT',
          message: `Invalid version format: ${module.version}. Expected semver format (e.g., 1.0.0)`,
          field: 'version'
        });
      }
    }

    // ID format validation
    if (module.id) {
      const idRegex = /^[a-z0-9-]+$/;
      if (!idRegex.test(module.id)) {
        errors.push({
          type: 'INVALID_FORMAT',
          message: 'Module ID must contain only lowercase letters, numbers, and hyphens',
          field: 'id'
        });
      }
    }

    // Name validation
    if (module.name && module.name.length > 100) {
      errors.push({
        type: 'INVALID_LENGTH',
        message: 'Module name must not exceed 100 characters',
        field: 'name'
      });
    }
  }

  /**
   * Validate module dependencies
   */
  private async validateDependencies(
    module: Module,
    errors: ValidationError[],
    warnings: ValidationWarning[]
  ): Promise<void> {
    if (!module.dependencies || module.dependencies.length === 0) {
      return;
    }

    for (const dep of module.dependencies) {
      // Validate dependency structure
      if (!dep.moduleId) {
        errors.push({
          type: 'INVALID_DEPENDENCY',
          message: 'Dependency moduleId is required',
          field: 'dependencies'
        });
        continue;
      }

      if (!dep.version) {
        errors.push({
          type: 'INVALID_DEPENDENCY',
          message: `Dependency version is required for ${dep.moduleId}`,
          field: 'dependencies'
        });
        continue;
      }

      // Check if dependency exists in registry
      const depModule = this.registry.get(dep.moduleId);
      if (!depModule) {
        if (dep.required) {
          errors.push({
            type: 'MISSING_DEPENDENCY',
            message: `Required dependency '${dep.moduleId}' not found in registry`,
            field: 'dependencies',
            details: { dependencyId: dep.moduleId }
          });
        } else {
          warnings.push({
            type: 'MISSING_OPTIONAL_DEPENDENCY',
            message: `Optional dependency '${dep.moduleId}' not found in registry`,
            field: 'dependencies'
          });
        }
        continue;
      }

      // Version compatibility check
      if (!this.isVersionCompatible(depModule.version, dep.version)) {
        errors.push({
          type: 'VERSION_MISMATCH',
          message: `Dependency version mismatch: ${dep.moduleId} requires ${dep.version}, found ${depModule.version}`,
          field: 'dependencies',
          details: {
            dependencyId: dep.moduleId,
            required: dep.version,
            found: depModule.version
          }
        });
      }

      // Check dependency status
      if (depModule.status === ModuleStatus.ERROR) {
        warnings.push({
          type: 'DEPENDENCY_ERROR',
          message: `Dependency '${dep.moduleId}' is in error state`,
          field: 'dependencies'
        });
      }
    }
  }

  /**
   * Validate module configuration
   */
  private validateConfiguration(
    module: Module,
    errors: ValidationError[],
    warnings: ValidationWarning[]
  ): void {
    if (!module.config) {
      return;
    }

    const config = module.config;

    // Priority validation
    if (config.priority !== undefined) {
      if (!Number.isInteger(config.priority) || config.priority < 0 || config.priority > 100) {
        errors.push({
          type: 'INVALID_CONFIG',
          message: 'Priority must be an integer between 0 and 100',
          field: 'config.priority'
        });
      }
    }

    // Environment validation
    if (config.environment) {
      const validEnvironments = ['development', 'staging', 'production', 'test'];
      if (!validEnvironments.includes(config.environment)) {
        warnings.push({
          type: 'INVALID_ENVIRONMENT',
          message: `Unknown environment: ${config.environment}. Valid values: ${validEnvironments.join(', ')}`,
          field: 'config.environment'
        });
      }
    }
  }

  /**
   * Validate module APIs
   */
  private validateAPIs(
    module: Module,
    errors: ValidationError[],
    warnings: ValidationWarning[]
  ): void {
    if (!module.apis || module.apis.length === 0) {
      return;
    }

    for (const api of module.apis) {
      // Validate API structure
      if (!api.name) {
        errors.push({
          type: 'INVALID_API',
          message: 'API name is required',
          field: 'apis'
        });
        continue;
      }

      if (!api.version) {
        errors.push({
          type: 'INVALID_API',
          message: `API version is required for ${api.name}`,
          field: 'apis'
        });
        continue;
      }

      // Validate endpoints
      if (!api.endpoints || api.endpoints.length === 0) {
        warnings.push({
          type: 'NO_ENDPOINTS',
          message: `API ${api.name} has no endpoints defined`,
          field: 'apis'
        });
        continue;
      }

      for (const endpoint of api.endpoints) {
        // Validate endpoint structure
        if (!endpoint.path) {
          errors.push({
            type: 'INVALID_ENDPOINT',
            message: `Endpoint path is required in API ${api.name}`,
            field: 'apis.endpoints'
          });
        }

        if (!endpoint.method) {
          errors.push({
            type: 'INVALID_ENDPOINT',
            message: `Endpoint method is required for path ${endpoint.path}`,
            field: 'apis.endpoints'
          });
        }

        if (!endpoint.handler) {
          errors.push({
            type: 'INVALID_ENDPOINT',
            message: `Endpoint handler is required for ${endpoint.method} ${endpoint.path}`,
            field: 'apis.endpoints'
          });
        }

        // Validate path format
        if (endpoint.path && !endpoint.path.startsWith('/')) {
          errors.push({
            type: 'INVALID_PATH',
            message: `Endpoint path must start with /: ${endpoint.path}`,
            field: 'apis.endpoints'
          });
        }

        // Validate parameters
        if (endpoint.parameters) {
          for (const param of endpoint.parameters) {
            if (!param.name) {
              errors.push({
                type: 'INVALID_PARAMETER',
                message: 'Parameter name is required',
                field: 'apis.endpoints.parameters'
              });
            }

            if (!param.type) {
              errors.push({
                type: 'INVALID_PARAMETER',
                message: `Parameter type is required for ${param.name}`,
                field: 'apis.endpoints.parameters'
              });
            }
          }
        }
      }
    }
  }

  /**
   * Check for circular dependencies
   */
  private checkCircularDependencies(module: Module, errors: ValidationError[]): void {
    const visited = new Set<string>();
    const recursionStack = new Set<string>();

    const hasCycle = (moduleId: string): boolean => {
      if (recursionStack.has(moduleId)) {
        return true;
      }

      if (visited.has(moduleId)) {
        return false;
      }

      visited.add(moduleId);
      recursionStack.add(moduleId);

      const currentModule = this.registry.get(moduleId);
      if (currentModule?.dependencies) {
        for (const dep of currentModule.dependencies) {
          if (hasCycle(dep.moduleId)) {
            return true;
          }
        }
      }

      recursionStack.delete(moduleId);
      return false;
    };

    if (hasCycle(module.id)) {
      errors.push({
        type: 'CIRCULAR_DEPENDENCY',
        message: `Circular dependency detected for module ${module.id}`,
        field: 'dependencies',
        details: { moduleId: module.id }
      });
    }
  }

  /**
   * Check version compatibility (simple semver check)
   */
  private isVersionCompatible(available: string, required: string): boolean {
    // Handle version ranges (simplified)
    if (required.startsWith('^')) {
      // Compatible with minor and patch updates
      const requiredMajor = parseInt(required.slice(1).split('.')[0]);
      const availableMajor = parseInt(available.split('.')[0]);
      return availableMajor === requiredMajor;
    }

    if (required.startsWith('~')) {
      // Compatible with patch updates only
      const requiredParts = required.slice(1).split('.');
      const availableParts = available.split('.');
      return (
        availableParts[0] === requiredParts[0] &&
        availableParts[1] === requiredParts[1]
      );
    }

    if (required.includes('||')) {
      // Multiple version ranges
      const ranges = required.split('||').map(r => r.trim());
      return ranges.some(range => this.isVersionCompatible(available, range));
    }

    if (required.includes(' - ')) {
      // Version range (e.g., "1.0.0 - 2.0.0")
      const [min, max] = required.split(' - ').map(v => v.trim());
      return this.compareVersions(available, min) >= 0 && this.compareVersions(available, max) <= 0;
    }

    // Exact match or >= comparison
    if (required.startsWith('>=')) {
      return this.compareVersions(available, required.slice(2).trim()) >= 0;
    }

    if (required.startsWith('>')) {
      return this.compareVersions(available, required.slice(1).trim()) > 0;
    }

    // Exact version match
    return available === required;
  }

  /**
   * Compare two semantic versions
   */
  private compareVersions(v1: string, v2: string): number {
    const parts1 = v1.split(/[.-]/).map(p => parseInt(p) || 0);
    const parts2 = v2.split(/[.-]/).map(p => parseInt(p) || 0);

    for (let i = 0; i < Math.max(parts1.length, parts2.length); i++) {
      const p1 = parts1[i] || 0;
      const p2 = parts2[i] || 0;

      if (p1 > p2) return 1;
      if (p1 < p2) return -1;
    }

    return 0;
  }

  /**
   * Validate all registered modules
   */
  async validateAll(): Promise<Map<string, ValidationResult>> {
    const results = new Map<string, ValidationResult>();
    const modules = this.registry.getAll();

    for (const module of modules) {
      const result = await this.validate(module);
      results.set(module.id, result);
    }

    return results;
  }
}

export default ModuleValidator;
