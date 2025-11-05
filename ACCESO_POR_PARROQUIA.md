# Control de Acceso por Parroquia

## Cambios Implementados

### 1. Parroquia OBLIGATORIA en el registro ✅

**Antes**:
- Campo de parroquia era opcional
- Los usuarios podían registrarse sin parroquia
- No había validación

**Ahora**:
- ✅ Campo de parroquia es **OBLIGATORIO**
- ✅ Marcado con asterisco rojo (*) y texto "(obligatorio)"
- ✅ Validación: no permite registrarse sin seleccionar una parroquia
- ✅ Mensaje de error claro: "Debes seleccionar una parroquia de la lista"
- ✅ Indicador visual verde (✓) cuando se selecciona correctamente
- ✅ Indicador de advertencia si no hay resultados

**Archivo modificado**:
- `src/app/auth/page.tsx`

### 2. Restricción de acceso a items por parroquia 🔒

**Políticas RLS actualizadas**:

#### Admin (mcgnexus@gmail.com):
- ✅ Ve TODOS los items de TODAS las parroquias
- ✅ Puede crear items en cualquier parroquia
- ✅ Puede editar cualquier item
- ✅ Puede eliminar cualquier item

#### Usuarios normales:
- ✅ Solo ven items de SU parroquia
- ✅ Solo pueden crear items en SU parroquia
- ✅ Solo pueden editar SUS items de SU parroquia
- ✅ NO pueden eliminar items (solo admin)

**Archivo SQL**:
- `RESTRICCION_POR_PARROQUIA.sql`

### 3. Estructura de base de datos

#### Tabla `items`:
- ✅ Tiene columna `parish_id` (UUID, FK a `parishes.id`)
- ✅ Tiene columna `user_id` (UUID, FK a `profiles.id`)

#### Tabla `profiles`:
- ✅ Tiene columna `parish_id` (UUID, FK a `parishes.id`)

#### Función helper:
```sql
get_user_parish_id() -- Retorna el parish_id del usuario autenticado
```

## Flujo de Trabajo

### Registro de Nuevo Usuario

1. Usuario completa formulario de registro
2. **DEBE** seleccionar una parroquia de la lista
3. Sistema valida que la parroquia está seleccionada
4. Si no hay parroquia: error y no puede continuar
5. Usuario registrado con `parish_id` asignado
6. Admin aprueba al usuario
7. Usuario activo solo ve items de su parroquia

### Creación de Items

1. Usuario crea un item en `/inventario`
2. Sistema automáticamente asigna `parish_id` del usuario al item
3. Item queda vinculado a la parroquia del usuario
4. Solo usuarios de esa parroquia (y admin) pueden verlo

### Admin

1. Admin ve TODOS los items de TODAS las parroquias
2. En el catálogo, puede filtrar por parroquia si lo desea
3. Puede crear items en cualquier parroquia
4. Gestión completa sin restricciones

## Aplicar los cambios

### Paso 1: Ejecutar SQL (3 minutos)

1. Ve a **Supabase SQL Editor**
2. Ejecuta **RESTRICCION_POR_PARROQUIA.sql** (todo el archivo)
3. Verifica que dice: "✅ Verificación de políticas" al final
4. Comprueba que no hay items sin `parish_id`

### Paso 2: Verificar en la aplicación (5 minutos)

#### Como usuario normal:

1. Crea un nuevo usuario de prueba
2. **DEBES** seleccionar una parroquia (ahora es obligatorio)
3. Admin aprueba el usuario
4. Usuario inicia sesión
5. Ve solo items de su parroquia
6. Crea un item → se asigna automáticamente a su parroquia

#### Como admin:

1. Inicia sesión con mcgnexus@gmail.com
2. Ve TODOS los items de TODAS las parroquias
3. Puede crear items en cualquier parroquia

### Paso 3: Migrar items existentes (si aplica)

Si tienes items sin `parish_id`, el script SQL los asigna automáticamente basándose en el `user_id` que los creó.

```sql
-- Esto se ejecuta automáticamente en RESTRICCION_POR_PARROQUIA.sql
UPDATE items
SET parish_id = (
  SELECT parish_id
  FROM profiles
  WHERE profiles.id = items.user_id
)
WHERE parish_id IS NULL AND user_id IS NOT NULL;
```

## Beneficios

✅ **Seguridad**: Cada parroquia solo ve sus propios datos
✅ **Privacidad**: Los datos están aislados por parroquia
✅ **Claridad**: Cada usuario sabe a qué parroquia pertenece
✅ **Control**: Admin tiene visibilidad completa
✅ **Validación**: Imposible registrarse sin parroquia

## Verificaciones

### Comprobar políticas RLS:

```sql
SELECT tablename, policyname
FROM pg_policies
WHERE tablename = 'items'
ORDER BY policyname;
```

Deberías ver:
- `items_select_policy`
- `items_insert_policy`
- `items_update_policy`
- `items_delete_policy`

### Comprobar items sin parroquia:

```sql
SELECT COUNT(*) as items_sin_parroquia
FROM items
WHERE parish_id IS NULL;
```

Debería retornar: **0**

### Comprobar distribución por parroquia:

```sql
SELECT
  p.name as parroquia,
  COUNT(i.id) as total_items
FROM items i
JOIN parishes p ON i.parish_id = p.id
GROUP BY p.name
ORDER BY total_items DESC;
```

## Solución de Problemas

### Error: "No se encontraron parroquias"

**Causa**: No hay parroquias en la base de datos o el nombre no coincide.

**Solución**:
1. Verifica que existen parroquias: `SELECT * FROM parishes;`
2. Asegúrate de escribir al menos 2 letras
3. El búsqueda es case-insensitive (`ilike`)

### Error: "Debes seleccionar una parroquia de la lista"

**Causa**: Escribiste un nombre pero no hiciste click en la opción del dropdown.

**Solución**:
1. Escribe el nombre de la parroquia
2. Espera a que aparezca la lista
3. **Click** en la opción correcta
4. Verás el checkmark verde (✓)

### Usuario no puede ver items

**Causa**: El usuario no tiene `parish_id` asignado.

**Solución**:
```sql
-- Verificar parish_id del usuario
SELECT id, email, parish_id
FROM profiles
WHERE email = 'usuario@ejemplo.com';

-- Si es NULL, asignar una parroquia
UPDATE profiles
SET parish_id = (SELECT id FROM parishes WHERE name = 'Nombre Parroquia')
WHERE email = 'usuario@ejemplo.com';
```

### Items no aparecen después de crearlos

**Causa**: Los items no tienen `parish_id` asignado.

**Solución**:
```sql
-- Asignar parish_id basándose en el creador
UPDATE items
SET parish_id = (
  SELECT parish_id
  FROM profiles
  WHERE profiles.id = items.user_id
)
WHERE parish_id IS NULL;
```

## Próximos pasos

1. ✅ Ejecutar `RESTRICCION_POR_PARROQUIA.sql`
2. ✅ Probar registro con parroquia obligatoria
3. ✅ Verificar que usuarios solo ven su parroquia
4. ✅ Verificar que admin ve todo
5. ⏭️ Hacer deploy a Vercel

---

**Fecha de implementación**: $(date)
**Archivos modificados**:
- `src/app/auth/page.tsx` (parroquia obligatoria)
- `RESTRICCION_POR_PARROQUIA.sql` (RLS policies)
- `ACCESO_POR_PARROQUIA.md` (este documento)
