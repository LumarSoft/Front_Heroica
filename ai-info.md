# Integración de IA — Heroica

Documentación técnica para el equipo de desarrollo.

---

## Qué se implementó

Un botón **"Mejorar con IA"** en el formulario de creación y edición de tareas (Nueva Tarea / Editar Tarea).

El flujo es simple: el usuario escribe la descripción como le salga — con errores, incompleta, informal — y al hacer click la IA la reescribe de forma clara y accionable para el equipo de desarrollo. El usuario puede aceptarla o revertir a la versión original.

---

## Arquitectura

```
[TareaDialog — cliente]
        ↓  POST /api/ai/mejorar-descripcion  { descripcion, titulo, tipo }
[Next.js API Route — servidor]
        ↓  generateText()
[Anthropic Claude Haiku — modelo]
        ↓  { descripcion: "texto mejorado" }
[TareaDialog — actualiza textarea]
```

### Por qué un API route de Next.js y no Api_Heroica

La llamada a la IA **no puede hacerse desde el browser** porque expondría la API key. Necesita un intermediario server-side. Hay dos opciones:

| Opción | Pros | Contras |
|--------|------|---------|
| **Next.js API route** ✅ | Sin cambios en el backend, key en el mismo entorno Vercel, en producción usa autenticación OIDC automática | — |
| Api_Heroica | Todo en un lugar | Habría que instalar `ai` en el backend, agregar endpoint, gestionar otra variable de entorno, desplegar el backend |

La lógica de "mejorar texto para el UI" es una responsabilidad del frontend, no del dominio de negocio. Por eso vive en Next.js.

---

## Archivos modificados / creados

```
app/
  api/
    ai/
      mejorar-descripcion/
        route.ts          ← API route nueva (servidor)
  tareas/
    page.tsx              ← TareaDialog: botón + lógica de mejora
.env                      ← Variable ANTHROPIC_API_KEY
package.json              ← Dependencias: ai, @ai-sdk/anthropic
```

---

## Variables de entorno

```env
# .env
ANTHROPIC_API_KEY=sk-ant-api03-...
```

Obtener la key en: https://console.anthropic.com/settings/keys

**Importante:** Esta variable es server-side (sin prefijo `NEXT_PUBLIC_`). Nunca llega al browser.

### Alternativa para producción en Vercel (recomendada)

En vez de gestionar la key manualmente, Vercel soporta autenticación OIDC con su AI Gateway — el token se renueva solo sin intervención:

```bash
vercel link
vercel env pull .env.local
```

Esto escribe un `VERCEL_OIDC_TOKEN` automáticamente. Para usarlo habría que cambiar el modelo en `route.ts` a `"openai/gpt-5.4-mini"` (string plano sin provider wrapper) y remover el import de `@ai-sdk/anthropic`.

---

## Modelo utilizado

**Claude Haiku 4.5** (`claude-haiku-4-5`) de Anthropic.

Se eligió porque:
- Es el modelo más rápido y barato de Anthropic
- Para reescribir texto corto no se necesita un modelo más potente
- Respuesta en ~1-2 segundos

Costo aproximado: ~$0.001 por reescritura. Con $4 USD de créditos hay para miles de usos.

---

## Cómo funciona el prompt

El route usa dos capas de instrucciones:

**`system`** — Define el rol, tono, formato y ejemplos concretos (few-shot prompting):
- Tono: español rioplatense, informal-profesional, como si lo escribiera un dev
- Formato: texto plano, 2-4 oraciones, sin markdown
- Estructura implícita: contexto → problema → resultado esperado
- 3 ejemplos entrada/salida para que el modelo aprenda el estilo deseado

**`prompt`** — Los datos de la tarea específica:
```
Tipo: Mejora de funcionalidad existente
Título: Token persistente
Descripción original: [lo que escribió el usuario]
```

El tipo de tarea (`bug`, `mejora`, `implementacion`, `otro`) se traduce a su label legible antes de enviarlo al modelo.

---

## UX en el formulario

- El botón **"Mejorar con IA"** está deshabilitado si la descripción está vacía
- Mientras procesa muestra un spinner y el texto "Mejorando..."
- El textarea se deshabilita durante la llamada para evitar ediciones simultáneas
- Al recibir la respuesta, el textarea se actualiza con el texto mejorado
- Aparece un link **"Revertir"** (abajo a la derecha) para volver al texto original
- Si el usuario edita manualmente después de mejorar, "Revertir" desaparece

---

## Posibles errores y cómo debuggearlos

### `500 — No se pudo procesar la solicitud`

Ver los logs del servidor (terminal con `pnpm dev`). Los errores se loguean como `[AI] Error al mejorar descripción:`.

**Causas más comunes:**

| Error en log | Causa | Solución |
|---|---|---|
| `authentication_error` / `401` | `ANTHROPIC_API_KEY` no está seteada o es inválida | Verificar `.env` y reiniciar el servidor |
| `credit_balance_too_low` / `402` | Sin créditos en Anthropic | Recargar en console.anthropic.com |
| `rate_limit_error` / `429` | Demasiadas requests por minuto | Esperar y reintentar (poco probable con uso normal) |
| `overloaded_error` / `529` | Anthropic sobrecargado | Reintentar en unos minutos |
| `GatewayInternalServerError` con mención a tarjeta | Se está usando el Vercel AI Gateway sin créditos | Usar `ANTHROPIC_API_KEY` directa (ver sección Variables) |

### `400 — La descripción no puede estar vacía`

El botón ya está deshabilitado si el textarea está vacío, pero si se llama al endpoint directamente sin el campo `descripcion` devuelve este error. Es el comportamiento esperado.

### El modelo devuelve texto con formato raro (asteriscos, listas)

El system prompt prohíbe markdown explícitamente. Si aparece igual, probablemente sea un cambio de comportamiento del modelo. Reforzar la instrucción en `route.ts`:

```ts
// Agregar al system prompt:
"CRÍTICO: No uses nunca asteriscos, guiones como lista, ni ningún carácter de markdown."
```

### La mejora no respeta el idioma o suena formal

El few-shot prompting (los ejemplos en el system) es lo que más influye en el tono. Si el equipo quiere ajustar el estilo, lo más efectivo es modificar los ejemplos de transformación en `route.ts` con casos reales propios del proyecto.

---

## Cómo agregar IA a otras partes del sistema

El patrón está establecido y es replicable:

1. Crear un nuevo route en `app/api/ai/[nombre-feature]/route.ts`
2. Importar `generateText` de `ai` y el provider que corresponda
3. Llamar al endpoint desde el componente con `fetch`

El mismo sistema se puede extender para, por ejemplo:
- Sugerir el tipo y prioridad de una tarea basándose en el título
- Generar un resumen automático de los comentarios de una tarea
- Mejorar los comentarios en el chat de una tarea

---

## Dependencias instaladas

```json
"ai": "^6.0.168",
"@ai-sdk/anthropic": "^3.0.71"
```

Instaladas con `pnpm add ai @ai-sdk/anthropic`.

El paquete `ai` es el Vercel AI SDK — provee `generateText`, `streamText` y otras utilidades. El paquete `@ai-sdk/anthropic` es el adapter para conectar con la API de Anthropic. Si en el futuro se quiere cambiar de proveedor (Google, OpenAI, etc.) se cambia solo el import del adapter y el nombre del modelo.
