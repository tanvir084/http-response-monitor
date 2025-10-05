# HTTP Response Monitor API

A robust NestJS-based HTTP endpoint monitoring service with real-time WebSocket updates, comprehensive logging, and full API documentation.

---

## 📋 Table of Contents

- [Features](#features)
- [Technology Stack](#technology-stack)
- [Architecture Overview](#architecture-overview)
- [Setup Instructions](#setup-instructions)
- [API Documentation](#api-documentation)
- [Database Schema](#database-schema)
- [Testing Strategy](#testing-strategy)
- [Deployment](#deployment)
- [Future Improvements](#future-improvements)
- [Troubleshooting](#troubleshooting)

---

## ✨ Features

- 🔄 **Scheduled HTTP Monitoring** - Automatically pings external endpoints every 5 minutes
- ⚡ **Real-Time Updates** - WebSocket broadcasts new responses to connected clients
- 💾 **Data Persistence** - MongoDB storage with full request/response details
- 🚀 **REST API** - Complete CRUD operations with pagination and statistics
- 📚 **Interactive API Docs** - Swagger/OpenAPI documentation at `/api/docs`
- 🧪 **Comprehensive Testing** - Unit and integration tests with high coverage
- 📊 **Production Logging** - Structured logging for debugging and monitoring
- 🛡️ **Error Handling** - Global exception filters with consistent responses
- 🔒 **Type Safety** - Full TypeScript implementation

---

## 🛠️ Technology Stack

### Core Technologies

- ![NestJS](https://img.shields.io/badge/NestJS-v10.4-E0234E?logo=nestjs&logoColor=white) - Progressive Node.js framework
- ![TypeScript](https://img.shields.io/badge/TypeScript-v5.9-3178C6?logo=typescript&logoColor=white) - Type-safe development
- ![MongoDB](https://img.shields.io/badge/MongoDB-v6.0-47A248?logo=mongodb&logoColor=white) - NoSQL database
- ![Mongoose](https://img.shields.io/badge/Mongoose-v8.8-880000) - MongoDB object modeling

### Key Libraries

- ![Socket.IO](https://img.shields.io/badge/Socket.IO-v4.8-010101?logo=socket.io&logoColor=white) - Real-time WebSocket communication
- ![Axios](https://img.shields.io/badge/Axios-v1.7-5A29E4?logo=axios&logoColor=white) - HTTP client with interceptors
- ![Jest](https://img.shields.io/badge/Jest-v29.7-C21325?logo=jest&logoColor=white) - Testing framework
- ![Swagger](https://img.shields.io/badge/Swagger-v8.0-85EA2D?logo=swagger&logoColor=black) - API documentation

### Choice of Technologies and Reasoning

#### NestJS

- **Built-in DI**: Dependency injection out of the box
- **Modular Architecture**: Easy to organize and scale
- **TypeScript Native**: First-class TypeScript support
- **Production Ready**: Battle-tested in enterprise applications

#### MongoDB with Mongoose

- **Flexible Schema**: Handles varying HTTP response structures
- **Time-Series Optimized**: Excellent for monitoring data
- **Easy Scaling**: Simple horizontal scaling
- **Rich Querying**: Powerful aggregation pipelines

#### Socket.IO

- **Reliable**: Automatic fallback to polling
- **Auto-reconnection**: Built-in reconnection handling
- **Cross-browser**: Works everywhere
- **Room Support**: Easy client grouping

#### Cron Scheduling

- **Native Integration**: @nestjs/schedule works seamlessly
- **Simple Syntax**: Standard cron expressions
- **Reliable**: Proven task scheduling mechanism

---

## 📋 Prerequisites

- Node.js v18 or higher
- MongoDB v6 or higher
- npm v9 or higher

---

## 📦 Installation

```bash
# Clone repository
git clone <repository-url>
cd backend

# Install dependencies
npm install

# Copy environment file
cp .env.example .env
```

Edit `.env` file with your configuration.

---

## 🔐 Environment Variables

**Required Configuration:**

```bash
# Application
NODE_ENV=development
PORT=3001

# Database
MONGODB_URI=mongodb://localhost:27017/http-monitor

# CORS
FRONTEND_URL=http://localhost:3000

# Monitoring
MONITOR_TARGET_URL=https://httpbin.org/anything
```

**Variable Details:**

- `NODE_ENV` - Environment mode (development/production/test)
- `PORT` - Application port (default: 3001)
- `MONGODB_URI` - MongoDB connection string
- `FRONTEND_URL` - Frontend URL for CORS configuration
- `MONITOR_TARGET_URL` - External endpoint to monitor

---

## 🚀 Setup Instructions

### Local Development

```bash
# 1. Start MongoDB
mongod
# OR with Docker
docker run -d -p 27017:27017 --name mongodb mongo:6

# 2. Start application
npm run start:dev

# Application runs at:
# API: http://localhost:3001
# Swagger: http://localhost:3001/api/docs
# Health: http://localhost:3001/health
```

### Docker

```bash
# Start everything (MongoDB + Backend)
docker-compose up -d

# View logs
docker-compose logs -f

# Stop
docker-compose down

# Application runs at:
# API: http://localhost:3001
# MongoDB: localhost:27018
```

---

## 📜 Available Scripts

**Development**
- `npm run start:dev` - Start with hot reload
- `npm run start:debug` - Start with debugger

**Production**
- `npm run start` - Start production server
- `npm run build` - Build for production

**Testing**
- `npm test` - Run unit tests (16 tests)
- `npm run test:e2e` - Run integration tests (23 tests)
- `npm run test:all` - Run all tests (39 total)
- `npm run test:cov` - Generate coverage report

**Code Quality**
- `npm run lint` - Lint code
- `npm run format` - Format code with Prettier

---

## 📖 API Documentation

### Interactive Documentation

Access Swagger UI at: `http://localhost:3001/api/docs`

### Core Endpoints

#### 🏥 Health Check
```http
GET /health
Returns application health status with system metrics
```

#### 🎯 Trigger Manual Ping
```http
POST /api/responses/trigger
Manually trigger HTTP endpoint monitoring
```

#### 📊 Get Historical Responses
```http
GET /api/responses?page=1&limit=50
Retrieve paginated historical response data
```

#### 🔍 Get Response by ID
```http
GET /api/responses/:id
Retrieve specific response by MongoDB ID
```

#### 📈 Get Statistics
```http
GET /api/responses/statistics
Get aggregated statistics (total, success rate, avg response time)
```

### 🔌 WebSocket Connection

```javascript
import io from 'socket.io-client';

const socket = io('http://localhost:3001');

socket.on('newResponse', (response) => {
  console.log('New response:', response);
});
```

---

## 🗄️ Database Schema

**Collection:** `http_responses`

```javascript
{
  url: String,              // Target URL
  statusCode: Number,       // HTTP status (0 for errors)
  requestPayload: Object,   // Request body
  responseData: Object,     // Response data
  headers: Object,          // Response headers
  responseTime: Number,     // Time in milliseconds
  error: String,            // Error message (if failed)
  timestamp: Date,          // Request timestamp
  createdAt: Date,          // Auto-generated
  updatedAt: Date           // Auto-generated
}
```

**Indexes:** `timestamp`, `statusCode`, `url` for optimized queries

---

## 🧪 Testing Strategy

### Test Coverage
- **Unit Tests:** 16 test cases covering service methods and business logic
- **Integration Tests:** 23 test cases covering complete workflows
- **Total:** 39 tests with approximately 95% code coverage

### Running Tests

```bash
# All tests
npm run test:all

# Unit tests only
npm test

# Integration tests only
npm run test:e2e

# Coverage report
npm run test:cov

# Watch mode
npm run test:watch
```

### What Gets Tested

**Unit Tests** - Individual service methods, business logic, error handling

**Integration Tests** - Complete end-to-end workflows including:
- Full flow: Trigger → Store → Broadcast → Retrieve
- All REST API endpoints with validation
- WebSocket communication with multiple clients
- MongoDB data persistence and queries
- Error scenarios and edge cases
- Performance with large datasets

---

## 📁 Project Structure

```
backend/
├── src/
│   ├── common/                    # Shared utilities
│   │   ├── filters/               # Exception filters
│   │   └── interceptors/          # Logging interceptors
│   ├── http-monitor/              # Main module
│   │   ├── schemas/               # MongoDB schemas
│   │   ├── events.gateway.ts      # WebSocket
│   │   ├── http-monitor.controller.ts
│   │   ├── http-monitor.service.ts
│   │   └── http-monitor.module.ts
│   ├── app.controller.ts
│   ├── app.service.ts
│   ├── app.module.ts
│   └── main.ts
├── test/                          # Tests
├── docker-compose.yml             # Docker setup
├── Dockerfile
└── .env                           # Configuration
```

---

## 🏗️ Architecture Overview

```
┌─────────────┐         ┌──────────────────┐         ┌─────────────┐
│   Client    │ ◄─────► │   NestJS API     │ ◄─────► │   MongoDB   │
│  (Browser)  │         │   (Port 3001)    │         │             │
└─────────────┘         └──────────────────┘         └─────────────┘
       │                        │
       │ WebSocket              │ HTTP
       │                        │
       ▼                        ▼
┌─────────────┐         ┌──────────────────┐
│ Socket.IO   │         │  External API    │
│   Client    │         │  (httpbin.org)   │
└─────────────┘         └──────────────────┘
```

### Request Flow

1. ⏰ Cron job triggers every 5 minutes
2. 🌐 Service makes HTTP request to external endpoint
3. 💾 Response saved to MongoDB
4. 📡 WebSocket broadcasts to connected clients
5. 📊 Data available via REST API

---

## 💡 Key Design Decisions

### Why NestJS?
Built-in dependency injection, modular architecture, excellent TypeScript support, and production-ready features make it ideal for scalable backend services.

### Why MongoDB?
Flexible schema accommodates varying HTTP response structures. Excellent for time-series data with fast writes and simple horizontal scaling.

### Why Socket.IO?
Provides reliable WebSocket communication with automatic fallback to polling, reconnection handling, and cross-browser compatibility.

### Why Global Exception Filter?
Ensures consistent error response format across all endpoints, centralized logging with context, and better debugging in production.

### Why Cron Scheduling?
Simple, reliable scheduled task execution with native NestJS integration and easy configuration.

---

## 🌐 Deployment

The application can be deployed on various platforms:

- **Railway** - Built-in MongoDB, Docker support, auto-deployments
- **Render** - Free tier, easy PostgreSQL/MongoDB integration
- **Heroku** - Simple deployment, extensive add-ons
- **Docker** - Container-based deployment on any platform

Configure environment variables according to your platform's requirements.

---

## 📝 Assumptions Made

1. **MongoDB Availability**: MongoDB instance is accessible and running
2. **External API**: httpbin.org is publicly accessible
3. **Network Stability**: Reasonable connection for scheduled pings
4. **Single Instance**: Application runs as single instance (no clustering)
5. **Time Zones**: Timestamps stored in UTC, displayed per client timezone
6. **Data Retention**: No automatic cleanup of old records

---

## 🔮 Future Improvements

### Features
- Multi-endpoint monitoring with configurable targets
- Alert system for failures and thresholds
- Custom webhook notifications
- Data retention policies and archiving

### Technical
- Redis caching for statistics
- Database query optimization
- API rate limiting

### Developer Experience
- Enhanced API documentation
- Performance monitoring

---

## 🔧 Troubleshooting

### MongoDB Connection Issues
```bash
# Verify MongoDB is running
mongosh

# For Docker, check container status
docker ps
```

### Port Conflicts
```bash
# Check what's using port 3001
lsof -ti:3001

# Kill process if needed
lsof -ti:3001 | xargs kill -9
```

### Docker Issues
```bash
# Rebuild containers
docker-compose up --build -d

# View logs
docker-compose logs -f backend

# Clean restart
docker-compose down
docker-compose up -d
```

---

## 🤝 Contributing

### Development Workflow

1. Create feature branch from `main`
2. Make changes with tests
3. Run `npm test` and `npm run lint`
4. Submit pull request

### Code Style

- Follow NestJS best practices
- Write unit tests for new features
- Use dependency injection
- Document complex logic
- Keep controllers thin

---

## 📄 License

MIT License - feel free to use for learning and projects.

---

## 💬 Support

For issues or questions, open a GitHub issue or review existing documentation.