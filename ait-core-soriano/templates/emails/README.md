# Email Templates - AIT-CORE Soriano

Plantillas de correo electrónico HTML responsivas para el sistema AIT-CORE Soriano Mediadores.

## Plantillas Disponibles

### 1. Welcome Email (`welcome.html`)
**Uso:** Email de bienvenida para nuevos usuarios
**Variables:**
- `{{user_name}}` - Nombre del usuario
- `{{user_email}}` - Email del usuario
- `{{verification_link}}` - Enlace de verificación
- `{{registration_date}}` - Fecha de registro
- `{{base_url}}` - URL base de la aplicación
- `{{year}}` - Año actual
- `{{company_address}}` - Dirección de la empresa
- `{{social_facebook}}` - URL de Facebook
- `{{social_twitter}}` - URL de Twitter
- `{{social_linkedin}}` - URL de LinkedIn
- `{{unsubscribe_link}}` - Enlace para cancelar suscripción

### 2. Verification Email (`verification.html`)
**Uso:** Verificación de cuenta de usuario
**Variables:**
- `{{user_name}}` - Nombre del usuario
- `{{verification_link}}` - Enlace de verificación
- `{{verification_code}}` - Código de verificación numérico
- `{{expiry_time}}` - Tiempo de expiración en horas
- `{{base_url}}` - URL base de la aplicación
- `{{year}}` - Año actual
- `{{company_address}}` - Dirección de la empresa

### 3. Password Reset (`password-reset.html`)
**Uso:** Solicitud de restablecimiento de contraseña
**Variables:**
- `{{user_name}}` - Nombre del usuario
- `{{reset_link}}` - Enlace para restablecer contraseña
- `{{expiry_time}}` - Tiempo de expiración en horas
- `{{request_date}}` - Fecha de la solicitud
- `{{request_time}}` - Hora de la solicitud
- `{{ip_address}}` - Dirección IP de la solicitud
- `{{user_agent}}` - Navegador utilizado
- `{{base_url}}` - URL base de la aplicación
- `{{year}}` - Año actual
- `{{company_address}}` - Dirección de la empresa

### 4. Policy Notification (`policy-notification.html`)
**Uso:** Notificaciones sobre pólizas de seguros
**Variables:**
- `{{user_name}}` - Nombre del usuario
- `{{notification_class}}` - Clase CSS (new, renewal, expiring, updated)
- `{{notification_type}}` - Tipo de notificación
- `{{notification_title}}` - Título de la notificación
- `{{notification_message}}` - Mensaje principal
- `{{policy_number}}` - Número de póliza
- `{{policy_type}}` - Tipo de póliza
- `{{insurance_company}}` - Compañía aseguradora
- `{{policyholder}}` - Tomador de la póliza
- `{{start_date}}` - Fecha de inicio
- `{{expiry_date}}` - Fecha de vencimiento
- `{{premium_amount}}` - Prima anual
- `{{policy_status}}` - Estado de la póliza
- `{{status_color}}` - Color del estado
- `{{policy_link}}` - Enlace a la póliza
- `{{download_link}}` - Enlace de descarga
- `{{contact_phone}}` - Teléfono de contacto
- `{{contact_email}}` - Email de contacto

**Variables condicionales:**
- `{{is_expiring}}` - Boolean para pólizas por vencer
- `{{days_until_expiry}}` - Días hasta el vencimiento
- `{{is_renewal}}` - Boolean para renovaciones
- `{{show_renewal_button}}` - Mostrar botón de renovación
- `{{show_download_button}}` - Mostrar botón de descarga
- `{{renewal_link}}` - Enlace de renovación

