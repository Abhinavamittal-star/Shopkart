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
| Hosting configuration | Render Blueprint for the API; Vercel for the frontend |

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

## Production deployment

The repository includes a Render Blueprint at `render.yaml` and Vercel settings in `frontend/frontend/vercel.json`. The frontend's Vercel rewrites proxy API calls through the Vercel origin to avoid cross-site login-cookie restrictions.

### 1. Push the repository

The Render service name in the configuration is `shopkart-api`, and the Vercel API rewrites target `https://shopkart-api.onrender.com`. If Render assigns a different hostname, update those destinations in `frontend/frontend/vercel.json` before deploying the frontend.

### 2. Deploy the backend on Render

1. In Render, create a **Blueprint** and select this GitHub repository.
2. Render reads `render.yaml`; the API root directory is `backend`.
3. Set the prompted environment values in Render's dashboard:
   - `MONGO_URI`: a production MongoDB Atlas connection string. Add Render's outbound access as required by the Atlas network settings.
   - `JWT_SECRET`: a fresh, long, random secret (not the development value).
   - `CLIENT_URL`: the exact deployed Vercel origin, such as `https://shopkart.vercel.app` (no trailing slash).
   - `RAZORPAY_KEY_ID` and `RAZORPAY_KEY_SECRET`: server-side Razorpay credentials. Use Test Mode credentials for a test deployment; the API intentionally blocks mock payments in production.
4. Wait for the Render health check at `/` to pass. The service uses `npm ci` and `npm start`.

### 3. Deploy the frontend on Vercel

1. Import the same GitHub repository into Vercel.
2. Set the Vercel **Root Directory** to `frontend/frontend`.
3. Set build command `npm run build` and output directory `dist`.
4. Set the Vercel build environment variable `VITE_API_URL` to `/api`.
5. Deploy. The included `vercel.json` rewrites `/api/*` requests to Render and other frontend routes to `index.html`, so product-detail routes do not collide with API routes.
6. Copy the final Vercel production origin into Render's `CLIENT_URL` environment value, then redeploy/restart the API.

### Production payment note

Production is configured for Razorpay, not the development mock. Checkout requires valid Razorpay Test Mode credentials to test without real charges. Do not set a Razorpay **Live** key in this test-mode application: the server accepts `rzp_test_` keys only.

## Environment variables

| Variable | Used by | Description |
| --- | --- | --- |
| `PORT` | Backend | HTTP port; Render provides this automatically |
| `MONGO_URI` | Backend | MongoDB connection URI |
| `JWT_SECRET` | Backend | Secret used to sign customer session tokens |
| `CLIENT_URL` | Backend | Allowed browser origin; production value is the Vercel site origin |
| `NODE_ENV` | Backend | Set to `development` locally and `production` on Render |
| `PAYMENT_GATEWAY` | Backend | `mock` locally or `razorpay` for a deployed service |
| `RAZORPAY_KEY_ID` | Backend | Razorpay Test Mode public key ID |
| `RAZORPAY_KEY_SECRET` | Backend | Razorpay Test Mode secret; server-side only |
| `VITE_API_URL` | Frontend build | Leave unset locally; set to `/api` on Vercel to use the same-origin API proxy |

`backend/.env` is a local-only file and is excluded by `.gitignore`. The checked-in `backend/.env.example` contains placeholders only.

## Build and validation

```powershell
Set-Location .\frontend\frontend
npm run build

Set-Location ..\..\backend
node --check index.js
```

## Security notes

- Do not commit `.env`, API keys, MongoDB credentials, JWT secrets, database dumps, or access tokens.
- Use dashboard environment variables for all deployment secrets.
- Passwords are hashed; session JWTs are stored in HttpOnly cookies.
- Order ownership and payment verification are checked by the server.
- The mock gateway is only for local development; it is not real payment processing.
