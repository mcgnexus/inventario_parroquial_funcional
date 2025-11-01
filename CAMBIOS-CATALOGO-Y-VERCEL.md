# ✅ Cambios Implementados: Catálogo y Botón de Insertar

## 📋 Resumen de Cambios

He realizado **3 mejoras** en el sistema:

1. ✅ Botón "Volver" → "**+ Insertar otra pieza**"
2. ✅ Mostrar **nombre de parroquia** en lugar de UUID
3. ✅ Obtener nombres de parroquias **automáticamente** desde la base de datos

---

## 🎨 Cambio 1: Botón "+ Insertar otra pieza"

### **Antes:**
```
[Mis piezas]  Volver
```

### **Ahora:**
```
[Mis piezas]  [+ Insertar otra pieza]
```

### **Archivo modificado:**
- [src/app/catalogo/page.tsx](src/app/catalogo/page.tsx#L137-L142)

### **Qué hace:**
- Botón con estilo llamativo (fondo ámbar, texto blanco)
- Redirige a `/inventario` para crear una nueva pieza
- Icono "+" para indicar acción de añadir

---

## 🏛️ Cambio 2: Mostrar Nombre de Parroquia

### **Problema:**
Debajo de "Catálogo" aparecía:
```
Parroquia: 81a66003-fd37-4f89-bacf-87e3f6197c8a  ❌
```

### **Solución:**
Ahora aparece:
```
Parroquia: Santa María La Mayor  ✅
```

### **Archivos modificados:**

#### 1. [src/app/catalogo/page.tsx](src/app/catalogo/page.tsx#L87-L122)
- **Líneas 87-107**: Nueva lógica para filtrar UUIDs de la lista de parroquias
- **Líneas 109-122**: Detecta si el parámetro es un UUID y busca el nombre correspondiente

```typescript
// Si el parámetro parroquia es un UUID, obtener el nombre
let parishHeader = ''
if (parroquia) {
  const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(parroquia)
  if (isUuid) {
    // Buscar el nombre en los items cargados
    const itemWithName = items.find(i => i.data.parish_id === parroquia && i.data.parish_name)
    parishHeader = itemWithName?.data.parish_name || 'Parroquia desconocida'
  } else {
    parishHeader = parroquia
  }
} else if (parroquias.length === 1) {
  parishHeader = parroquias[0]
}
```

#### 2. [src/lib/supabase.ts](src/lib/supabase.ts#L827-L888)
- **Líneas 827-853**: Nueva lógica para obtener nombres de parroquias desde la BD
- **Líneas 864-879**: Añadir `parish_name` al objeto `merged`

```typescript
// Obtener nombres de parroquias para todos los items
const uniqueParishIds = Array.from(new Set(
  (data || [])
    .map(row => row.parish_id)
    .filter((id): id is string => typeof id === 'string' && id.length > 0)
))

// Consultar nombres de parroquias
const parishNames = new Map<string, string>()
if (uniqueParishIds.length > 0) {
  const { data: parishes } = await supabase
    .from('parishes')
    .select('id, name')
    .in('id', uniqueParishIds)

  if (parishes) {
    parishes.forEach((p: { id: string; name: string }) => {
      if (p.id && p.name) {
        parishNames.set(p.id, p.name)
      }
    })
  }
}

// Luego en el loop:
const parishName = parishId ? parishNames.get(parishId) : undefined
const merged = {
  ...parsed,
  parish_name: parishName || parsed.parish_name, // ✅ Nombre actualizado
  // ... resto de campos
}
```

### **Ventajas de esta solución:**
1. ✅ **Siempre actualizado**: Obtiene el nombre real desde la tabla `parishes`
2. ✅ **Eficiente**: Una sola consulta para todas las parroquias (batch query)
3. ✅ **Fallback robusto**: Si no encuentra el nombre, usa el almacenado o muestra "Parroquia desconocida"

---

## 🚀 Desplegar en Vercel

### **Problema:**
Los cambios no aparecen en Vercel después de hacer push.

### **Soluciones:**

#### **Opción A: Limpiar caché de Vercel (Recomendado)**

1. Ve a tu proyecto en Vercel: https://vercel.com/dashboard
2. Ve a la pestaña **Deployments**
3. Busca el deployment más reciente
4. Haz clic en los **tres puntos (⋮)** → **Redeploy**
5. Marca la opción **"Use existing Build Cache"** → **DESMÁRCALA** ✅
6. Haz clic en **Redeploy**

Esto forzará a Vercel a reconstruir todo desde cero.

#### **Opción B: Forzar nuevo deployment**

```bash
# En tu terminal local:
git add .
git commit -m "fix: actualizar botón y mostrar nombres de parroquias"
git push origin main

# Si ya hiciste push, puedes forzar un cambio vacío:
git commit --allow-empty -m "chore: forzar rebuild en Vercel"
git push origin main
```

#### **Opción C: Verificar variables de entorno**

Asegúrate de que en Vercel tienes configuradas estas variables:

```
NEXT_PUBLIC_SUPABASE_URL=https://tu-proyecto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu-anon-key-aqui
SUPABASE_SERVICE_ROLE_KEY=tu-service-role-key-aqui
```

#### **Opción D: Verificar logs de build**

1. En Vercel, ve a **Deployments**
2. Haz clic en el deployment más reciente
3. Ve a la pestaña **Build Logs**
4. Busca errores relacionados con TypeScript o build

---

## 🧪 Cómo Verificar que Funciona

### **En Local (localhost:3000):**

1. **Botón de insertar:**
   - Ve a: `http://localhost:3000/catalogo`
   - Verifica que aparece el botón **"+ Insertar otra pieza"** (color ámbar)
   - Haz clic → debe llevar a `/inventario`

2. **Nombre de parroquia:**
   - En la página del catálogo, debajo de "Catálogo"
   - Si tienes items filtrados por parroquia, debe aparecer:
     ```
     Parroquia: Santa María La Mayor  ✅
     ```
   - **NO debe aparecer un UUID**

3. **Lista de parroquias en el filtro:**
   - Abre el desplegable "Parroquia" en los filtros
   - Debe mostrar nombres, **NO UUIDs**

### **En Vercel (producción):**

Después de hacer el redeploy:

1. Abre tu URL de Vercel (ej: `https://tu-app.vercel.app/catalogo`)
2. **Refresca con Ctrl+Shift+R** (fuerza recarga sin caché)
3. Verifica los mismos puntos de arriba

---

## 📊 Comparación Antes vs Ahora

| Aspecto | Antes | Ahora |
|---------|-------|-------|
| **Botón en catálogo** | "Volver" (link simple) | "+ Insertar otra pieza" (botón destacado) |
| **Destino del botón** | `/` (home) | `/inventario` (crear pieza) |
| **Header de parroquia** | Muestra UUID o nada | Muestra nombre real |
| **Filtro de parroquias** | Mezcla nombres y UUIDs | Solo nombres |
| **Obtención de nombres** | Solo del campo `parish_name` | Consulta dinámica a tabla `parishes` |

---

## 🔧 Troubleshooting

### **Problema 1: El botón sigue diciendo "Volver" en Vercel**

**Causa**: Caché de build no se limpió

**Solución**:
1. Vercel → Deployments → Redeploy sin caché
2. O haz un commit vacío y push

---

### **Problema 2: Sigue apareciendo UUID en lugar de nombre**

**Causa posible 1**: La tabla `parishes` no tiene la parroquia con ese UUID

**Solución**:
```sql
-- Verifica si existe la parroquia
SELECT id, name FROM parishes
WHERE id = 'EL-UUID-QUE-APARECE';

-- Si no existe, agrégala:
INSERT INTO parishes (id, name, location, diocese)
VALUES (
  'EL-UUID-QUE-APARECE',
  'Nombre de la Parroquia',
  'Ubicación',
  'Guadix'
);
```

**Causa posible 2**: La política RLS no permite leer `parishes`

**Solución**:
```sql
-- Ya deberías tener esto, pero por si acaso:
CREATE POLICY "parishes_public_read"
ON parishes FOR SELECT TO public
USING (true);
```

---

### **Problema 3: Error en build de Vercel**

**Causa**: Error de TypeScript

**Solución**:
- Revisa los Build Logs en Vercel
- Si hay error en `supabase.ts` línea 844, asegúrate de que el tipo está correcto:
  ```typescript
  parishes.forEach((p: { id: string; name: string }) => {
  ```

---

## ✅ Checklist de Verificación

Después de desplegar, verifica:

- [ ] El botón en `/catalogo` dice "+ Insertar otra pieza"
- [ ] El botón tiene color ámbar y es clickeable
- [ ] Al hacer clic, redirige a `/inventario`
- [ ] El header "Parroquia: XXX" muestra nombres, no UUIDs
- [ ] El filtro de parroquias muestra solo nombres
- [ ] Los items del catálogo se cargan correctamente
- [ ] No hay errores en la consola del navegador

---

## 📝 Resumen de Archivos Modificados

| Archivo | Cambios | Líneas |
|---------|---------|--------|
| [src/app/catalogo/page.tsx](src/app/catalogo/page.tsx) | Botón insertar + lógica nombres parroquias | 87-122, 137-142 |
| [src/lib/supabase.ts](src/lib/supabase.ts) | Consulta batch de nombres de parroquias | 827-888 |

---

## 🎯 Próximos Pasos (Opcional)

Si quieres mejorar aún más:

1. **Caché de nombres de parroquias**: Guardar en localStorage para evitar consultas repetidas
2. **Lazy loading**: Cargar nombres solo cuando se necesitan
3. **Actualización automática**: Cuando se edita una parroquia, actualizar el catálogo

---

¡Listo! Con estos cambios, tu catálogo ahora es más intuitivo y profesional. 🎉
