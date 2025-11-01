# 🧪 Instrucciones para Probar la Generación Automática de Número de Inventario

## ✅ Preparación

He agregado **logs de depuración extensivos** en el código para que podamos diagnosticar exactamente qué está pasando.

---

## 📝 Paso a Paso para Probar

### 1. Iniciar el Servidor de Desarrollo

```bash
npm run dev
```

### 2. Abrir la Aplicación y la Consola del Navegador

1. Abre tu navegador en `http://localhost:3000` (o el puerto que uses)
2. Abre la **Consola del Navegador**:
   - **Windows/Linux**: Presiona `F12` o `Ctrl + Shift + I`
   - **Mac**: Presiona `Cmd + Option + I`
3. Ve a la pestaña **"Console"**

### 3. Ir a la Página de Inventario

1. Navega a la página de insertar/crear inventario
2. Sube una imagen de un objeto o toma una foto
3. Espera a que la IA analice el objeto

### 4. Activar el Modo de Edición

1. Una vez que veas la ficha generada por la IA, haz clic en el botón **"Editar"** (botón naranja con icono de lápiz)
2. **MUY IMPORTANTE**: Observa la consola, deberías ver este mensaje:

```
🔍 InventoryForm - Verificando generación de número: {
  estaEditando: true,
  parish_id: undefined,
  tipo_objeto: "...",
  inventory_number: undefined
}
```

### 5. Seleccionar una Parroquia

1. En la sección **"Datos de Identificación"** (debe estar expandida por defecto)
2. Busca el campo **"Parroquia"** con desplegable
3. Escribe en el buscador: `"Santa María"` o `"Galera"`
4. Selecciona una parroquia del desplegable

### 6. Observar la Consola

**Deberías ver una secuencia como esta:**

```
🔍 InventoryForm - Verificando generación de número: {
  estaEditando: true,
  parish_id: "12345678-1234-1234-1234-123456789abc",
  tipo_objeto: "Orfebrería",
  inventory_number: undefined
}
✅ Generando número de inventario...
🔢 generarNumeroInventario llamado con: {
  parishId: "12345678-1234-1234-1234-123456789abc",
  tipoObjeto: "Orfebrería"
}
📍 Obteniendo nombre de parroquia...
✅ Nombre de parroquia: "Santa María la Mayor"
✅ Código de parroquia: "SMM"
📅 Año: 2025
🎨 Código de objeto: "ORF"
🔍 Contando items en la parroquia...
📊 Items encontrados: 0
🔢 Número secuencial: "0001"
✅ Número de inventario generado: "SMM-2025-ORF-0001"
```

### 7. Verificar el Campo

El campo **"Número de inventario"** debería llenarse automáticamente con: `SMM-2025-ORF-0001`

---

## 🔍 Qué Hacer si No Funciona

### Caso 1: No hay parish_id

Si ves esto:
```
⚠️ Faltan datos para generar número: {
  estaEditando: true,
  tiene_parish: false,  // ❌ Problema aquí
  tiene_tipo: true
}
```

**Problema**: El campo `parish_id` no se está actualizando.

**Soluciones**:
1. Asegúrate de seleccionar una parroquia del **desplegable**, no solo del buscador
2. Verifica que la parroquia tenga un UUID válido (no solo un nombre)
3. Copia y pega los logs de la consola y envíamelos

---

### Caso 2: No hay tipo_objeto

Si ves esto:
```
⚠️ Faltan datos para generar número: {
  estaEditando: true,
  tiene_parish: true,
  tiene_tipo: false  // ❌ Problema aquí
}
```

**Problema**: El campo `tipo_objeto` está vacío.

**Soluciones**:
1. Verifica que la IA haya analizado correctamente el objeto
2. Edita manualmente el campo "Tipo de objeto" si está vacío
3. Escribe algo como "Orfebrería", "Pintura", "Escultura", etc.

---

### Caso 3: Error al obtener nombre de parroquia

Si ves esto:
```
📍 Obteniendo nombre de parroquia...
❌ No se encontró el nombre para la parroquia con ID: 12345...
```

**Problema**: La parroquia no existe en la base de datos.

**Soluciones**:
1. Verifica que la tabla `parishes` existe en Supabase
2. Verifica que la tabla `parishes` tiene datos
3. Ejecuta en Supabase SQL Editor:
   ```sql
   SELECT id, name FROM parishes LIMIT 10;
   ```

---

### Caso 4: Error al contar items

Si ves esto:
```
🔍 Contando items en la parroquia...
❌ Error al contar items: {
  message: "relation 'items' does not exist"
}
```

**Problema**: La tabla `items` no existe en Supabase.

**Solución**:
1. Ve a tu proyecto en Supabase
2. Abre el **SQL Editor**
3. Ejecuta el contenido de estos archivos en orden:
   - `supabase/schema/items.sql`
   - `supabase/schema/items_v2.sql`

---

## 📋 Checklist de Verificación

Antes de reportar un problema, verifica:

- [ ] El servidor de desarrollo está corriendo (`npm run dev`)
- [ ] La consola del navegador está abierta y visible
- [ ] Hiciste clic en el botón **"Editar"**
- [ ] Seleccionaste una parroquia del **desplegable** (no solo buscador)
- [ ] El campo "Tipo de objeto" tiene un valor
- [ ] Viste los logs en la consola (con emojis 🔍✅❌)
- [ ] La tabla `parishes` existe y tiene datos en Supabase
- [ ] La tabla `items` existe en Supabase

---

## 📤 Información a Reportar

Si después de seguir todos los pasos el problema persiste, envíame:

1. **Captura de pantalla de la consola** con todos los logs visibles
2. **Estado del formulario**:
   - ¿Está en modo edición?
   - ¿Qué parroquia seleccionaste?
   - ¿Qué dice el campo "Tipo de objeto"?
   - ¿Qué dice el campo "Número de inventario"?

3. **Resultado de esta consulta SQL en Supabase**:
   ```sql
   SELECT COUNT(*) as total_parishes FROM parishes;
   SELECT COUNT(*) as total_items FROM items;
   ```

---

## 🎯 Resultado Esperado

Al final, el campo **"Número de inventario"** debería mostrar algo como:

- `SMM-2025-ORF-0001` (Santa María la Mayor, Orfebrería, item #1)
- `PDG-2025-PIN-0012` (Parroquia de Galera, Pintura, item #12)
- `NSA-2025-ESC-0045` (Nuestra Señora Asunción, Escultura, item #45)

El formato siempre es: **XXX-YYYY-OOO-NNNN**

---

¡Pruébalo y cuéntame qué ves en la consola! 🚀
