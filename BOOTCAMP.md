# Bootcamp Financiero — `/bootcamp`

Página de venta del Bootcamp Financiero del **sábado 14 de noviembre de 2026**, en Gold
Coast. El QR impreso que se reparte en el evento del 12 de septiembre apunta acá.

**Ruta canónica: `https://www.revoluciondeldinero.com/bootcamp`**

## Variables de entorno que hay que configurar en Vercel

Vercel → Project → Settings → Environment Variables. Las dos son nuevas; las demás ya
están puestas.

| Variable | Valor |
|---|---|
| `REACT_APP_STRIPE_PRICE_BOOTCAMP_INDIVIDUAL` | Price ID de **AUD 255,00** (anunciado $250) |
| `REACT_APP_STRIPE_PRICE_BOOTCAMP_PAREJA` | Price ID de **AUD 408,00** (anunciado $400) |

Ya configuradas y reutilizadas tal cual: `STRIPE_SECRET_KEY`,
`STRIPE_WEBHOOK_SECRET`, `SYSTEME_API_KEY`.

**Después de añadirlas hay que redesplegar**: el prefijo `REACT_APP_` se inyecta en el
bundle en tiempo de build, no se lee en caliente.

El prefijo `REACT_APP_` solo controla qué ve el navegador. Vercel expone la misma
variable a las funciones serverless, así que este par sirve para las dos partes y no hay
que configurar el mismo valor dos veces. **El servidor es la autoridad sobre el precio**:
el navegador manda `tier`, nunca un price ID, así que nadie puede pagar cinco centavos.

Si falta una de las dos, la página muestra un error en español, deshabilita el botón y no
intenta cobrar con ningún fallback.

## Flujo de compra

```
La persona elige individual ($250) o para dos ($400) y llena el formulario
   ↓
1. POST /api/bootcamp-lead
   → crea/actualiza el contacto en systeme.io con el tag `bootcamp-nov-2026`
   → fire-and-forget con keepalive; si falla, log con prefijo "bootcamp-lead:" y
     el checkout se abre IGUAL. Nunca se bloquea una venta por el CRM.
   ↓
2. Píxel de Meta → evento `Lead` (con email y teléfono en los parámetros)
   ↓
3. POST /api/create-bootcamp-checkout → Stripe Checkout Session
   metadata: { nombre, tel, tier, amigoNombre, amigoTel, oferta: 'bootcamp' }
   ↓
4. Píxel de Meta → evento `InitiateCheckout`
   ↓
5. Redirección a Stripe
   ↓
success_url → /bootcamp/gracias     cancel_url → /bootcamp
   ↓
6. Stripe llama a /api/stripe-webhook, que enruta por `metadata.oferta` y
   reconfirma el contacto con `bootcamp-nov-2026`. Nada más.
   ↓
7. /bootcamp/gracias dispara `Purchase` y muestra el link de Calendly
```

Los nombres de campo de la metadata son **exactamente** los que ya usa `/evento`
(`nombre`, `tel`, `tier`, `amigoNombre`, `amigoTel`), porque son los que se leen en el
dashboard de Stripe. `oferta` se añade para poder separar reportes.

Los eventos del píxel aparecen duplicados en las estadísticas porque la Conversions API
también está activa. Es esperado, no hay que arreglarlo.

## El tag de systeme.io

**`bootcamp-nov-2026`, y nada más.** No es `acceso-comunidad`: ese es del Círculo
Presencial ($1.000) y dispara el email con el acceso a Skool. El Bootcamp son $250 por un
día, sin comunidad. El tag vive en un solo sitio: `BOOTCAMP_TAG` en
`api/_lib/bootcampRegistration.js`.

## Archivos

**Nuevos**

| Archivo | Qué hace |
|---|---|
| `src/config/bootcamp.js` | Fechas, precios, `LINK_AGENDA`, price IDs. Fuente única. |
| `src/pages/Bootcamp.js` / `.css` | La página de venta. |
| `src/pages/BootcampGracias.js` | `/bootcamp/gracias`. Único sitio con el link de Calendly. |
| `src/pages/Terminos.js` | `/terminos`. Política de reembolso, enlazada solo desde el pie. |
| `api/bootcamp-lead.js` | Guarda el contacto en systeme.io antes del pago. |
| `api/create-bootcamp-checkout.js` | Crea la Stripe Checkout Session. |
| `api/_lib/bootcampRegistration.js` | Upsert del contacto + `bootcamp-nov-2026`. |

**Modificados** — `src/App.js` (rutas), `src/seoData.js`, `vercel.json`,
`public/sitemap.xml`, `middleware.js`, `.env.example`, `api/stripe-webhook.js` (una rama
por `metadata.oferta`) y los dos componentes compartidos:

