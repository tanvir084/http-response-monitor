# HTTP Response Monitor

Full-stack application for monitoring HTTP endpoints with real-time updates, built with NestJS and React.

![Backend CI](https://github.com/tanvir084/http-response-monitor/workflows/Backend%20CI/badge.svg)
![Frontend CI](https://github.com/tanvir084/http-response-monitor/workflows/Frontend%20CI/badge.svg)

---

## 📋 Table of Contents

- [Features](#features)
- [Tech Stack](#tech-stack)
- [Quick Start](#quick-start)
- [Project Structure](#project-structure)
- [Testing](#testing)
- [Documentation](#documentation)
- [Architecture](#architecture)
- [Deployment](#deployment)
- [Contributing](#contributing)
- [License](#license)
- [Support](#support)

---

## ✨ Features

- 🔄 **Real-time Monitoring** - WebSocket updates for instant response notifications
- ⏰ **Scheduled Pings** - Automatic endpoint checks every 5 minutes
- 📊 **Historical Data** - Paginated response history with detailed views
- 📈 **Statistics Dashboard** - Success rates, failure counts, and average response times
- 🚀 **REST API** - Complete CRUD operations with Swagger documentation
- 🧪 **Comprehensive Testing** - 54 total tests with high coverage
- 🐳 **Docker Support** - One-command deployment for all services
- ⚡ **CI/CD Pipeline** - Automated testing and build verification

---

## 🛠️ Tech Stack

### Backend

- ![NestJS](https://img.shields.io/badge/NestJS-v10.4-E0234E?logo=nestjs&logoColor=white) - Progressive Node.js framework
- ![TypeScript](https://img.shields.io/badge/TypeScript-v5.9-3178C6?logo=typescript&logoColor=white) - Type-safe development
- ![MongoDB](https://img.shields.io/badge/MongoDB-v6.0-47A248?logo=mongodb&logoColor=white) - NoSQL database
- ![Socket.IO](https://img.shields.io/badge/Socket.IO-v4.8-010101?logo=socket.io&logoColor=white) - Real-time communication

### Frontend

- ![React](https://img.shields.io/badge/React-v19.1-61DAFB?logo=react&logoColor=black) - UI library
- ![TypeScript](https://img.shields.io/badge/TypeScript-v5.9-3178C6?logo=typescript&logoColor=white) - Type safety
- ![Vite](https://img.shields.io/badge/Vite-v7.1-646CFF?logo=vite&logoColor=white) - Build tool
- ![Socket.IO](https://img.shields.io/badge/Socket.IO_Client-v4.8-010101?logo=socket.io&logoColor=white) - WebSocket client

---

## 📁 Project Structure

```
.
├── backend/                 # NestJS backend service
│   ├── src/
│   │   ├── http-monitor/   # Core monitoring module
│   │   ├── common/         # Shared utilities
│   │   └── main.ts
│   ├── test/               # Test suites
│   ├── Dockerfile
│   └── README.md
├── frontend/               # React frontend application
│   ├── src/
│   │   ├── components/     # React components
│   │   ├── hooks/          # Custom hooks
│   │   └── types.ts
│   ├── Dockerfile
│   ├── nginx.conf
│   └── README.md
├── .github/
│   └── workflows/          # CI/CD pipelines
├── docker-compose.yml      # Docker orchestration
├── CI-CD-TESTING.md       # Testing documentation
└── README.md              # This file
```

---

## 🚀 Quick Start

### Prerequisites

- Node.js 20+
- Docker & Docker Compose
- MongoDB 6+ (or use Docker)

### Option 1: Docker (Recommended)

```bash
# Clone repository
git clone <repository-url>
cd http-response-monitor

# Start all services
docker-compose up --build
```

**Access Points:**
- 🌐 **Frontend**: http://localhost:3000
- 🔌 **Backend API**: http://localhost:3001
- 📚 **API Docs**: http://localhost:3001/api/docs
- 🗄️ **MongoDB**: localhost:27018

### Option 2: Local Development

**Backend:**
```bash
cd backend
cp .env.example .env
npm install
npm run start:dev
```

**Frontend:**
```bash
cd frontend
cp .env.example .env
npm install
npm run dev
```

---

## 🧪 Testing

### Backend Tests (39 total)

```bash
cd backend

# All tests
npm run test:all

# Unit tests (16)
npm test

# Integration tests (23)
npm run test:e2e

# With coverage
npm run test:cov
```

### Frontend Tests (15 total)

```bash
cd frontend

# Run tests
npm test

# With coverage
npm run test:coverage
```

**Total Test Coverage:** 54 tests across both applications

---

## 📖 Documentation

Detailed documentation for each part of the application:

- 📘 [**Backend Documentation**](./backend/README.md) - API, architecture, and setup
- 📗 [**Frontend Documentation**](./frontend/README.md) - Components, hooks, and features
- 🧪 [**CI/CD & Testing**](./CI-CD-TESTING.md) - Pipelines and test strategy

---

## 🏗️ Architecture

```
┌──────────────┐         ┌──────────────┐         ┌──────────────┐
│   Frontend   │ ◄─────► │   Backend    │ ◄─────► │   MongoDB    │
│    React     │         │   NestJS     │         │   Database   │
│   (Port 3000)│         │  (Port 3001) │         │  (Port 27018)│
└──────────────┘         └──────────────┘         └──────────────┘
       │                        │
       │ WebSocket              │ HTTP Requests
       │ (Real-time)            │ (External API)
       │                        │
       └────────────────────────▼
                          ┌──────────────┐
                          │  httpbin.org │
                          │  (Monitoring)│
                          └──────────────┘
```

### Key Features

1. **Scheduled Monitoring**: Cron job pings httpbin.org every 5 minutes
2. **Real-time Updates**: WebSocket broadcasts new responses to all connected clients
3. **Data Persistence**: MongoDB stores complete request/response history
4. **REST API**: Full CRUD operations with pagination and statistics
5. **Docker Ready**: Complete containerization with docker-compose

---

## 🌐 Deployment

The application can be deployed on various platforms:

- **Railway** - Full-stack deployment with built-in MongoDB
- **Vercel** - Frontend deployment with backend on Railway/Render
- **Render** - Full-stack with managed services
- **Docker** - Self-hosted on any container platform

Configure environment variables according to your platform's requirements.

---

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open Pull Request

### Development Guidelines

- Follow TypeScript best practices
- Write tests for new features
- Run linting before committing: `npm run lint`
- Ensure all tests pass: `npm test`
- Update documentation as needed

---

## 📄 License

MIT License - see [LICENSE](./LICENSE) file for details

---

## 💬 Support

For issues or questions:

- 🐛 [Open a GitHub Issue](https://github.com/YOUR_USERNAME/YOUR_REPO/issues)
- 📖 Check the [documentation](#documentation)
- 💡 Review [CI/CD testing strategy](./CI-CD-TESTING.md)

---

**Built with modern web technologies for reliable HTTP endpoint monitoring.**