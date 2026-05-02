# 🏏 CricketNepal — Full-Stack eCommerce Platform

> Nepal's premier online store for cricket equipment, gear, and accessories.
> Built with the MERN stack — MongoDB, Express.js, React (Vite), Node.js.

---

## 📁 Project Structure

```
cricketnepal/
├── backend/                        # Express.js API
│   ├── config/
│   │   ├── db.js                   # MongoDB Atlas connection
│   │   └── cloudinary.js           # Image upload config
│   ├── controllers/
│   │   ├── authController.js       # Register, login, password reset
│   │   ├── productController.js    # CRUD, search, filters, reviews
│   │   ├── orderController.js      # Orders, Khalti & eSewa payment
│   │   ├── adminController.js      # Admin dashboard & management
│   │   └── wishlistController.js   # User wishlist
│   ├── middleware/
│   │   ├── auth.js                 # JWT protect + role authorize
│   │   └── errorHandler.js        # Global error formatter
│   ├── models/
│   │   ├── User.js                 # User schema (buyer/seller/admin)
│   │   ├── Product.js              # Product schema with reviews
│   │   └── Order.js                # Order schema with payment result
│   ├── routes/
│   │   ├── authRoutes.js
│   │   ├── productRoutes.js
│   │   ├── orderRoutes.js
│   │   ├── adminRoutes.js
│   │   └── wishlistRoutes.js
│   ├── utils/
│   │   ├── sendEmail.js            # Nodemailer email helper
│   │   ├── tokenHelper.js          # JWT + cookie response helper
│   │   └── seeder.js               # DB seed with 15 sample products
│   ├── .env.example
│   ├── .gitignore
│   ├── package.json
│   └── server.js                   # App entry point
│
└── frontend/                       # React + Vite (coming next)
    ├── src/
    │   ├── components/
    │   ├── pages/
    │   ├── context/
    │   ├── hooks/
    │   └── utils/
    └── ...
```

---

## 🚀 Backend Setup (Local Development)

### 1. Prerequisites

- Node.js v18+
- MongoDB Atlas account (free tier)
- Cloudinary account (free tier)
- Gmail account (for SMTP)

### 2. Clone and install

```bash
git clone https://github.com/your-username/cricketnepal.git
cd cricketnepal/backend
npm install
```

### 3. Configure environment variables

```bash
cp .env.example .env
# Open .env and fill in all values (see Environment Variables section below)
```

### 4. Seed the database

```bash
npm run seed
```

This creates:
- 1 Admin user: `admin@cricketnepal.com` / `Admin@123`
- 1 Seller user: `seller@cricketnepal.com` / `Seller@123`
- 1 Buyer user: `user@cricketnepal.com` / `User@123`
- 15 sample cricket products

### 5. Start the development server

```bash
npm run dev
# API running at http://localhost:5000
# Health check: http://localhost:5000/api/health
```

---

## 🔐 Environment Variables

