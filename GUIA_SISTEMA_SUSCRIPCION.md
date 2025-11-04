# Guía completa del Sistema de Suscripción y Aprobación de Usuarios

## Descripción general

Este sistema permite:
- **Control total del administrador** (mcgnexus@gmail.com)
- **Aprobación manual** de nuevos usuarios
- **Sistema de suscripción** de 10€/mes
- **Gestión de pagos** (Bizum o Ko-fi)

---

## Arquitectura del sistema

### Estados de usuario

| Estado | Descripción | Acceso |
|--------|-------------|--------|
| `pending` | Recién registrado, esperando aprobación | ❌ Sin acceso |
| `approved_unpaid` | Aprobado por admin, debe pagar | ❌ Sin acceso |
| `active` | Suscripción activa | ✅ Acceso completo |
| `suspended` | Suspendido por admin | ❌ Sin acceso |
| `rejected` | Rechazado por admin | ❌ Sin acceso |

### Flujo de usuario nuevo

```
1. Usuario se registra
   ↓
   Estado: "pending"

2. Admin aprueba en panel
   ↓
   Estado: "approved_unpaid"
   ↓
   Usuario recibe email/WhatsApp con instrucciones de pago

3. Usuario paga 10€ (Bizum o Ko-fi)
   ↓
   Admin registra el pago en panel
   ↓
   Estado: "active"
   ↓
   Usuario tiene acceso por 1 mes

4. Cada mes:
   Usuario paga → Admin renueva → +1 mes de acceso
```

---

## Instalación y configuración

### Paso 1: Ejecutar la migración SQL

1. Accede al **SQL Editor** de Supabase
2. Copia y ejecuta el archivo `supabase/migrations/001_user_approval_system.sql`
3. Verifica que se ejecutó correctamente:

```sql
-- Debe mostrar tu email como admin
SELECT email, role, user_status
FROM profiles p
JOIN auth.users u ON u.id = p.id
WHERE u.email = 'mcgnexus@gmail.com';
```

Deberías ver:
```
email                | role  | user_status
---------------------|-------|-------------
mcgnexus@gmail.com   | admin | active
```

### Paso 2: Verificar las tablas creadas

Ejecuta en Supabase SQL Editor:

```sql
-- Ver tablas nuevas
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name IN ('user_approvals', 'payment_history');

-- Ver funciones nuevas
SELECT routine_name
FROM information_schema.routines
WHERE routine_schema = 'public'
  AND routine_name IN ('approve_user', 'activate_subscription', 'renew_subscription', 'suspend_user');
```

### Paso 3: Configurar tu contraseña de admin

Si aún no has creado tu cuenta de admin:

1. Ve a la página de registro de tu app
2. Regístrate con:
   - Email: `mcgnexus@gmail.com`
   - Contraseña: `Avemaria_1977` (o la que prefieras)
   - Nombre: Tu nombre

3. Luego ejecuta en Supabase:

```sql
UPDATE profiles
SET role = 'admin', user_status = 'active'
WHERE id = (SELECT id FROM auth.users WHERE email = 'mcgnexus@gmail.com');
```

---

## Uso del panel de administración

### Acceder al panel

1. Inicia sesión con tu cuenta de admin
2. Navega a: `https://tu-app.com/admin`

### Gestión de usuarios pendientes

**Cuando un usuario se registra:**

1. Aparecerá en la pestaña **"Pendientes"**
2. Verás su:
   - Nombre completo
   - Email
   - Parroquia (si la especificó)
   - Fecha de registro

**Para aprobar:**

1. Click en botón **"Aprobar"**
2. El usuario pasa a estado `approved_unpaid`
3. Contacta al usuario por email/WhatsApp:

```
Hola [Nombre],

¡Tu cuenta ha sido aprobada! Para activar el acceso, realiza el pago de 10€/mes:

OPCIÓN 1 - Bizum:
- Número: [TU_NÚMERO]
- Concepto: Inventarios Diocesano - [Email del usuario]

OPCIÓN 2 - Transferencia:
- IBAN: [TU_IBAN]
- Concepto: Inventarios - [Email del usuario]

Una vez realizado el pago, envíame el comprobante para activar tu acceso.

Saludos,
Diócesis de Guadix
```

