# Project Map

Guia rapida del proyecto para la entrevista tecnica. La idea es saber donde esta cada cosa y que tocar si durante el pair programming piden extender una parte concreta.

## Comandos Rapidos

```bash
npm install
npm run db:deploy
npm run dev
npm run lint
npm run build
npm run test:acceptance
```

En remoto, despues de cambios de Prisma:

```bash
npm run db:deploy
npm run build
```

## Estructura General

```txt
src/app/          Rutas Next.js App Router, paginas y API routes.
src/components/   Componentes UI reutilizables y componentes de producto.
src/lib/          Logica de servidor: auth, billing, Stripe, documentos, errores.
src/messages/     Textos de UI centralizados para estar localization-ready.
prisma/           Schema de base de datos SQLite.
scripts/          Tests smoke y utilidades de Stripe.
public/           Assets publicos y uploads locales de imagenes.
```

## Root Files

| Fichero | Para que sirve |
| --- | --- |
| `package.json` | Scripts, dependencias Next/Prisma/TipTap/Stripe. |
| `next.config.ts` | Configuracion Next. |
| `tailwind.config.ts` | Tema Tailwind y tokens CSS. |
| `tsconfig.json` | TypeScript, alias `@/* -> src/*`. |
| `eslint.config.mjs` | Linting. |
| `.env.example` | Variables de entorno esperadas. No contiene secretos reales. |
| `README.md` | Setup, Stripe, Prisma, tradeoffs, decisiones tecnicas. |
| `WRITEUP.md` | Respuesta corta de la prueba: subscriber status, webhook fallback, seguridad. |
| `PROJECT_MAP.md` | Este mapa para orientarse en la entrevista. |

## Base de Datos

### `prisma/schema.prisma`

Modelos principales:

| Modelo | Uso |
| --- | --- |
| `User` | Email, password hash, session hash, Stripe customer/subscription ids. |
| `Subscription` | Estado local de billing: plan, status, current period, lifetime, eventos Stripe procesados. |
| `Document` | Documento del usuario: titulo y contenido TipTap JSON serializado. |
| `DocumentAsset` | Metadata de imagenes subidas al editor, ligada a usuario y documento. |

Notas:

- SQLite usa strings para estados/planes por simplicidad.
- `DocumentAsset` cae en cascada si se borra `User` o `Document`.
- Los uploads fisicos estan en `public/uploads/{userId}/{documentId}`.

## Rutas Publicas

| Fichero | Ruta | Uso |
| --- | --- | --- |
| `src/app/page.tsx` | `/` | Landing page: hero, features, pricing, FAQ, CTA. |
| `src/components/layout/site-header.tsx` | Header publico | Navegacion landing/login/register. |
| `src/components/pricing/pricing-cards.tsx` | Pricing cards | Renderiza monthly/annual/lifetime en landing y upgrade. |
| `public/landing/laptop-hero.png` | Asset landing | Imagen principal del hero. |

Textos de landing/precios: `src/messages/en.ts`.

## Autenticacion

| Fichero | Uso |
| --- | --- |
| `src/app/login/page.tsx` | Pagina login. |
| `src/app/register/page.tsx` | Pagina registro. |
| `src/components/auth/auth-form.tsx` | Formulario reutilizable login/register. |
| `src/lib/auth-actions.ts` | Server Actions de registro/login. |
| `src/lib/auth.ts` | Hash password, verificar password, crear/limpiar sesion, leer usuario actual. |
| `src/app/api/auth/logout/route.ts` | Logout via POST. |

Detalles importantes:

- Password hashing con `bcryptjs`.
- Cookie HttpOnly `rtext_session`.
- La DB guarda hash SHA-256 del token, no el token plano.
- `requireUser()` redirige a `/login`.
- `getAuthenticatedUserOrThrow()` se usa en APIs y lanza error 401.

## Layout Autenticado

| Fichero | Uso |
| --- | --- |
| `src/app/app/layout.tsx` | Layout para rutas `/app/*`, exige usuario. |
| `src/components/layout/app-header.tsx` | Header autenticado: estado plan, billing portal, upgrade, logout. |

## Billing y Stripe

### Configuracion Stripe

| Fichero | Uso |
| --- | --- |
| `src/lib/stripe.ts` | Cliente Stripe, planes, price ids, app URL. |
| `.env.example` | Variables `STRIPE_*`. |

### Checkout

