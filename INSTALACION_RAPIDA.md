# Instalación Rápida - Sistema de Suscripción

## Pasos de instalación (15 minutos)

### 1. Ejecutar migración SQL (5 min)

1. Ve a [Supabase Dashboard](https://supabase.com/dashboard)
2. Selecciona tu proyecto
3. Ve a **SQL Editor** (icono de base de datos)
4. Click en **New Query**
5. Copia TODO el contenido de: `supabase/migrations/001_user_approval_system.sql`
6. Pega en el editor
7. Click en **RUN** (o Ctrl+Enter)
8. Espera a que termine (verás "Success" en verde)

### 2. Verificar que eres admin (2 min)

En el mismo SQL Editor, ejecuta:

```sql
SELECT u.email, p.role, p.user_status
FROM auth.users u
JOIN profiles p ON p.id = u.id
WHERE u.email = 'mcgnexus@gmail.com';
```

**Resultado esperado:**
```
email              | role  | user_status
-------------------|-------|-------------
mcgnexus@gmail.com | admin | active
```

Si no aparece, ejecuta:

```sql
UPDATE profiles
SET role = 'admin', user_status = 'active'
WHERE id = (SELECT id FROM auth.users WHERE email = 'mcgnexus@gmail.com');
```

### 3. Añadir el panel de admin al menú (3 min)

Busca tu componente de navegación (probablemente en `src/components/` o `src/app/layout.tsx`) y añade:

```tsx
// Si el usuario es admin, mostrar link al panel
{userRole === 'admin' && (
  <Link href="/admin">Panel de Admin</Link>
)}
```

O simplemente accede directamente a: `http://localhost:3000/admin` (o tu dominio `/admin`)

### 4. Personalizar instrucciones de pago (5 min)

Edita el archivo: `src/components/SubscriptionStatus.tsx`

Busca estas líneas (aprox. línea 100-110):

```tsx
• Número: <strong>[NÚMERO_AQUÍ]</strong>
```

Y reemplaza con tu información real:

```tsx
• Número: <strong>666 123 456</strong>  // Tu número de teléfono para Bizum
```

```tsx
• IBAN: <strong>[IBAN_AQUÍ]</strong>
```

Reemplaza con:

```tsx
• IBAN: <strong>ES12 3456 7890 1234 5678 9012</strong>  // Tu IBAN real
```

### 5. Mostrar el estado de suscripción (opcional, 3 min)

En tu página principal o dashboard de usuario, añade:

```tsx
import SubscriptionStatus from '@/components/SubscriptionStatus'

export default function DashboardPage() {
  return (
    <div>
      {/* Mostrar estado de suscripción al inicio */}
      <SubscriptionStatus />

      {/* Resto de tu contenido */}
    </div>
  )
}
```

---

## ¡Listo! Ahora puedes:

1. **Iniciar sesión** con mcgnexus@gmail.com
2. **Ir a** `/admin` para ver el panel
3. **Gestionar** usuarios y pagos

---

## Flujo de trabajo diario

### Cuando un usuario nuevo se registra:

1. **Recibes notificación** (puedes configurar email alerts en Supabase)
2. **Vas a** `/admin`
3. **Pestaña "Pendientes"** → Ves el usuario
4. **Click "Aprobar"**
5. **Contactas al usuario** (email/WhatsApp):
   ```
   Hola [Nombre],

   ¡Tu cuenta ha sido aprobada! Para activar el acceso:

   Bizum: 666 123 456
   Concepto: Inventarios Diocesano

   Envíame el comprobante cuando hayas pagado.

   Saludos,
   Diócesis de Guadix
   ```

### Cuando el usuario paga:

1. **Usuario te envía** comprobante (WhatsApp, email, etc)
2. **Vas a** `/admin`
3. **Pestaña "Sin pago"** → Encuentras al usuario
4. **Click "Registrar pago"**
5. **Completas**:
   - Monto: 10.00
   - Referencia: Número de Bizum o ID de transferencia
   - Notas: "Pago recibido vía Bizum"
6. **Click "Activar suscripción"**
7. ✅ **Usuario tiene acceso por 1 mes**

### Cada mes (renovaciones):

1. **Pestaña "Activos"** → Encuentras usuarios por expirar
2. **Les recuerdas** que deben pagar
3. **Cuando pagan** → Click "Renovar"
4. ✅ **+1 mes de acceso**

---

## Solución de problemas

### No veo el panel de admin

**Problema:** Error 403 o redirige a home

**Solución:**

```sql
-- Verificar rol
SELECT id, email, role FROM profiles
WHERE id = (SELECT id FROM auth.users WHERE email = 'mcgnexus@gmail.com');

-- Si role NO es 'admin', ejecutar:
UPDATE profiles SET role = 'admin'
WHERE id = (SELECT id FROM auth.users WHERE email = 'mcgnexus@gmail.com');
```

### Los usuarios no ven el estado de suscripción

**Problema:** No aparece el componente SubscriptionStatus

**Solución:**

1. Verifica que importaste el componente
2. Verifica que el usuario NO sea admin (a admins no se les muestra)
3. Revisa la consola del navegador (F12) por errores

### Error al ejecutar la migración SQL

**Problema:** "permission denied" o "already exists"

**Solución:**

Si dice "already exists", significa que ya está instalado. Si dice "permission denied":

1. Ve a Supabase → Settings → Database
2. Verifica que estés en el proyecto correcto
3. Usa el SQL Editor, no psql directo

---

## Siguientes pasos

1. ✅ Sistema instalado
2. ✅ Tú eres admin
3. ✅ Panel funcional
4. ⏳ **Configura tu número/IBAN** en SubscriptionStatus.tsx
5. ⏳ **Añade link al panel** en tu navegación
6. ⏳ **Prueba el flujo completo** con un usuario de prueba

---

## Recursos

- **Guía completa:** Lee `GUIA_SISTEMA_SUSCRIPCION.md`
- **Soporte:** mcgnexus@gmail.com
- **Backup:** Supabase hace backups automáticos diarios

---

## Contacto para dudas

Si tienes problemas durante la instalación:

1. Revisa los logs en Supabase → Logs → API
2. Verifica que las políticas RLS estén activas
3. Contacta al desarrollador con capturas de pantalla del error
