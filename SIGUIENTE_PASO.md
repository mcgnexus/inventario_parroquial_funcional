# SIGUIENTE PASO - Arreglar recursión infinita

## Estado actual

Has ejecutado `EJECUTAR_ESTO.sql` correctamente, pero ahora hay un error de **recursión infinita** en las políticas RLS.

## Error que estás viendo

```
Error cargando info de suscripción:
{code: '42P17', message: 'infinite recursion detected in policy for relation "profiles"'}
```

## Solución

### 1. Ejecutar FIX_RECURSION.sql (5 minutos)

1. Ve a **Supabase Dashboard**: https://supabase.com/dashboard
2. Abre **SQL Editor**
3. Copia **TODO** el contenido del archivo `FIX_RECURSION.sql`
4. Pégalo en el editor
5. Click en **RUN** (o Ctrl+Enter)
6. Deberías ver: `Success. No rows returned`

### 2. Limpiar caché del navegador (1 minuto)

1. Cierra todas las pestañas de tu aplicación
2. En Chrome/Edge:
   - Presiona `Ctrl+Shift+Delete`
   - Selecciona "Últimas 24 horas"
   - Marca "Caché" y "Cookies"
   - Click en "Borrar datos"
3. O simplemente usa una ventana de incógnito para probar

### 3. Reiniciar la aplicación (1 minuto)

En tu terminal:

```bash
# Detener el servidor (Ctrl+C)
# Luego reiniciar:
npm run dev
```

### 4. Probar que funciona (3 minutos)

1. **Abre** http://localhost:3000
2. **Inicia sesión** con `mcgnexus@gmail.com`
3. **Verifica** que ves:
   - ✅ Tu email en la parte superior
   - ✅ Botón "Panel de Administración" (tarjeta con borde azul)
   - ✅ NO ves errores en consola (F12)

4. **Click** en "Panel de Administración"
5. **Verifica** que ves:
   - ✅ Pestaña "Pendientes"
   - ✅ Pestaña "Sin pago"
   - ✅ Pestaña "Activos"
   - ✅ Estadísticas de usuarios

### 5. Probar registro de usuario nuevo (5 minutos)

1. **Abre** ventana de incógnito
2. Ve a http://localhost:3000
3. Click en "Registrarse"
4. Completa formulario con datos de prueba:
   - Nombre: "Usuario Prueba"
   - Email: "test@ejemplo.com"
   - Contraseña: "Test123456"
   - Parroquia: "Iglesia de Prueba"
5. Click en "Registrarse"
6. **Deberías ver**:
   - ✅ Mensaje verde "Registro exitoso"
   - ✅ Explicación de próximos pasos
   - ✅ Te redirige a login automáticamente

### 6. Aprobar usuario desde admin (3 minutos)

1. Vuelve a tu ventana normal (admin)
2. Ve a `/admin`
3. Pestaña "Pendientes"
4. Deberías ver a "Usuario Prueba"
5. Click en "Aprobar"
6. Verifica que pasa a la pestaña "Sin pago"

### 7. Ver instrucciones de Bizum (2 minutos)

1. Vuelve a ventana de incógnito
2. Inicia sesión con `test@ejemplo.com`
3. **Deberías ver** un banner GRANDE con:
   - ✅ "Cuenta aprobada! Último paso: Realizar el pago"
   - ✅ Tu número de Bizum: **614 242 716** en tamaño gigante
   - ✅ Concepto: "Inventarios Diocesano"
   - ✅ Importe: 10,00 €
   - ✅ Instrucciones de qué hacer después del pago

## ¿Qué hace FIX_RECURSION.sql?

**Problema**: Las políticas RLS estaban consultando la tabla `profiles` desde dentro de las políticas de `profiles`, causando un bucle infinito.

**Ejemplo del problema**:
```sql
-- MALO (causa recursión):
CREATE POLICY "profiles_select_policy" ON profiles
USING (
  (SELECT role FROM profiles WHERE id = auth.uid()) = 'admin'  -- ¡Consulta profiles!
);
```

**Solución**: Usar `auth.jwt()` para leer el email directamente del token JWT, sin consultar la base de datos:
```sql
-- BUENO (sin recursión):
CREATE POLICY "profiles_select_policy" ON profiles
USING (
  auth.uid() = id
  OR (auth.jwt() ->> 'email') = 'mcgnexus@gmail.com'  -- Lee del JWT
);
```

## Si algo falla

### Error: "policy already exists"

Ejecuta primero esto en SQL Editor:

```sql
-- Limpiar todas las políticas antiguas
DROP POLICY IF EXISTS "profiles_select_policy" ON profiles;
DROP POLICY IF EXISTS "profiles_insert_policy" ON profiles;
DROP POLICY IF EXISTS "profiles_update_policy" ON profiles;
DROP POLICY IF EXISTS "items_select_policy" ON items;
DROP POLICY IF EXISTS "items_insert_policy" ON items;
DROP POLICY IF EXISTS "items_update_policy" ON items;
DROP POLICY IF EXISTS "items_delete_policy" ON items;
```

Luego ejecuta `FIX_RECURSION.sql` completo.

### Error: "No eres admin" / No ves panel admin

Ejecuta en SQL Editor:

```sql
UPDATE profiles
SET role = 'admin', user_status = 'active'
WHERE id = (SELECT id FROM auth.users WHERE email = 'mcgnexus@gmail.com');
```

### Error: Sigo viendo errores de recursión

1. Verifica que ejecutaste TODO el archivo `FIX_RECURSION.sql`
2. Cierra sesión completamente
3. Borra cookies y caché
4. Reinicia el servidor (`npm run dev`)
5. Abre ventana de incógnito e inicia sesión de nuevo

## Resumen

```
┌──────────────────────────────────────────────┐
│ 1. Ejecutar FIX_RECURSION.sql en Supabase   │
│ 2. Limpiar caché del navegador              │
│ 3. Reiniciar npm run dev                    │
│ 4. Probar login como admin                  │
│ 5. Verificar panel admin funciona           │
│ 6. Crear usuario de prueba                  │
│ 7. Aprobar desde admin                      │
│ 8. Ver instrucciones de Bizum               │
└──────────────────────────────────────────────┘
```

**Tiempo estimado total**: 20 minutos

## Después de que funcione

Una vez que todo funcione correctamente:

1. **Reemplaza el IBAN** en [src/components/SubscriptionStatus.tsx:149](src/components/SubscriptionStatus.tsx#L149)
2. **Elimina usuarios de prueba** (opcional)
3. **Empieza a recibir usuarios reales**

---

**¿Dudas?** Revisa los otros documentos:
- [CAMBIOS_SISTEMA_APROBACION.md](CAMBIOS_SISTEMA_APROBACION.md) - Resumen de todos los cambios
- [SOLUCION_RAPIDA.md](SOLUCION_RAPIDA.md) - Solución de problemas
- [INSTALACION_RAPIDA.md](INSTALACION_RAPIDA.md) - Guía completa de instalación
