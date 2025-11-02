import { describe, it, expect } from 'vitest'
import {
  CatalogacionIASchema,
  CatalogacionCompletaSchema,
  FiltrosCatalogacionSchema,
  CategoriaObjetoEnum,
  EstadoConservacionEnum,
  StatusEnum,
} from '@/schemas/catalogacion.schema'

// Note: CrearCatalogacionSchema y ActualizarCatalogacionSchema están disponibles
// pero no se usan en estos tests. Se pueden añadir tests específicos en el futuro.

describe('Catalogacion Schemas', () => {
  describe('CatalogacionIASchema', () => {
    it('debe validar una catalogación IA válida', () => {
      const validData = {
        tipo_objeto: 'Crucifijo',
        categoria: 'escultura',
        descripcion_breve: 'Crucifijo de madera tallada del siglo XVII',
        descripcion_detallada:
          'Crucifijo de madera tallada policromada, representando a Cristo en la cruz con expresión de dolor. Notable trabajo de talla en los detalles anatómicos.',
        materiales: ['madera', 'policromía'],
        tecnicas: ['talla', 'policromía'],
        estilo_artistico: 'Barroco',
        datacion_aproximada: 'Siglo XVII',
        siglos_estimados: 'XVII',
        iconografia: 'Cristo Crucificado',
        estado_conservacion: 'Bueno',
        deterioros_visibles: ['pérdida de policromía', 'grietas'],
        dimensiones_estimadas: '45 x 30 x 10 cm',
        valor_artistico: 'Alto valor artístico e histórico',
        observaciones: 'Pieza de gran interés para la colección parroquial',
        confianza_analisis: 'alta',
      }

      const result = CatalogacionIASchema.safeParse(validData)
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.tipo_objeto).toBe('Crucifijo')
        expect(result.data.categoria).toBe('escultura')
      }
    })

    it('debe rechazar una catalogación con tipo_objeto vacío', () => {
      const invalidData = {
        tipo_objeto: '',
        categoria: 'pintura',
        // ... otros campos
      }

      const result = CatalogacionIASchema.safeParse(invalidData)
      expect(result.success).toBe(false)
    })

    it('debe rechazar una categoría inválida', () => {
      const invalidData = {
        tipo_objeto: 'Objeto',
        categoria: 'categoria_invalida',
        descripcion_breve: 'Descripción válida de al menos 10 caracteres',
        descripcion_detallada:
          'Descripción detallada válida con al menos veinte caracteres completos',
        materiales: ['material'],
        tecnicas: ['tecnica'],
        estilo_artistico: 'Estilo',
        datacion_aproximada: 'Siglo XX',
        siglos_estimados: 'XX',
        iconografia: 'Iconografía',
        estado_conservacion: 'Bueno',
        deterioros_visibles: [],
        dimensiones_estimadas: '10x10x10',
        valor_artistico: 'Alto',
        observaciones: 'Observaciones',
        confianza_analisis: 'media',
      }

      const result = CatalogacionIASchema.safeParse(invalidData)
      expect(result.success).toBe(false)
    })

    it('debe validar materiales y técnicas como arrays', () => {
      const validData = {
        tipo_objeto: 'Retablo',
        categoria: 'retablo',
        descripcion_breve: 'Retablo barroco del siglo XVIII',
        descripcion_detallada:
          'Retablo barroco de grandes dimensiones con múltiples escenas religiosas',
        materiales: ['madera', 'pan de oro', 'policromía'],
        tecnicas: ['talla', 'dorado', 'policromía'],
        estilo_artistico: 'Barroco',
        datacion_aproximada: 'Siglo XVIII',
        siglos_estimados: 'XVIII',
        iconografia: 'Escenas de la vida de Cristo',
        estado_conservacion: 'Regular',
        deterioros_visibles: ['pérdida de dorado', 'xilófagos'],
        dimensiones_estimadas: '5 x 3 x 1 m',
        valor_artistico: 'Muy alto',
        observaciones: 'Requiere restauración urgente',
        confianza_analisis: 'alta',
      }

      const result = CatalogacionIASchema.safeParse(validData)
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.materiales).toHaveLength(3)
        expect(result.data.tecnicas).toHaveLength(3)
      }
    })

    it('debe validar confianza_analisis con valores específicos', () => {
      const testValues = ['alta', 'media', 'baja']

      testValues.forEach((value) => {
        const data = {
          tipo_objeto: 'Objeto',
          categoria: 'pintura',
          descripcion_breve: 'Descripción válida de al menos 10 caracteres',
          descripcion_detallada:
            'Descripción detallada válida con al menos veinte caracteres completos',
          materiales: ['oleo'],
          tecnicas: ['pintura'],
          estilo_artistico: 'Barroco',
          datacion_aproximada: 'Siglo XVII',
          siglos_estimados: 'XVII',
          iconografia: 'Virgen María',
          estado_conservacion: 'Bueno',
          deterioros_visibles: [],
          dimensiones_estimadas: '100x80 cm',
          valor_artistico: 'Alto',
          observaciones: 'Ninguna',
          confianza_analisis: value,
        }

        const result = CatalogacionIASchema.safeParse(data)
        expect(result.success).toBe(true)
      })

      // Test invalid value
      const invalidData = {
        tipo_objeto: 'Objeto',
        categoria: 'pintura',
        descripcion_breve: 'Descripción válida de al menos 10 caracteres',
        descripcion_detallada:
          'Descripción detallada válida con al menos veinte caracteres completos',
        materiales: ['oleo'],
        tecnicas: ['pintura'],
        estilo_artistico: 'Barroco',
        datacion_aproximada: 'Siglo XVII',
        siglos_estimados: 'XVII',
        iconografia: 'Virgen María',
        estado_conservacion: 'Bueno',
        deterioros_visibles: [],
        dimensiones_estimadas: '100x80 cm',
        valor_artistico: 'Alto',
        observaciones: 'Ninguna',
        confianza_analisis: 'invalida',
      }

      const result = CatalogacionIASchema.safeParse(invalidData)
      expect(result.success).toBe(false)
    })
  })

  describe('CatalogacionCompletaSchema', () => {
    it('debe validar una catalogación completa con user_id', () => {
      const validData = {
        user_id: '123e4567-e89b-12d3-a456-426614174000',
        parish_id: '123e4567-e89b-12d3-a456-426614174001',
        tipo_objeto: 'Cáliz',
        categoria: 'orfebreria',
        descripcion_breve: 'Cáliz de plata del siglo XVIII',
        descripcion_detallada:
          'Cáliz de plata repujada con escenas religiosas en el pie y el nudo',
        materiales: ['plata'],
        tecnicas: ['repujado', 'cincelado'],
        estilo_artistico: 'Rococó',
        datacion_aproximada: 'Siglo XVIII',
        siglos_estimados: 'XVIII',
        iconografia: 'Escenas de la Pasión',
        estado_conservacion: 'Excelente',
        deterioros_visibles: [],
        dimensiones_estimadas: '25 cm de altura',
        valor_artistico: 'Muy alto',
        observaciones: 'Pieza excepcional',
        confianza_analisis: 'alta',
        inventory_number: 'ORF-2024-001',
        image_url: 'https://example.com/image.jpg',
      }

      const result = CatalogacionCompletaSchema.safeParse(validData)
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.user_id).toBe('123e4567-e89b-12d3-a456-426614174000')
        expect(result.data.inventory_number).toBe('ORF-2024-001')
      }
    })

    it('debe rechazar un user_id que no sea UUID', () => {
      const invalidData = {
        user_id: 'not-a-uuid',
        tipo_objeto: 'Objeto',
        categoria: 'pintura',
        // ... otros campos
      }

      const result = CatalogacionCompletaSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
    })
  })

  describe('FiltrosCatalogacionSchema', () => {
    it('debe validar filtros con valores por defecto', () => {
      const data = {}

      const result = FiltrosCatalogacionSchema.safeParse(data)
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.limit).toBe(20)
        expect(result.data.offset).toBe(0)
        expect(result.data.order_by).toBe('created_at')
        expect(result.data.order_direction).toBe('desc')
      }
    })

    it('debe validar filtros personalizados', () => {
      const data = {
        parish_id: '123e4567-e89b-12d3-a456-426614174000',
        categoria: 'pintura',
        limit: 50,
        offset: 10,
        order_by: 'inventory_number',
        order_direction: 'asc',
      }

      const result = FiltrosCatalogacionSchema.safeParse(data)
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.limit).toBe(50)
        expect(result.data.offset).toBe(10)
        expect(result.data.order_by).toBe('inventory_number')
        expect(result.data.order_direction).toBe('asc')
      }
    })

    it('debe rechazar limit fuera de rango', () => {
      const data = {
        limit: 200, // Máximo es 100
      }

      const result = FiltrosCatalogacionSchema.safeParse(data)
      expect(result.success).toBe(false)
    })
  })

  describe('Enums', () => {
    it('debe validar CategoriaObjetoEnum', () => {
      const validCategories = [
        'pintura',
        'escultura',
        'orfebreria',
        'textil',
        'documento',
        'libro',
        'mobiliario',
        'instrumento_musical',
        'retablo',
        'imagineria',
        'vitral',
        'ceramica',
        'metalurgia',
        'otro',
      ]

      validCategories.forEach((cat) => {
        const result = CategoriaObjetoEnum.safeParse(cat)
        expect(result.success).toBe(true)
      })

      const invalid = CategoriaObjetoEnum.safeParse('invalida')
      expect(invalid.success).toBe(false)
    })

    it('debe validar EstadoConservacionEnum', () => {
      const validEstados = [
        'excelente',
        'bueno',
        'regular',
        'malo',
        'critico',
        'restaurado',
        'en_restauracion',
      ]

      validEstados.forEach((estado) => {
        const result = EstadoConservacionEnum.safeParse(estado)
        expect(result.success).toBe(true)
      })
    })

    it('debe validar StatusEnum', () => {
      const validStatus = ['draft', 'pending', 'approved', 'published', 'archived']

      validStatus.forEach((status) => {
        const result = StatusEnum.safeParse(status)
        expect(result.success).toBe(true)
      })
    })
  })
})
