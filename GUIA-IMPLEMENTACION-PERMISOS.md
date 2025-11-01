# 🔐 GUÍA: Implementación del Sistema de Permisos

## 📋 Objetivos

Después de implementar este sistema:

| Usuario | Email | Permisos |
|---------|-------|----------|
| **TÚ (Admin)** | mcgnexus@gmail.com | ✅ Ver TODO<br>✅ Editar TODO<br>✅ Eliminar TODO |
| **Otros usuarios** | cualquier@email.com | ✅ Ver solo SUS items<br>✅ Editar solo SUS items<br>❌ NO pueden ver items de otros<br>❌ NO pueden eliminar |

---

## 🚀 PASO A PASO (10 minutos)

### **PASO 1: Abrir Supabase SQL Editor**

1. Ve a: https://supabase.com/dashboard
2. Selecciona tu proyecto
3. En el menú lateral, haz clic en **SQL Editor** (icono de consola)

---

### **PASO 2: Ejecutar el script completo**

He creado un script que hace todo automáticamente: [IMPLEMENTAR-SISTEMA-PERMISOS.sql](IMPLEMENTAR-SISTEMA-PERMISOS.sql)

**IMPORTANTE:** El script está dividido en secciones. Puedes ejecutarlo todo de una vez, PERO te recomiendo hacerlo por pasos para entender qué está pasando.

#### **Opción A: Ejecutar todo de una vez (Rápido)**

1. Abre el archivo [IMPLEMENTAR-SISTEMA-PERMISOS.sql](IMPLEMENTAR-SISTEMA-PERMISOS.sql)
2. Copia **TODO el contenido**
3. Pégalo en el SQL Editor de Supabase
4. Haz clic en **RUN** (o Ctrl+Enter)
5. Espera a que termine (verás mensajes de confirmación)

#### **Opción B: Ejecutar paso a paso (Recomendado para entender)**

**Paso 2.1 - Verificar columna 'role':**
```sql
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'role'
  ) THEN
    ALTER TABLE profiles ADD COLUMN role TEXT DEFAULT 'user';
  END IF;
END $$;
```
✅ Esto crea la columna `role` si no existe.

**Paso 2.2 - Hacer tu cuenta administrador:**
```sql
INSERT INTO profiles (id, email, full_name, role)
SELECT
  id,
  email,
  raw_user_meta_data->>'full_name' as full_name,
  'admin' as role
FROM auth.users
WHERE email = 'mcgnexus@gmail.com'
ON CONFLICT (id) DO UPDATE
SET role = 'admin';
```
✅ Esto te asigna el rol de administrador.

**Paso 2.3 - Verificar que funcionó:**
```sql
SELECT p.id, p.email, p.full_name, p.role
FROM profiles p
JOIN auth.users u ON u.id = p.id
WHERE u.email = 'mcgnexus@gmail.com';
```
**Deberías ver:**
```
| id        | email                  | full_name | role  |
|-----------|------------------------|-----------|-------|
| uuid-aqui | mcgnexus@gmail.com     | Tu nombre | admin |
```

**Paso 2.4 - Eliminar políticas antiguas:**
```sql
DROP POLICY IF EXISTS "public read published/approved items" ON items;
DROP POLICY IF EXISTS "users read own items" ON items;
DROP POLICY IF EXISTS "users insert own items" ON items;
DROP POLICY IF EXISTS "users update own items" ON items;
DROP POLICY IF EXISTS "select_own_profile" ON profiles;
DROP POLICY IF EXISTS "update_own_profile" ON profiles;
DROP POLICY IF EXISTS "insert_own_profile" ON profiles;
```
✅ Limpia las políticas anteriores.

**Paso 2.5 - Crear nuevas políticas para items:**
```sql
-- Admin ve TODO, usuarios solo sus items
CREATE POLICY "admin_read_all_items"
ON items FOR SELECT TO authenticated
USING (
  (SELECT role FROM profiles WHERE id = auth.uid()) = 'admin'
  OR auth.uid() = user_id
);

-- Todos pueden insertar con su user_id
CREATE POLICY "users_insert_own_items"
ON items FOR INSERT TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Admin actualiza todo, usuarios solo lo suyo
CREATE POLICY "admin_update_all_items"
ON items FOR UPDATE TO authenticated
USING (
  (SELECT role FROM profiles WHERE id = auth.uid()) = 'admin'
  OR auth.uid() = user_id
)
WITH CHECK (
  (SELECT role FROM profiles WHERE id = auth.uid()) = 'admin'
  OR auth.uid() = user_id
);

-- Solo admin puede eliminar
CREATE POLICY "admin_delete_items"
ON items FOR DELETE TO authenticated
USING (
  (SELECT role FROM profiles WHERE id = auth.uid()) = 'admin'
);
```

