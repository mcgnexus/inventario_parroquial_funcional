# 🚨 PASOS INMEDIATOS PARA RESOLVER EL ERROR

## Error Actual
```
❌ No se encontró el nombre para la parroquia con ID: 81a66003-fd37-4f89-bacf-87e3f6197c8a
```

---

## ✅ Solución en 3 Pasos (10 minutos)

### **PASO 1: Verificar la Base de Datos**

1. Ve a **Supabase.com**
2. Inicia sesión y selecciona tu proyecto
3. Abre **SQL Editor** (menú lateral izquierdo, ícono `</>`)
4. Ejecuta este comando:

```sql
SELECT COUNT(*) AS total_parroquias
FROM parishes
WHERE diocese = 'Guadix';
```

#### 🔍 Interpretación del Resultado:

**Si devuelve `0` o da error:**
- ❌ La tabla está vacía o no existe
- ✅ Continúa al **PASO 2**

**Si devuelve `74`:**
- ✅ Las parroquias YA están insertadas
- 🔄 El problema es otro, continúa al **PASO 3**

---

### **PASO 2: Insertar TODAS las Parroquias** ⭐

**Solo ejecuta este paso si el PASO 1 devolvió `0` o error**

1. **Abre el archivo:** `INSERT-TODAS-PARROQUIAS-GUADIX.sql` (en la raíz del proyecto)

2. **Selecciona TODO el contenido:**
   - Windows/Linux: `Ctrl + A`
   - Mac: `Cmd + A`

3. **Copia:**
   - Windows/Linux: `Ctrl + C`
   - Mac: `Cmd + C`

4. **Vuelve a Supabase SQL Editor**

5. **Crea una nueva consulta:**
   - Haz clic en el botón `+ New query`

6. **Pega el contenido:**
   - Windows/Linux: `Ctrl + V`
   - Mac: `Cmd + V`

7. **Ejecuta:**
   - Haz clic en el botón `Run` (esquina superior derecha)
   - O presiona `Ctrl + Enter` (Windows) / `Cmd + Enter` (Mac)

8. **Espera el resultado:**
   - Deberías ver: ✅ **"Success. 74 rows affected"**
   - Si ves un error, cópialo y compártelo conmigo

9. **Verifica que se insertaron:**
   ```sql
   SELECT COUNT(*) FROM parishes WHERE diocese = 'Guadix';
   ```
   - Debe devolver: **74**

---

### **PASO 3: Limpiar Caché y Recargar**

1. **En tu navegador:**
   - **Recarga Forzada:**
     - Windows: `Ctrl + Shift + R` o `Ctrl + F5`
     - Mac: `Cmd + Shift + R`

2. **Si no funciona, cierra y reabre el navegador completamente**

3. **Vuelve a la aplicación:**
   - Ve a la página de inventario
   - Haz clic en **"Editar"** en una ficha
   - Abre el selector de **"Parroquia"**

4. **Busca "Huéscar"** en el campo de búsqueda

5. **Selecciona "Santa María La Mayor — Huéscar"**
   - Debe aparecer en **texto negro** (habilitada)
   - Si aparece en **gris itálico**, significa que no se insertó correctamente

6. **Observa la consola del navegador** (F12):
   - Busca mensajes que empiecen con 🔍, ✅, ❌
   - Deberías ver algo como:
     ```
     🏛️ ParishSelector - Selección cambiada: 81a66003-fd37-4f89-bacf-87e3f6197c8a
     🔍 InventoryForm - Verificando generación de número: {...}
     ✅ Generando número de inventario...
     🔢 generarNumeroInventario llamado con: {...}
     🔍 Buscando parroquia con ID: 81a66003-...
     📊 Resultado de la búsqueda: [{name: "Santa María La Mayor", location: "Huéscar"}]
     ✅ Parroquia encontrada: Santa María La Mayor (Huéscar)
     ✅ Número de inventario generado: SML-2025-ORF-0001
     ```

---

## 🆘 Si Aún No Funciona

### Opción A: Verificar que el UUID existe

En Supabase SQL Editor, ejecuta:

```sql
SELECT id, name, location
FROM parishes
WHERE id = '81a66003-fd37-4f89-bacf-87e3f6197c8a';
```

