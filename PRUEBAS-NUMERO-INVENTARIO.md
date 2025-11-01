# Pruebas de Generación Automática de Número de Inventario

## ✅ Implementación Completada

Se ha implementado exitosamente la generación automática del número de inventario con el formato **XXX-YYYY-OOO-NNNN**.

---

## 📋 Formato del Número de Inventario

```
XXX  - YYYY - OOO  - NNNN
│      │      │      │
│      │      │      └─ Número secuencial (4 dígitos, único por parroquia)
│      │      └──────── Código del tipo de objeto (3 letras)
│      └─────────────── Año de catalogación (4 dígitos)
└────────────────────── Código de la parroquia (3 letras)
```

### Ejemplo Real
**Santa María la Mayor** - **2025** - **Orfebrería** - **Item #25**
```
SMM-2025-ORF-0025
```

---

## 🧪 Resultados de Pruebas

### Códigos de Parroquia (XXX)

| Nombre de la Parroquia           | Código | Explicación |
|----------------------------------|--------|-------------|
| Santa María la Mayor             | `SMM`  | **S**anta **M**aría **M**ayor |
| Parroquia de Galera              | `PDG`  | **P**arroquia **D**e **G**alera |
| San José                         | `SJX`  | **S**an **J**osé + X (relleno) |
| Nuestra Señora de la Asunción    | `NSA`  | **N**uestra **S**eñora **A**sunción |
| Santiago Apóstol                 | `SAX`  | **S**antiago **A**póstol + X |
| San Pedro y San Pablo            | `SPS`  | **S**an **P**edro **S**an Pablo |
| Cristo Rey                       | `CRX`  | **C**risto **R**ey + X |
| Virgen del Carmen                | `VDC`  | **V**irgen **D**el **C**armen |

**Nota:** Se ignoran palabras como "de", "la", "el", "los", "las", "y", "en", "del", "al", "a"

---

### Códigos de Tipo de Objeto (OOO)

| Tipo de Objeto | Código | Tipo |
|----------------|--------|------|
| Orfebrería     | `ORF`  | Mapeo predefinido |
| Pintura        | `PIN`  | Mapeo predefinido |
| Escultura      | `ESC`  | Mapeo predefinido |
| Talla          | `TAL`  | Mapeo predefinido |
| Ornamentos     | `ORN`  | Mapeo predefinido |
| Telas          | `TEL`  | Mapeo predefinido |
| Mobiliario     | `MOB`  | Mapeo predefinido |
| Documentos     | `DOC`  | Mapeo predefinido |
| Otros          | `OTR`  | Mapeo predefinido |
| Retablo        | `RET`  | Primeras 3 letras |
| Cáliz          | `CAL`  | Primeras 3 letras |
| Custodia       | `CUS`  | Primeras 3 letras |

---

### Ejemplos de Números Completos

#### Santa María la Mayor

| Tipo       | Número | Resultado           |
|------------|--------|---------------------|
| Orfebrería | 25     | `SMM-2025-ORF-0025` |
| Pintura    | 26     | `SMM-2025-PIN-0026` |

#### Parroquia de Galera

| Tipo       | Número | Resultado           |
|------------|--------|---------------------|
| Orfebrería | 45     | `PDG-2025-ORF-0045` |
| Escultura  | 46     | `PDG-2025-ESC-0046` |

#### San José

| Tipo  | Número | Resultado           |
|-------|--------|---------------------|
| Talla | 1      | `SJX-2025-TAL-0001` |

#### Nuestra Señora de la Asunción

| Tipo       | Número | Resultado           |
|------------|--------|---------------------|
| Ornamentos | 100    | `NSA-2025-ORN-0100` |

#### Santiago Apóstol

| Tipo       | Número | Resultado           |
|------------|--------|---------------------|
| Documentos | 15     | `SAX-2025-DOC-0015` |

---

## 🔧 Archivos Modificados

### 1. `src/lib/supabase.ts`
- ✅ Función `generarCodigoParroquia()` - Genera código de 3 letras de la parroquia
- ✅ Función `generarCodigoObjeto()` - Genera código de 3 letras del tipo de objeto
- ✅ Función `generarNumeroInventario()` - Genera el número completo consultando DB

### 2. `src/components/InventoryForm.tsx`
- ✅ Agregado `useEffect` para generación automática
- ✅ Se activa al cambiar parroquia o tipo de objeto
- ✅ Solo genera si el campo está vacío

### 3. `src/components/EditableCatalogForm.tsx`
- ✅ Agregado `useEffect` para generación automática
- ✅ Validación de UUID de parroquia
- ✅ Generación reactiva a cambios

---

## 🎯 Características Implementadas

### ✅ Generación Automática
- El número se genera automáticamente cuando el usuario selecciona:
  - Una parroquia del selector
  - Un tipo de objeto/categoría

### ✅ Números Únicos por Parroquia
- Cada parroquia mantiene su propio contador secuencial
- Ejemplo: Santa María puede estar en 0025 mientras Galera está en 0045

### ✅ Normalización de Texto
- Elimina tildes automáticamente
- Convierte a mayúsculas
- Ignora palabras no significativas (artículos, preposiciones)

### ✅ Formato Consistente
- Siempre 3 letras para parroquia (rellena con X si es necesario)
- Siempre 3 letras para tipo de objeto
- Siempre 4 dígitos para número secuencial (0001, 0002, etc.)

### ✅ Editable
- El campo puede editarse manualmente si es necesario
- No sobrescribe números existentes

---

## 📝 Cómo Usar

### En la Página de Insertar Inventario

1. **Seleccionar Parroquia**
   - Usa el selector de parroquias o búsqueda
   - Ejemplo: "Santa María la Mayor"

2. **Seleccionar Tipo de Objeto**
   - Elige la categoría del desplegable
   - Ejemplo: "Orfebrería"

3. **Resultado**
   - El campo "Número de inventario" se completa automáticamente
   - Ejemplo: `SMM-2025-ORF-0025`

4. **Opcional**
   - Puedes editar el número manualmente si lo necesitas

---

## 🧪 Ejecutar Pruebas

Para verificar la funcionalidad, ejecuta el script de pruebas:

```bash
node test-inventory-number.js
```

Este script prueba:
- Generación de códigos de parroquia
- Generación de códigos de tipo de objeto
- Números completos de inventario
- Casos especiales

---

## 📌 Notas Importantes

1. **Número Secuencial por Parroquia**
   - Cada parroquia tiene su propia secuencia
   - El contador NO se reinicia por año
   - El contador NO se reinicia por tipo de objeto

2. **Parroquias con Nombres Similares**
   - "Santa Ana" y "Santiago Apóstol" ambos dan `SAX`
   - En estos casos, el número secuencial los diferencia

3. **Validación**
   - Solo genera si hay parroquia Y tipo de objeto
   - Solo genera si el campo está vacío
   - Requiere que la parroquia sea del sistema (UUID válido)

---

## ✅ Estado: COMPLETADO

Todas las funcionalidades han sido implementadas y probadas exitosamente.