**Paso 2.6 - Crear nuevas políticas para profiles:**
```sql
-- Admin ve todo, usuarios solo su perfil
CREATE POLICY "profiles_select_policy"
ON profiles FOR SELECT TO authenticated
USING (
  (SELECT role FROM profiles WHERE id = auth.uid()) = 'admin'
  OR auth.uid() = id
);

CREATE POLICY "profiles_insert_policy"
ON profiles FOR INSERT TO authenticated
WITH CHECK (auth.uid() = id);

-- Usuarios NO pueden cambiar su propio rol
CREATE POLICY "profiles_update_policy"
ON profiles FOR UPDATE TO authenticated
USING (
  (SELECT role FROM profiles WHERE id = auth.uid()) = 'admin'
  OR auth.uid() = id
)
WITH CHECK (
  (SELECT role FROM profiles WHERE id = auth.uid()) = 'admin'
  OR (auth.uid() = id AND role = (SELECT role FROM profiles WHERE id = auth.uid()))
);
```

---

### **PASO 3: Verificar que todo funcionó**

Ejecuta esta query de verificación:

```sql
-- Ver todas las políticas creadas
SELECT
  tablename,
  policyname,
  cmd as operacion,
  roles
FROM pg_policies
WHERE tablename IN ('items', 'profiles')
ORDER BY tablename, policyname;
```

**Deberías ver algo como:**

| tablename | policyname | operacion | roles |
|-----------|-----------|-----------|-------|
| items | admin_delete_items | DELETE | {authenticated} |
| items | admin_read_all_items | SELECT | {authenticated} |
| items | admin_update_all_items | UPDATE | {authenticated} |
| items | users_insert_own_items | INSERT | {authenticated} |
| profiles | profiles_insert_policy | INSERT | {authenticated} |
| profiles | profiles_select_policy | SELECT | {authenticated} |
| profiles | profiles_update_policy | UPDATE | {authenticated} |

---

### **PASO 4: Probar el sistema**

#### **4.1 - Probar como administrador:**

1. Abre tu aplicación: `http://localhost:3000`
2. **Inicia sesión** con:
   - Email: `mcgnexus@gmail.com`
   - Password: `Avemaria_1977`
3. Ve al catálogo: `http://localhost:3000/catalogo`
4. **Deberías ver TODOS los items** (de todos los usuarios)

#### **4.2 - Probar como usuario normal (OPCIONAL):**

1. **Crea un nuevo usuario de prueba:**
   - Ve a: `http://localhost:3000/register`
   - Registra un usuario: `test@example.com` / `Test1234!`

2. **Inicia sesión con ese usuario**

3. Ve al catálogo: `http://localhost:3000/catalogo`

4. **Deberías ver SOLO los items creados por ese usuario**

5. Si intentas acceder a un item de otro usuario directamente (ej: `/catalogo/123`), debería dar error o no mostrar nada

---

## 🎯 Cómo Funciona

### **Sistema de Roles:**

```
┌─────────────────────────────────────────────────────┐
│  TABLA: profiles                                    │
├──────────────┬──────────────────────┬───────────────┤
│ id (UUID)    │ email                │ role          │
├──────────────┼──────────────────────┼───────────────┤
│ abc-123...   │ mcgnexus@gmail.com   │ admin  ✅     │
│ def-456...   │ usuario1@mail.com    │ user   👤     │
│ ghi-789...   │ usuario2@mail.com    │ user   👤     │
└──────────────┴──────────────────────┴───────────────┘
```

### **Políticas RLS (Row Level Security):**

**Para items:**

