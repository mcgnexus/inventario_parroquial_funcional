# ❌ Error: "No se encontró el nombre para la parroquia con ID"

## 🐛 El Problema

Estás viendo este error:
```
No se encontró el nombre para la parroquia con ID: 81a66003-fd37-4f89-bacf-87e3f6197c8a
```

Esto significa que el sistema está intentando buscar una parroquia con un UUID que **no existe** en tu base de datos.

---

## 🔍 Diagnóstico

### Paso 1: Verificar Si la Tabla Existe

1. Abre **Supabase SQL Editor**
2. Ejecuta:
   ```sql
   SELECT COUNT(*) AS total_parroquias
   FROM parishes;
   ```

**Resultados Posibles:**

#### ✅ Si devuelve un número (ej: 0, 74, etc.)
→ La tabla existe. Continúa al Paso 2.

#### ❌ Si devuelve error "relation 'parishes' does not exist"
→ La tabla NO existe. Ve a **Solución 1** abajo.

---

### Paso 2: Verificar Si Hay Parroquias de Guadix

```sql
SELECT COUNT(*) AS parroquias_guadix
FROM parishes
WHERE diocese = 'Guadix';
```

**Resultados Posibles:**

#### ✅ Si devuelve un número > 0 (ej: 74)
→ Hay parroquias registradas. Continúa al Paso 3.

#### ❌ Si devuelve 0
→ La tabla está vacía. Ve a **Solución 2** abajo.

---

### Paso 3: Verificar el UUID Específico

Reemplaza el UUID con el que te da error:

```sql
SELECT id, name, location
FROM parishes
WHERE id = '81a66003-fd37-4f89-bacf-87e3f6197c8a';
```

**Resultados Posibles:**

#### ✅ Si devuelve una fila
→ La parroquia existe. El problema puede ser de caché. Ve a **Solución 3**.

#### ❌ Si devuelve 0 filas
→ Ese UUID no existe. Ve a **Solución 4**.

---

## ✅ Soluciones

### Solución 1: Crear la Tabla `parishes`

Si la tabla no existe, créala:

```sql
CREATE TABLE IF NOT EXISTS parishes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  location TEXT,
  diocese TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

Luego, ve a **Solución 2** para insertar las parroquias.

---

### Solución 2: Insertar Todas las Parroquias

Si la tabla está vacía:

1. Abre el archivo: **[INSERT-TODAS-PARROQUIAS-GUADIX.sql](INSERT-TODAS-PARROQUIAS-GUADIX.sql)**
2. Copia **TODO** el contenido (Ctrl+A, Ctrl+C)
3. Pega en **Supabase SQL Editor** (Ctrl+V)
4. Haz clic en **"Run"** o presiona `Ctrl+Enter`
5. Espera a ver: ✅ **"Success. 74 rows affected"**

Luego, **recarga tu aplicación** (F5) y prueba de nuevo.

---

### Solución 3: Limpiar Caché del Navegador

Si la parroquia existe en la BD pero aún da error:

1. **Recarga Forzada:**
   - Windows/Linux: `Ctrl + F5`
   - Mac: `Cmd + Shift + R`

2. **Limpiar Caché Completa:**
   - Chrome: `Ctrl + Shift + Delete` → Borrar caché
   - Firefox: `Ctrl + Shift + Delete` → Borrar caché
   - Edge: `Ctrl + Shift + Delete` → Borrar caché

3. **Cerrar y Reabrir el Navegador**

---

### Solución 4: El UUID No Existe (Más Común)

Si ese UUID específico no está en la base de datos, significa que:

1. **La parroquia se eliminó**
2. **Seleccionaste una parroquia que solo existe en el fallback local** (sin UUID)
3. **Hay un problema de sincronización**

**Qué hacer:**

1. **Recarga tu aplicación** (F5)
2. **Vuelve al formulario de inventario**
3. Haz clic en **"Editar"**
4. **CAMBIA la parroquia** seleccionada:
   - Selecciona una parroquia diferente
   - Asegúrate de que esté en **texto negro** (no gris)
5. El número de inventario debería generarse correctamente

---

## 🧪 Script de Diagnóstico Completo

He creado un script SQL completo para diagnosticar: **[DIAGNOSTICO-PARROQUIAS.sql](DIAGNOSTICO-PARROQUIAS.sql)**

Este script verifica:
- ✅ Si la tabla existe
- ✅ Cuántas parroquias hay
- ✅ Si hay parroquias de Guadix
- ✅ Si el UUID específico existe
- ✅ Si hay duplicados
- ✅ Estructura de la tabla
- ✅ Y más...

**Cómo usarlo:**

1. Abre **Supabase SQL Editor**
2. Copia y pega el contenido de [DIAGNOSTICO-PARROQUIAS.sql](DIAGNOSTICO-PARROQUIAS.sql)
3. Ejecuta todo (Ctrl+Enter)
4. Revisa los resultados

---

## 🔧 Logs Mejorados

Ahora, cuando veas el error en la consola, verás información más detallada:

```
🔍 Buscando parroquia con ID: 81a66003-fd37-4f89-bacf-87e3f6197c8a
📊 Resultado de la búsqueda: []
⚠️ No se encontró ninguna parroquia con el UUID: 81a66003-fd37-4f89-bacf-87e3f6197c8a
💡 Posibles causas:
   1. La parroquia no existe en la base de datos
   2. El UUID es incorrecto
   3. La tabla parishes está vacía
📝 Ejecuta este SQL para verificar:
   SELECT * FROM parishes WHERE id = '81a66003-fd37-4f89-bacf-87e3f6197c8a';
```

---

## 📋 Checklist de Verificación

- [ ] La tabla `parishes` existe
- [ ] La tabla tiene parroquias (COUNT > 0)
- [ ] Hay parroquias de Guadix (diocese = 'Guadix')
- [ ] Ejecutaste el script de inserción completo
- [ ] Recargaste la aplicación (F5)
- [ ] Seleccionaste una parroquia en **texto negro** (habilitada)
- [ ] El UUID de la parroquia existe en la base de datos

---

## 🎯 Solución Rápida (Más Probable)

El problema más común es que la **tabla está vacía** o **no tiene las parroquias de Guadix**.

**Solución en 3 pasos:**

1. **Ejecuta el script de inserción:**
   - Abre [INSERT-TODAS-PARROQUIAS-GUADIX.sql](INSERT-TODAS-PARROQUIAS-GUADIX.sql)
   - Cópialo completo
   - Pégalo en Supabase SQL Editor
   - Ejecuta (Run)

2. **Verifica que se insertaron:**
   ```sql
   SELECT COUNT(*) FROM parishes WHERE diocese = 'Guadix';
   ```
   Debe devolver: **74**

3. **Recarga tu aplicación:**
   - Presiona `F5`
   - Selecciona una parroquia
   - Prueba generar número de inventario

---

¿El problema persiste? Copia y pega **todos** los logs de la consola del navegador y compártelos conmigo para ayudarte mejor.
