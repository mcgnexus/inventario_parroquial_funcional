# 🔧 SOLUCIÓN DEFINITIVA: Problema con UUID de Santa María La Mayor de Huéscar

## 🐛 El Problema Identificado

Cuando intentas seleccionar "Santa María La Mayor de Huéscar" en el formulario de inventario, aparece este error:

```
❌ No se encontró el nombre para la parroquia con ID: 81a66003-fd37-4f89-bacf-87e3f6197c8a
```

### Causa Raíz:

El UUID `81a66003-fd37-4f89-bacf-87e3f6197c8a` **NO EXISTE** en tu base de datos. Este UUID está apareciendo porque:

1. El archivo [src/data/guadixParishes.ts](src/data/guadixParishes.ts) contiene una **lista fallback** con solo nombres (sin UUIDs)
2. El componente [ParishSelector](src/components/ParishSelector.tsx) hace un "merge" entre:
   - Parroquias de la BD (con UUIDs reales) ✅
   - Parroquias del archivo fallback (sin UUIDs válidos) ❌

3. **Si la API falla o la parroquia no está en la BD**, se usa el fallback que crea un "ID" artificial concatenando nombre+ubicación:
   ```typescript
   id: `${f.name}|${f.location || ''}`  // NO es un UUID válido
   ```

---

## ✅ SOLUCIÓN PASO A PASO

### **PASO 1: Verificar qué UUID tiene realmente Santa María La Mayor en tu BD**

He creado un script SQL para diagnosticar: [VERIFICAR-SANTA-MARIA-HUESCAR.sql](VERIFICAR-SANTA-MARIA-HUESCAR.sql)

**Ejecútalo en Supabase:**

1. Ve a tu proyecto de Supabase
2. Abre el **SQL Editor**
3. Copia y pega el contenido del archivo `VERIFICAR-SANTA-MARIA-HUESCAR.sql`
4. Haz clic en **Run**

**Esto te mostrará:**
- ✅ El UUID real de "Santa María La Mayor" en tu BD
- ✅ Todas las parroquias de Huéscar
- ✅ Cuántas parroquias tienes en total

---

### **PASO 2: Identificar el problema**

Después de ejecutar el SQL, verás uno de estos escenarios:

#### **Escenario A: La parroquia EXISTE en la BD**

```sql
┌──────────────────────────────────────┬────────────────────────┬──────────┐
│ id                                   │ name                   │ location │
├──────────────────────────────────────┼────────────────────────┼──────────┤
│ 12345678-abcd-1234-abcd-123456789abc │ Santa María La Mayor   │ Huéscar  │
└──────────────────────────────────────┴────────────────────────┴──────────┘
```

**Si ves esto:**
- ✅ La parroquia está correctamente registrada
- ❌ PERO el UUID es **diferente** al que está intentando usar la app (`81a66003-...`)
- **Problema:** El ParishSelector no está cargando correctamente desde la API

#### **Escenario B: La parroquia NO EXISTE en la BD**

```sql
-- Sin resultados
```

**Si ves esto:**
- ❌ La parroquia nunca se insertó en la base de datos
- **Solución:** Insertar la parroquia usando el script que ya creamos

---

### **PASO 3: Solución según el escenario**

#### **Si Escenario A (existe pero UUID diferente):**

El problema está en que la API no está devolviendo las parroquias correctamente.

**Verifica en la consola del navegador:**

1. Abre las herramientas de desarrollo (F12)
2. Ve a la pestaña **Network** (Red)
3. Recarga la página de inventario
4. Busca una petición a: `api/parishes/list?diocese=Guadix`
5. Haz clic en ella y ve a la pestaña **Response**

**Deberías ver algo como:**
```json
{
  "ok": true,
  "parishes": [
    {
      "id": "12345678-abcd-1234-abcd-123456789abc",
      "name": "Santa María La Mayor",
      "location": "Huéscar"
    },
    ...
  ]
}
```

**Si no ves esto:**
- ❌ La API no está funcionando
- **Causa posible:** Variables de entorno mal configuradas
- **Solución:** Verificar `.env.local`

#### **Si Escenario B (no existe en BD):**

**Solución: Insertar la parroquia**

Ejecuta este SQL en Supabase:

```sql
-- Insertar solo Santa María La Mayor de Huéscar
INSERT INTO parishes (id, name, location, diocese)
VALUES (
  gen_random_uuid(),
  'Santa María La Mayor',
  'Huéscar',
  'Guadix'
)
ON CONFLICT (name, location) DO NOTHING;

-- Verificar que se insertó correctamente
SELECT id, name, location FROM parishes
WHERE name ILIKE '%Santa María%Mayor%'
  AND location ILIKE '%Huéscar%';
```

**O mejor: Insertar TODAS las parroquias si falta alguna**

Usa el script completo: [INSERT-TODAS-PARROQUIAS-GUADIX.sql](INSERT-TODAS-PARROQUIAS-GUADIX.sql)

```sql
-- Ejecuta todo el contenido de INSERT-TODAS-PARROQUIAS-GUADIX.sql
```

---

### **PASO 4: Limpiar items con UUIDs inválidos (Opcional)**

Si tienes items del catálogo que ya fueron creados con el UUID inválido `81a66003-fd37-4f89-bacf-87e3f6197c8a`, necesitas actualizarlos.

**1. Identificar items problemáticos:**

