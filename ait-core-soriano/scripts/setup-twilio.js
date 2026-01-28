#!/usr/bin/env node

/**
 * Twilio Configuration Validator
 * Verifica que todas las credenciales estén correctamente configuradas
 */

const fs = require('fs');
const path = require('path');

const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function loadEnv(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf-8');
    const env = {};

    content.split('\n').forEach(line => {
      const trimmed = line.trim();
      if (trimmed && !trimmed.startsWith('#')) {
        const [key, ...valueParts] = trimmed.split('=');
        const value = valueParts.join('=');
        if (key && value) {
          env[key.trim()] = value.trim();
        }
      }
    });

    return env;
  } catch (error) {
    return null;
  }
}

function validateTwilioConfig() {
  log('\n🔍 Validando configuración de Twilio...\n', 'blue');

  const rootEnvPath = path.join(__dirname, '..', '.env');
  const telephonyEnvPath = path.join(__dirname, '..', 'services', 'telephony', '.env');
  const mobileEnvPath = path.join(__dirname, '..', 'apps', 'mobile', '.env');

  const checks = [];

  // Check 1: Root .env exists
  const rootEnv = loadEnv(rootEnvPath);
  if (!rootEnv) {
    checks.push({
      name: 'Archivo .env raíz',
      status: 'error',
      message: 'No existe. Copia .env.example a .env',
    });
  } else {
    checks.push({
      name: 'Archivo .env raíz',
      status: 'ok',
      message: 'Encontrado',
    });
  }

  // Check 2: Telephony .env exists
  const telephonyEnv = loadEnv(telephonyEnvPath);
  if (!telephonyEnv) {
    checks.push({
      name: 'Archivo .env de telefonía',
      status: 'error',
      message: 'No existe. Copia services/telephony/.env.example a .env',
    });
  } else {
    checks.push({
      name: 'Archivo .env de telefonía',
      status: 'ok',
      message: 'Encontrado',
    });
  }

  // Check 3: Mobile .env exists
  const mobileEnv = loadEnv(mobileEnvPath);
  if (!mobileEnv) {
    checks.push({
      name: 'Archivo .env de app móvil',
      status: 'warning',
      message: 'No existe. Copia apps/mobile/.env.example a .env',
    });
  } else {
    checks.push({
      name: 'Archivo .env de app móvil',
      status: 'ok',
      message: 'Encontrado',
    });
  }

  // Check 4: Twilio credentials
  const requiredVars = [
    'TWILIO_ACCOUNT_SID',
    'TWILIO_AUTH_TOKEN',
    'TWILIO_API_KEY',
    'TWILIO_API_SECRET',
    'TWILIO_PHONE_NUMBER',
    'TWILIO_TWIML_APP_SID',
  ];

  if (telephonyEnv) {
    requiredVars.forEach(varName => {
      const value = telephonyEnv[varName];

      if (!value || value.includes('xxx') || value.includes('your_')) {
        checks.push({
          name: varName,
          status: 'error',
          message: 'No configurado. Obtén el valor de Twilio Console',
        });
      } else {
        checks.push({
          name: varName,
          status: 'ok',
          message: 'Configurado',
        });
      }
    });
  }

  // Check 5: Phone number format
  if (telephonyEnv && telephonyEnv.TWILIO_PHONE_NUMBER) {
    const phone = telephonyEnv.TWILIO_PHONE_NUMBER;
    if (!phone.startsWith('+')) {
      checks.push({
        name: 'Formato de número',
        status: 'warning',
        message: 'El número debe incluir código de país (ej: +34912345678)',
      });
    } else {
      checks.push({
        name: 'Formato de número',
        status: 'ok',
        message: 'Correcto',
      });
    }
  }

  // Print results
  let hasErrors = false;
  let hasWarnings = false;

  checks.forEach(check => {
    const icon = check.status === 'ok' ? '✅' : check.status === 'warning' ? '⚠️' : '❌';
    const color = check.status === 'ok' ? 'green' : check.status === 'warning' ? 'yellow' : 'red';

    log(`${icon} ${check.name}: ${check.message}`, color);

    if (check.status === 'error') hasErrors = true;
    if (check.status === 'warning') hasWarnings = true;
  });

  log('', 'reset');

  if (hasErrors) {
    log('❌ CONFIGURACIÓN INCOMPLETA', 'red');
    log('\nPasos a seguir:', 'yellow');
    log('1. Copia los archivos .env.example a .env:', 'reset');
    log('   cp .env.example .env', 'reset');
    log('   cp services/telephony/.env.example services/telephony/.env', 'reset');
    log('   cp apps/mobile/.env.example apps/mobile/.env', 'reset');
    log('\n2. Obtén tus credenciales de Twilio:', 'reset');
    log('   https://console.twilio.com', 'blue');
    log('\n3. Rellena los valores en los archivos .env', 'reset');
    log('\n4. Ejecuta este script nuevamente: npm run setup-twilio', 'reset');
    process.exit(1);
  } else if (hasWarnings) {
    log('⚠️  CONFIGURACIÓN CON ADVERTENCIAS', 'yellow');
    log('El sistema funcionará pero revisa las advertencias anteriores.\n', 'reset');
    process.exit(0);
  } else {
    log('✅ CONFIGURACIÓN COMPLETA', 'green');
    log('\n🚀 Todo listo! Puedes iniciar el sistema con:', 'blue');
    log('   npm run start:all\n', 'reset');
    process.exit(0);
  }
}

// Run validation
validateTwilioConfig();