### Gestión de pagos

**Cuando un usuario te envía comprobante de pago:**

1. Ve a pestaña **"Sin pago"**
2. Encuentra al usuario
3. Click en **"Registrar pago"**
4. Completa el formulario:
   - **Monto**: `10.00` (por defecto)
   - **Referencia**: Número de Bizum o ID de transferencia
   - **Notas**: Cualquier información adicional
5. Click en **"Activar suscripción"**

El usuario ahora tiene acceso por **1 mes** desde hoy.

### Gestión de renovaciones

**Cuando un usuario paga su renovación mensual:**

1. Ve a pestaña **"Activos"**
2. Encuentra al usuario
3. Click en **"Renovar"**
4. Se añadirá **1 mes más** desde su fecha de expiración

**Usuarios por expirar:**
- En el dashboard verás cuántos usuarios expiran en 7 días
- Puedes contactarlos para recordarles el pago

### Suspender un usuario

Si necesitas suspender a alguien:

1. Encuentra al usuario en cualquier pestaña
2. Click en **"Suspender"**
3. Escribe el motivo
4. El usuario pierde acceso inmediatamente

---

## Integración de pagos automática (Futuro)

### Opción A: Ko-fi

**Ventajas:**
- Webhooks automáticos
- Internacional
- Fácil de configurar

**Cómo implementar:**

