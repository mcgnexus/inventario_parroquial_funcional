# 🐛 Debug: Número de Inventario No Se Genera

## 📋 Pasos para Diagnosticar el Problema

### 1. Abrir la Consola del Navegador

1. Abre tu aplicación en el navegador
2. Presiona **F12** o **Ctrl+Shift+I** (Windows/Linux) o **Cmd+Option+I** (Mac)
3. Ve a la pestaña **Console**

### 2. Ir a la Página de Insertar Inventario

1. Navega a la página donde creas/editas inventarios
2. Toma una foto o sube una imagen de un objeto
3. Espera a que la IA analice el objeto

### 3. Activar el Modo Edición

1. Haz clic en el botón **"Editar"** en la ficha de inventario generada
2. **Observa la consola** - Deberías ver mensajes como:

```
🔍 InventoryForm - Verificando generación de número: {
  estaEditando: true,
  parish_id: undefined,
  tipo_objeto: "Orfebrería",
  inventory_number: undefined
}
```

### 4. Seleccionar Parroquia

1. En el formulario, busca y selecciona una **parroquia** del desplegable
2. **Observa la consola nuevamente**

### 5. Interpretar los Logs

#### ✅ Caso Exitoso (Debería verse así):

```
🔍 InventoryForm - Verificando generación de número: {
  estaEditando: true,
  parish_id: "123e4567-e89b-12d3-a456-426614174000",
  tipo_objeto: "Orfebrería",
  inventory_number: undefined
}
✅ Generando número de inventario...
🔢 generarNumeroInventario llamado con: {
  parishId: "123e4567-e89b-12d3-a456-426614174000",
  tipoObjeto: "Orfebrería"
}
📍 Obteniendo nombre de parroquia...
✅ Nombre de parroquia: "Santa María la Mayor"
✅ Código de parroquia: "SMM"
📅 Año: 2025
🎨 Código de objeto: "ORF"
🔍 Contando items en la parroquia...
📊 Items encontrados: 24
🔢 Número secuencial: "0025"
✅ Número de inventario generado: "SMM-2025-ORF-0025"
```

#### ❌ Posibles Problemas:

**Problema 1: No está editando**
```
🔍 InventoryForm - Verificando generación de número: {
  estaEditando: false,  // ❌ Debe ser true
  parish_id: "...",
  tipo_objeto: "...",
  inventory_number: undefined
}
⚠️ Faltan datos para generar número: {
  estaEditando: false,
  tiene_parish: true,
  tiene_tipo: true
}
```
**Solución**: Haz clic en el botón "Editar"

---

**Problema 2: No hay parish_id**
```
🔍 InventoryForm - Verificando generación de número: {
  estaEditando: true,
  parish_id: undefined,  // ❌ Falta seleccionar parroquia
  tipo_objeto: "Orfebrería",
  inventory_number: undefined
}
⚠️ Faltan datos para generar número: {
  estaEditando: true,
  tiene_parish: false,  // ❌
  tiene_tipo: true
}
```
**Solución**: Selecciona una parroquia del desplegable "Parroquia"

---

**Problema 3: No hay tipo_objeto**
```
🔍 InventoryForm - Verificando generación de número: {
  estaEditando: true,
  parish_id: "123e4567-...",
  tipo_objeto: undefined,  // ❌ Falta tipo de objeto
  inventory_number: undefined
}
⚠️ Faltan datos para generar número: {
  estaEditando: true,
  tiene_parish: true,
  tiene_tipo: false  // ❌
}
```
**Solución**: Asegúrate de que el tipo de objeto esté seleccionado/definido

---

**Problema 4: Ya existe número de inventario**
```
🔍 InventoryForm - Verificando generación de número: {
  estaEditando: true,
  parish_id: "123e4567-...",
  tipo_objeto: "Orfebrería",
  inventory_number: "SMM-2025-ORF-0001"  // Ya existe
}
ℹ️ Ya existe número de inventario: "SMM-2025-ORF-0001"
```
**Solución**: El número ya existe, bórralo manualmente si quieres regenerarlo

---

**Problema 5: Error en la base de datos**
```
✅ Generando número de inventario...
🔢 generarNumeroInventario llamado con: {...}
📍 Obteniendo nombre de parroquia...
❌ No se encontró el nombre para la parroquia con ID: 123e4567-...
```
**Solución**: La parroquia no existe en la base de datos

---

**Problema 6: Tabla 'items' no existe**
```
🔍 Contando items en la parroquia...
❌ Error al contar items: {
  message: "relation 'items' does not exist"
}
```
**Solución**: Necesitas crear la tabla `items` en Supabase (ver archivos SQL)

---

## 🔧 Soluciones Comunes

### Solución 1: Verifica que ParishSelector está funcionando

Comprueba que cuando seleccionas una parroquia, el campo `parish_id` se actualiza correctamente.

**Busca en el código del componente InventoryForm alrededor de la línea 446-459:**

```tsx
{estaEditando ? (
  <ParishSelector
    value={datos.parish_id}
    onChange={(parishId) => onActualizarCampo('parish_id', parishId)}
    className=""
  />
) : (
  <div>
    <label className="block text-sm font-semibold text-slate-700 mb-1">Parroquia</label>
    <p className="text-slate-900 bg-slate-50 px-3 py-2 rounded-md min-h-[40px] whitespace-pre-wrap">
      {datos.parish_id || <span className="text-slate-400 italic">No especificada</span>}
    </p>
  </div>
)}
```

### Solución 2: Verifica que la tabla 'items' existe en Supabase

1. Ve a tu proyecto en Supabase
2. Abre el **SQL Editor**
3. Ejecuta:
   ```sql
   SELECT table_name
   FROM information_schema.tables
   WHERE table_schema = 'public'
   AND table_name = 'items';
   ```
4. Si no devuelve nada, ejecuta los archivos:
   - `supabase/schema/items.sql`
   - `supabase/schema/items_v2.sql`

### Solución 3: Verifica que la tabla 'parishes' tiene datos

1. En el **SQL Editor** de Supabase ejecuta:
   ```sql
   SELECT id, name FROM parishes LIMIT 10;
   ```
2. Debe devolver al menos una parroquia

---

## 📊 Información que Necesito

Si el problema persiste, copia y pega en la consola **todos** los mensajes que aparezcan con:
- 🔍 (verificación)
- ✅ (éxito)
- ❌ (error)
- ⚠️ (advertencia)

Y compártelos conmigo para ayudarte mejor.

---

## 🎯 Flujo Esperado Completo

1. Usuario sube imagen → IA analiza
2. Usuario hace clic en **"Editar"** → `estaEditando = true`
3. Usuario selecciona **Parroquia** → `datos.parish_id` se actualiza
4. `useEffect` detecta cambio → llama a `generarNumeroInventario()`
5. Función obtiene nombre de parroquia desde DB
6. Genera códigos (parroquia + objeto)
7. Cuenta items en la parroquia
8. Genera número secuencial
9. Retorna número completo: `SMM-2025-ORF-0025`
10. `onActualizarCampo('inventory_number', ...)` actualiza el campo
11. Campo "Número de inventario" muestra el valor generado

---

## 💡 Tip de Debugging

Si quieres ver qué está pasando en tiempo real, abre la consola del navegador y deja la pestaña Console visible mientras interactúas con el formulario.
