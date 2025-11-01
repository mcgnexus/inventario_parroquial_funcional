/**
 * Script de prueba para verificar la generación de números de inventario
 * Ejecutar con: node test-inventory-number.js
 */

// Función para generar código de parroquia (copia de la implementación)
function generarCodigoParroquia(parishName) {
  const stopWords = ['de', 'la', 'el', 'los', 'las', 'y', 'en', 'del', 'al', 'a']

  const normalize = (str) =>
    str.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase()

  const palabras = parishName
    .split(' ')
    .filter(word => word.length > 0)

  const palabrasSignificativas = palabras
    .filter(word => !stopWords.includes(normalize(word)))

  let codigo = palabrasSignificativas
    .map(word => word.charAt(0).toUpperCase())
    .join('')

  if (codigo.length < 3) {
    codigo = palabras
      .map(word => word.charAt(0).toUpperCase())
      .join('')
  }

  return codigo.substring(0, 3).padEnd(3, 'X')
}

// Función para generar código de objeto (copia de la implementación)
function generarCodigoObjeto(tipoObjeto) {
  const normalize = (str) =>
    str.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toUpperCase()

  const normalizado = normalize(tipoObjeto)

  const mapeoTipos = {
    'ORFEBRERIA': 'ORF',
    'PINTURA': 'PIN',
    'ESCULTURA': 'ESC',
    'TALLA': 'TAL',
    'ORNAMENTOS': 'ORN',
    'TELAS': 'TEL',
    'MOBILIARIO': 'MOB',
    'DOCUMENTOS': 'DOC',
    'OTROS': 'OTR'
  }

  if (mapeoTipos[normalizado]) {
    return mapeoTipos[normalizado]
  }

  return normalizado.substring(0, 3).padEnd(3, 'X')
}

// Función para simular generación completa de número de inventario
function simularNumeroInventario(parishName, tipoObjeto, numeroSecuencial) {
  const parishCode = generarCodigoParroquia(parishName)
  const year = new Date().getFullYear()
  const objectCode = generarCodigoObjeto(tipoObjeto)
  const sequentialNumber = String(numeroSecuencial).padStart(4, '0')

  return `${parishCode}-${year}-${objectCode}-${sequentialNumber}`
}

// ==================== PRUEBAS ====================

console.log('='.repeat(70))
console.log('PRUEBAS DE GENERACIÓN DE NÚMEROS DE INVENTARIO')
console.log('='.repeat(70))
console.log()

// Pruebas de códigos de parroquia
console.log('📍 PRUEBAS DE CÓDIGOS DE PARROQUIA:')
console.log('-'.repeat(70))

const testParroquias = [
  'Santa María la Mayor',
  'Parroquia de Galera',
  'San José',
  'Nuestra Señora de la Asunción',
  'Santiago Apóstol',
  'Santa Ana',
  'Inmaculada Concepción',
  'San Pedro y San Pablo',
  'Cristo Rey',
  'Virgen del Carmen'
]

testParroquias.forEach(nombre => {
  const codigo = generarCodigoParroquia(nombre)
  console.log(`  ${nombre.padEnd(40)} → ${codigo}`)
})

console.log()
console.log('🎨 PRUEBAS DE CÓDIGOS DE TIPO DE OBJETO:')
console.log('-'.repeat(70))

const testObjetos = [
  'Orfebrería',
  'Pintura',
  'Escultura',
  'Talla',
  'Ornamentos',
  'Telas',
  'Mobiliario',
  'Documentos',
  'Otros',
  'Retablo',
  'Cáliz',
  'Custodia'
]

testObjetos.forEach(tipo => {
  const codigo = generarCodigoObjeto(tipo)
  console.log(`  ${tipo.padEnd(40)} → ${codigo}`)
})

console.log()
console.log('🔢 PRUEBAS DE NÚMEROS COMPLETOS DE INVENTARIO:')
console.log('-'.repeat(70))

const testCasos = [
  { parroquia: 'Santa María la Mayor', tipo: 'Orfebrería', numero: 25 },
  { parroquia: 'Santa María la Mayor', tipo: 'Pintura', numero: 26 },
  { parroquia: 'Parroquia de Galera', tipo: 'Orfebrería', numero: 45 },
  { parroquia: 'Parroquia de Galera', tipo: 'Escultura', numero: 46 },
  { parroquia: 'San José', tipo: 'Talla', numero: 1 },
  { parroquia: 'Nuestra Señora de la Asunción', tipo: 'Ornamentos', numero: 100 },
  { parroquia: 'Santiago Apóstol', tipo: 'Documentos', numero: 15 }
]

testCasos.forEach(({ parroquia, tipo, numero }) => {
  const numeroInventario = simularNumeroInventario(parroquia, tipo, numero)
  console.log(`  ${parroquia} (${tipo}, #${numero})`)
  console.log(`    → ${numeroInventario}`)
  console.log()
})

console.log('='.repeat(70))
console.log('EJEMPLOS DE USO REAL:')
console.log('='.repeat(70))
console.log()

console.log('Ejemplo 1: Primera pieza de orfebrería en Santa María la Mayor')
console.log('  Resultado: ' + simularNumeroInventario('Santa María la Mayor', 'Orfebrería', 1))
console.log()

console.log('Ejemplo 2: Item #45 de pintura en Galera')
console.log('  Resultado: ' + simularNumeroInventario('Parroquia de Galera', 'Pintura', 45))
console.log()

console.log('Ejemplo 3: Item #100 de escultura en Santiago Apóstol')
console.log('  Resultado: ' + simularNumeroInventario('Santiago Apóstol', 'Escultura', 100))
console.log()

console.log('='.repeat(70))
console.log('✅ PRUEBAS COMPLETADAS')
console.log('='.repeat(70))
