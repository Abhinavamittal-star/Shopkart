# ShopKart

ShopKart is a full-stack shopping application built with React, Express, and MongoDB. Customers can create an account, discover products, save a wishlist, keep a persistent cart, check out with a shipping address, make a payment, and review past orders.

## Technology stack

| Layer | Technology |
| --- | --- |
| Frontend | React 18, Vite, React Router |
| API | Node.js, Express |
| Database | MongoDB, Mongoose |
| Authentication | JWT in an HttpOnly cookie; bcryptjs password hashing |
| Payment | Razorpay Test Mode in deployment; randomized mock gateway for local development |
| HTTP client | Axios with cookie credentials |
| Hosting configuration | Railway single service for the API and frontend; optional Render/Vercel configuration |

## Features

- Customer registration, login, session restoration, and logout.
- Product catalogue with search, category filtering, and stock display.
- Customer-specific wishlist and persistent cart.
- Checkout shipping form with client and server validation.
- Server-side cart reload, product-price snapshotting, stock verification, and total calculation.
- Payment verification on the API before an order is marked placed or the cart is cleared.
- Protected order history and customer-owned order details.
- Responsive charcoal theme with teal accents.

## Project layout

```text
.
├── backend/
│   ├── config/             # MongoDB and Razorpay configuration
│   ├── controllers/        # Customer, catalogue, cart, wishlist, and order logic
│   ├── middlewares/        # JWT authentication
│   ├── models/             # Customer, Product, and Order schemas
│   ├── routes/              # Express route modules
│   ├── utils/
│   ├── .env.example         # Safe local configuration template
│   └── index.js             # API entry point
├── frontend/
│   └── frontend/
│       ├── src/
│       │   ├── components/
│       │   ├── pages/
│       │   ├── services/    # Axios API client
│       │   └── utils/
│       ├── vercel.json      # Vercel SPA fallback and API proxy rewrites
│       └── vite.config.js
├── render.yaml              # Render API service Blueprint
└── README.md
```

## Requirements

- Node.js 20 or newer (Node 22 LTS is recommended).
- npm.
- MongoDB, either a local service or a MongoDB Atlas database.

## Run locally

### 1. Configure the backend

In PowerShell:

```powershell
Set-Location .\backend
Copy-Item .env.example .env
npm ci
```

Edit `backend/.env` and set:

```env
PORT=5000
MONGO_URI=mongodb://127.0.0.1:27017/shopkart
JWT_SECRET=replace_with_a_long_random_secret
CLIENT_URL=http://localhost:5173
NODE_ENV=development
PAYMENT_GATEWAY=mock
```

Use a reachable MongoDB URI. The development mock gateway is selected by default when `PAYMENT_GATEWAY` is omitted in development mode. It never charges money and randomly declines approximately 1 in 4 payment attempts. The API chooses the result; the browser cannot select success or failure. A declined payment leaves the cart intact so it can be retried.

Start the backend in the first terminal:

```powershell
Set-Location .\backend
npm run dev
```

The API listens on `http://localhost:5000`.

### 2. Start the frontend

In a second terminal:

```powershell
Set-Location .\frontend\frontend
npm ci
npm run dev -- --host 127.0.0.1
```

Open `http://127.0.0.1:5173`. To stop either server, press **Ctrl+C** in its terminal.

### Optional Razorpay Test Mode locally

To use Razorpay Checkout instead of the randomized local mock, set `PAYMENT_GATEWAY=razorpay` and add valid Razorpay **Test Mode** credentials to `backend/.env`:

```env
PAYMENT_GATEWAY=razorpay
RAZORPAY_KEY_ID=rzp_test_your_key_id
RAZORPAY_KEY_SECRET=your_test_secret
```

Never expose the Razorpay secret in frontend variables, source code, commits, or screenshots.

## API overview

All protected routes require a valid login cookie. The API uses JSON request and response bodies.

| Method | Endpoint | Access | Purpose |
| --- | --- | --- | --- |
| `POST` | `/customers/register` | Public | Create a customer account |
| `POST` | `/customers/login` | Public | Authenticate and set the HttpOnly cookie |
| `GET` | `/customers/me` | Customer | Restore the current session |
| `POST` | `/customers/logout` | Customer | Clear the login cookie |
| `GET` | `/products` | Public | List/search/filter products |
| `GET` | `/products/:id` | Public | Get a product |
| `GET` | `/wishlist` | Customer | Get the customer wishlist |
| `POST` | `/wishlist/:productId` | Customer | Add a wishlist product |
| `DELETE` | `/wishlist/:productId` | Customer | Remove a wishlist product |
| `GET` | `/cart` | Customer | Get the persistent cart |
| `POST` | `/cart/items` | Customer | Add a product and quantity |
| `PATCH` | `/cart/items/:productId` | Customer | Change cart quantity |
| `DELETE` | `/cart/items/:productId` | Customer | Remove a cart item |
| `POST` | `/orders/create-payment-order` | Customer | Revalidate cart/address and create a pending payment order |
| `POST` | `/orders/verify-payment` | Customer | Verify payment server-side, place order, and clear cart on success |
| `GET` | `/orders` | Customer | List the current customer's orders |
| `GET` | `/orders/:id` | Customer | Retrieve an owned order |

