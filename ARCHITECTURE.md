# Holiday Landing - Architecture & Codebase Guide

## Overview

This is the **Holiday** brand landing page - a Next.js 16 (React 19) single-page application with two views: an **offline** artistic/interactive experience and a **shop** e-commerce view powered by Shopify. The aesthetic is dark/minimal with retro Mac OS-inspired UI elements (blue modal headers, orange close buttons, beach ball loader). Tailwind CSS v4 handles all styling.

**Stack**: Next.js 16.1.1, React 19, TypeScript 5, Tailwind CSS 4, Sanity CMS, Shopify Storefront API, Klaviyo, Google Sheets API, Framer Motion, Embla Carousel.

---

## Page Architecture

The entire landing experience lives in a single client component (`app/page.tsx`, ~800 lines). There is no routing beyond this page (plus `/studio` for embedded Sanity Studio). The page exports `ViewMode = 'offline' | 'shop'` and manages all application state — forms, modals, cart, spotlight, scroll tracking. The default view is `'shop'`. The two views are mutually exclusive, controlled by `currentView` state:

```
[TickerHeader]                    ← scrolling marquee, fixed top, z-70
[HeaderContent]                   ← view toggle + audio player, fixed below ticker, z-65
  ├── [offline/shop tabs]
  └── [AudioPlayer]
[Spotlight Effect]                ← intro animation overlay, z-100, disappears after 3.2s
[ProductsView]                   ← shop view (products grid + cart)
[Offline View]                   ← split layout with modals
```

### Startup Sequence

1. **0ms**: Page mounts. Spotlight overlay covers everything (solid black with growing radial gradient)
2. **500ms**: `showContent` = true. Logo begins fading in on the offline view
3. **3200ms**: `showSpotlight` = false. Spotlight fades out, ticker + header become visible
4. **3700ms**: `modalsVisible` = true. Modal cards on the offline view fade in

### Z-Index Layers

| z-index | Element |
|---------|---------|
| 100 | Spotlight effect (intro only) |
| 100000 | ProductCard header (when lightbox is open) |
| 99999 | ProductDetailsLightbox (portal on document.body) |
| 70 | TickerHeader |
| 65 | HeaderContent |
| 50 | Cart scroll indicator, view toggle buttons |
| 30 | ProductsView |

### State Management (page.tsx)

All state lives in the root `Home` component. Key state groups:

**UI/Animation state**:
- `showSpotlight` / `showContent` / `modalsVisible` — intro sequence timing
- `currentView: ViewMode` — `'offline'` or `'shop'` (default: `'shop'`)
- `activeMobileModal` / `activeDesktopModal` — which modal card is in view (IntersectionObserver)
- `desktopModalTotal` — total desktop modal count for scroll tracker

**Form state**:
- `answer` / `isSubmittingAnswer` / `answerSuccess` / `answerError` — Q&A form
- `showSubscribe` / `email` / `phone` / `isSubmittingSubscribe` / `subscribeSuccess` / `subscribeError` — subscribe form

**Modal visibility**:
- `showDownloadModal` / `downloadModalData` — CMS downloadable content (fetched on mount)
- `showSlideshowModal` / `showAnswersModal` / `showProblemsModal` / `showTopRightModal` / `showAloneModal` — all set `true` on mount

**Cart state** (persisted to `localStorage` under key `'holiday-cart'`):
- `cartItems: CartItem[]` — loaded from localStorage on mount, saved on every change
- `addToCart(product)` — creates new CartItem with unique ID (`name-size-timestamp`)
- `removeFromCart(id)` — filters out by ID
- `updateQuantity(id, quantity)` — updates quantity or removes if < 1
- `handleCheckout()` — maps cart to Shopify line items, calls `createCheckoutClient()`, redirects to `checkout.webUrl`. Falls back to `holidaybrand.co` on error or empty cart

**Refs**:
- `mobileScrollRef` / `desktopScrollRef` — scroll containers for IntersectionObserver
- `mobileModalCount` — ref tracking total mobile modal cards

---

## View: Shop (`currentView === 'shop'`)

### Data Flow

```
ProductsView
  ├── useShopifyCollection('swingers', sortSwingersProducts)
  │     └── fetchCollectionClient('swingers')
  │           └── GET /api/shopify/collection?handle=swingers
  │                 └── fetchProductsByCollection('swingers')  [server-side, cached 5min]
  │                       └── Shopify Storefront API GraphQL
  │
  ├── useShopifyCollection('pre-swingers')
  │     └── (same chain as above with handle='pre-swingers')
  │
  └── Checkout flow:
        handleCheckout() in page.tsx
          └── createCheckoutClient(lineItems)
                └── POST /api/shopify/checkout
                      └── Shopify cartCreate mutation → returns checkoutUrl → redirect
```

### Component Hierarchy

```
ProductsView
  ├── ProductCard (for each standard product)
  │     ├── ImageScroller (horizontal snap-scroll of product images)
  │     └── ProductDetailsLightbox (full-screen image viewer, portal to document.body)
  │
  ├── PasswordProductCard (for products with name containing "+ more" or "hidden")
  │     ├── Password gate → POST /api/secret-product-auth (timing-safe comparison)
  │     ├── ImageScroller (same component, shown after unlock)
  │     └── ProductDetailsLightbox (same, shown after unlock)
  │
  └── CartModal (shopping cart, rendered at the bottom of the grid)
```

