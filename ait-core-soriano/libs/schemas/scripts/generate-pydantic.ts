#!/usr/bin/env ts-node

import { z } from 'zod';
import fs from 'fs';
import path from 'path';

/**
 * Generate Pydantic models from Zod schemas
 *
 * This script converts TypeScript Zod schemas to Python Pydantic models
 * for use in Python-based services (e.g., AI engines, scrapers)
 */

interface SchemaInfo {
  name: string;
  schema: z.ZodType;
}

/**
 * Convert Zod type to Python type string
 */
function zodToPythonType(schema: z.ZodType, optional = false): string {
  // Handle optional types
  if (schema instanceof z.ZodOptional) {
    return `Optional[${zodToPythonType(schema._def.innerType, true)}]`;
  }

  // Handle nullable types
  if (schema instanceof z.ZodNullable) {
    return `Optional[${zodToPythonType(schema._def.innerType, true)}]`;
  }

  // Handle default values
  if (schema instanceof z.ZodDefault) {
    return zodToPythonType(schema._def.innerType, optional);
  }

  // Primitive types
  if (schema instanceof z.ZodString) {
    return optional ? 'Optional[str]' : 'str';
  }

  if (schema instanceof z.ZodNumber) {
    return optional ? 'Optional[float]' : 'float';
  }

  if (schema instanceof z.ZodBoolean) {
    return optional ? 'Optional[bool]' : 'bool';
  }

  if (schema instanceof z.ZodDate) {
    return optional ? 'Optional[datetime]' : 'datetime';
  }

  // Array types
  if (schema instanceof z.ZodArray) {
    const innerType = zodToPythonType(schema._def.type);
    return optional ? `Optional[List[${innerType}]]` : `List[${innerType}]`;
  }

  // Enum types
  if (schema instanceof z.ZodEnum) {
    // For enums, we'll create a separate Literal type
    const values = schema._def.values;
    const literalValues = values.map((v: string) => `"${v}"`).join(', ');
    return optional ? `Optional[Literal[${literalValues}]]` : `Literal[${literalValues}]`;
  }

  // Object types
  if (schema instanceof z.ZodObject) {
    return optional ? 'Optional[Dict[str, Any]]' : 'Dict[str, Any]';
  }

  // Record types
  if (schema instanceof z.ZodRecord) {
    const valueType = zodToPythonType(schema._def.valueType);
    return optional ? `Optional[Dict[str, ${valueType}]]` : `Dict[str, ${valueType}]`;
  }

  // Union types
  if (schema instanceof z.ZodUnion) {
    const types = schema._def.options.map((opt: z.ZodType) => zodToPythonType(opt));
    return `Union[${types.join(', ')}]`;
  }

  // Literal types
  if (schema instanceof z.ZodLiteral) {
    return `Literal[${JSON.stringify(schema._def.value)}]`;
  }

  // Fallback to Any
  return optional ? 'Optional[Any]' : 'Any';
}

/**
 * Generate field definition for Pydantic model
 */
function generateField(fieldName: string, fieldSchema: z.ZodType): string {
  const pythonType = zodToPythonType(fieldSchema);

  // Check if field has a default value
  let defaultValue = '';
  if (fieldSchema instanceof z.ZodDefault) {
    const def = fieldSchema._def.defaultValue();
    if (typeof def === 'string') {
      defaultValue = ` = "${def}"`;
    } else if (typeof def === 'number' || typeof def === 'boolean') {
      defaultValue = ` = ${def}`;
    } else if (def === null) {
      defaultValue = ' = None';
    }
  } else if (fieldSchema instanceof z.ZodOptional || fieldSchema instanceof z.ZodNullable) {
    defaultValue = ' = None';
  }

  return `    ${fieldName}: ${pythonType}${defaultValue}`;
}

/**
 * Generate Pydantic model from Zod schema
 */
function generatePydanticModel(name: string, schema: z.ZodType): string {
  if (!(schema instanceof z.ZodObject)) {
    console.warn(`Skipping ${name}: not an object schema`);
    return '';
  }

  const shape = schema._def.shape();
  const fields: string[] = [];

  for (const [fieldName, fieldSchema] of Object.entries(shape)) {
    fields.push(generateField(fieldName, fieldSchema as z.ZodType));
  }

  const modelCode = `
class ${name}(BaseModel):
    """
    Auto-generated from Zod schema: ${name}
    """
${fields.join('\n')}

    class Config:
        from_attributes = True
        json_encoders = {
            datetime: lambda v: v.isoformat(),
        }
`;

  return modelCode;
}

/**
 * Generate enum class from Zod enum schema
 */
function generatePydanticEnum(name: string, schema: z.ZodEnum<any>): string {
  const values = schema._def.values;
  const enumFields = values.map((value: string) => {
    const enumName = value.toUpperCase().replace(/[^A-Z0-9_]/g, '_');
    return `    ${enumName} = "${value}"`;
  });

  return `
class ${name}(str, Enum):
    """
    Auto-generated from Zod enum: ${name}
    """
${enumFields.join('\n')}
`;
}

/**
 * Main generation function
 */
async function generatePydanticModels() {
  console.log('🐍 Generating Pydantic models from Zod schemas...\n');

  // Import all schemas
  const schemasModule = await import('../src/index');

  const schemas: SchemaInfo[] = [];
  const enums: SchemaInfo[] = [];

  // Collect all schemas and enums
  for (const [name, value] of Object.entries(schemasModule)) {
    if (name.endsWith('Schema') && value instanceof z.ZodType) {
      if (value instanceof z.ZodEnum) {
        enums.push({ name: name.replace('Schema', ''), schema: value });
      } else if (value instanceof z.ZodObject) {
        schemas.push({ name: name.replace('Schema', ''), schema: value });
      }
    }
  }

  console.log(`Found ${schemas.length} schemas and ${enums.length} enums\n`);

  // Generate Python code
  let pythonCode = `"""
Auto-generated Pydantic models from AIT-CORE Zod schemas

DO NOT EDIT THIS FILE MANUALLY
Generated on: ${new Date().toISOString()}
"""

from datetime import datetime
from typing import Any, Dict, List, Optional, Union, Literal
from enum import Enum
from pydantic import BaseModel, Field, validator

`;

  // Generate enums first
  console.log('Generating enums...');
  for (const { name, schema } of enums) {
    if (schema instanceof z.ZodEnum) {
      pythonCode += generatePydanticEnum(name, schema);
      console.log(`  ✓ ${name}`);
    }
  }

  pythonCode += '\n# ============================================\n';
  pythonCode += '# MODELS\n';
  pythonCode += '# ============================================\n';

  // Generate models
  console.log('\nGenerating models...');
  for (const { name, schema } of schemas) {
    pythonCode += generatePydanticModel(name, schema);
    console.log(`  ✓ ${name}`);
  }

  // Write to file
  const outputPath = path.join(__dirname, '../../../ait-engines/schemas.py');
  const outputDir = path.dirname(outputPath);

  // Create directory if it doesn't exist
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  fs.writeFileSync(outputPath, pythonCode, 'utf-8');

  console.log(`\n✅ Pydantic models generated successfully!`);
  console.log(`📁 Output: ${outputPath}`);
  console.log(`📊 Total: ${schemas.length} models, ${enums.length} enums`);
}

// Run the script
if (require.main === module) {
  generatePydanticModels().catch((error) => {
    console.error('❌ Error generating Pydantic models:', error);
    process.exit(1);
  });
}

export { generatePydanticModels };
