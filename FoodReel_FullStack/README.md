# 🍔 FoodReel — Full Stack Food Delivery App

A TikTok-style food delivery app where users scroll through short food videos (reels), discover dishes, apply coupon codes, and place orders. Food partners upload reels, manage incoming orders, and create discount coupons.

---

## 📁 Project Structure

```
FoodReel/
├── Backend/                  ← Express + MongoDB API
│   ├── src/
│   │   ├── controllers/      ← auth, food, order logic
│   │   ├── models/           ← Mongoose schemas
│   │   ├── routes/           ← API route definitions
│   │   ├── middlewares/      ← JWT auth middleware
│   │   ├── services/         ← ImageKit upload service
│   │   ├── db/               ← MongoDB connection
│   │   └── app.js
│   ├── server.js
│   └── package.json
│
├── Frontend/                 ← React + Vite SPA
│   ├── src/
│   │   ├── pages/            ← All page components
│   │   ├── components/       ← Navbar
│   │   ├── context/          ← Auth + Toast context
│   │   └── services/         ← Axios API layer
│   ├── index.html
│   └── package.json
│
├── package.json              ← Root scripts
├── .env.example              ← Environment variable template
└── README.md
```

---

## ⚙️ Setup & Installation

### 1. Clone / Extract the project

### 2. Set up environment variables

Copy `.env.example` to `Backend/.env` and fill in your values:

```bash
cp .env.example Backend/.env
```

Required values:
| Variable | Description |
|---|---|
| `MONGODB_URI` | MongoDB connection string |
| `JWT_SECRET` | Any long random string |
| `IMAGEKIT_PUBLIC_KEY` | From [imagekit.io](https://imagekit.io) dashboard |
| `IMAGEKIT_PRIVATE_KEY` | From ImageKit dashboard |
| `IMAGEKIT_URL_ENDPOINT` | From ImageKit dashboard |

### 3. Install dependencies

```bash
# Install backend deps
cd Backend && npm install

# Install frontend deps
cd ../Frontend && npm install
```

Or from root:
```bash
npm run install:all
```

---

## 🚀 Running in Development

Open **two terminals**:

**Terminal 1 — Backend:**
```bash
cd Backend
npm run dev
# API running at http://localhost:3000
```

**Terminal 2 — Frontend:**
```bash
cd Frontend
npm run dev
# App running at http://localhost:5173
```

The Vite dev server proxies all `/api` requests to `localhost:3000` automatically.

---

## 📦 Running in Production (Single Server)

Build the React app into the Backend's `public/` folder, then serve everything from Express:

```bash
# From root:
npm run start:prod

# Or manually:
cd Frontend && npm run build    # builds into Backend/public/
cd ../Backend && NODE_ENV=production node server.js
# App served at http://localhost:3000
```

---

## 🔌 API Reference

### Auth
| Method | Route | Access | Description |
|--------|-------|--------|-------------|
| POST | `/api/auth/user/register` | Public | Register customer |
| POST | `/api/auth/user/login` | Public | Login customer |
| GET | `/api/auth/user/logout` | Public | Logout customer |
| POST | `/api/auth/food-partner/register` | Public | Register food partner |
| POST | `/api/auth/food-partner/login` | Public | Login food partner |
| GET | `/api/auth/food-partner/logout` | Public | Logout food partner |

### Food Reels
| Method | Route | Access | Description |
|--------|-------|--------|-------------|
| GET | `/api/food` | User | Browse all food reels |
| POST | `/api/food` | Partner | Upload a food reel (multipart/form-data, field: `mama`) |
| GET | `/api/food/partner` | Partner | Get own food listings |
| PATCH | `/api/food/partner/:foodId/toggle` | Partner | Toggle food availability |

**Upload fields:** `mama` (video file), `name`, `description`, `price`, `category`

### Orders
| Method | Route | Access | Description |
|--------|-------|--------|-------------|
| POST | `/api/orders` | User | Place an order |
| GET | `/api/orders` | User | Get own order history |
| POST | `/api/orders/validate-coupon` | User | Check coupon before ordering |
| GET | `/api/orders/coupons` | User | List all active coupons |
| POST | `/api/orders/confirm-payment` | User | Confirm online payment |
| DELETE | `/api/orders/:orderId/cancel` | User | Cancel an order |
| GET | `/api/orders/partner` | Partner | Incoming orders (filter: `?status=`) |
| PATCH | `/api/orders/partner/:orderId/status` | Partner | Update order status |
| POST | `/api/orders/partner/coupon` | Partner | Create a coupon |

---

## 🖥️ Frontend Pages

| Route | Who | Description |
|-------|-----|-------------|
| `/` | Everyone | Landing page |
| `/register` | New users | Register as Customer or Food Partner |
| `/login` | Returning users | Login |
| `/feed` | Users | Vertical food reel scroll (TikTok-style) |
| `/orders` | Users | Order history with status tracker |
| `/partner/dashboard` | Partners | Stats, food listings, quick order view |
| `/partner/orders` | Partners | Manage all incoming orders |
| `/partner/upload` | Partners | Upload new food reel with video |
| `/partner/coupons` | Partners | Create and view discount coupons |

---

## 🧩 Tech Stack

**Backend**
- Node.js + Express
- MongoDB + Mongoose
- JWT Authentication (cookie-based)
- ImageKit (video storage)
- Multer (file uploads)
- bcryptjs (password hashing)

**Frontend**
- React 18 + Vite
- React Router v6
- Axios (API calls)
- CSS Variables design system (dark theme)
- Google Fonts: Syne + DM Sans

---

## 📝 Notes

- Food reels are stored on **ImageKit CDN** — make sure your ImageKit credentials are correct
- Cookies are `httpOnly` — no token exposed to JavaScript
- In dev mode, CORS allows `localhost:5173`; in production, React is served by Express directly
- The `COD` payment flow marks orders as `paid` automatically when the partner marks the order as `delivered`
- Online payment: call `/api/orders/confirm-payment` with `{ orderId, transactionId }` after your payment gateway confirms