### ProductsView Layout

- **Mobile**: Single column, vertical scroll, `max-w-[360px]` centered, `gap-3`, `pb-20` bottom padding
- **Desktop**: 4-column grid (`grid-cols-4 gap-4`), `max-w-[1400px]`, centered with `px-4`
- Products render in order: swingers collection grid first (custom sorted), then pre-swingers in a separate grid below (`mt-4`)
- Cart sits as the last item in the pre-swingers grid (both mobile and desktop)
- **Floating cart indicator**: Green pill (`bg-green-500`) fixed to right edge (`right-0 top-1/2`), z-50, with white count badge and vertical "cart" text. Only visible when `cartItems.length > 0`. Clicking scrolls to the cart section via `scrollIntoView`
- **Staggered entrance**: Products fade in with a `translate-y` animation after spotlight completes (top row at 100ms, bottom row at 200ms via `topRowVisible`/`bottomRowVisible` state)
- **Hidden product detection**: Products with names containing `"+ more"` or `"hidden"` (case-insensitive) render as `PasswordProductCard` instead of `ProductCard`. This check is `isHiddenProduct()` inside ProductsView
- **View container**: Fixed `inset-0` with `z-30`, padding-top calculated as `calc(var(--ticker-height, 32px) + 52px)` to sit below ticker + header

### ProductCard Anatomy

```
┌─────────────────────────────┐
│ [swingers-1.png bg] header  │  ← product name + price, orange X button
│ bg-black/40 overlay         │     X closes lightbox if open, else triggers heart reveal
├─────────────────────────────┤
│                             │
│     ImageScroller           │  ← aspect-square (mobile) / aspect-[4/3] (desktop)
│     (snap-scroll images)    │     per-product scale: coyote bag=0.9, hldy zip/melrose/swinger jean=0.95, default=1.1
│                             │     overflow-hidden on outer wrapper prevents scale bleed
├─────────────────────────────┤
│     "see details"           │  ← opens ProductDetailsLightbox at index 0
├─────────────────────────────┤
│ [swingers-1.png bg] footer  │  ← size buttons or "add to cart" (single-size products)
│ bg-black/40 overlay         │     or "Sold Out" if all variants unavailable
└─────────────────────────────┘
```

**Props**: `{ product: Product | null, onClose: () => void, onAddToCart?: (product) => void }`

**Single-size detection**: If a product has exactly one variant and its size is `'default title'`, `'one size'`, or `'os'` (case-insensitive), the footer shows an "add to cart" button instead of a size selector.

**Heart reveal**: When the X button is clicked (and lightbox is not open), it calls `onClose()` which triggers `revealCard(key)` in ProductsView. This covers the card with a `HEARTLOGO.png` overlay (black bg, centered 120px/150px image with hover scale). Clicking the heart calls `hideCard(key)` to reveal the card again. State is managed by `revealedCards: Record<string, boolean>` in ProductsView using keys like `'swingers-0'`, `'preswingers-2'`, `'cart'`.

**X button dual behavior**: When lightbox is open, the X button closes the lightbox (`setLightboxOpen(false)`). When lightbox is closed, it calls `onClose()` (heart reveal). The header gets `z-[100000]` when lightbox is open so the X sits above the lightbox portal (z-99999).

**Bell sound on add-to-cart**: When a size button is clicked, `playBellSound()` dispatches `'pauseForBell'` event, plays `/swingers-bell.mp3`, and dispatches `'resumeAfterBell'` on completion. The button is disabled during playback via `isBellPlaying` state.

**Per-product image scale** (`getImageScale()`):
- `'hldy zip'` → 0.95
- `'melrose'` or `'swinger jean'` → 0.95
- `'coyote bag'` → 0.9
- All others → 1.1 (default)

**Size button styling**: Semi-transparent black with white border (`bg-black/40 border-white/60`), text shadow for readability. Unavailable sizes get `line-through`, reduced opacity, and `cursor-not-allowed`.

**Sold out state**: Red pulsing pill overlay on image area (`absolute top-2 right-2 z-10`), footer shows "Sold Out" text instead of size buttons.

### PasswordProductCard

Yellow-themed variant of a product card (`bg-yellow-500` header/footer vs tartan pattern on standard cards). Shows a password entry screen (centered "enter code for private item" text + input field). On submit, sends password to `POST /api/secret-product-auth` which uses `crypto.timingSafeEqual` for timing-safe comparison. On success (`data.success`), fades out the password screen (`opacity-0 scale-95`) and fades in the standard product display (ImageScroller + size selector + lightbox). Falls back to hardcoded password `'holiday'` if env var `SECRET_PRODUCT_PASSWORD` is not set.

**Incorrect password**: Triggers `animate-shake` CSS animation on the input container + red error text "incorrect password" that auto-clears after 2s.

**Props**: `{ title?, product?, onClose, onAddToCart? }`. Does NOT include `quantityAvailable` in its `onAddToCart` callback (unlike ProductCard).