1. Crea cuenta en [ko-fi.com](https://ko-fi.com)
2. Configura membresía de 10€/mes
3. Añade webhook que llame a tu API:

```typescript
// src/app/api/webhooks/kofi/route.ts
export async function POST(request: Request) {
  const data = await request.json()

  // Verificar el pago
  if (data.type === 'Subscription' && data.amount === '10.00') {
    const userEmail = data.email

    // Buscar usuario y activar suscripción
    // ... código de activación
  }
}
```

### Opción B: Bizum automatizado

**Limitaciones:**
- Bizum no tiene API pública
- Requiere banco con API (BBVA, Santander)
- Más complejo de implementar

**Recomendación:** Mantener manual hasta tener >50 usuarios, luego migrar a Ko-fi.

---

## Consultas SQL útiles

### Ver todos los usuarios y su estado

```sql
SELECT
  u.email,
  p.full_name,
  p.user_status,
  p.subscription_end,
  CASE
    WHEN p.subscription_end IS NULL THEN 'Sin suscripción'
    WHEN p.subscription_end < NOW() THEN 'Expirado'
    WHEN p.subscription_end < NOW() + INTERVAL '7 days' THEN 'Por expirar'
    ELSE 'Activo'
  END as estado_suscripcion
FROM auth.users u
LEFT JOIN profiles p ON p.id = u.id
WHERE p.role != 'admin'
ORDER BY p.created_at DESC;
```

### Ver historial de pagos de un usuario

```sql
SELECT
  ph.amount,
  ph.payment_method,
  ph.payment_reference,
  ph.period_start,
  ph.period_end,
  ph.created_at,
  admin.full_name as verificado_por
FROM payment_history ph
LEFT JOIN profiles admin ON admin.id = ph.verified_by
WHERE ph.user_id = (
  SELECT id FROM auth.users WHERE email = 'usuario@ejemplo.com'
)
ORDER BY ph.created_at DESC;
```

### Ver usuarios que expiran pronto

```sql
SELECT
  u.email,
  p.full_name,
  p.subscription_end,
  DATE_PART('day', p.subscription_end - NOW()) as dias_restantes
FROM profiles p
JOIN auth.users u ON u.id = p.id
WHERE p.user_status = 'active'
  AND p.subscription_end < NOW() + INTERVAL '7 days'
ORDER BY p.subscription_end ASC;
```

### Activar manualmente un usuario (emergencia)

```sql
-- Solo usa esto en caso de emergencia
UPDATE profiles
SET
  user_status = 'active',
  subscription_start = NOW(),
  subscription_end = NOW() + INTERVAL '1 month',
  last_payment_date = NOW()
WHERE id = (SELECT id FROM auth.users WHERE email = 'usuario@ejemplo.com');
```

---

## Seguridad

### Protecciones implementadas

1. **RLS (Row Level Security):**
   - Los usuarios solo ven sus propios datos
   - Solo tú como admin ves todo

2. **No pueden auto-promover:**
   - Los usuarios no pueden cambiar su `role` a admin
   - No pueden cambiar su `user_status`

3. **Funciones seguras:**
   - Todas las funciones verifican que seas admin
   - Usan `SECURITY DEFINER` para ejecutar con privilegios

### Mejores prácticas

1. **NO compartas tu contraseña**
2. **Usa contraseña fuerte** (Avemaria_1977 está bien)
3. **Revisa logs regularmente:**

```sql
SELECT *
FROM user_approvals
ORDER BY created_at DESC
LIMIT 20;
```

4. **Backups automáticos:**
   - Supabase hace backups diarios automáticamente
   - Puedes descargarlos desde el dashboard

---

## Precios y escalabilidad

### Para Diócesis de Guadix (inicial)

**Estimación de usuarios:**
- ~20 parroquias
- 1-2 usuarios por parroquia
- **Total:** ~30 usuarios

**Ingresos mensuales:**
- 30 usuarios × 10€ = **300€/mes**

**Costos:**
- Supabase Free: 0€ (hasta 500MB DB)
- Vercel Free: 0€
- **Total:** 0€/mes

**Beneficio neto:** 300€/mes

### Si escalas a toda España

**Potencial:**
- ~70 diócesis
- ~30 usuarios promedio por diócesis
- **Total:** ~2,100 usuarios

**Ingresos:**
- 2,100 × 10€ = **21,000€/mes**

**Costos estimados:**
- Supabase Pro: ~25€/mes
- Vercel Pro: ~20€/mes
- Soporte: Variable
- **Total:** ~50€/mes

**Beneficio neto:** ~20,950€/mes

---

## Roadmap futuro

### Fase 1 (Actual) - Manual
- ✅ Sistema de aprobación manual
- ✅ Registro manual de pagos
- ✅ Panel de administración

### Fase 2 - Semi-automático
- ⏳ Integración Ko-fi con webhooks
- ⏳ Emails automáticos de aprobación
- ⏳ Recordatorios de renovación

### Fase 3 - Profesional
- ⏳ Pasarela de pago directa (Stripe)
- ⏳ Facturación automática
- ⏳ Multi-admin (delegar a otros obispos)
- ⏳ Sistema de soporte integrado

---

## Preguntas frecuentes

### ¿Qué pasa si un usuario no paga?

Su `subscription_end` expira y automáticamente pierde acceso. Puedes enviarle un recordatorio.

### ¿Puedo hacer descuentos?

Sí, al registrar el pago puedes poner cualquier monto (ej: 5€, 7€).

### ¿Puedo tener suscripciones anuales?

Sí, modifica la función:

```sql
-- Para 1 año en lugar de 1 mes
subscription_end := NOW() + INTERVAL '1 year'
```

### ¿Puedo añadir más administradores?

Sí, ejecuta:

```sql
UPDATE profiles
SET role = 'admin', user_status = 'active'
WHERE id = (SELECT id FROM auth.users WHERE email = 'otro-admin@ejemplo.com');
```

### ¿Qué datos se guardan?

- Email, nombre, parroquia del usuario
- Historial de pagos (montos, fechas, referencias)
- Historial de aprobaciones/suspensiones
- NO se guardan datos de tarjetas ni bancarios

---

## Soporte

Si tienes problemas:

1. Revisa los logs en Supabase → Logs → API
2. Verifica las políticas RLS estén activas
3. Prueba en modo incógnito (para descartar caché)

Para reportar bugs o sugerencias:
- Contacta al desarrollador
- O crea un issue en el repositorio

---

## Licencia y créditos

**Desarrollado para:** Diócesis de Guadix
**Administrador:** mcgnexus@gmail.com
**Fecha:** Noviembre 2025
**Versión:** 1.0

Este sistema es privado y de uso exclusivo para la Diócesis de Guadix.
Prohibida su distribución o uso sin autorización.
