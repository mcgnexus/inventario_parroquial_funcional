'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { useToast } from '@/hooks/use-toast'
import { getSupabaseBrowser } from '@/lib/auth'
import {
  Church,
  Sparkles,
  Calendar,
  FileText,
  Image,
  Users,
  Shield,
  Mail,
  Linkedin,
  CheckCircle2
} from 'lucide-react'

export default function AcercaDePage() {
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [formData, setFormData] = useState({
    email: '',
    nombre: '',
    parroquia: '',
    diocesis: '',
    cargo: '',
    intereses: '',
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.email || !formData.nombre) {
      toast({
        title: 'Campos requeridos',
        description: 'Por favor, completa al menos tu nombre y email',
        variant: 'destructive',
      })
      return
    }

    setLoading(true)

    try {
      const supabase = getSupabaseBrowser()
      if (!supabase) throw new Error('No se pudo conectar con la base de datos')

      const { error } = await supabase
        .from('waitlist')
        .insert([
          {
            email: formData.email.trim().toLowerCase(),
            nombre: formData.nombre.trim(),
            parroquia: formData.parroquia.trim() || null,
            diocesis: formData.diocesis.trim() || null,
            cargo: formData.cargo.trim() || null,
            intereses: formData.intereses.trim() || null,
          },
        ])

      if (error) {
        // Si el email ya existe (unique constraint)
        if (error.code === '23505') {
          toast({
            title: 'Ya estás en la lista',
            description: 'Este email ya está registrado en la lista de espera',
          })
          setSubmitted(true)
          return
        }
        throw error
      }

      toast({
        title: '¡Gracias por tu interés!',
        description: 'Te notificaremos cuando Fides Sacristía esté disponible',
      })

      setSubmitted(true)
      setFormData({
        email: '',
        nombre: '',
        parroquia: '',
        diocesis: '',
        cargo: '',
        intereses: '',
      })
    } catch (error) {
      console.error('Error al registrar en lista de espera:', error)
      toast({
        title: 'Error',
        description: 'No se pudo registrar tu solicitud. Intenta más tarde.',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-12 max-w-5xl">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300 px-4 py-2 rounded-full text-sm font-medium mb-4">
            <Church className="h-4 w-4" />
            Sistema gratuito para la Diócesis de Guadix
          </div>
          <h1 className="text-4xl font-bold mb-4">Inventario Parroquial</h1>
          <p className="text-xl text-muted-foreground">
            Gestión digital del patrimonio diocesano
          </p>
        </div>

        {/* Sobre esta aplicación */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Sobre esta aplicación</CardTitle>
            <CardDescription>
              Sistema de gestión de inventarios desarrollado específicamente para las necesidades
              de las parroquias de la Diócesis de Guadix
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h3 className="font-semibold mb-2">Características principales</h3>
              <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground ml-2">
                <li>Catálogo digital de objetos sagrados y patrimonio artístico</li>
                <li>Gestión por parroquias con acceso controlado</li>
                <li>Registro fotográfico y documentación detallada</li>
                <li>Sistema de aprobación para nuevos usuarios</li>
                <li>Acceso seguro y cumplimiento de protección de datos</li>
              </ul>
            </div>
            <div className="bg-muted/50 rounded-lg p-4 text-sm">
              <p className="font-medium mb-1">💙 Aplicación gratuita</p>
              <p className="text-muted-foreground">
                Esta herramienta es de uso libre para todas las parroquias de la diócesis. Si deseas colaborar con
                su mantenimiento, puedes hacerlo de forma completamente voluntaria.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Próximo proyecto: Fides Sacristía */}
        <Card className="mb-8 border-2 border-blue-200 dark:border-blue-900">
          <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950 dark:to-indigo-950">
            <div className="flex items-center gap-2 mb-2">
              <Sparkles className="h-5 w-5 text-blue-600" />
              <span className="text-sm font-medium text-blue-600 dark:text-blue-400">
                PRÓXIMAMENTE
              </span>
            </div>
            <CardTitle className="text-2xl">Fides Sacristía</CardTitle>
            <CardDescription className="text-base">
              Suite integral con IA para la gestión completa de parroquias y diócesis
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="space-y-6">
              {/* Descripción */}
              <p className="text-muted-foreground">
                <span className="font-semibold text-foreground">Fides Sacristía</span> es una plataforma completa
                que integra inteligencia artificial para automatizar y simplificar las tareas administrativas,
                pastorales y de gestión del patrimonio en parroquias y diócesis.
              </p>

              {/* Funcionalidades clave */}
              <div>
                <h3 className="font-semibold mb-3 flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-blue-600" />
                  Funcionalidades clave
                </h3>
                <div className="grid sm:grid-cols-2 gap-3">
                  <div className="flex gap-3 bg-muted/50 rounded-lg p-3">
                    <Image className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-medium text-sm">Inventario inteligente</p>
                      <p className="text-xs text-muted-foreground">
                        Clasificación automática por foto y OCR, con fichas técnicas y alertas de mantenimiento
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-3 bg-muted/50 rounded-lg p-3">
                    <FileText className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-medium text-sm">Generador de documentos con IA</p>
                      <p className="text-xs text-muted-foreground">
                        Homilías, avisos, hojas parroquiales, amonestaciones y carteles personalizados
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-3 bg-muted/50 rounded-lg p-3">
                    <Calendar className="h-5 w-5 text-purple-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-medium text-sm">Calendario litúrgico automático</p>
                      <p className="text-xs text-muted-foreground">
                        Planificación anual, recordatorios y coordinación de equipos
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-3 bg-muted/50 rounded-lg p-3">
                    <Users className="h-5 w-5 text-orange-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-medium text-sm">Gestión de expedientes</p>
                      <p className="text-xs text-muted-foreground">
                        Bautismos, matrimonios, licencias canónicas con firma digital y versiones
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-3 bg-muted/50 rounded-lg p-3">
                    <Church className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-medium text-sm">Comunicación parroquial</p>
                      <p className="text-xs text-muted-foreground">
                        Carteles, redes sociales, avisos y boletines atractivos en minutos
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-3 bg-muted/50 rounded-lg p-3">
                    <Shield className="h-5 w-5 text-indigo-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-medium text-sm">Seguridad y cumplimiento</p>
                      <p className="text-xs text-muted-foreground">
                        RGPD, copias de seguridad automáticas y control de accesos
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Problemas que resuelve */}
              <div>
                <h3 className="font-semibold mb-3">¿Qué problemas resuelve?</h3>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li className="flex gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-600 flex-shrink-0 mt-0.5" />
                    <span>
                      <strong>Falta de tiempo</strong> para preparar homilías, avisos y documentación repetitiva
                    </span>
                  </li>
                  <li className="flex gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-600 flex-shrink-0 mt-0.5" />
                    <span>
                      <strong>Inventarios dispersos</strong> del patrimonio sin fotos, fichas técnicas ni trazabilidad
                    </span>
                  </li>
                  <li className="flex gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-600 flex-shrink-0 mt-0.5" />
                    <span>
                      <strong>Desorden documental</strong> con riesgo de pérdida o errores en expedientes canónicos
                    </span>
                  </li>
                  <li className="flex gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-600 flex-shrink-0 mt-0.5" />
                    <span>
                      <strong>Comunicación parroquial lenta</strong> y poco atractiva (carteles, hojas, redes)
                    </span>
                  </li>
                  <li className="flex gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-600 flex-shrink-0 mt-0.5" />
                    <span>
                      <strong>Dificultad para planificar</strong> el año litúrgico y coordinar equipos pastorales
                    </span>
                  </li>
                </ul>
              </div>

              {/* Para quién es */}
              <div className="bg-blue-50 dark:bg-blue-950 rounded-lg p-4">
                <h3 className="font-semibold mb-2 text-sm">Usuarios ideales</h3>
                <p className="text-sm text-muted-foreground">
                  Párrocos, sacristanes, secretaría parroquial, equipos de liturgia,
                  responsables de patrimonio diocesano y cancillerías.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Formulario de lista de espera */}
        <Card className="mb-8 border-2 border-green-200 dark:border-green-900">
          <CardHeader className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950 dark:to-emerald-950">
            <CardTitle>Lista de espera para Fides Sacristía</CardTitle>
            <CardDescription>
              Sé de los primeros en probar la plataforma completa. Te notificaremos cuando esté disponible
              y podrás acceder a condiciones especiales de lanzamiento.
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            {submitted ? (
              <div className="text-center py-8">
                <CheckCircle2 className="h-16 w-16 text-green-600 mx-auto mb-4" />
                <h3 className="text-xl font-semibold mb-2">¡Gracias por tu interés!</h3>
                <p className="text-muted-foreground">
                  Te contactaremos cuando Fides Sacristía esté lista para usar.
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="nombre">
                      Nombre completo <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="nombre"
                      type="text"
                      placeholder="P. Juan Pérez"
                      value={formData.nombre}
                      onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email">
                      Email <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="parroco@diocesis.org"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      required
                    />
                  </div>
                </div>

                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="parroquia">Parroquia</Label>
                    <Input
                      id="parroquia"
                      type="text"
                      placeholder="San Pedro Apóstol"
                      value={formData.parroquia}
                      onChange={(e) => setFormData({ ...formData, parroquia: e.target.value })}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="diocesis">Diócesis</Label>
                    <Input
                      id="diocesis"
                      type="text"
                      placeholder="Guadix"
                      value={formData.diocesis}
                      onChange={(e) => setFormData({ ...formData, diocesis: e.target.value })}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="cargo">Cargo o función</Label>
                  <Input
                    id="cargo"
                    type="text"
                    placeholder="Párroco, Sacristán, Secretaria..."
                    value={formData.cargo}
                    onChange={(e) => setFormData({ ...formData, cargo: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="intereses">
                    ¿Qué funcionalidades te interesan más? (opcional)
                  </Label>
                  <Textarea
                    id="intereses"
                    placeholder="Generador de homilías, calendario litúrgico, gestión de expedientes..."
                    value={formData.intereses}
                    onChange={(e) => setFormData({ ...formData, intereses: e.target.value })}
                    rows={3}
                  />
                </div>

                <div className="bg-muted/50 rounded-lg p-3 text-xs text-muted-foreground">
                  Al registrarte, aceptas que guardemos tu información para notificarte sobre Fides Sacristía.
                  No compartiremos tus datos con terceros.
                </div>

                <Button type="submit" className="w-full" size="lg" disabled={loading}>
                  {loading ? 'Registrando...' : 'Únete a la lista de espera'}
                </Button>
              </form>
            )}
          </CardContent>
        </Card>

        {/* Desarrollador */}
        <Card>
          <CardHeader>
            <CardTitle>Desarrollador</CardTitle>
            <CardDescription>
              Software personalizado para instituciones religiosas
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <p className="font-medium mb-1">Manuel Carrasco García</p>
                <p className="text-sm text-muted-foreground">
                  Ingeniero de software especializado en soluciones tecnológicas para parroquias y diócesis
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-3">
                <a
                  href="mailto:mcgnexus@gmail.com"
                  className="inline-flex items-center gap-2 text-sm hover:text-foreground transition-colors"
                >
                  <Mail className="h-4 w-4" />
                  mcgnexus@gmail.com
                </a>
                <a
                  href="https://www.linkedin.com/in/manuel-carrasco-garcia"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-sm hover:text-foreground transition-colors"
                >
                  <Linkedin className="h-4 w-4" />
                  LinkedIn
                </a>
              </div>

              <div className="bg-muted/50 rounded-lg p-4 text-sm">
                <p className="font-medium mb-2">Servicios disponibles</p>
                <ul className="space-y-1 text-muted-foreground ml-4 list-disc">
                  <li>Desarrollo de software personalizado para diócesis</li>
                  <li>Consultoría tecnológica pastoral</li>
                  <li>Formación en herramientas digitales para equipos parroquiales</li>
                  <li>Integración de sistemas existentes</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