### 5. Claim Update (`claim-update.html`)
**Uso:** Actualizaciones del estado de siniestros
**Variables:**
- `{{user_name}}` - Nombre del usuario
- `{{status_class}}` - Clase CSS del estado
- `{{status_emoji}}` - Emoji del estado
- `{{claim_status}}` - Estado del siniestro
- `{{status_bg_color}}` - Color de fondo del estado
- `{{status_text_color}}` - Color de texto del estado
- `{{update_title}}` - Título de la actualización
- `{{update_message}}` - Mensaje de actualización
- `{{claim_number}}` - Número de siniestro
- `{{policy_number}}` - Número de póliza asociada
- `{{claim_type}}` - Tipo de siniestro
- `{{incident_date}}` - Fecha del incidente
- `{{claim_date}}` - Fecha de apertura
- `{{claim_amount}}` - Importe reclamado
- `{{approved_amount}}` - Importe aprobado (opcional)
- `{{adjuster_name}}` - Nombre del tramitador
- `{{claim_link}}` - Enlace al siniestro
- `{{claims_phone}}` - Teléfono de siniestros
- `{{claims_email}}` - Email de siniestros

**Timeline variables:**
- `{{received_date}}` - Fecha de recepción
- `{{review_status}}` - Estado de revisión (completed/current/pending)
- `{{review_date}}` - Fecha de revisión (opcional)
- `{{assessment_status}}` - Estado de valoración
- `{{assessment_date}}` - Fecha de valoración (opcional)
- `{{approval_status}}` - Estado de aprobación
- `{{approval_date}}` - Fecha de aprobación (opcional)
- `{{payment_status}}` - Estado de pago
- `{{payment_date}}` - Fecha de pago (opcional)

**Arrays opcionales:**
- `{{next_steps}}` - Array de próximos pasos
- `{{documents}}` - Array de documentos (cada uno con `name` y `link`)

### 6. Payment Confirmation (`payment-confirmation.html`)
**Uso:** Confirmación de pagos realizados
**Variables:**
- `{{user_name}}` - Nombre del usuario
- `{{payment_amount}}` - Importe del pago
- `{{payment_method}}` - Método de pago
- `{{payment_datetime}}` - Fecha y hora completa
- `{{payment_date}}` - Fecha del pago
- `{{payment_ref}}` - Referencia del pago (opcional)
- `{{transaction_id}}` - ID de transacción
- `{{policy_number}}` - Número de póliza
- `{{insurance_type}}` - Tipo de seguro
- `{{coverage_period}}` - Período de cobertura
- `{{payment_concept}}` - Concepto del pago
- `{{receipt_download_link}}` - Enlace de descarga del recibo
- `{{policy_link}}` - Enlace a la póliza
- `{{contact_phone}}` - Teléfono de contacto
- `{{contact_email}}` - Email de contacto
- `{{company_name}}` - Razón social
- `{{company_nif}}` - NIF de la empresa
- `{{company_address}}` - Dirección fiscal

**Variables opcionales:**
- `{{next_payment_date}}` - Fecha del próximo pago
- `{{next_payment_amount}}` - Importe del próximo pago
- `{{payment_breakdown}}` - Array con desglose (cada uno con `description` y `amount`)

### 7. Report Ready (`report-ready.html`)
**Uso:** Notificación de informes generados
**Variables:**
- `{{user_name}}` - Nombre del usuario
- `{{report_category}}` - Categoría del informe
- `{{report_name}}` - Nombre del informe
- `{{report_period}}` - Período del informe
- `{{generation_date}}` - Fecha de generación
- `{{requester_name}}` - Nombre del solicitante
- `{{page_count}}` - Número de páginas
- `{{record_count}}` - Cantidad de registros
- `{{view_report_link}}` - Enlace para ver online
- `{{pdf_download_link}}` - Enlace descarga PDF
- `{{pdf_size}}` - Tamaño del PDF
- `{{excel_download_link}}` - Enlace descarga Excel
- `{{excel_size}}` - Tamaño del Excel
- `{{csv_download_link}}` - Enlace descarga CSV
- `{{csv_size}}` - Tamaño del CSV
- `{{availability_days}}` - Días de disponibilidad
- `{{expiry_date}}` - Fecha de expiración
- `{{schedule_report_link}}` - Enlace para programar informes
- `{{report_id}}` - ID del informe
- `{{contact_phone}}` - Teléfono de contacto
- `{{contact_email}}` - Email de contacto