Checkout sends only the shipping address. The API reloads cart products and calculates the payable amount; totals sent by the browser are not trusted. Order items store product name, price, image, and quantity snapshots.

## Payment and order workflow

```text
Login
  -> Add products to the database-backed cart
  -> Validate shipping details
  -> API reloads current product data and checks stock
  -> API calculates total and stores a pending order snapshot
  -> Payment gateway processes/decides the attempt
  -> API verifies payment
  -> Success: mark PAID / PLACED, then clear the database cart
  -> Failure: mark FAILED and leave the cart unchanged
  -> Customer views the persisted order history
```

For local development, the mock gateway uses a cryptographically random, one-use payment token whose hash is stored with the pending order. The API randomly returns success or failure and does not accept a client-supplied outcome. Mock payments are blocked when `NODE_ENV=production`.

## Production deployment on Railway (single web service)

Railway can run the React frontend and Express API together in one public web service. The root [`railway.json`](./railway.json) and [`package.json`](./package.json) configure the build and start commands: the build installs both apps' dependencies and builds the Vite frontend, then the backend serves the generated frontend files alongside the API. The API is under `/api`, keeping it separate from client-side routes such as `/orders`.

1. Push the repository to GitHub and create a Railway project from that repository. Keep the service root directory at the repository root.
2. Railway uses `railway.json` to build (`npm run build`) and start (`npm start`) the single service. Generate a public domain from the service's Networking settings.
3. Provide a MongoDB connection string in `MONGO_URI`. This can be MongoDB Atlas or a separate persistent MongoDB service; the web app and API themselves are deployed together in the Railway service.
4. Add these Railway service variables:
   - `NODE_ENV=production`
   - `PAYMENT_GATEWAY=razorpay`
   - `MONGO_URI`: production MongoDB connection string
   - `JWT_SECRET`: a fresh, long, random secret (not the development value)
   - `CLIENT_URL`: the Railway public origin, for example `https://shopkart-production.up.railway.app` (no trailing slash)
   - `RAZORPAY_KEY_ID` and `RAZORPAY_KEY_SECRET`: server-side Razorpay **Test Mode** credentials
5. Wait for Railway's `/health` check to pass, then open the generated domain to load the storefront. No Vercel project or `VITE_API_URL` setting is required: the production frontend calls `/api` on the same origin.

### Production payment note

Production is configured for Razorpay, not the development mock. Checkout requires valid Razorpay Test Mode credentials to test without real charges. Do not set a Razorpay **Live** key in this test-mode application: the server accepts `rzp_test_` keys only.

## Environment variables

| Variable | Used by | Description |
| --- | --- | --- |
| `PORT` | Backend | HTTP port; Railway provides this automatically |
| `MONGO_URI` | Backend | MongoDB connection URI |
| `JWT_SECRET` | Backend | Secret used to sign customer session tokens |
| `CLIENT_URL` | Backend | Allowed browser origin; production value is the Railway public origin |
| `NODE_ENV` | Backend | Set to `development` locally and `production` on Railway |
| `PAYMENT_GATEWAY` | Backend | `mock` locally or `razorpay` for a deployed service |
| `RAZORPAY_KEY_ID` | Backend | Razorpay Test Mode public key ID |
| `RAZORPAY_KEY_SECRET` | Backend | Razorpay Test Mode secret; server-side only |
| `VITE_API_URL` | Frontend build | Optional API base URL override; defaults to the local API in development and `/api` in production |

`backend/.env` is a local-only file and is excluded by `.gitignore`. The checked-in `backend/.env.example` contains placeholders only.

## Build and validation

```powershell
npm run build

node --check .\backend\index.js
```

## Security notes

- Do not commit `.env`, API keys, MongoDB credentials, JWT secrets, database dumps, or access tokens.
- Use dashboard environment variables for all deployment secrets.
- Passwords are hashed; session JWTs are stored in HttpOnly cookies.
- Order ownership and payment verification are checked by the server.
- The mock gateway is only for local development; it is not real payment processing.