### CartModal

**Exports**: `CartItem` interface + default component. `CartItem` has: `{ id, name, price, quantity, size?, image?, variantId?, quantityAvailable? }`.

**Props**: `{ title, onClose, items: CartItem[], onUpdateQuantity?, onRemoveItem?, onCheckout?, isMobileEmbedded? }`

Styled to match ProductCard (same `swingers-1.png` tartan header/footer with `bg-black/40` overlay). Structure:
- **Header**: Title + orange X close button (triggers heart reveal like ProductCard)
- **Content area**: Fixed height `h-[304px]` mobile / `h-[248px]` desktop. White background. Scrollable item list or "cart is empty" centered text
- **Each line item**: Product name (bold, uppercase, truncated) + size (if not "default title") + quantity controls (+/- buttons) + trash icon remove button
- **Quantity controls**: Minus button removes item if quantity is 1. Plus button disabled when `quantity >= quantityAvailable`
- **Footer**: Checkout button

**Checkout behavior**: Empty cart → plays bell sound (same `pauseForBell`/`resumeAfterBell` coordination). Cart with items → calls `onCheckout()` prop which triggers `handleCheckout()` in page.tsx → `createCheckoutClient(lineItems)` → Shopify cart creation → `window.location.href` redirect to checkout URL.

**`isMobileEmbedded` prop**: When true, adds `overflow-hidden bg-black rounded-sm` to outer wrapper for inline display in mobile layout.

### ProductDetailsLightbox

The **only lightbox system** in the project. Full-screen overlay rendered via `createPortal(_, document.body)` at `z-index: 99999`. Solid black backdrop (`bg-black`, not semi-transparent).

**Props**: `{ images: string[], alt, description?, onClose, initialIndex? }`

**Layout**:
- Image area: `w-full h-[50vh] md:h-[60vh]`, `max-w-4xl`, uses `next/image` with `fill` + `object-contain` + `sizes='(max-width: 768px) 100vw, 80vw'`
- Image counter below image: `"1 / 5"` in `text-white/50 text-xs` (only if multiple images)
- Description below counter: `text-gray-300 text-xs md:text-sm`, max `20vh` scrollable
- Close button: Orange, `absolute top-4 right-4`
- Navigation arrows: Plain white chevrons, `w-5 h-5 md:w-6 md:h-6`, no background

**Interactions**:
- Clicking backdrop closes lightbox (via `onClick={handleClose}` on outer div)
- Content area stops propagation (`e.stopPropagation()`) so clicking image/arrows doesn't close
- Image navigation wraps around (modulo): prev from first goes to last, next from last goes to first
- Keyboard: Escape closes, ArrowLeft/ArrowRight navigates
- Animate in: `opacity-0 → opacity-100` + `scale-95 → scale-100` over 200ms
- Animate out: reverse opacity, then calls `onClose` after 200ms delay
- Prevents body scroll while open (`document.body.style.overflow = 'hidden'`)
- Uses `mounted` state to avoid SSR portal issues

When the lightbox is open, the parent ProductCard's header gets `z-[100000]` so its X button sits above the lightbox portal and acts as an alternate close button.

### Cart Persistence

Cart state lives in `page.tsx`, persisted to `localStorage` under key `'holiday-cart'`. It survives view switches and page refreshes. Cart props flow down: `page.tsx → ProductsView → CartModal`.

### Audio Coordination

A global event system coordinates background music with the bell sound effect:
1. User clicks a size button (add to cart) in ProductCard or clicks checkout on empty cart in CartModal
2. Component dispatches `window.dispatchEvent(new CustomEvent('pauseForBell'))`
3. AudioPlayer listens, pauses music, saves `wasPlayingBeforeMute` state
4. Bell sound (`/swingers-bell.mp3`) plays
5. On bell `onended`, dispatches `new CustomEvent('resumeAfterBell')`
6. AudioPlayer resumes if it was playing before

---

## View: Offline (`currentView === 'offline'`)

### Layout

Split screen:
- **Mobile**: Top section = logo + Q&A + subscribe (vertically stacked, centered). Bottom section = horizontally-scrollable modal cards with dot tracker
- **Desktop**: Left panel (`w-1/2 md:w-2/5`) = logo + Q&A + subscribe. Right panel (`w-1/2 md:w-3/5`) = vertically-scrollable modal cards with bar tracker

### Left/Top Panel

1. **Logo** (`/h.png`): Container is responsive — `w-[160px] h-[160px]` → `sm:200px` → `md:320px` → `lg:380px`. Uses `next/image` with `fill` + `object-contain` + `sizes` prop. Fades in via `showContent` state (opacity transition, 500ms). Desktop has negative margin (`md:-mt-8`)

2. **Q&A Section** (appears 2500ms after `showContent` via Framer Motion `motion.div` with `initial={{ opacity: 0, y: 8 }}`):
   - Question: "what do you think of when you hear the word holiday?" in `Holiday Content` custom font
   - Text input (`bg-transparent border-b border-white/30`) + SVG arrow submit button
   - Submit → `handleAnswerSubmit()` → `POST /api/submit-holiday-answer` → Google Sheets
   - Success: "thank you" message, clears after 3s
   - Error: error text, clears after 5s
   - Server-side validation: max 500 chars, blocks URLs/domains, XSS patterns, HTML tags, base64
   - Server-side sanitization: strips HTML, removes angle brackets, trims to 500 chars

