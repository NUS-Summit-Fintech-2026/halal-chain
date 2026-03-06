# Halal Chain — Development Context

## What This Project Is

A Shariah-compliant tokenization platform on **XRPL (XRP Ledger)** that lets users buy, sell, and trade fractional ownership of Islamic bonds (Sukuk) and real-world assets through a decentralized exchange.

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| **Framework** | Next.js 16 (App Router) |
| **UI** | React 19, Ant Design 6, Tailwind CSS 4 |
| **Charts** | Recharts 3.6 |
| **Language** | TypeScript 5 |
| **Database** | PostgreSQL (Supabase) via Prisma 6 |
| **Blockchain** | XRPL Testnet, xrpl.js 4.5 |
| **File Storage** | Supabase Storage |
| **Deployment** | Vercel |

---

## Frontend Structure

```
src/app/
├── layout.tsx                     # Root layout (AntdProvider, AuthProvider wrapping)
├── AntdProvider.tsx               # Ant Design ConfigProvider setup
├── globals.css                    # Global styles (Tailwind)
├── page.tsx                       # Home / landing page
├── login/                         # User login/signup page
│
├── component/                     # Shared UI components
│   ├── LayoutWrapper.tsx          # Main layout with sidebar
│   ├── AuthGuard.tsx              # Route protection for buyers
│   ├── AdminGuard.tsx             # Route protection for admins
│   ├── AuthModal.tsx              # Login/signup modal
│   ├── sidebar.tsx                # Navigation sidebar
│   ├── purchase.tsx               # Buy/sell trading form
│   ├── orderbook.tsx              # Order book table display
│   └── pricechart.tsx             # Price history chart (Recharts)
│
├── bond-marketplace/              # Browse published Sukuk bonds
├── asset-marketplace/             # Browse published real assets
├── trade/[bondId]/                # Bond trading page (orderbook + purchase + chart)
├── asset-trade/[assetId]/         # Asset trading page
├── charity/                       # Charity listing page
├── zakat/                         # Zakat donation page
├── users/                         # User profiles
├── bonds/home/                    # Bond listing
│
├── admin/                         # Admin portal
│   ├── login/                     # Admin login
│   ├── bonds/                     # Bond CRUD + publish
│   │   └── publish/[bondId]/      # Bond publish page
│   ├── assets/                    # Asset CRUD + publish
│   │   └── publish/[assetId]/     # Asset publish page
│   └── charities/                 # Charity management
│
├── tool/xrpl.js                   # XRPL utility functions (wallets, tokens, DEX, clawback)
│
└── api/                           # Next.js API routes (see API section below)
```

### Auth & Context

```
src/context/
├── AuthContext.tsx                 # User auth state (email, token, user data)
└── AdminAuthContext.tsx            # Admin auth state

src/lib/
├── prisma.ts                      # Prisma client singleton
├── did.ts                         # DID generation (did:halal:{type}:{hash})
└── api-utils.ts                   # API middleware, auth helpers, error handling
```

---

## Key UI Components

### LayoutWrapper (`component/LayoutWrapper.tsx`)
Main page shell — renders the sidebar and wraps page content. Used by all authenticated pages.

### Sidebar (`component/sidebar.tsx`)
Navigation sidebar with links to marketplace, portfolio, charities, admin sections. Conditionally shows admin links.

### Purchase (`component/purchase.tsx`)
Trading form used on both bond and asset trade pages. Handles buy/sell order submission by calling `/api/xrpl/buy/*` or `/api/xrpl/sell/*`.

### OrderBook (`component/orderbook.tsx`)
Displays current buy/sell orders from XRPL DEX. Fetches from `/api/xrpl/orderbook/*`.

### PriceChart (`component/pricechart.tsx`)
Recharts-based price visualization for bond/asset trading pages.

### AuthGuard / AdminGuard
Route protection wrappers. Redirect to login if not authenticated.

---

## Page Flows

### Buyer Flow
1. **Login** → `/login` — email-based signup/signin, auto-creates XRPL wallet + DID
2. **Browse** → `/bond-marketplace` or `/asset-marketplace` — view published instruments
3. **Trade** → `/trade/[bondId]` or `/asset-trade/[assetId]` — order book, buy/sell forms, price chart
4. **Donate** → `/charity` or `/zakat` — browse charities, make XRP donations

### Admin Flow
1. **Login** → `/admin/login`
2. **Create** → `/admin/bonds` or `/admin/assets` — create bond/asset (DRAFT status)
3. **Publish** → `/admin/bonds/publish/[id]` — tokenize on XRPL (creates issuer, treasury, trust lines, lists on DEX)
4. **Redeem** → Simulate maturity/realization — clawback tokens, distribute XRP payouts
5. **Charities** → `/admin/charities` — manage registered charities

---

## API Routes

### Authentication
- `POST /api/auth/signup` — create user + wallet + DID
- `POST /api/auth/signin` — email-based login
- `POST /api/admin/auth/signup` / `signin` — admin auth

