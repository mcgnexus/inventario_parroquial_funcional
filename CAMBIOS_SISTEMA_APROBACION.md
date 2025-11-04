# Cambios implementados - Sistema de Aprobación

## ✅ Resumen de cambios

He implementado un **sistema completo de aprobación de usuarios** donde:

1. ✅ **Solo tú eres administrador** (mcgnexus@gmail.com)
2. ✅ **Todos los nuevos registros requieren tu aprobación**
3. ✅ **Los usuarios NO pueden acceder hasta que tú los apruebes y paguen**
4. ✅ **Instrucciones de Bizum visibles y claras** (tu número: 614 242 716)

---

## 🔄 Flujo completo del usuario

### 1. Usuario se registra

- Va a `/auth` → Pestaña "Registrarse"
- Completa el formulario (nombre, email, contraseña, parroquia opcional)
- **Ya NO puede elegir "admin"** - ese campo fue eliminado
- Al enviar el formulario:
  - Se crea usuario con `role='user'` y `user_status='pending'`
  - Se cierra la sesión automáticamente (no puede acceder)
  - Ve un mensaje verde de éxito explicando los próximos pasos

**Mensaje que verá:**
```
✅ Registro exitoso

Tu cuenta ha sido creada correctamente.

Próximos pasos:
1. El administrador revisará tu solicitud
2. Recibirás las instrucciones de pago por email
3. Una vez aprobado y pagado, podrás acceder

Importante: No podrás iniciar sesión hasta que tu cuenta sea aprobada
por el administrador de la Diócesis de Guadix.
```

### 2. Tú recibes la notificación

- Accedes a `/admin` con tu cuenta
- Ves el nuevo usuario en la pestaña **"Pendientes"**
- Verificas su información (nombre, email, parroquia)

### 3. Tú apruebas al usuario

- Click en botón **"Aprobar"**
- El usuario pasa a estado `approved_unpaid`
- Le envías un email/WhatsApp con las plantillas de [PLANTILLAS_COMUNICACION.md](PLANTILLAS_COMUNICACION.md)

### 4. Usuario ve instrucciones de Bizum

- El usuario inicia sesión (ahora sí puede)
- Ve un **banner grande con instrucciones de Bizum**:

```
💳 Instrucciones de pago

📱 Opción 1 - Bizum (Recomendado)

Enviar Bizum a:
614 242 716

Concepto:
Inventarios Diocesano

Importe:
10,00 €

📧 Después de realizar el pago:
1. Haz captura del comprobante de pago
2. Envíalo por email a: mcgnexus@gmail.com
3. Incluye tu email de registro en el mensaje

⏱️ Tu acceso se activará en menos de 24 horas
```

### 5. Usuario paga y te envía comprobante

- Usuario hace Bizum a tu número: **614 242 716**
- Te envía comprobante por email/WhatsApp

### 6. Tú activas la suscripción

- Accedes a `/admin` → Pestaña **"Sin pago"**
- Encuentras al usuario
- Click en **"Registrar pago"**
- Completas:
  - Monto: 10.00
  - Referencia: Número del Bizum
  - Notas: "Pago recibido"
- Click en **"Activar suscripción"**

### 7. Usuario tiene acceso completo

- `user_status` cambia a `active`
- Tiene acceso por 1 mes
- Puede usar toda la aplicación normalmente

---

## 🔒 Cambios de seguridad implementados

### 1. Archivo [src/lib/auth.ts](src/lib/auth.ts)

**Antes:**
```typescript
role,  // Tomaba el valor del formulario
parish_id: resolvedParishId || null,
```

**Ahora:**
```typescript
role: 'user',  // Forzar role='user' siempre (ignorar parámetro)
user_status: 'pending',  // Usuarios nuevos empiezan como "pending"
parish_id: resolvedParishId || null,

// Cerrar sesión inmediatamente después del registro
// El usuario NO debe tener acceso hasta que el admin lo apruebe
await sb.auth.signOut()
```

### 2. Archivo [src/app/auth/page.tsx](src/app/auth/page.tsx)

**Cambios:**
- ❌ Eliminado campo "Rol" del formulario de registro
- ✅ Añadido mensaje de éxito después del registro
- ✅ Forzado `role='user'` en todos los casos
- ✅ Limpieza del formulario después del registro exitoso

### 3. Archivo [src/components/SubscriptionStatus.tsx](src/components/SubscriptionStatus.tsx)

**Cambios:**
- ✅ Diseño completamente nuevo y visual
- ✅ Tu número de Bizum (614 242 716) destacado en tamaño 3xl
- ✅ Instrucciones paso a paso muy claras
- ✅ Colores llamativos (verde para Bizum, azul para aprobación)
- ✅ Iconos y emojis para mejor comprensión

---

## 📋 Próximos pasos (OBLIGATORIOS)

### 1. Ejecutar la migración SQL (5 minutos)

Si aún no lo hiciste:

