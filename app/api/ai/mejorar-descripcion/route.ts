import { generateText } from 'ai'
import { anthropic } from '@ai-sdk/anthropic'
import { NextRequest, NextResponse } from 'next/server'

export const runtime = 'nodejs'

const TIPO_LABEL: Record<string, string> = {
  bug: 'Bug / Error',
  mejora: 'Mejora de funcionalidad existente',
  implementacion: 'Nueva implementación / feature',
  otro: 'Otro',
}

export async function POST(req: NextRequest) {
  try {
    const { descripcion, titulo, tipo } = await req.json()

    if (!descripcion?.trim()) {
      return NextResponse.json(
        { error: 'La descripción no puede estar vacía' },
        { status: 400 },
      )
    }

    const { text } = await generateText({
      model: anthropic('claude-haiku-4-5'),
      system: `Sos parte de un equipo de desarrollo de software argentino (Lumarsoft). Tu único trabajo es reescribir descripciones de tareas internas para que sean claras y accionables.

TONO: Directo, informal-profesional, como si lo escribiera un dev del equipo. Sin lenguaje burocrático ni frases de documentación formal ("se requiere", "el comportamiento esperado es que", "se procederá a").

FORMATO:
- Texto plano, sin markdown, sin títulos, sin listas con guiones
- 2 a 4 oraciones cortas como máximo
- Estructura implícita: contexto → problema o pedido → resultado esperado
- Si hay pasos para reproducir un bug, conservalos en el mismo orden

EJEMPLOS DE TRANSFORMACIÓN:

Entrada (bug): "el boton de guardar a veces no hace nada cuando apreto y hay que apretar varias veces"
Salida: "El botón Guardar no responde al primer click en algunos casos y hay que clickearlo varias veces para que funcione. Pasa principalmente en el formulario de movimientos. Hay que revisar si hay algún handler que se está bloqueando o un estado que no se limpia bien."

Entrada (mejora): "que el sistema recuerde al usuario logueado y no pida el codigo cada vez que entra"
Salida: "Hoy el sistema pide el código 2FA en cada entrada aunque la sesión sea válida. Hay que persistir el token de autenticación para que el usuario no tenga que re-autenticarse mientras la sesión no expire."

Entrada (implementacion): "necesitamos un reporte que muestre las ventas del mes comparadas con el mes anterior"
Salida: "Agregar un reporte mensual que compare las ventas del mes actual contra el anterior. Tiene que mostrar el delta en pesos y porcentaje. Se usaría desde la sección Reportes de cada sucursal."

Devolvé solo la descripción reescrita, sin prefijos ni explicaciones.`,
      prompt: `Tipo: ${TIPO_LABEL[tipo] ?? tipo}
Título: ${titulo}
Descripción original: ${descripcion.trim()}`,
    })

    return NextResponse.json({ descripcion: text.trim() })
  } catch (error) {
    console.error('[AI] Error al mejorar descripción:', error)
    return NextResponse.json(
      { error: 'No se pudo procesar la solicitud. Verificá tu API key de AI Gateway.' },
      { status: 500 },
    )
  }
}
