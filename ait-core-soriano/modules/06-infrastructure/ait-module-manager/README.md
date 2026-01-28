# 🏗️ AIT-MODULE-MANAGER

**Meta-módulo para gestión dinámica de módulos AIT**

Sistema TODO EN UNO que permite crear, editar, eliminar y gestionar módulos del ecosistema AIT-CORE.

---

## 🎯 Funcionalidades

- ✨ **Generar módulos** nuevos desde templates
- ✏️ **Editar módulos** existentes (endpoints, servicios, DTOs, configs)
- 🗑️ **Eliminar módulos** con backup automático
- 🔄 **Activar/Desactivar** módulos dinámicamente
- 📝 **Gestionar templates** incluidos
- ⚡ **Hot reload** de módulos sin reiniciar sistema

---

## 🚀 Uso Rápido

### Generar Nuevo Módulo

```bash
POST http://localhost:3099/api/v1/module-manager/generate

{
  "moduleName": "ait-treasury",
  "category": "01-core-business",
  "description": "Gestión de tesorería con IA",
  "entityName": "Payment",
  "port": 3005,
  "features": ["crud", "export", "analytics"],
  "dependencies": ["ait-authenticator", "ait-pgc-engine"]
}
```

**Resultado:**
- Módulo completo generado en `modules/01-core-business/ait-treasury/`
- Incluye: package.json, tsconfig, controllers, services, DTOs, tests
- Con configuración de 100 agentes paralelos
- Modos avanzados: switch/edit/plain/bypass
- Listo para `pnpm install` y `pnpm start:dev`

### Editar Módulo Existente

```bash
PUT http://localhost:3099/api/v1/module-manager/ait-treasury/edit

{
  "action": "change-config",
  "config": {
    "agent": {
      "parallelAgents": 50,
      "modes": {
        "bypass": {
          "enabled": true
        }
      }
    }
  }
}
```

### Eliminar Módulo

```bash
DELETE http://localhost:3099/api/v1/module-manager/ait-old-module?backup=true

# Crea backup en _backups/ait-old-module-2026-01-28T...
```

### Activar/Desactivar Módulo

```bash
POST http://localhost:3099/api/v1/module-manager/modules/ait-treasury/activate
POST http://localhost:3099/api/v1/module-manager/modules/ait-treasury/deactivate
```

---

## 📦 Templates Incluidos

El sistema incluye templates completos en `/templates/module/`:

- `package.json.template` - NestJS 11 + Prisma 6
- `tsconfig.json.template` - TypeScript config
- `nest-cli.json.template` - NestJS CLI
- `module.config.json.template` - Config con agentes
- `src/` - Controllers, services, DTOs, tests

Todos los templates soportan **variables Handlebars**.

---

## 🤖 Configuración de Agentes

Cada módulo generado incluye:

```json
{
  "agent": {
    "enabled": true,
    "parallelAgents": 100,
    "modes": {
      "switch": true,
      "edit": true,
      "plain": true,
      "bypass": {
        "enabled": false,
        "warning": "DANGER!"
      }
    }
  }
}
```

---

## 🔒 Seguridad

- Requiere autenticación: `Bearer token`
- Roles permitidos: `ADMIN`, `DEVELOPER`
- Rate limiting: 100 req/min
- Módulos core protegidos (require `force=true`)
- Backup automático antes de eliminar
- Audit log de todas las operaciones

---

## 📊 API Endpoints

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| `POST` | `/generate` | Generar nuevo módulo |
| `PUT` | `/:moduleId/edit` | Editar módulo |
| `DELETE` | `/:moduleId` | Eliminar módulo |
| `GET` | `/modules` | Listar todos los módulos |
| `GET` | `/modules/:moduleId` | Detalle de módulo |
| `POST` | `/modules/:moduleId/activate` | Activar módulo |
| `POST` | `/modules/:moduleId/deactivate` | Desactivar módulo |
| `GET` | `/health` | Health check |

---

## 💻 Instalación

```bash
cd modules/06-infrastructure/ait-module-manager

pnpm install
pnpm start:dev
```

**Puerto:** 3099
**Swagger:** http://localhost:3099/api-docs

---

## 🎯 Próximos Pasos

1. ✅ Estructura completa creada
2. ⏳ Testing de generación de módulos
3. ⏳ Hot reload implementation
4. ⏳ Template versioning
5. ⏳ Module marketplace

---

**¡Sistema de gestión de módulos más avanzado!** 🚀