1. Ve a [Supabase Dashboard](https://supabase.com/dashboard)
2. SQL Editor
3. Ejecuta el archivo: `supabase/migrations/001_user_approval_system.sql`
4. Verifica que eres admin:

```sql
SELECT email, role, user_status
FROM profiles p
JOIN auth.users u ON u.id = p.id
WHERE u.email = 'mcgnexus@gmail.com';
```

Debe mostrar:
```
email              | role  | user_status
-------------------|-------|-------------
mcgnexus@gmail.com | admin | active
```

### 2. Reemplazar el IBAN (opcional, 1 minuto)

En [src/components/SubscriptionStatus.tsx](src/components/SubscriptionStatus.tsx), línea ~149:

**Actual:**
```tsx
<p className="font-mono font-semibold">ES12 3456 7890 1234 5678 9012</p>
<p className="text-xs text-red-600 dark:text-red-400">← Reemplaza con tu IBAN real</p>
```

**Cámbialo por tu IBAN real:**
```tsx
<p className="font-mono font-semibold">ES91 XXXX XXXX XXXX XXXX XXXX</p>
```

O simplemente elimina la opción de transferencia si solo quieres Bizum.

### 3. Probar el sistema completo (10 minutos)

1. **Crear usuario de prueba:**
   - Abre ventana de incógnito
   - Ve a `/auth` → Registrarse
   - Registra con email de prueba (ej: `test@ejemplo.com`)
   - Verifica que:
     - ✅ Ves el mensaje verde de éxito
     - ✅ NO puedes acceder al sistema
     - ✅ Te redirige a login

2. **Aprobar desde admin:**
   - Inicia sesión con `mcgnexus@gmail.com`
   - Ve a `/admin`
   - Pestaña "Pendientes" → Verás al usuario de prueba
   - Click "Aprobar"

3. **Ver instrucciones de Bizum:**
   - En incógnito, inicia sesión con el usuario de prueba
   - Deberías ver el **banner grande con tu número de Bizum: 614 242 716**
   - Verifica que se ve claro y visible

4. **Activar suscripción:**
   - Vuelve a admin
   - Pestaña "Sin pago"
   - Click "Registrar pago"
   - Rellena con datos ficticios
   - Click "Activar suscripción"

5. **Verificar acceso:**
   - En incógnito, recarga la página
   - El usuario de prueba ahora debería tener acceso completo
   - El banner de pago desaparece
   - Puede usar la aplicación normalmente

---

## 🐛 Solución de problemas

### Problema: Usuarios antiguos no tienen `user_status`

**Solución:** Ejecuta en Supabase SQL Editor:

```sql
-- Actualizar usuarios antiguos para que tengan estado
UPDATE profiles
SET user_status = CASE
  WHEN role = 'admin' THEN 'active'
  ELSE 'pending'
END
WHERE user_status IS NULL;
```

### Problema: Un usuario se registró y puede acceder sin aprobación

**Solución:** Suspenderlo inmediatamente:

```sql
UPDATE profiles
SET user_status = 'pending'
WHERE id = (SELECT id FROM auth.users WHERE email = 'usuario@ejemplo.com');
```

### Problema: No veo el panel de admin

**Solución:** Verifica que eres admin:

```sql
UPDATE profiles
SET role = 'admin', user_status = 'active'
WHERE id = (SELECT id FROM auth.users WHERE email = 'mcgnexus@gmail.com');
```

### Problema: El número de Bizum no se ve

**Solución:** Verifica que ejecutaste `npm run dev` después de los cambios.

---

## 📊 Qué puedes hacer ahora

### Desde el panel `/admin`:

1. **Ver estadísticas:**
   - Usuarios pendientes
   - Usuarios aprobados sin pago
   - Usuarios activos
   - Usuarios por expirar

2. **Gestionar usuarios pendientes:**
   - Aprobar nuevos registros
   - Rechazar usuarios no deseados

3. **Gestionar pagos:**
   - Registrar nuevos pagos (activar suscripciones)
   - Renovar suscripciones existentes
   - Ver historial de pagos

4. **Monitorear:**
   - Ver usuarios por expirar (7 días antes)
   - Ver cantidad de items por usuario
   - Ver información de parroquias

---

## 📞 Información de contacto visible

En toda la aplicación se muestra:

- **Email:** mcgnexus@gmail.com
- **Bizum:** 614 242 716
- **Concepto:** Inventarios Diocesano
- **Importe:** 10,00 €

Los usuarios lo ven claramente en:
1. Mensaje después de registro
2. Banner cuando están aprobados sin pagar
3. Plantillas de comunicación para ti

---

## ✅ Resumen de archivos modificados

1. [src/lib/auth.ts](src/lib/auth.ts) - Forzar role='user' y status='pending' + signOut después de registro
2. [src/app/auth/page.tsx](src/app/auth/page.tsx) - Eliminar campo "Rol" + mensaje de éxito
3. [src/components/SubscriptionStatus.tsx](src/components/SubscriptionStatus.tsx) - Diseño visual con Bizum destacado

---

## 🎉 ¡Listo para usar!

Tu sistema ahora está **100% controlado por ti**:

- ✅ Solo tú eres admin
- ✅ Apruebas cada nuevo usuario
- ✅ Los usuarios ven claramente cómo pagar (Bizum: 614 242 716)
- ✅ Registras pagos desde el panel admin
- ✅ Control total sobre accesos

**Siguiente paso:** Prueba el flujo completo con un usuario de prueba (10 minutos) y ¡empieza a recibir usuarios reales!

---

¿Necesitas ayuda con algo? Revisa [INSTALACION_RAPIDA.md](INSTALACION_RAPIDA.md) o [GUIA_SISTEMA_SUSCRIPCION.md](GUIA_SISTEMA_SUSCRIPCION.md).