3. **Subscribe section** (toggleable via `showSubscribe` state):
   - Default state: "subscribe" text link
   - Clicked → cross-fades to email + phone input form
   - Submit → `handleSubscribeSubmit()` → validates email format + phone (10+ digits) client-side → `POST /api/subscribe` → Klaviyo
   - Success states: "subscribed!" or "already subscribed"
   - Error: shows error text, clears after 3s
   - "back" link returns to default subscribe text

### Right/Bottom Panel - Modal Cards

Six modal cards in a scrollable container, each wrapped in `StaticModalWrapper`:

| # | Component | Title | Content | Data Source | Buttons |
|---|-----------|-------|---------|-------------|---------|
| 1 | BottomLeftModal | (from Sanity) | Question text from CMS | `/api/downloadable-content` → Sanity | download, who am i, offline |
| 2 | QAModal | "what would you miss tomorrow?" | Random user answers, browsable | `/api/answers` → CSV file | prev, watch, next |
| 3 | QAModal | "what problem do you wish you could solve?" | Random user answers, browsable | `/api/problems` → CSV file | prev, watch, next |
| 4 | TopRightModal | "january 29th" | Static image `/IMG_0316.jpeg` | None (static) | watch |
| 5 | ImageSlideshowModal | "what kept me alive" | Embla carousel of images | `/api/slideshow` → Sanity | prev, counter, next |
| 6 | AloneModal | "who do you perform for when you're alone?" | Static text | None (static) | watch |

**Mobile scroll**: Horizontal snap-scroll (`scroll-snap-type: x mandatory`, `scrollbar-none`), each card slot is `w-[96vw]` with `px-[2vw]` padding, inner content capped at `max-w-[340px]` centered. Dot tracker below (row of circles, active dot is `bg-white`, inactive `bg-white/30`). "swipe" label in `Holiday Content` font next to dots. `IntersectionObserver` (threshold 0.6) on `[data-modal-card]` elements tracks `activeMobileModal` state.

**Desktop scroll**: Vertical snap-scroll (`scroll-snap-type: y mandatory`, `scrollbar-hide`), cards are `w-[360px]`. Vertical bar tracker on right side: thin gray track with white filled segment proportional to `1/totalCards`, positioned by `activeDesktopModal * (100% / total)`. "scroll" label in `Holiday Content` font below bar. `IntersectionObserver` (threshold 0.6) on `[data-modal-card]` elements tracks `activeDesktopModal` state. `desktopModalTotal` state stores total count.

**All cards fade in** together via `modalsVisible` state (opacity + translate-y transition, 700ms) which triggers 500ms after spotlight completes.

### ModalWrapper (shared by all offline modals)

**Props**: `{ title, onClose, children, buttons?: Array<{ label, onClick?, isDisplay?, small? }> }`

Retro Mac OS window chrome with consistent structure:
- **Header**: `bg-blue-600`, title text (responsive `text-[11px] md:text-sm`, uses `@container` queries for font sizing), orange X close button (`bg-orange-500`, `w-3 h-3 md:w-3.5 md:h-3.5` icon)
- **Content**: `bg-gray-200 text-gray-700`, fixed `h-[216px]`, overflow hidden, renders `{children}`
- **Footer** (only renders if `buttons` array provided): `bg-blue-600`, horizontal flex row of buttons with `gap-1 md:gap-1.5`

The X button triggers a **shake animation** instead of closing — there's nowhere to close to since they're static cards. Sets `isShaking` state true for 500ms, applies `animate-shake` CSS class to the entire wrapper.

**Button types**:
- **Interactive** (default): `bg-gray-200 text-gray-700`, clickable with `hover:bg-gray-300 hover:scale-105 active:scale-95`
- **Display-only** (`isDisplay: true`): `bg-gray-400 text-gray-700`, no hover/click effects, no cursor pointer — used for the slideshow image counter
- **Small** (`small: true`): `w-[20%]` instead of `flex-1` — used for the "watch" button in QAModal to be narrower than prev/next
- All buttons: `rounded text-[10px] md:text-xs font-bold uppercase py-1.5`

### Individual Modal Details

**BottomLeftModal** — `{ title, questionText, imageUrl, downloadFileName, fileExtension, onClose }`. Shows `questionText` from Sanity CMS in the content area. Three buttons: "download" (fetches image as blob via `fetch(imageUrl)`, creates object URL, triggers `<a download>` click), "who am i" (opens YouTube link), "offline" (opens YouTube link).

**QAModal** — `{ onClose, title?, apiEndpoint, watchUrl }`. Fetches answers from `apiEndpoint` on mount. Displays one random answer at a time with browsing history. `seenIndices` tracks viewed answers to avoid repeats until all are seen. Three buttons: "prev" (goes back in `history` array), "watch" (opens `watchUrl` in new tab, small button), "next" (picks random unseen answer, pushes to history). Uses `RetroLoader` while loading.