| Operación | Admin | Usuario normal |
|-----------|-------|----------------|
| **SELECT** | ✅ Ve TODO | ✅ Solo sus items (`user_id = auth.uid()`) |
| **INSERT** | ✅ Puede insertar | ✅ Solo con su `user_id` |
| **UPDATE** | ✅ Actualiza TODO | ✅ Solo sus items |
| **DELETE** | ✅ Elimina TODO | ❌ NO puede eliminar |

**Código de la política:**
```sql
-- Ejemplo: Lectura
USING (
  (SELECT role FROM profiles WHERE id = auth.uid()) = 'admin'  -- Si es admin, ve todo
  OR
  auth.uid() = user_id  -- Si no, solo sus items
)
```

---

## 🔍 Diagnóstico y Solución de Problemas

### **Problema 1: No veo items después de iniciar sesión**

**Causa:** El usuario no tiene items creados, o las políticas no están activas.

**Solución:**
```sql
-- Verificar si RLS está activo
SELECT tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public' AND tablename = 'items';
-- Debería mostrar: rowsecurity = true

-- Ver qué items tiene el usuario
SELECT id, data->>'name' as nombre, user_id
FROM items
WHERE user_id = (SELECT id FROM auth.users WHERE email = 'TU_EMAIL_AQUI');
```

---

### **Problema 2: Como admin no veo todos los items**

**Causa:** Tu cuenta no tiene el rol de 'admin' asignado.

**Solución:**
```sql
-- Verificar tu rol
SELECT p.role, u.email
FROM profiles p
JOIN auth.users u ON u.id = p.id
WHERE u.email = 'mcgnexus@gmail.com';

-- Si no es 'admin', actualizarlo:
UPDATE profiles
SET role = 'admin'
WHERE id = (SELECT id FROM auth.users WHERE email = 'mcgnexus@gmail.com');
```

---

### **Problema 3: Error "new row violates row-level security policy"**

**Causa:** Intentas insertar/actualizar un item con un `user_id` diferente al tuyo (y no eres admin).

**Solución:** Asegúrate de que cuando creas items, se use el `user_id` del usuario autenticado:

```typescript
// En tu código TypeScript:
const { data: { user } } = await supabase.auth.getUser()
const itemData = {
  ...otrosDatos,
  user_id: user.id  // ✅ Usar el ID del usuario autenticado
}
```

---

## 📚 Archivos Relacionados

| Archivo | Descripción |
|---------|-------------|
| [IMPLEMENTAR-SISTEMA-PERMISOS.sql](IMPLEMENTAR-SISTEMA-PERMISOS.sql) | Script SQL completo para ejecutar |
| [supabase/policies/items_policies.sql](supabase/policies/items_policies.sql) | Políticas antiguas (referencia) |
| [supabase/policies/profiles_and_parishes.sql](supabase/policies/profiles_and_parishes.sql) | Políticas de perfiles (referencia) |

---

## ✅ Checklist Final

Después de implementar, verifica:

- [ ] Ejecuté todo el script SQL sin errores
- [ ] Mi cuenta (mcgnexus@gmail.com) tiene role = 'admin'
- [ ] Puedo ver TODOS los items del catálogo como admin
- [ ] Creé un usuario de prueba y solo ve sus propios items
- [ ] Las políticas están activas (RLS enabled)

---

## 🆘 ¿Necesitas Ayuda?

Si algo no funciona, ejecuta este script de diagnóstico y envíame el resultado:

```sql
-- DIAGNÓSTICO COMPLETO
SELECT 'TABLA: auth.users' as seccion;
SELECT email, id, created_at FROM auth.users ORDER BY created_at DESC LIMIT 5;

SELECT 'TABLA: profiles' as seccion;
SELECT p.email, p.role, p.full_name
FROM profiles p
ORDER BY p.created_at DESC LIMIT 5;

SELECT 'POLÍTICAS: items' as seccion;
SELECT policyname, cmd, roles FROM pg_policies WHERE tablename = 'items';

SELECT 'POLÍTICAS: profiles' as seccion;
SELECT policyname, cmd, roles FROM pg_policies WHERE tablename = 'profiles';

SELECT 'RLS STATUS' as seccion;
SELECT tablename, rowsecurity FROM pg_tables
WHERE schemaname = 'public' AND tablename IN ('items', 'profiles');
```

---

¡Listo! Ahora tienes un sistema de permisos completo y seguro. 🎉