```sql
SELECT
  i.id,
  i.data->>'name' as item_name,
  i.data->>'parish_id' as parish_id_invalido,
  i.data->>'inventory_number' as inventory_number
FROM items i
WHERE i.data->>'parish_id' = '81a66003-fd37-4f89-bacf-87e3f6197c8a';
```

**2. Obtener el UUID correcto de Santa María La Mayor:**

```sql
SELECT id FROM parishes
WHERE name = 'Santa María La Mayor'
  AND location = 'Huéscar';
-- Copia el UUID que aparezca, ejemplo: aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee
```

**3. Actualizar los items:**

```sql
-- IMPORTANTE: Reemplaza 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee' con el UUID real
UPDATE items
SET data = jsonb_set(
  data,
  '{parish_id}',
  '"aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee"'::jsonb
)
WHERE data->>'parish_id' = '81a66003-fd37-4f89-bacf-87e3f6197c8a';

-- Verificar los cambios
SELECT
  i.id,
  i.data->>'name' as item_name,
  i.data->>'parish_id' as nuevo_parish_id,
  p.name as parish_name
FROM items i
LEFT JOIN parishes p ON p.id::text = i.data->>'parish_id'
WHERE i.data->>'parish_id' = 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee';
```

---

### **PASO 5: Forzar recarga en el navegador**

Después de hacer los cambios en la BD:

1. **Cierra completamente** el navegador
2. **Abre de nuevo** y ve a `http://localhost:3000`
3. **O presiona** Ctrl+Shift+R para forzar recarga (vacía la caché)

---

## 🎯 Verificación Final

Después de seguir los pasos, verifica:

### ✅ **En el formulario de inventario:**

1. Abre el campo "Parroquia"
2. Busca "Huéscar" o "Santa María"
3. Selecciona "Santa María La Mayor — Huéscar"
4. **NO debería aparecer** el texto "(No disponible - sin registro en BD)"
5. **Debería aparecer en NEGRO** (no gris cursiva)

### ✅ **En la consola del navegador (F12):**

```javascript
🏛️ ParishSelector - Selección cambiada: aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee
🏛️ ParishSelector - Enviando valor: {
  selectedId: "aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee",
  isUuid: true,              // ✅ Debe ser true
  valueToSend: "aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee",
  name: "Santa María La Mayor"
}

🔢 generarNumeroInventario llamado con: {
  parishId: "aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee",  // ✅ UUID válido
  tipoObjeto: "ORFEBRERIA"
}

✅ Parroquia encontrada: Santa María La Mayor (Huéscar)  // ✅ Sin errores
```

### ❌ **NO deberías ver:**

```javascript
❌ No se encontró el nombre para la parroquia con ID: 81a66003-fd37-4f89-bacf-87e3f6197c8a
⚠️ ParishSelector - La parroquia no tiene un UUID válido, enviando vacío
```

---

## 📊 Resumen de Archivos Relevantes

| Archivo | Qué Hace | Problema Potencial |
|---------|----------|-------------------|
| [src/data/guadixParishes.ts](src/data/guadixParishes.ts) | Lista fallback de parroquias | Solo tiene nombres, NO UUIDs |
| [src/components/ParishSelector.tsx](src/components/ParishSelector.tsx) | Selector de parroquias | Hace merge entre BD y fallback |
| [src/app/api/parishes/list/route.ts](src/app/api/parishes/list/route.ts) | API que consulta la BD | Debe devolver parroquias con UUIDs reales |
| [INSERT-TODAS-PARROQUIAS-GUADIX.sql](INSERT-TODAS-PARROQUIAS-GUADIX.sql) | Script para insertar parroquias | Crea UUIDs aleatorios con `gen_random_uuid()` |

---

## 🤔 Preguntas Frecuentes

### **P: ¿Por qué no simplemente usar el archivo guadixParishes.ts con UUIDs fijos?**

**R:** Porque:
- ❌ Los UUIDs se generan aleatoriamente al insertar en la BD (`gen_random_uuid()`)
- ❌ No puedes predecir qué UUID tendrá cada parroquia
- ✅ Es mejor cargar siempre desde la BD (que es la fuente de verdad)

### **P: ¿Para qué sirve entonces guadixParishes.ts?**

**R:** Como **fallback** si:
- La API falla por problemas de red
- Supabase está caído temporalmente
- No hay variables de entorno configuradas (desarrollo local)

**PERO** las parroquias del fallback **no deberían usarse para crear items**, solo para mostrar opciones.

### **P: ¿Debería eliminar el archivo guadixParishes.ts?**

**R:** NO. Es útil tenerlo como fallback. El problema es que las parroquias sin UUID válido **ya están siendo deshabilitadas** en el selector (línea 149 de ParishSelector.tsx), así que el usuario no debería poder seleccionarlas.

Si puedes seleccionar "Santa María La Mayor" y NO tiene UUID, significa que:
- La API **no está devolviendo** las parroquias de la BD correctamente
- O la parroquia **no existe** en la BD

---

## 🚀 Siguiente Paso

**Ejecuta el SQL de diagnóstico:**

1. Abre Supabase SQL Editor
2. Ejecuta [VERIFICAR-SANTA-MARIA-HUESCAR.sql](VERIFICAR-SANTA-MARIA-HUESCAR.sql)
3. **Copia aquí el resultado** para que pueda ayudarte con la solución específica

**Una vez sepamos qué devuelve el SQL, sabremos exactamente qué hacer.**

---

¿Listo para ejecutar el SQL y ver qué resultado da? 🔍