**ImageSlideshowModal** — `{ onClose, title? }`. Uses `embla-carousel-react` with options `{ loop: true, align: 'center' }`. Fetches images from `/api/slideshow`. Three buttons: "prev" (calls `emblaApi.scrollPrev()`), counter display (display-only, shows `"X / Y"`), "next" (calls `emblaApi.scrollNext()`). Uses `next/image` with `fill` + `object-contain` for each slide. Uses `RetroLoader` while loading.

**TopRightModal** — `{ onClose, title? }`. Static content: `next/image` of `/IMG_0316.jpeg` in a `h-[140px] md:h-[180px]` container. One button: "watch" (opens YouTube link about Holiday 9 Year Anniversary).

**AloneModal** — `{ onClose, title? }`. Static content: centered text "who do you perform for when you're alone?" in gray-700. One button: "watch" (opens YouTube link).

### StaticModalWrapper

**Props**: `{ children, className? }`

Simple pass-through div that adds `select-none` class. Used in page.tsx to wrap each modal card in the scroll layout with consistent sizing classes applied from the parent (`max-w-[340px]` on mobile, `w-[360px]` on desktop).

---

## Shared Components

### TickerHeader

**Props**: `{ showAfterSpotlight?: boolean }`

Scrolling marquee banner fixed at the very top of the page (`fixed top-0 left-0 right-0 z-70`). Fetches messages from `/api/ticker` (Sanity CMS, cached 1 hour). Displays up to 2 messages, each duplicated 6x for seamless infinite scroll loop. Uses CSS animation (`.ticker` class: `ticker 45s linear infinite`, translates `-16.666%`). Pauses on hover (`.ticker:hover { animation-play-state: paused }`).

Sets `--ticker-height` CSS variable dynamically on the outermost div via `ref` measurement, which other components use for top padding calculations (`calc(var(--ticker-height, 32px) + 52px)`).

Black background with white text (`text-sm font-medium tracking-wide`). Each message separated by `4rem` padding. Fades in after spotlight completes via `showAfterSpotlight` prop → opacity transition.

### HeaderContent

**Props**: `{ currentView?: ViewMode, onViewChange?: (view) => void, showAfterSpotlight?: boolean }`

Fixed bar below the ticker (`fixed z-65`, top positioned by `--ticker-height` CSS variable). Contains:
- **View toggle** (offline/shop tabs): `bg-gray-800/80 backdrop-blur-sm` pill container. Each tab is a button; active tab gets `bg-blue-600 text-white`, inactive gets `text-gray-400 hover:text-white`. Text: "offline" and "shop", lowercase
- **AudioPlayer**: Rendered via `useRef<AudioPlayerHandle>` for imperative control

**Layout**: Mobile = single row with tabs left, audio right. Desktop = same but with more padding. Both use `flex items-center justify-between`.

Fades in 50ms after `showAfterSpotlight` triggers, with a `mounted` state guard to prevent hydration mismatches (renders nothing on first server render).

### AudioPlayer

**Exports**: `AudioPlayerHandle` interface (`{ mute, unmute, isCurrentlyPlaying }`) + `memo(forwardRef(AudioPlayer))`

Fetches audio URL from `/api/site-audio` (Sanity CMS) on mount. Creates `<audio>` element programmatically (not in JSX) with `loop=true`, `volume=0.3`. Plays on first user interaction (click anywhere on `document`).

**UI**: Small button with speaker SVG icon. Two states:
- **Playing**: Speaker with sound waves icon (stroke-based SVG)
- **Muted**: Speaker with X icon (stroke-based SVG)

Clicking toggles `isMuted` state → pauses or resumes audio.

**Imperative handle** (via `useImperativeHandle`): Exposes `mute()`, `unmute()`, `isCurrentlyPlaying()` for parent (`HeaderContent`) to control.

**Bell coordination**: Listens for `pauseForBell` CustomEvent → pauses audio, saves `wasPlayingBeforeMute`. Listens for `resumeAfterBell` CustomEvent → resumes only if was playing before.

### ImageScroller

**Props**: `{ images: string[], alt?, className?, onImageClick?: (index) => void, scale? }`

Horizontal snap-scroll gallery using native `<img>` tags (not Next.js Image — avoids layout shift with dynamically loaded Shopify URLs). Features:
- **Outer wrapper**: `overflow-hidden` to clip scaled images from bleeding into adjacent slides
- **Scroll container**: `overflow-x-auto snap-x snap-mandatory scrollbar-none`, flex row
- **Each image**: `snap-center`, full width/height, `object-cover`, CSS `transform: scale(${scale})` (default 1.1)
- **Previous/next arrow buttons**: Plain white chevron SVGs (`w-5 h-5`), `absolute` positioned at vertical center, `hover:opacity-70 hover:scale-110`, no background circle/bubble
- **Disabled state**: At start (prev disabled) or end (next disabled) → `opacity-30 cursor-not-allowed`
- **Click handler**: `onImageClick(currentIndex)` fires on image click, used to open lightbox at the correct index
- **Scroll tracking**: `onScroll` handler calculates `currentIndex` from `scrollLeft / containerWidth`, clamped to valid range

