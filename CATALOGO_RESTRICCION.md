# Restricción de Acceso al Catálogo por Parroquia

## Implementación Completa ✅

### Resumen

El catálogo ahora está completamente restringido por parroquia:

- **Admin (mcgnexus@gmail.com)**: Ve TODO el catálogo diocesano (todas las parroquias)
- **Usuarios normales**: Solo ven el catálogo de SU parroquia

## Cambios Implementados

### 1. Verificación de permisos en el servidor

**Archivo**: `src/app/catalogo/page.tsx`

```typescript
// Obtener usuario actual y verificar permisos
const supabase = await createServerSupabaseClient()
const { data: { user } } = await supabase.auth.getUser()

let userParishId: string | null = null
let isAdmin = false

if (user) {
  // Obtener datos del perfil del usuario
  const { data: profile } = await supabase
    .from('profiles')
    .select('parish_id, role, email')
    .eq('id', user.id)
    .single()

  if (profile) {
    userParishId = profile.parish_id
    isAdmin = profile.role === 'admin' || profile.email === 'mcgnexus@gmail.com'
  }
}
```

### 2. Filtrado automático por parroquia

**Para usuarios normales**: El filtro de parroquia se fuerza automáticamente

```typescript
// RESTRICCIÓN: Si no es admin, forzar filtro por su parroquia
if (!isAdmin && userParishId) {
  parroquia = userParishId
}

// Construir filtros para la consulta paginada
const filtros: FiltrosCatalogo = {}
if (parroquia) filtros.parish_id = parroquia
```

### 3. UI adaptada según rol

#### Título dinámico:

- **Admin**: "Catálogo Diocesano"
- **Usuario**: "Catálogo - [Nombre Parroquia]"

```typescript
<h1 className="text-3xl font-bold text-foreground">
  {isAdmin ? 'Catálogo Diocesano' : `Catálogo - ${parishHeader || 'Mi Parroquia'}`}
</h1>
```

#### Mensaje informativo:

- **Admin**: Muestra parroquia filtrada (si aplica)
- **Usuario**: "Mostrando solo items de tu parroquia"

#### Filtro de parroquia:

- **Admin**: ✅ Ve el dropdown para cambiar de parroquia
- **Usuario**: ❌ Oculto (no puede cambiar de parroquia)

```typescript
{/* Solo mostrar filtro de parroquia a admin */}
{isAdmin && (
  <div className="space-y-2">
    <Label htmlFor="parroquia">Parroquia</Label>
    <select id="parroquia" name="parroquia" ...>
      <option value="">Todas</option>
      {parroquias.map((p) => (
        <option key={p} value={p}>{p}</option>
      ))}
    </select>
  </div>
)}
```

## Flujo de Trabajo

### Como Admin (mcgnexus@gmail.com)

1. Inicia sesión
2. Ve "Catálogo Diocesano"
3. Ve TODOS los items de TODAS las parroquias
4. Puede filtrar por parroquia usando el dropdown
5. Puede ver/editar/eliminar cualquier item

### Como Usuario Normal

1. Inicia sesión
2. Ve "Catálogo - [Su Parroquia]"
3. Ve mensaje: "Mostrando solo items de tu parroquia"
4. **NO ve** el filtro de parroquia (está oculto)
5. Solo ve items de su propia parroquia
6. Puede crear/editar sus propios items (solo en su parroquia)

## Seguridad en Capas

### Capa 1: RLS Policies (Base de datos)

Las políticas RLS ya implementadas en `RESTRICCION_POR_PARROQUIA.sql` garantizan que:

```sql
-- Usuarios solo ven items de su parroquia
CREATE POLICY "items_select_policy"
ON items FOR SELECT TO authenticated
USING (
  (auth.jwt() ->> 'email') = 'mcgnexus@gmail.com'
  OR
  parish_id = (SELECT parish_id FROM profiles WHERE id = auth.uid())
);
```

### Capa 2: Filtrado en Aplicación

```typescript
// Forzar filtro de parroquia para usuarios no-admin
if (!isAdmin && userParishId) {
  parroquia = userParishId
}
```

### Capa 3: UI Condicional

```typescript
// Ocultar selector de parroquia para usuarios normales
{isAdmin && (
  <ParishSelector ... />
)}
```

## Verificación

### Probar como Admin:

1. Inicia sesión con `mcgnexus@gmail.com`
2. Ve `/catalogo`
3. Verificar:
   - ✅ Título: "Catálogo Diocesano"
   - ✅ Ve filtro de parroquia
   - ✅ Puede seleccionar "Todas" las parroquias
   - ✅ Ve items de todas las parroquias

### Probar como Usuario Normal:

1. Crea un usuario de prueba
2. Admin lo aprueba
3. Usuario inicia sesión
4. Ve `/catalogo`
5. Verificar:
   - ✅ Título: "Catálogo - [Nombre Parroquia]"
   - ✅ Mensaje: "Mostrando solo items de tu parroquia"
   - ✅ **NO** ve filtro de parroquia
   - ✅ Solo ve items de su parroquia
   - ✅ No puede ver items de otras parroquias

### Query SQL para verificar:

```sql
-- Ver distribución de items por parroquia
SELECT
  p.name as parroquia,
  COUNT(i.id) as total_items
FROM items i
JOIN parishes p ON i.parish_id = p.id
GROUP BY p.name
ORDER BY total_items DESC;
```

## Archivos Relacionados

1. **src/app/catalogo/page.tsx** (modificado) - Página principal del catálogo
2. **RESTRICCION_POR_PARROQUIA.sql** - Políticas RLS en base de datos
3. **ACCESO_POR_PARROQUIA.md** - Documentación general del sistema
4. **src/lib/supabase-server.ts** - Cliente de Supabase para server components

## Estado del Sistema

| Funcionalidad | Estado | Notas |
|--------------|--------|-------|
| RLS Policies | ✅ Implementado | RESTRICCION_POR_PARROQUIA.sql |
| Registro con parroquia obligatoria | ✅ Implementado | src/app/auth/page.tsx |
| Filtrado automático catálogo | ✅ Implementado | src/app/catalogo/page.tsx |
| UI adaptada por rol | ✅ Implementado | src/app/catalogo/page.tsx |
| Pago opcional | ✅ Implementado | SIMPLIFICAR_APROBACION.sql |

## Próximos Pasos

1. ✅ Ejecutar `RESTRICCION_POR_PARROQUIA.sql` en Supabase (si aún no está hecho)
2. ✅ Verificar que todos los items tienen `parish_id` asignado
3. ✅ Probar con usuarios de diferentes parroquias
4. ⏭️ Hacer deploy a Vercel
5. ⏭️ Verificar en producción

---

**Fecha**: 2025-11-05
**Implementado por**: Manuel Carrasco García con Claude Code
**Archivos modificados**: src/app/catalogo/page.tsx