**Si devuelve 0 filas:**
- Ese UUID específico NO existe
- Necesitas cambiar de parroquia en el selector

**Si devuelve 1 fila:**
- El UUID SÍ existe
- El problema puede ser de caché
- Limpia la caché del navegador completamente

---

### Opción B: Ver TODAS las parroquias disponibles

```sql
SELECT id, name, location
FROM parishes
WHERE diocese = 'Guadix'
ORDER BY name
LIMIT 20;
```

Copia los resultados y busca manualmente el UUID de "Santa María La Mayor - Huéscar"

---

### Opción C: Limpiar y Volver a Insertar

Si ya ejecutaste el script pero sigues teniendo problemas:

1. **Primero, limpia las parroquias existentes:**
   ```sql
   DELETE FROM parishes WHERE diocese = 'Guadix';
   ```

2. **Luego, vuelve a ejecutar el script completo:**
   - Abre `INSERT-TODAS-PARROQUIAS-GUADIX.sql`
   - Copia TODO
   - Pega en SQL Editor
   - Ejecuta

3. **Verifica:**
   ```sql
   SELECT COUNT(*) FROM parishes WHERE diocese = 'Guadix';
   ```
   Debe devolver: **74**

4. **Recarga la aplicación con Ctrl + Shift + R**

---

## 📋 Checklist de Verificación

Marca cada paso que hayas completado:

- [ ] Abrí Supabase SQL Editor
- [ ] Ejecuté `SELECT COUNT(*) FROM parishes WHERE diocese = 'Guadix';`
- [ ] El resultado fue **0** (necesito insertar) o **74** (ya están insertadas)
- [ ] Si fue 0, ejecuté el script `INSERT-TODAS-PARROQUIAS-GUADIX.sql`
- [ ] Esperé a ver "Success. 74 rows affected"
- [ ] Verifiqué que ahora hay 74 parroquias
- [ ] Recargué la aplicación con Ctrl + Shift + R
- [ ] Abrí la consola del navegador (F12)
- [ ] Seleccioné una parroquia en el selector
- [ ] La parroquia aparece en **texto negro** (no gris)
- [ ] Vi los logs en la consola (🔍, ✅, etc.)
- [ ] El número de inventario se generó correctamente

---

## 🎯 Resultado Esperado

Al final, deberías ver en la consola:

```
🏛️ ParishSelector - Enviando valor: {
  selectedId: "...-...-...-...-...",
  isUuid: true,
  valueToSend: "...-...-...-...-...",
  name: "Santa María La Mayor"
}
🔍 InventoryForm - Verificando generación de número: {
  estaEditando: true,
  parish_id: "...-...-...-...-...",
  tipo_objeto: "Orfebrería",
  inventory_number: undefined
}
✅ Generando número de inventario...
🔢 generarNumeroInventario llamado con: {...}
🔍 Buscando parroquia con ID: ...
📊 Resultado de la búsqueda: [{name: "Santa María La Mayor", ...}]
✅ Parroquia encontrada: Santa María La Mayor (Huéscar)
✅ Código de parroquia: SML
📅 Año: 2025
🎨 Código de objeto: ORF
🔍 Contando items en la parroquia...
📊 Items encontrados: 0
🔢 Número secuencial: 0001
✅ Número de inventario generado: SML-2025-ORF-0001
```

Y en el formulario, el campo **"Número de inventario"** mostrará: `SML-2025-ORF-0001`

---

## ❓ ¿Qué Hacer Si Sigue Fallando?

Copia y pega **TODOS** los siguientes datos:

1. **Resultado de:**
   ```sql
   SELECT COUNT(*) FROM parishes WHERE diocese = 'Guadix';
   ```

2. **Resultado de:**
   ```sql
   SELECT id, name, location FROM parishes WHERE name ILIKE '%Santa María%' AND location ILIKE '%Huéscar%';
   ```

3. **Logs de la consola del navegador** (todos los mensajes con 🔍, ✅, ❌)

4. **Captura de pantalla** del selector de parroquias mostrando si "Santa María La Mayor — Huéscar" está en negro o gris

Comparte eso conmigo y te ayudo a resolver el problema específico.