### Bonds
- `GET /api/bonds` — list all bonds
- `POST /api/bonds` — create bond (file upload supported)
- `GET /api/bonds/published` — published bonds only
- `GET /api/bonds/[id]` — single bond
- `GET /api/bonds/code/[code]` — bond by currency code
- `POST /api/bonds/code/[code]/publish` — tokenize + list on DEX
- `POST /api/bonds/code/[code]/simulate-expired` — trigger redemption

### Real Assets
- `GET /api/realassets` — list all
- `POST /api/realassets` — create asset
- `GET /api/realassets/published` — published only
- `GET /api/realassets/[id]` — single asset
- `POST /api/realassets/code/[code]/publish` — tokenize + list on DEX
- `POST /api/realassets/code/[code]/simulate-realization` — distribute proceeds

### XRPL / Trading
- `POST /api/xrpl/buy/[bondCode]` — place buy order (bonds)
- `POST /api/xrpl/buy/asset/[assetCode]` — place buy order (assets)
- `POST /api/xrpl/sell/[bondCode]` — place sell order (bonds)
- `POST /api/xrpl/sell/asset/[assetCode]` — place sell order (assets)
- `GET /api/xrpl/orderbook?bondCode=X&issuerAddress=Y` — bond order book
- `GET /api/xrpl/orderbook/asset/[assetCode]` — asset order book
- `GET /api/xrpl/portfolio` — user's token holdings
- `GET /api/xrpl/offers` — user's open orders

### Users
- `GET /api/users` — all users
- `GET /api/users/[id]` — single user
- `GET /api/me` — current user
- `GET /api/me/wallet` — wallet details
- `GET /api/me/balance` — XRP balance

### Charity
- `GET /api/charities` — list charities
- `POST /api/charities` — create charity
- `GET /api/charities/[id]` — charity details
- `POST /api/zakat/donate` — make donation

---

## Database Models

| Model | Key Fields | Status Values |
|-------|-----------|---------------|
| **User** | email, did, walletAddress, walletSeed | — |
| **Admin** | email, password | — |
| **Wallet** | role (ISSUER/TREASURY), address, seed | — |
| **Bond** | name, code, currencyCode, totalTokens, profitRate, maturityAt, issuerAddress, treasuryAddress, fileUrl | DRAFT, PUBLISHED, EXPIRED |
| **RealAsset** | name, code, totalTokens, profitRate, currentValuationXrp, issuerAddress, treasuryAddress | DRAFT, PUBLISHED, REALIZED |
| **AssetFile** | realAssetId, fileUrl, fileType | — |
| **Charity** | name, description, did, walletAddress, walletSeed | — |
| **Donation** | charityId, userId, xrpAmount, txHash | — |

---

## XRPL Operations (src/app/tool/xrpl.js)

Key functions used by the API routes:

| Function | What It Does |
|----------|-------------|
| `createWallet` | Creates + funds wallet via testnet faucet |
| `configureIssuerSettings` | Enables DefaultRipple + Clawback flags |
| `tokenizeBond` | Creates trust line + mints tokens to treasury |
| `setupTrustLine` | Buyer opts-in to hold a token |
| `createBuyOffer` / `createSellOffer` | Places orders on XRPL DEX |
| `getOrderBook` | Queries DEX order book via `book_offers` |
| `clawbackTokens` | Issuer reclaims tokens from holders |
| `sendXrpPayment` | Sends XRP (payouts, donations) |
| `cancelOffer` / `cancelAllOffers` | Cancels DEX orders |
| `getTrustLines` | Gets account trust lines |
| `getOffers` | Gets account open offers |

---

## Styling Conventions

- **Ant Design 6** components are the primary UI building blocks (Table, Card, Button, Form, Modal, Tag, etc.)
- **Tailwind CSS 4** is used for layout and spacing utilities alongside Ant Design
- **AntdProvider** wraps the app for theme configuration
- Pages use Ant Design's grid/layout system
- Color scheme follows Ant Design defaults (can be customized in AntdProvider)

---

## Environment Variables

```env
DATABASE_URL=postgresql://...
SUPABASE_URL=https://[project].supabase.co
SUPABASE_SERVICE_ROLE_KEY=...
SUPABASE_BUCKET=halal-chain
```

---

## Notes for UI Development

- All pages are App Router (no `pages/` directory)
- Auth state is managed via React Context (`AuthContext`, `AdminAuthContext`), not a state library
- API calls use `fetch` with Bearer token auth from context
- The `LayoutWrapper` component handles the sidebar — individual pages only render their content
- Trade pages (`/trade/[bondId]`, `/asset-trade/[assetId]`) compose the `OrderBook`, `Purchase`, and `PriceChart` components
- File uploads (bond documents, asset images) go to Supabase Storage and return public URLs
- The app ignores TypeScript and ESLint errors during build (`next.config.ts` — MVP mode)