### RetroLoader

**Props**: `{ size?: 'sm' | 'md' | 'lg', className? }`

Mac OS beach ball spinner. SVG (`viewBox="0 0 32 32"`) with 6 colored pie-slice `<path>` segments (blue `#0066FF`, cyan `#00CCFF`, green `#00CC00`, yellow `#FFCC00`, orange `#FF6600`, red `#FF0000`) around a center point. Animated with Framer Motion `motion.svg` (`rotate: 360`, `duration: 0.8`, `linear`, `repeat: Infinity`).

Sizes: sm = 20px, md = 32px (default), lg = 48px. Used in ImageSlideshowModal and QAModal as loading state.

---

## API Routes

| Route | Method | Purpose | External Service | Caching |
|-------|--------|---------|-----------------|---------|
| `/api/ticker` | GET | Fetch active ticker messages ordered by `order` field | Sanity CMS | `revalidate: 3600` (1hr) |
| `/api/downloadable-content` | GET | Fetch active downloadable content with file URL + extension | Sanity CMS | None |
| `/api/slideshow` | GET | Fetch active slideshow images, flattened into single array with URLs + alt text | Sanity CMS | None |
| `/api/site-audio` | GET | Fetch active background music audio URL | Sanity CMS | None |
| `/api/answers` | GET | Parse `public/Holiday Landing Responses - Sheet1.csv`, filter empty/short/link entries | Local CSV | None |
| `/api/problems` | GET | Parse `public/Offline Answers PT 2 - answers.csv`, filter empty/short/link/placeholder entries | Local CSV | None |
| `/api/submit-holiday-answer` | POST | Validate + sanitize answer, append to Google Sheet with timestamp | Google Sheets API | N/A |
| `/api/subscribe` | POST | Format phone to E.164, check existing Klaviyo profile, create subscription with email+SMS consent | Klaviyo API | N/A |
| `/api/secret-product-auth` | POST | Timing-safe password comparison via `crypto.timingSafeEqual` | None (env var) | N/A |
| `/api/shopify/collection` | GET | Fetch products by `?handle=` query param, GraphQL query for 50 products/10 images/20 variants | Shopify Storefront API | `unstable_cache` 5min + `s-maxage=300` |
| `/api/shopify/checkout` | POST | Validate line items, execute `cartCreate` GraphQL mutation, return `{ id, webUrl }` | Shopify Storefront API | N/A |
| `/api/revalidate` | POST | Secret-protected webhook endpoint, revalidates `/api/ticker` path | Sanity webhook | N/A |

---

## Data Layer

### Sanity CMS (project: `uq9s8one`, dataset: `production`)

Used for: ticker messages, downloadable content, slideshow images, site audio. Client configured in `lib/sanity.ts`. Embedded studio available at `/studio` route.

Active schema types for this landing page:
- `tickerMessage` (text, isActive, order)
- `downloadableContent` (title, questionText, downloadableImage, downloadFileName, isActive, delaySeconds)
- `offlineSlideshow1` (image arrays, isActive)
- `siteAudio` (title, audioFile, isActive)

The `lib/sanity.ts` file also contains interfaces and query functions for a larger brand site (Lookbook, Radio, YouTube, Staff, Collab, Press, Archive) that are not actively used by this landing page but share the same Sanity project.

### Shopify Storefront API

Used for: product data and checkout. Auth via `SHOPIFY_STOREFRONT_ACCESS_TOKEN` (headless channel approach). Server-side auth module in `lib/shopify-auth.ts` (never imported client-side).

Two collections fetched:
- `swingers` - main collection, custom sorted by `SWINGERS_PRODUCT_ORDER` array in `hooks/useShopifyCollection.ts`
- `pre-swingers` - secondary collection, default order

Products fetched with: up to 50 products, 10 images each, 20 variants each. Cached 5 minutes server-side (`unstable_cache`) + CDN headers (`s-maxage=300, stale-while-revalidate=600`).

Client-side functions (`createCheckoutClient`, `fetchCollectionClient`) call internal API routes. Server-side functions (`fetchProductsByCollection`, `shopifyFetch`) call Shopify directly.

### Klaviyo

Email and SMS subscription. Uses `profile-subscription-bulk-create-jobs` API endpoint. Checks for existing profiles before creating, returns `alreadySubscribed` flag. Phone numbers formatted to E.164 (+1 prefix assumed US).

### Google Sheets API

Stores user-submitted answers to "what do you think of when you hear the word holiday?". Uses service account authentication. Input validated server-side with comprehensive sanitization (URL blocking, XSS prevention, HTML stripping, 500 char max).

---

## Hooks

### `useShopifyCollection(handle, sortFn?)`

Client-side hook that fetches a Shopify collection. Returns `{ products, loading, error }`. Calls `fetchCollectionClient` (which hits `/api/shopify/collection`). Optionally applies a sort function.

### `sortSwingersProducts(products)`