| Variable | Description | Where to get |
|----------|-------------|--------------|
| `NODE_ENV` | `development` or `production` | Manual |
| `PORT` | Server port (default: 5000) | Manual |
| `MONGO_URI` | MongoDB Atlas connection string | [MongoDB Atlas](https://cloud.mongodb.com) |
| `JWT_SECRET` | Random 32+ char secret | `openssl rand -hex 32` |
| `JWT_EXPIRE` | Token expiry (e.g., `30d`) | Manual |
| `CLOUDINARY_CLOUD_NAME` | Cloudinary cloud name | [cloudinary.com](https://cloudinary.com) |
| `CLOUDINARY_API_KEY` | Cloudinary API key | [cloudinary.com](https://cloudinary.com) |
| `CLOUDINARY_API_SECRET` | Cloudinary API secret | [cloudinary.com](https://cloudinary.com) |
| `SMTP_HOST` | SMTP host (`smtp.gmail.com`) | Manual |
| `SMTP_PORT` | SMTP port (`587`) | Manual |
| `SMTP_USER` | Gmail address | Your Gmail |
| `SMTP_PASS` | Gmail App Password | [Google Account Security](https://myaccount.google.com/apppasswords) |
| `FRONTEND_URL` | Frontend URL | `http://localhost:5173` (dev) |
| `KHALTI_SECRET_KEY` | Khalti test secret key | [Khalti Merchant Dashboard](https://khalti.com) |
| `KHALTI_PUBLIC_KEY` | Khalti test public key | [Khalti Merchant Dashboard](https://khalti.com) |
| `ESEWA_MERCHANT_ID` | eSewa merchant ID (`EPAYTEST` for test) | [eSewa Developer](https://developer.esewa.com.np) |

---

## 📡 API Endpoints

### Auth — `/api/auth`

| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| POST | `/register` | Public | Register new user/seller |
| POST | `/login` | Public | Login and get JWT |
| POST | `/logout` | Private | Logout (clears cookie) |
| GET | `/me` | Private | Get current user profile |
| PUT | `/me` | Private | Update profile |
| PUT | `/me/avatar` | Private | Upload avatar image |
| PUT | `/change-password` | Private | Change password |
| POST | `/forgot-password` | Public | Send password reset email |
| PUT | `/reset-password/:token` | Public | Reset password with token |
| GET | `/verify-email/:token` | Public | Verify email address |

### Products — `/api/products`

| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| GET | `/` | Public | List products (with filters, search, pagination) |
| GET | `/meta` | Public | Get all brands & categories for filters |
| GET | `/:id` | Public | Get single product (by ID or slug) |
| GET | `/seller/my-products` | Seller/Admin | Get seller's own products |
| POST | `/` | Seller/Admin | Create product (with image upload) |
| PUT | `/:id` | Seller/Admin | Update product |
| DELETE | `/:id` | Seller/Admin | Delete product |
| DELETE | `/:id/images/:imageId` | Seller/Admin | Delete single product image |
| POST | `/:id/reviews` | User | Add or update product review |
| DELETE | `/:id/reviews/:reviewId` | User/Admin | Delete review |

**Query params for GET /api/products:**

```
?keyword=bat          # Full-text search
&category=Bats        # Filter by category
&brand=SG,MRF         # Filter by brand (comma-separated)
&minPrice=1000        # Min price (NPR)
&maxPrice=20000       # Max price
&rating=4             # Min star rating
&sort=price-asc       # newest|oldest|price-asc|price-desc|rating|popular
&page=1               # Pagination
&limit=12             # Items per page
&featured=true        # Only featured items
```

### Orders — `/api/orders`

| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| POST | `/` | Private | Create new order |
| GET | `/my-orders` | Private | Get user's order history |
| GET | `/seller-orders` | Seller/Admin | Get orders for seller's products |
| GET | `/admin` | Admin | Get all platform orders |
| GET | `/:id` | Private | Get single order |
| POST | `/:id/pay/khalti` | Private | Verify Khalti payment |
| POST | `/:id/pay/esewa` | Private | Verify eSewa payment |
| PUT | `/:id/cancel` | Private | Cancel order |
| PUT | `/:id/status` | Admin | Update order status |

### Admin — `/api/admin` *(Admin role required)*

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/stats` | Dashboard stats + revenue charts |
| GET | `/users` | All users with filters |
| GET | `/users/:id` | Single user details |
| PUT | `/users/:id` | Update user role/status |
| DELETE | `/users/:id` | Delete user + their data |
| PUT | `/sellers/:id/approve` | Approve/reject seller |
| GET | `/products` | All products |
| PUT | `/products/:id/featured` | Toggle featured status |

### Wishlist — `/api/wishlist` *(Auth required)*

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/` | Get user's wishlist |
| POST | `/:productId` | Toggle product in wishlist |
| DELETE | `/` | Clear entire wishlist |

---

## 💳 Payment Integration

### Khalti (Recommended for Nepal)

1. Sign up at [khalti.com/merchant](https://khalti.com/merchant/)
2. Get test keys from the merchant dashboard
3. Add to `.env`: `KHALTI_SECRET_KEY` and `KHALTI_PUBLIC_KEY`

**Flow:**
```
Frontend: Initialize Khalti widget with public key + amount (in paisa)
User: Completes payment on Khalti popup
Frontend: Receives token from Khalti
Frontend: POST /api/orders/:id/pay/khalti  { token, amount }
Backend: Verifies token with Khalti API → marks order paid
```

**Test credentials:**
- Khalti ID: `9800000000` / `9800000001` / ... `9800000005`
- MPIN: `1111`
- OTP: `987654`

### eSewa

1. Get test credentials from [developer.esewa.com.np](https://developer.esewa.com.np)
2. Merchant ID for testing: `EPAYTEST`

**Flow:**
```
Frontend: Build eSewa form with merchant_id, total_amount, transaction_uuid
User: Redirected to eSewa payment page
eSewa: Redirects to success_url?oid=...&amt=...&refId=...
Frontend: POST /api/orders/:id/pay/esewa  { oid, amt, refId }
Backend: Verifies with eSewa status API → marks order paid
```

**Test credentials:**
- eSewa ID: `9806800001` / `9806800002`
- Password: `Nepal@123`
- Token: `123456`

### Cash on Delivery (COD)

No payment gateway needed. Order is confirmed immediately on placement and stock is deducted.

---

## 🌐 Deployment (Free Tier)

### Database — MongoDB Atlas (Free)

1. Go to [cloud.mongodb.com](https://cloud.mongodb.com)
2. Create a free M0 cluster (512MB, shared)
3. Create a database user and whitelist `0.0.0.0/0` for IP access
4. Copy the connection string to `MONGO_URI`

### Backend — Render (Free)

1. Push backend code to GitHub
2. Go to [render.com](https://render.com) → New Web Service
3. Connect your GitHub repo
4. Set:
   - Root Directory: `backend`
   - Build Command: `npm install`
   - Start Command: `npm start`
5. Add all environment variables in the Render dashboard
6. Deploy — your API will be at `https://your-app.onrender.com`

> ⚠️ Free Render instances spin down after 15 min of inactivity. Use [UptimeRobot](https://uptimerobot.com) to ping it every 10 min.

### Alternative Backend — Railway

1. Go to [railway.app](https://railway.app)
2. New Project → Deploy from GitHub
3. Add environment variables
4. Railway auto-detects Node.js and deploys

### Frontend — Vercel (Free, Fastest)

```bash
cd frontend
npm run build
# Deploy via Vercel CLI or connect GitHub repo at vercel.com
```

1. Go to [vercel.com](https://vercel.com) → New Project
2. Import GitHub repo
3. Set Root Directory: `frontend`
4. Add environment variable: `VITE_API_URL=https://your-backend.onrender.com`
5. Deploy

### Image Storage — Cloudinary (Free)

- Free tier: 25GB storage, 25GB bandwidth/month
- Sign up at [cloudinary.com](https://cloudinary.com)
- Copy Cloud Name, API Key, API Secret to `.env`

---

## 🔒 Security Features

- Passwords hashed with bcrypt (12 salt rounds)
- JWT stored in httpOnly cookies (XSS protection)
- Helmet.js HTTP security headers
- Rate limiting (100 req/15min global, 10 req/15min on auth routes)
- CORS restricted to frontend origin
- Input validation with express-validator
- Role-based access control (user / seller / admin)
- MongoDB injection protection via Mongoose

---

## 🏏 Brand

**CricketNepal** — *Your Game. Your Gear. Nepal's Own.*

Color Palette:
- Primary Green: `#16a34a` (cricket field)
- Dark Green: `#14532d`
- Accent Gold: `#ca8a04` (trophy)
- Background Dark: `#0f172a`
- Background Light: `#f8fafc`

---

## 📝 Seed Destroy

```bash
# Destroy all data
npm run seed -- -d

# Re-seed fresh data
npm run seed
```

---

*Built with ❤️ for Nepal's cricket community*