**Arrays opcionales:**
- `{{statistics}}` - Array de estadísticas (cada uno con `label` y `value`)
- `{{highlights}}` - Array de puntos destacados

## Características

- **Responsive Design:** Todas las plantillas son completamente responsivas y se adaptan a dispositivos móviles
- **Cross-client Compatible:** Probadas en los principales clientes de email
- **Inline CSS:** Estilos inline para máxima compatibilidad
- **Branded:** Diseño consistente con la identidad de Soriano Mediadores
- **Accesible:** HTML semántico y estructura accesible
- **Spanish Content:** Todo el contenido está en español
- **Modern Design:** Diseño moderno con degradados y esquemas de color profesionales

## Esquema de Colores

- **Primary Blue:** #1e3a8a / #3b82f6
- **Success Green:** #059669 / #10b981
- **Warning Yellow:** #f59e0b / #fef3c7
- **Error Red:** #ef4444 / #fee2e2
- **Purple Accent:** #7c3aed / #a78bfa
- **Gray Scale:** #1f2937 / #4b5563 / #6b7280 / #9ca3af

## Uso en Backend

### Ejemplo en Node.js con Handlebars:

```javascript
const fs = require('fs');
const handlebars = require('handlebars');

// Cargar template
const template = fs.readFileSync('./templates/emails/welcome.html', 'utf8');
const compiledTemplate = handlebars.compile(template);

// Datos
const data = {
  user_name: 'Juan Pérez',
  user_email: 'juan@example.com',
  verification_link: 'https://app.sorianomediadores.com/verify/abc123',
  registration_date: '28 de enero de 2026',
  base_url: 'https://app.sorianomediadores.com',
  year: new Date().getFullYear(),
  company_address: 'Calle Principal 123, Madrid, España'
};

// Renderizar
const html = compiledTemplate(data);

// Enviar email
sendEmail({
  to: data.user_email,
  subject: 'Bienvenido a Soriano Mediadores',
  html: html
});
```

### Ejemplo en Python con Jinja2:

```python
from jinja2 import Template

# Cargar template
with open('./templates/emails/welcome.html', 'r', encoding='utf-8') as f:
    template_content = f.read()

template = Template(template_content)

# Datos
data = {
    'user_name': 'Juan Pérez',
    'user_email': 'juan@example.com',
    'verification_link': 'https://app.sorianomediadores.com/verify/abc123',
    'registration_date': '28 de enero de 2026',
    'base_url': 'https://app.sorianomediadores.com',
    'year': datetime.now().year,
    'company_address': 'Calle Principal 123, Madrid, España'
}

# Renderizar
html = template.render(**data)

# Enviar email
send_email(
    to=data['user_email'],
    subject='Bienvenido a Soriano Mediadores',
    html=html
)
```

## Testing

Para probar las plantillas localmente:

1. Reemplaza las variables `{{variable}}` con datos de prueba
2. Abre el archivo HTML en diferentes navegadores
3. Prueba en visualizadores de email como Litmus o Email on Acid
4. Verifica la responsividad cambiando el tamaño de la ventana

## Buenas Prácticas

1. **Siempre incluye** un texto alternativo para cuando las imágenes estén deshabilitadas
2. **Mantén el ancho máximo** en 600px para compatibilidad
3. **Usa tablas** para layouts complejos si es necesario
4. **Evita JavaScript** - no es compatible con la mayoría de clientes de email
5. **Prueba en múltiples clientes** antes de implementar en producción
6. **Incluye siempre** un enlace de cancelación de suscripción
7. **Versión texto plano** - considera incluir una versión en texto plano como fallback

## Personalización

Para personalizar las plantillas:

1. Modifica los colores en la sección `<style>`
2. Actualiza el logo/nombre de la empresa
3. Ajusta el contenido del footer
4. Añade o quita secciones según necesidad
5. Mantén la estructura responsive intacta

## Soporte

Para problemas o sugerencias sobre las plantillas, contacta al equipo de desarrollo de AIT-CORE.

---

**Versión:** 1.0.0
**Última actualización:** 28 de enero de 2026
**Autor:** AIT-CORE Development Team
