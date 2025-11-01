# 🏛️ Guía: Insertar TODAS las Parroquias de Guadix

## 📋 Resumen

He creado un script SQL que inserta **TODAS las 74 parroquias** de la Diócesis de Guadix en tu base de datos de una sola vez.

---

## 🚀 Pasos (5 minutos)

### **Paso 1: Abrir Supabase**

1. Ve a [https://supabase.com](https://supabase.com)
2. Inicia sesión
3. Selecciona tu proyecto
4. En el menú lateral izquierdo, haz clic en **"SQL Editor"** (ícono `</>`)

### **Paso 2: Abrir el Archivo SQL**

Abre el archivo: **[INSERT-TODAS-PARROQUIAS-GUADIX.sql](INSERT-TODAS-PARROQUIAS-GUADIX.sql)**

### **Paso 3: Copiar TODO el Contenido**

1. Selecciona **TODO** el contenido del archivo (Ctrl+A)
2. Copia (Ctrl+C)

### **Paso 4: Pegar en Supabase SQL Editor**

1. Vuelve a Supabase SQL Editor
2. Crea una nueva consulta (botón "+ New query")
3. Pega el contenido (Ctrl+V)

### **Paso 5: Ejecutar el Script**

1. Haz clic en el botón **"Run"** (esquina superior derecha)
   - O presiona `Ctrl + Enter`
2. **Espera unos segundos**
3. Deberías ver: ✅ **"Success. 74 rows affected"**

### **Paso 6: Verificar**

El script incluye automáticamente consultas de verificación. Deberías ver:

**Conteo total:**
```
total_parroquias
----------------
74
```

**Listado de parroquias** (ordenadas por municipio)

**Estadísticas por municipio:**
```
municipio                             | cantidad_parroquias
--------------------------------------|--------------------
Guadix                                | 8
Baza                                  | 4
Cúllar                                | 4
...
```

---

## 🎯 ¿Qué Incluye el Script?

### 74 Parroquias Distribuidas en:

- **Albuñan** - 1 parroquia
- **Aldeire** - 1 parroquia
- **Alicún de Ortega** - 1 parroquia
- **Alquife** - 1 parroquia
- **Baza** - 5 parroquias (incluyendo El Sagrario, San Juan Bautista, Santo Ángel, Santiago Apóstol, + 1 pedanía)
- **Guadix** - 8 parroquias (incluyendo Sagrario, Santa Ana, Santiago Apóstol, San Miguel Arcángel, etc.)
- **Huéscar** - 2 parroquias (**Santa María La Mayor** + San Clemente)
- **Y 60+ parroquias más** distribuidas por toda la diócesis

---

## ✅ Después de Ejecutar

### 1. **Recarga tu Aplicación**
- Presiona `F5` en tu navegador
- O cierra y vuelve a abrir la aplicación

### 2. **Prueba el Selector de Parroquias**
1. Ve al formulario de inventario
2. Haz clic en **"Editar"**
3. Abre el selector de **"Parroquia"**
4. **TODAS las parroquias** ahora deberían aparecer en **negro** (habilitadas)

### 3. **Busca "Santa María La Mayor"**
1. En el buscador de parroquias, escribe: `"Huéscar"`
2. Selecciona: **"Santa María La Mayor — Huéscar"**
3. Debería estar **habilitada** (texto negro)

### 4. **Genera un Número de Inventario**
1. Con la parroquia seleccionada
2. Asegúrate de tener un tipo de objeto (ej: "Orfebrería")
3. El número de inventario debería generarse automáticamente:
   ```
   SML-2025-ORF-0001
   ```
   - **SML** = Santa María [La] Mayor
   - **2025** = Año actual
   - **ORF** = Orfebrería
   - **0001** = Primer item de esa parroquia

---

## 📊 Comandos SQL Útiles (Después de Insertar)

### Ver todas las parroquias:
```sql
SELECT id, name, location
FROM parishes
WHERE diocese = 'Guadix'
ORDER BY location, name;
```

### Buscar una parroquia específica:
```sql
SELECT id, name, location
FROM parishes
WHERE name ILIKE '%Santa María%'
  AND location ILIKE '%Huéscar%';
```

### Contar parroquias por municipio:
```sql
SELECT location, COUNT(*) as total
FROM parishes
WHERE diocese = 'Guadix'
GROUP BY location
ORDER BY total DESC;
```

### Ver parroquias de un municipio específico:
```sql
SELECT name, location
FROM parishes
WHERE diocese = 'Guadix'
  AND location = 'Guadix'
ORDER BY name;
```

---

## 🔄 ¿Qué Hacer si Ya Existen Algunas Parroquias?

Si ya insertaste algunas parroquias manualmente, el script **intentará insertar todas de nuevo**, lo que puede causar **duplicados**.

### Solución 1: Limpiar Primero (Recomendado)

Si quieres empezar limpio:

```sql
-- ⚠️ CUIDADO: Esto borra TODAS las parroquias de Guadix
DELETE FROM parishes WHERE diocese = 'Guadix';

-- Luego ejecuta el script completo
```

### Solución 2: Insertar Solo las Faltantes

Si quieres mantener las existentes y solo agregar nuevas, sería más complejo. En ese caso, mejor usa la Solución 1.

---

## ⚠️ Importante

### Antes de Ejecutar:
- ✅ Asegúrate de estar en el **proyecto correcto** de Supabase
- ✅ Haz un **backup** si tienes datos importantes (opcional)
- ✅ Verifica que la tabla `parishes` existe

### Durante la Ejecución:
- ⏳ Espera a que termine (puede tardar 5-10 segundos)
- 📊 Revisa el resultado: debe decir "74 rows affected"

### Después de Ejecutar:
- 🔄 Recarga tu aplicación (F5)
- ✅ Verifica que las parroquias aparecen habilitadas (texto negro)
- 🧪 Prueba generar un número de inventario

---

## 🆘 Solución de Problemas

### Error: "relation 'parishes' does not exist"
**Causa:** La tabla `parishes` no existe en tu base de datos.

**Solución:** Ejecuta primero el script de creación de la tabla:
```sql
CREATE TABLE IF NOT EXISTS parishes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  location TEXT,
  diocese TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### Error: "duplicate key value"
**Causa:** Algunas parroquias ya existen.

**Solución:** Usa el comando de limpieza (Solución 1 arriba) o inserta manualmente solo las faltantes.

### Las parroquias no aparecen en la aplicación
**Causa:** Caché del navegador.

**Solución:**
1. Recarga con `F5`
2. Si no funciona, recarga forzada: `Ctrl + F5` (Windows) o `Cmd + Shift + R` (Mac)
3. Si aún no funciona, limpia la caché del navegador

---

## 📈 Estadísticas

Después de ejecutar el script, tendrás:

- **74 parroquias** registradas
- **Distribuidas** en más de 60 municipios
- **Todas con UUID** válido para generar números de inventario
- **Listas para usar** inmediatamente

---

## ✅ Checklist Final

Después de ejecutar el script:

- [ ] El SQL Editor muestra "Success. 74 rows affected"
- [ ] La consulta de verificación muestra "total_parroquias: 74"
- [ ] Recargaste la aplicación (F5)
- [ ] El selector de parroquias muestra todas las opciones en negro
- [ ] "Santa María La Mayor — Huéscar" está habilitada
- [ ] Puedes generar un número de inventario correctamente

---

¡Listo! Ahora tienes **todas las parroquias de Guadix** registradas y listas para usar. 🎉
