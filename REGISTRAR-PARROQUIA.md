# 📝 Cómo Registrar una Parroquia en la Base de Datos

## Problema
"Santa María la Mayor de Huéscar" aparece en **gris** (deshabilitada) porque no está registrada en la base de datos de Supabase.

---

## ✅ Solución: Registrar la Parroquia

### Opción 1: Mediante SQL Editor (Recomendado) 🚀

#### Paso 1: Abrir Supabase
1. Ve a tu proyecto en [https://supabase.com](https://supabase.com)
2. Abre el **SQL Editor** (menú lateral izquierdo)

#### Paso 2: Ejecutar el Script
Copia y pega este comando SQL:

```sql
INSERT INTO parishes (id, name, location, diocese)
VALUES (
  gen_random_uuid(),
  'Santa María la Mayor',
  'Huéscar',
  'Guadix'
);
```

#### Paso 3: Ejecutar
1. Haz clic en el botón **"Run"** o presiona `Ctrl+Enter`
2. Deberías ver: **"Success. 1 rows affected"**

#### Paso 4: Verificar
Ejecuta esta consulta para confirmar:

```sql
SELECT id, name, location, diocese
FROM parishes
WHERE name = 'Santa María la Mayor'
  AND location = 'Huéscar';
```

Deberías ver algo como:
```
id                                    | name                   | location | diocese
--------------------------------------|------------------------|----------|--------
a1b2c3d4-e5f6-7890-abcd-ef1234567890 | Santa María la Mayor   | Huéscar  | Guadix
```

---

## 📋 Script Completo con Múltiples Parroquias

Si quieres registrar **varias parroquias a la vez**, usa el archivo [INSERT-PARROQUIAS.sql](INSERT-PARROQUIAS.sql) que he creado.

### Parroquias Comunes de Guadix:

```sql
INSERT INTO parishes (id, name, location, diocese)
VALUES
  (gen_random_uuid(), 'Santa María la Mayor', 'Huéscar', 'Guadix'),
  (gen_random_uuid(), 'Ntra. Sra. de la Anunciación', 'Galera', 'Guadix'),
  (gen_random_uuid(), 'Santiago Apóstol', 'Baza', 'Guadix'),
  (gen_random_uuid(), 'San Juan Bautista', 'Baza', 'Guadix'),
  (gen_random_uuid(), 'Santa Ana', 'Guadix', 'Guadix'),
  (gen_random_uuid(), 'Santiago Apóstol', 'Guadix', 'Guadix'),
  (gen_random_uuid(), 'Sagrado Corazón de Jesús', 'Guadix', 'Guadix'),
  (gen_random_uuid(), 'San Miguel Arcángel', 'Guadix', 'Guadix'),
  (gen_random_uuid(), 'Ntra. Sra. de Gracia', 'Guadix', 'Guadix'),
  (gen_random_uuid(), 'Sagrario', 'Guadix', 'Guadix');
```

---

## Opción 2: Mediante API (Más Complejo)

Si prefieres crear una interfaz para registrar parroquias desde la aplicación, puedo ayudarte a implementarla. Pero para empezar rápido, usa la Opción 1.

---

## 🔄 Después de Registrar

1. **Recarga la página** de tu aplicación (`F5`)
2. Ve al formulario de inventario
3. Haz clic en **"Editar"**
4. Abre el selector de **"Parroquia"**
5. **"Santa María la Mayor — Huéscar"** ahora debería aparecer en **negro** (habilitada)

---

## 📊 Comandos Útiles para Gestionar Parroquias

### Ver todas las parroquias registradas:
```sql
SELECT id, name, location, diocese, created_at
FROM parishes
ORDER BY location, name;
```

### Contar parroquias por municipio:
```sql
SELECT location, COUNT(*) as total
FROM parishes
WHERE diocese = 'Guadix'
GROUP BY location
ORDER BY total DESC;
```

### Buscar una parroquia específica:
```sql
SELECT id, name, location
FROM parishes
WHERE name ILIKE '%santa maría%'
  AND location ILIKE '%huéscar%';
```

### Eliminar una parroquia (cuidado):
```sql
DELETE FROM parishes
WHERE name = 'Santa María la Mayor'
  AND location = 'Huéscar';
```

---

## 🎯 Campos de la Tabla `parishes`

| Campo      | Tipo        | Descripción                           | Requerido |
|------------|-------------|---------------------------------------|-----------|
| `id`       | UUID        | Identificador único (auto-generado)  | Sí        |
| `name`     | TEXT        | Nombre de la parroquia               | Sí        |
| `location` | TEXT        | Municipio/Localidad                  | No        |
| `diocese`  | TEXT        | Diócesis (ej: "Guadix")              | No        |
| `created_at` | TIMESTAMP | Fecha de creación                    | Auto      |

---

## ⚠️ Importante

- El campo `id` se genera automáticamente con `gen_random_uuid()`
- El campo `name` es el nombre de la parroquia (ej: "Santa María la Mayor")
- El campo `location` es el municipio (ej: "Huéscar")
- El campo `diocese` debe ser "Guadix" para que aparezca en el selector

---

## ✅ Resultado Esperado

Después de registrar la parroquia, cuando generes un número de inventario para un objeto de "Santa María la Mayor de Huéscar", verás:

```
Parroquia: Santa María la Mayor (Huéscar)
Código generado: SML (Santa María [la] Mayor)
Número de inventario: SML-2025-ORF-0001
```

---

## 🚀 Prueba

1. Ejecuta el SQL para insertar la parroquia
2. Recarga tu aplicación
3. Edita un inventario
4. Selecciona "Santa María la Mayor — Huéscar"
5. El número de inventario debería generarse automáticamente

¿Necesitas ayuda con algún paso específico?