Sorts products by matching names against a predefined order:
1. hldy zip grey
2. melrose swinger jean
3. baseball raglan
4. logo tee
5. come together tee
6. varsity red
7. syrup logo thermal
8. distressed trucker hat
9. \+ more (password-protected item)

Products not in the list sort to the end, preserving original order.

---

## CSS & Animations (`globals.css`)

### Custom Fonts
- **Bebas Neue**: Loaded via Google Fonts in layout.tsx (CSS variable `--font-bebas-neue`)
- **Holiday Content**: Custom font from `/holiday-content.ttf`, used for "swipe"/"scroll" labels

### Key Animations
- `spotlight-grow` + `spotlight-reveal`: Intro spotlight effect (3.5s). Grows a blurred radial gradient from center, then fades out. Smaller on mobile (<640px)
- `ticker`: Marquee scroll (45s linear infinite, translates -16.666% for seamless 6x duplication loop)
- `shake`: Error feedback (500ms, alternating translateX -8px/+8px)
- `fade-in`: Generic fade + slide up (300ms)
- `slide-up`: Cart drawer entrance (300ms translateY)

### Scrollbar Classes
- `.scrollbar-hide`: Hidden by default, shows thin white scrollbar on hover (used in desktop scroll areas)
- `.scrollbar-none`: Always hidden, no hover reveal (used in mobile scroll areas)

### Global Styles
- `html, body`: Fixed position, overflow hidden, full viewport, black background
- Touch highlight removed (`-webkit-tap-highlight-color: transparent`)
- Custom volume slider thumb styling (white circle with shadow)

---

## Static Assets (`public/`)

| File | Used By | Purpose |
|------|---------|---------|
| `h.png` | page.tsx (offline view logo) | Holiday brand logo, large (1.8MB) |
| `HEARTLOGO.png` | ProductsView.tsx (card reveal overlay) | Heart logo shown when product card is "closed" |
| `swingers-1.png` | ProductCard, PasswordProductCard, CartModal (header/footer bg) | Tartan/plaid pattern used as background-image on card chrome |
| `swingers-bell.mp3` | ProductCard, CartModal (add-to-cart sound) | Bell sound effect played on add-to-cart and empty checkout |
| `IMG_0316.jpeg` | TopRightModal | January 29th anniversary photo |
| `holiday-content.ttf` | globals.css (@font-face) | Custom "Holiday Content" font for "swipe"/"scroll" labels |
| `delmar.ico` / `delmar.png` | Favicon / OG image | Site favicon and potential OG image |
| `Holiday Landing Responses - Sheet1.csv` | `/api/answers` route | User-submitted answers to "what do you think of when you hear the word holiday?" |
| `Offline Answers PT 2 - answers.csv` | `/api/problems` route | User-submitted answers to "what problem do you wish you could solve?" |

Other images in `public/` (`finalcorrection.jpeg`, `gh-sucess.jpeg`, `holiday-landing-updated.jpeg`, `rambo-rollout.jpeg`) appear to be unused reference/screenshot files.

---

## Environment Variables

| Variable | Purpose |
|----------|---------|
| `NEXT_PUBLIC_SANITY_PROJECT_ID` | Sanity project ID (default: `uq9s8one`) |
| `NEXT_PUBLIC_SANITY_DATASET` | Sanity dataset (default: `production`) |
| `SANITY_API_TOKEN` | Sanity API token for server-side queries |
| `SHOPIFY_STORE_DOMAIN` | Shopify store domain |
| `SHOPIFY_STOREFRONT_ACCESS_TOKEN` | Shopify Storefront API token |
| `SECRET_PRODUCT_PASSWORD` | Password for hidden product (fallback: `'holiday'`) |
| `KLAVIYO_PRIVATE_API_KEY` | Klaviyo API key |
| `KLAVIYO_LIST_ID` | Klaviyo subscription list ID |
| `GOOGLE_CLIENT_EMAIL` | Google service account email (used by submit-holiday-answer route) |
| `GOOGLE_PRIVATE_KEY` | Google service account private key (newlines escaped as `\n`) |
| `GOOGLE_SHEET_ID_HOLIDAY` | Target Google Sheets spreadsheet ID |
| `REVALIDATE_SECRET` | Secret for on-demand revalidation webhook |
| `UPSTASH_REDIS_REST_URL` | Upstash Redis URL (rate limiting, currently disabled) |
| `UPSTASH_REDIS_REST_TOKEN` | Upstash Redis token (rate limiting, currently disabled) |

---

## File Reference

### `app/`
- `layout.tsx` - Root layout. Server component. Loads Bebas Neue font, sets metadata, includes Vercel Analytics/SpeedInsights
- `page.tsx` - Main page (~800 lines). Client component. All state management, cart logic, spotlight, forms, two-view layout
- `globals.css` - All CSS: Tailwind import, custom fonts, animations, scrollbar utilities, ticker styles
- `error.tsx` - App-level error boundary
- `global-error.tsx` - Root layout error boundary
- `studio/[[...tool]]/page.tsx` - Embedded Sanity Studio