- `src/components/TestimonialsSection.js` → props `eyebrow` y `heading`
- `src/components/AboutSection.js` → prop `closing`

En los dos casos el valor por defecto es **el texto original, idéntico**, así que la home
y `/evento` renderizan exactamente lo mismo. `/bootcamp` los sobreescribe: el cierre por
defecto de `AboutSection` está fechado ("el sábado 12, en Robina") y quedaría
desactualizado en una página que se vende hasta noviembre.

## Diseño

Calca el lenguaje visual de `src/pages/Evento.css`, no lo aproxima:

- **Hero de dos columnas** (`1.05fr / .95fr`) con el video `/videos/hero-bg.mp4` de fondo
  y el mismo degradado marfil encima. A la izquierda el copy; a la derecha la **tarjeta de
  compra oscura pegada** (`position: sticky`) con su resplandor esmeralda radial.
- **Meta-chips** de fecha / horario / lugar, más el chip de precio en esmeralda.
- **Banda dorada** con el bono de la sesión 1:1.
- **Foto con marco blanco de 5px** y etiqueta esmeralda superpuesta.
- **Punto dorado que pulsa** con la única urgencia real: la ventana de la sesión 1:1.
  Nunca un número de cupos, nunca un contador de segundos.
- **Bandas CTA a sangre** entre secciones (una en `--ink`, otra en `--emerald`).
- **"Qué te llevas"** con numerales dorados 01–06, como los *results* de `/evento`.
- **Los tres movimientos** con píldoras doradas y foto lateral pegada, con el mismo
  esqueleto que la agenda de `/evento` pero sin horas, sin bloques y sin módulos.
- **Entradas en claro/oscuro**, con la de dos personas en `--ink` y acentos dorados.
- **Trustband** en arena y **cierre esmeralda** con resplandor dorado radial.
- `AboutSection` y `TestimonialsSection` reutilizados, igual que en `/evento`.

`Bootcamp.css` **no** importa `Evento.css` y no declara ni un selector fuera de
`.bc-*` / `.page-bootcamp`: `Evento.css` usa clases globales sin prefijo (`.ann`,
`.field`, `.formcard`, `.tk`, `.final`…) y CRA importa el CSS de forma global, así que
compartir un nombre podría filtrar estilos a producción.

La tarjeta de compra es **una sola** en toda la página. Los botones de la sección de
entradas eligen la entrada y suben a esa tarjeta, así que hay un único formulario y un
único juego de refs. En móvil el hero se colapsa a una columna y aparece un botón que
baja a la tarjeta, para que haya CTA sin hacer scroll.

**`/evento` y su endpoint no se tocaron.** `git diff` sobre `src/pages/Evento.js`,
`src/pages/Evento.css`, `api/create-checkout-session.js`, `api/evento-lead.js`,
`api/_lib/eventoRegistration.js`, `api/_lib/systeme.js` y `api/_lib/antiSpam.js` sale
vacío.

## Decisiones de negocio que el código respeta

- **Ningún número de cupos** en ninguna parte. Ni aforo, ni "quedan X plazas".
- **Sin temario publicado.** El día se cuenta como tres movimientos: sin bloques, sin
  títulos de módulos, sin duraciones. La especificidad va en "Qué te llevas".
- **El almuerzo NO está incluido**, dicho explícitamente en la sección práctica, en las
  preguntas frecuentes, en `/terminos` y en la página de gracias.
- **La garantía de reembolso no es argumento de venta.** Vive solo en `/terminos`,
  enlazada desde el pie. Jonathan la anuncia desde el escenario.
- **El crédito al Círculo no aparece en ninguna parte.** Jonathan lo anuncia en persona el
  día del Bootcamp.
- **La sesión 1:1 nunca se llama "asesoría".** Va con su alcance escrito y su línea de lo
  que no es. Jonathan no tiene licencia AFSL y opera bajo su ABN personal.
- **El link de Calendly no está en la página de venta.** Quien no ha pagado no agenda.
- `/bootcamp/gracias` no menciona ni enlaza la comunidad ni Skool.

## Pendientes para Jonathan

1. Crear los dos precios en Stripe (AUD 255,00 y AUD 408,00) y poner sus price IDs en las
   dos variables de entorno. Redesplegar después.
2. Confirmar la ventana de la garantía redactada en `src/pages/Terminos.js` (por defecto:
   "hasta el final del día del Bootcamp") contra lo que anuncia desde el escenario.
3. Cambiar `CONTACTO` en `src/pages/Terminos.js` — no había ninguna dirección de contacto
   en el repositorio, así que el valor actual es un supuesto.
4. Confirmar que la hora de cierre anunciada (19:00) es la que quiere. Es la constante
   `HORARIO` en `src/config/bootcamp.js`.
5. Los QR los hace él por separado. Apuntan a `https://www.revoluciondeldinero.com/bootcamp`.
