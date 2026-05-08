# 🚗 Car Raffle Platform | سامانه قرعه‌کشی خودرو

<div align="center">

**A Modern Full-Stack Car Raffle & Fintech Gaming Platform**  
**سامانه مدرن قرعه‌کشی خودرو با تکنولوژی فین‌تک و گیمینگ**

![Next.js](https://img.shields.io/badge/Next.js-14-black?style=for-the-badge&logo=next.js)
![Fastify](https://img.shields.io/badge/Fastify-5-000?style=for-the-badge&logo=fastify)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?style=for-the-badge&logo=typescript)
![Node.js](https://img.shields.io/badge/Node.js-20+-green?style=for-the-badge&logo=node.js)
![MySQL](https://img.shields.io/badge/MySQL-8.0-blue?style=for-the-badge&logo=mysql)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3-38B2AC?style=for-the-badge&logo=tailwind-css)
![License](https://img.shields.io/badge/License-MIT-green?style=for-the-badge)

[🌐 Live Demo](#) • [📖 Documentation](#-documentation) • [🚀 Quick Start](#-quick-start) • [📝 Contributing](#-contributing)

</div>

---

## ✨ Project Overview

A **production-ready full-stack platform** for car raffles with integrated fintech capabilities, real-time gaming, and provably fair lottery mechanisms.

**دستاورد اصلی:**
- 🎰 Interactive raffle system with provably fair draws
- 💰 Advanced wallet & payment processing system
- 🎮 Gamification with Car Slide and Wheel of Fortune
- 🌐 Real-time WebSocket updates
- 🔐 Enterprise-grade security & authentication
- 📊 Admin dashboard with detailed metrics

---

## 🌟 Key Features

### 🎯 Core Raffle System
- ✅ **Provably Fair Draws** - Commit-Reveal algorithm with transparent verification
- ✅ **Real-time Live Feed** - WebSocket-powered instant updates
- ✅ **Tiered Prize Distribution** - Dynamic ranking (Top 1-1000)
- ✅ **Transparency** - Full audit logs and draw proofs

### 💎 Financial Features
- 🏷️ **Smart Pricing** - Tiered discounts based on purchase volume
- 💳 **Cashback System** - 20% instant rebate on purchases
- 💰 **Digital Wallet** - Deposit, withdraw, transaction history
- 📈 **Profit Calculator** - Real-time cost & reward estimation
- 🔄 **Payment Reconciliation** - Automatic transaction validation

### 🎮 Gaming & Engagement
- 🎰 **Car Slide Game** - Interactive raffle with live/target draws
- 🎡 **Wheel of Fortune** - Instant rewards and bonus chances
- 🤝 **Referral System** - Earn free spins and cash rewards
- 🏆 **Leaderboards** - User rankings and achievement system
- ⭐ **Gamification** - Points, badges, streaks

### 🔐 Security & Compliance
- 🛡️ **Helmet + CORS** - Industry-standard security headers
- 🔑 **JWT + Refresh Tokens** - Secure session management
- 🔐 **Argon2id Hashing** - Military-grade password encryption
- ✅ **Rate Limiting** - Global request throttling
- 📋 **Audit Logging** - Complete action trail for compliance
- 💯 **Input Validation** - Zod schema validation on all endpoints

### 👥 Admin Panel
- 📊 **Live Metrics** - Real-time platform statistics
- 🎲 **Draw Management** - Create, open, close, and finalize draws
- 💼 **User Management** - Role-based access control
- 📝 **Audit Logs** - Complete activity history
- 💵 **Payment Configuration** - Policy management & publishing
- ⚙️ **System Settings** - Dynamic configuration

---

## 🛠 Tech Stack

| Layer | Technology |
|:------|:-----------|
| **Frontend** | Next.js 14, React 18, TypeScript, Tailwind CSS, Framer Motion |
| **Backend** | Fastify 5, Node.js 20+, TypeScript |
| **Database** | MySQL 8.0, Prisma ORM |
| **Authentication** | JWT + Refresh Tokens, Argon2id |
| **Real-time** | WebSocket (Fastify WS) |
| **Validation** | Zod Schema Validation |
| **Deployment** | PM2, Nginx, VPS/cPanel |
| **Security** | Helmet.js, CORS, Rate Limiting |

---

## 📁 Project Structure

```
car/
├── backend/                    # Fastify REST API Server
│   ├── src/
│   │   ├── routes/            # API endpoints
│   │   │   ├── raffles.ts     # Raffle management
│   │   │   ├── wallet.ts      # Wallet operations
│   │   │   ├── auth.ts        # Authentication
│   │   │   ├── admin.ts       # Admin panel APIs
│   │   │   └── ...
│   │   ├── services/          # Business logic
│   │   │   ├── payment-config.ts
│   │   │   ├── pricing.ts
│   │   │   ├── events.ts
│   │   │   └── ...
│   │   ├── persistence/       # Database layer
│   │   ├── security/          # Security utilities
│   │   ├── plugins/           # Fastify plugins
│   │   └── server.ts          # Server entry point
│   ├── tests/                 # Integration tests
│   ├── sql/                   # Database schema
│   └── package.json
│
├── frontend/                   # Next.js Web Application
│   ├── src/
│   │   ├── app/
│   │   │   ├── raffles/       # Raffle listing & details
│   │   │   ├── dashboard/     # User dashboard
│   │   │   ├── slide-game/    # Car slide game
│   │   │   ├── wheel/         # Wheel of fortune
│   │   │   ├── wallet/        # Wallet management
│   │   │   ├── admin/         # Admin dashboard
│   │   │   └── ...
│   │   ├── components/        # Reusable components
│   │   ├── lib/               # Utilities & helpers
│   │   └── types/             # TypeScript definitions
│   ├── public/                # Static assets
│   └── package.json
│
├── scripts/                    # Utility scripts
├── reports/                    # Generated artifacts
├── ecosystem.config.cjs        # PM2 configuration
├── VPS_DEPLOY.md             # VPS deployment guide
└── README.md                  # This file
```

---

## 🚀 Quick Start

### Prerequisites
- **Node.js** >= 20.x
- **npm** or **yarn**
- **MySQL** 8.0+
- **Git**

### 1. Clone Repository
```bash
git clone https://github.com/your-username/car-raffle.git
cd car
```

### 2. Install Dependencies
```bash
# Install backend dependencies
npm --prefix backend install

# Install frontend dependencies
npm --prefix frontend install
```

### 3. Environment Configuration
```bash
# Backend configuration
cp backend/.env.example backend/.env
# Edit backend/.env with your database credentials and secrets

# Frontend configuration
cp frontend/.env.example frontend/.env.local
# Edit frontend/.env.local with your API endpoints
```

### 4. Database Setup
```bash
# Import schema
mysql -u root -p your_database < backend/sql/schema.mysql.sql
```

### 5. Development Servers
```bash
# Terminal 1: Backend (Fastify)
npm --prefix backend run dev
# API available at: http://localhost:4000/api/v1
# WebSocket: ws://localhost:4000/api/v1/live

# Terminal 2: Frontend (Next.js)
npm --prefix frontend run dev
# App available at: http://localhost:3000
```

---

## 📚 Detailed Documentation

- **[Backend README](./backend/README.md)** - API documentation, security controls, and architecture
- **[Frontend README](./frontend/README.md)** - UI components, features, and styling guide
- **[VPS Deployment Guide](./VPS_DEPLOY.md)** - Production deployment instructions
- **[cPanel Deployment](./backend/DEPLOY_CPANEL.md)** - Shared hosting deployment

---

## 🔧 Available Commands

### Backend Commands
```bash
npm --prefix backend run dev      # Start development server with hot reload
npm --prefix backend run build    # Build TypeScript to JavaScript
npm --prefix backend run start    # Start production server
npm --prefix backend run test     # Run test suite
npm --prefix backend run type-check # TypeScript type checking
```

### Frontend Commands
```bash
npm --prefix frontend run dev     # Start development server
npm --prefix frontend run build   # Build for production
npm --prefix frontend run start   # Start production server
npm --prefix frontend run lint    # Run ESLint
npm --prefix frontend run type-check # TypeScript type checking
```

---

## 🔐 Security Features

### Authentication & Authorization
- ✅ JWT + Refresh Token pattern with automatic rotation
- ✅ Argon2id password hashing (resistant to GPU attacks)
- ✅ Role-based access control (RBAC)
- ✅ Session revocation & blacklisting

### API Security
- ✅ Rate limiting (global & per-endpoint)
- ✅ CORS whitelist
- ✅ Helmet.js security headers
- ✅ Input validation with Zod schemas
- ✅ Idempotency-Key support for financial endpoints

### Data Protection
- ✅ Encrypted password storage
- ✅ Secure token transmission
- ✅ SQL injection prevention (parameterized queries)
- ✅ XSS protection headers
- ✅ CSRF token validation

### Lottery Fairness
- ✅ Commit-Reveal scheme for draw verification
- ✅ External entropy sources (NIST/drand)
- ✅ Deterministic Fisher-Yates shuffling
- ✅ Public proof generation & verification

---

## 📊 API Endpoints Overview

### Authentication
- `POST /auth/register` - User registration
- `POST /auth/login` - User login
- `POST /auth/refresh` - Token refresh
- `POST /auth/logout` - Logout & token revocation

### Raffles
- `GET /raffles` - List all raffles
- `GET /raffles/:raffleId` - Get raffle details
- `POST /raffles/:raffleId/buy` - Purchase tickets
- `GET /raffles/:raffleId/proof` - Get draw proof
- `GET /raffles/:raffleId/winners` - Get winner list

### Wallet
- `GET /wallet` - Get wallet details
- `POST /wallet/deposit` - Add funds
- `POST /wallet/withdraw` - Withdraw funds
- `GET /wallet/transactions` - Transaction history

### Admin
- `POST /admin/raffles` - Create new raffle
- `POST /admin/raffles/:raffleId/draw` - Execute draw
- `GET /admin/live/metrics` - Live platform stats
- `GET /admin/audit` - View audit logs

[See full API documentation](./backend/README.md#important-endpoints)

---

## 🚀 Deployment

### Development
See [Quick Start](#-quick-start) section above.

### Production on VPS
```bash
# Follow detailed instructions in VPS_DEPLOY.md
npm --prefix backend run build
npm --prefix frontend run build

# Use PM2 for process management
pm2 start ecosystem.config.cjs --env production
```

**Full guide:** [VPS_DEPLOY.md](./VPS_DEPLOY.md)

### Shared Hosting (cPanel)
**Full guide:** [backend/DEPLOY_CPANEL.md](./backend/DEPLOY_CPANEL.md)

---

## 🧪 Testing

### Backend Integration Tests
```bash
cd backend
npm run test
```

### Quick Test Suite
```bash
npm --prefix backend run test:quick
```

### Test Database
Tests use a separate test database. Configure in `backend/.env.test`

---

## 📝 Environment Variables

### Backend (`.env`)
```env
NODE_ENV=development
PORT=4000
DATABASE_URL=mysql://user:password@localhost:3306/car_db
JWT_SECRET=your_super_secret_key_here
REFRESH_TOKEN_SECRET=your_refresh_token_secret
CORS_ORIGIN=http://localhost:3000
```

### Frontend (`.env.local`)
```env
NEXT_PUBLIC_API_URL=http://localhost:4000/api/v1
NEXT_PUBLIC_WS_URL=ws://localhost:4000/api/v1/live
```

See `.env.example` files for complete configuration templates.

---

## 📊 Performance & Scaling

### Current Optimizations
- ✅ Database query optimization with indexes
- ✅ Connection pooling
- ✅ Response caching
- ✅ Gzip compression
- ✅ Image optimization (WebP format)

### Production Recommendations
- 🔄 Redis for session & rate-limit caching
- 📦 Database replication (MySQL Master-Slave)
- 🎯 Load balancing (Nginx, HAProxy)
- 📈 CDN for static assets (Cloudflare)
- 📊 Monitoring & alerting (Prometheus, Grafana)

---

## 🤝 Contributing

We welcome contributions! Please follow these steps:

1. **Fork** the repository
2. **Create** a feature branch (`git checkout -b feature/amazing-feature`)
3. **Commit** changes (`git commit -m 'Add amazing feature'`)
4. **Push** to the branch (`git push origin feature/amazing-feature`)
5. **Open** a Pull Request

### Code Standards
- TypeScript strict mode enabled
- ESLint configuration enforced
- Unit tests required for new features
- Code review before merge

---

## 📋 Important Notes

### Git Best Practices
- ✅ Never commit `.env` files or secrets
- ✅ `.next`, `dist`, `node_modules` are git-ignored
- ✅ Lock files (`package-lock.json`) should be committed

### Development Workflow
1. Create feature branch from `main`
2. Add tests for new features
3. Ensure all tests pass: `npm run test`
4. Submit pull request for review

---

## 📈 Roadmap

- [ ] Mobile app (React Native)
- [ ] Advanced analytics dashboard
- [ ] Multi-currency support
- [ ] Third-party payment integrations
- [ ] AI-powered recommendation engine
- [ ] Blockchain verification layer

---

## 🐛 Issue Reporting

Found a bug? Please create an issue with:
- Clear description of the problem
- Steps to reproduce
- Expected vs actual behavior
- Screenshots/logs if applicable

---

## 📄 License

This project is licensed under the **MIT License** - see the [LICENSE](./LICENSE) file for details.

---

## 💡 Acknowledgments

- Built with ❤️ using Next.js, Fastify, and TypeScript
- Inspired by modern fintech platforms
- Special thanks to all contributors

---

## 📞 Support & Contact

- 📧 Email: support@carraffle.dev
- 🐦 Twitter: [@CarRaffle](https://twitter.com)
- 💬 Discord: [Join Community](#)
- 📖 Documentation: [Wiki](#)

---

<div align="center">

**Made with ❤️ for the community**

[⬆ Back to top](#-car-raffle-platform--سامانه-قرعه‌کشی-خودرو)

</div>