### `app/api/`
- `ticker/route.ts` - GET ticker messages from Sanity (1hr cache)
- `downloadable-content/route.ts` - GET downloadable content from Sanity
- `slideshow/route.ts` - GET slideshow images from Sanity
- `site-audio/route.ts` - GET background audio URL from Sanity
- `answers/route.ts` - GET parsed answers from local CSV
- `problems/route.ts` - GET parsed answers from local CSV
- `submit-holiday-answer/route.ts` - POST answer to Google Sheets
- `subscribe/route.ts` - POST email/phone subscription to Klaviyo
- `secret-product-auth/route.ts` - POST password verification (timing-safe)
- `shopify/collection/route.ts` - GET products by collection handle (5min cache)
- `shopify/checkout/route.ts` - POST create Shopify cart, return checkout URL
- `revalidate/route.ts` - POST on-demand revalidation (Sanity webhook)

### `components/`
- `TickerHeader.tsx` - Scrolling marquee, fetches from `/api/ticker`
- `HeaderContent.tsx` - View toggle tabs + AudioPlayer, fixed header bar
- `AudioPlayer.tsx` - Background music player, forwardRef, memoized, event-coordinated
- `ProductsView.tsx` - Shop view: fetches collections, renders product grid + cart
- `ProductCard.tsx` - Product card: header, ImageScroller, lightbox trigger, size selector, bell sound
- `PasswordProductCard.tsx` - Password-gated product card, yellow theme
- `ProductDetailsLightbox.tsx` - Full-screen image lightbox (portal), keyboard nav, the only lightbox system
- `CartModal.tsx` - Shopping cart display, checkout button, bell sound on empty checkout
- `ImageScroller.tsx` - Horizontal snap-scroll image gallery, configurable scale, no bubble arrows
- `ModalWrapper.tsx` - Retro Mac OS window wrapper (blue header, gray content, button row), shake-on-close
- `StaticModalWrapper.tsx` - Simple pass-through div with `select-none`
- `BottomLeftModal.tsx` - Download/watch modal (uses ModalWrapper)
- `ImageSlideshowModal.tsx` - Embla carousel slideshow (uses ModalWrapper)
- `QAModal.tsx` - Browsable user answers with history (uses ModalWrapper)
- `TopRightModal.tsx` - Static image + watch button (uses ModalWrapper)
- `AloneModal.tsx` - Static text + watch button (uses ModalWrapper)
- `RetroLoader.tsx` - Mac OS beach ball spinner (Framer Motion SVG)

### `lib/`
- `sanity.ts` - Sanity client + all query functions + interfaces
- `shopify.ts` - Shopify Storefront API client (server + client functions), product types
- `shopify-auth.ts` - Server-only Shopify auth (env var validation)
- `image-utils.ts` - Shopify CDN image URL optimization utility

### `hooks/`
- `useShopifyCollection.ts` - Client hook for fetching Shopify collections + swingers sort function

### Root Config
- `next.config.ts` - Image optimization (Sanity CDN + Shopify CDN)
- `sanity.config.ts` - Sanity Studio config with inline schema types
- `sanity.cli.ts` - Sanity CLI config
- `proxy.ts` - Next.js 16 proxy (rate limiting disabled)
- `tsconfig.json` - TypeScript config with `@/*` path alias
- `postcss.config.mjs` - Tailwind CSS v4 PostCSS plugin
- `CLAUDE.md` - Project rules for AI assistants (keep ARCHITECTURE.md updated, code style)

---

## Changelog

| Date | Change | Files Affected |
|------|--------|----------------|
| 2025-02-16 | Initial architecture documentation created | `ARCHITECTURE.md` |
| 2025-02-16 | Added `sizes` prop to `<Image fill>` components for performance; removed debug console.logs and unused refs from CartModal | `app/page.tsx`, `components/TopRightModal.tsx`, `components/CartModal.tsx` |
| 2025-02-16 | Added `metadataBase` to metadata export for OG/Twitter image resolution; removed unused `.volume-slider-vertical` CSS (dead code with deprecated `-webkit-appearance: slider-vertical`) | `app/layout.tsx`, `app/globals.css` |
| 2025-02-16 | Added arrow key navigation (ArrowUp/ArrowDown) to desktop offline modal cards via global `keydown` listener; only active when `currentView === 'offline'`, skips when input/textarea/select is focused | `app/page.tsx` |
| 2025-02-16 | Removed default browser focus outline from offline/shop toggle buttons by adding `focus:outline-none` | `components/HeaderContent.tsx` |
| 2025-02-16 | Added arrow key navigation (ArrowUp/ArrowDown) to desktop shop product grid; scrolls 400px per press, only active when shop view is visible | `components/ProductsView.tsx` |
| 2025-02-16 | Performance: compressed h.png (1.7MB→230KB), HEARTLOGO.png (432KB→133KB), swingers-1.png (1.0MB→689KB); added Cache-Control + revalidate to all Sanity API routes; enabled Sanity CDN; lazy-loaded 5 modal components with next/dynamic; adjusted spotlight-reveal to fade from 40% instead of 70% for faster LCP | `public/h.png`, `public/HEARTLOGO.png`, `public/swingers-1.png`, `app/api/*/route.ts`, `lib/sanity.ts`, `app/page.tsx`, `app/globals.css` |