| Fichero | Ruta | Uso |
| --- | --- | --- |
| `src/app/api/billing/checkout/route.ts` | `POST /api/billing/checkout` | Crea Customer si hace falta, crea Checkout Session y redirige a Stripe. |
| `src/app/upgrade/page.tsx` | `/upgrade` | Pagina para usuarios free o cambio de plan. |
| `src/app/billing/success/page.tsx` | `/billing/success` | Fallback server-side: valida Checkout Session si webhook va tarde. |
| `src/app/billing/cancel/page.tsx` | `/billing/cancel` | Checkout cancelado. |

### Webhooks y Reconciliacion

| Fichero | Uso |
| --- | --- |
| `src/app/api/stripe/webhook/route.ts` | Recibe webhooks Stripe y verifica firma. |
| `src/lib/stripe-sync.ts` | Aplica `checkout.session.completed`, `invoice.paid`, `invoice.payment_failed`, `customer.subscription.deleted`. |

Puntos clave:

- Webhooks idempotentes con `processedStripeEvents`.
- `syncCheckoutSession(sessionId, userId)` valida session ownership.
- `syncLatestCheckoutSessionForUser(userId, customerId)` recupera pagos si el webhook fallo o va tarde.
- No se da acceso solo por email.

### Customer Portal

| Fichero | Ruta | Uso |
| --- | --- | --- |
| `src/app/api/billing/portal/route.ts` | `POST /api/billing/portal` | Crea sesion de Stripe Customer Portal para gestionar billing. |

Si Stripe falla, redirige a dashboard con `billing=portal-error`.

## Estado de Suscripcion

| Fichero | Uso |
| --- | --- |
| `src/lib/billing.ts` | Helpers de plan/status/acceso: `hasPaidAccess`, `getSubscriptionState`, labels de plan/status/renovacion. |
| `src/app/app/dashboard/page.tsx` | Muestra resumen: Plan, Status, Renews. |

Regla principal:

- Lifetime: `lifetimeAccess = true` o `status = LIFETIME`.
- Recurring: `status = ACTIVE` y `currentPeriodEnd` no expirado.
- Si Stripe esta caido, usuarios activos siguen funcionando con el estado local.

## Dashboard y Documentos

| Fichero | Uso |
| --- | --- |
| `src/app/app/dashboard/page.tsx` | Lista documentos, resumen billing, CTA upgrade si free. |
| `src/components/dashboard/new-document-form.tsx` | Crear documento con nombre sugerido `DocumentN`. |
| `src/components/dashboard/document-row.tsx` | Fila de documento: abrir, renombrar, borrar. |
| `src/components/documents/document-title-editor.tsx` | Renombrado inline dentro de la pagina del editor. |
| `src/lib/document-actions.ts` | Server Actions create/rename/delete. |
| `src/lib/documents.ts` | Parse/serialize TipTap JSON, fechas, titulos. |

Autorizacion:

- Todas las mutaciones validan usuario.
- Crear/editar/renombrar/borrar requiere `hasPaidAccess`.
- Queries siempre filtran por `userId`.

## Editor TipTap

| Fichero | Uso |
| --- | --- |
| `src/app/documents/[id]/page.tsx` | Pagina del editor. Exige usuario y paid access. |
| `src/components/editor/rich-text-editor.tsx` | Editor TipTap completo. Toolbar, autosave, links, imagenes, colores, contador. |
| `src/app/api/documents/[id]/route.ts` | `PATCH` para guardar contenido TipTap JSON. |

Features del editor:

- StarterKit: paragraph, headings, lists, blockquote, code block, undo/redo.
- Marks: bold, italic, strike, underline.
- Text color y multicolor highlight.
- Links con normalizacion de URL.
- Imagenes con upload, resize por presets y alineacion.
- Text align para heading/paragraph.
- Autosave debounced cada 2 segundos tras cambios.
- Boton `Save now` solo como fallback cuando hay cambios/error.
- Word count y character count con `@tiptap/extension-character-count`.

## Uploads de Imagenes

| Fichero | Ruta | Uso |
| --- | --- | --- |
| `src/app/api/documents/[id]/assets/route.ts` | `POST /api/documents/:id/assets` | Upload server-side de imagen. |
| `src/lib/uploads.ts` | Validacion y escritura de archivos. |
| `.gitignore` | Ignora `public/uploads`. |

Validaciones:

- Usuario autenticado.
- Paid access.
- Documento pertenece al usuario.
- MIME permitido: JPG, PNG, WebP, GIF.
- Max 5 MB.
- Firma binaria basica antes de escribir archivo.

Tradeoff:

- Local filesystem esta bien para VPS y prueba tecnica.
- Para produccion escalada/serverless, migrar a S3/R2/Supabase Storage.

## UI Base

| Fichero | Uso |
| --- | --- |
| `src/app/globals.css` | Variables CSS, Tailwind base, estilos globales. |
| `src/components/ui/button.tsx` | Button y variants. |
| `src/components/ui/card.tsx` | Card components. |
| `src/components/ui/input.tsx` | Input base. |
| `src/components/ui/badge.tsx` | Badge base. |
| `src/lib/utils.ts` | `cn()` para clases Tailwind. |

## Errores, Logging y Textos

| Fichero | Uso |
| --- | --- |
| `src/lib/errors.ts` | `ApplicationError`, `ValidationError`, `ForbiddenError`, `handleRouteError`. |
| `src/lib/logger.ts` | Logger `info/error/debug`, controlado por env. |
| `src/messages/en.ts` | Todos los textos visibles al usuario. Preparado para i18n. |

Regla:

- Si se anade UI visible, meter texto en `messages/en.ts`.
- Si se anade API route, usar `handleRouteError` cuando sea posible.

## Scripts y Testing

| Fichero | Uso |
| --- | --- |
| `scripts/acceptance-smoke.mjs` | Smoke black-box local/remoto: landing, auth, gating, billing routes. |
| `scripts/stripe-status-by-email.mjs` | Diagnostico Stripe por email. No se usa para autorizar acceso. |

Comandos:

```bash
npm run test:acceptance
TEST_BASE_URL="https://nodetest.andromedanova.com" npm run test:acceptance
TEST_STRIPE_CHECKOUT=true npm run test:acceptance
npm run stripe:status -- user@example.com
```

## Flujos Importantes

### Registro/Login

```txt
/register o /login
  -> src/components/auth/auth-form.tsx
  -> src/lib/auth-actions.ts
  -> src/lib/auth.ts
  -> cookie HttpOnly + session hash en User
```

### Crear Checkout

```txt
/upgrade
  -> PricingCards checkout mode
  -> POST /api/billing/checkout
  -> Stripe Checkout
  -> /billing/success?session_id=...
  -> syncCheckoutSession si webhook aun no llego
```

### Webhook

```txt
Stripe event
  -> /api/stripe/webhook
  -> verify signature
  -> processStripeWebhookEvent
  -> applyBillingState
  -> Subscription local
```

### Editor Save

```txt
/documents/[id]
  -> RichTextEditor
  -> autosave tras 2s
  -> PATCH /api/documents/[id]
  -> serializeEditorContent
  -> Document.content
```

### Image Upload

```txt
Toolbar image button
  -> file input
  -> POST /api/documents/[id]/assets
  -> storeDocumentImage
  -> public/uploads/userId/documentId/file
  -> DocumentAsset
  -> setImage({ src, alt })
  -> autosave guarda JSON TipTap
```

## Donde Tocar Segun Feature Nueva

| Si piden... | Mirar/tocar |
| --- | --- |
| Compartir documentos | `prisma/schema.prisma`, `src/app/documents/[id]/page.tsx`, APIs documentos, nuevo modelo `DocumentShare`. |
| Carpetas/tags | `Document` schema, dashboard query/UI, `document-actions.ts`. |
| Buscar documentos | `src/app/app/dashboard/page.tsx`, query Prisma, search param. |
| Papelera/restore | `Document` con `deletedAt`, dashboard filters, delete action. |
| Exportar PDF/HTML | `src/components/editor/rich-text-editor.tsx`, nueva API export, transformar TipTap JSON. |
| Mejorar billing | `src/lib/billing.ts`, `src/lib/stripe-sync.ts`, dashboard summary. |
| AI assistant | Nuevo route handler en `src/app/api/...`, boton/panel en editor, guardar resultado en TipTap. |
| Mejor i18n | Cambiar `src/messages/en.ts` por loader de locales. |
| Cloud uploads | Reemplazar `src/lib/uploads.ts`, mantener `DocumentAsset`. |
| Tests nuevos | Extender `scripts/acceptance-smoke.mjs`. |

## Puntos Para Explicar En Voz Alta

- La autorizacion es server-side: no se confia en la UI.
- Stripe webhook es idempotente y hay fallback si el webhook se retrasa.
- No se autoriza por email de Stripe; se ata a `stripeCustomerId` y `client_reference_id`.
- Si Stripe cae, usuarios con suscripcion local vigente siguen accediendo.
- SQLite/local uploads son tradeoffs intencionales para MVP y prueba tecnica.
- TipTap guarda JSON, no HTML, para preservar estructura editable.
- Textos centralizados facilitan futura localizacion.
