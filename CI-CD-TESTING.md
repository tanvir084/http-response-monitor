# 🔄 CI/CD Pipeline & Testing Strategy

## 📋 Overview

This project uses GitHub Actions for continuous integration with separate workflows for frontend and backend. Each workflow runs linting, testing, and build checks automatically on every push and pull request.

---

## 📁 CI/CD Structure

```
.github/
└── workflows/
    ├── backend-ci.yml      # Backend pipeline
    └── frontend-ci.yml     # Frontend pipeline
```

---

## 🔧 Pipeline Configuration

### Backend Pipeline (NestJS)

**Triggers:**
- 🔀 Push to `main` or `develop` branches
- 🔀 Pull requests to `main` or `develop`
- 📂 Only when backend files change

**Jobs:**

1. **✅ Lint Check**
   - ESLint validation
   - Prettier formatting check
   - Ensures code style consistency

2. **🧪 Test Suite**
   - Unit tests (16 tests)
   - Integration tests (23 tests)
   - MongoDB service for integration tests

3. **🏗️ Build Check**
   - Production build verification
   - Artifact upload for deployment

### Frontend Pipeline (React + Vite)

**Triggers:**
- 🔀 Push to `main` or `develop` branches
- 🔀 Pull requests to `main` or `develop`
- 📂 Only when frontend files change

**Jobs:**

1. **✅ Lint Check**
   - ESLint validation
   - Code style enforcement

2. **🧪 Test Suite**
   - Component tests (15 tests)
   - Vitest runner

3. **🏗️ Build Check**
   - Production build verification
   - Artifact upload for deployment

---

## 🎯 Core Components Tested

### Backend Core Components

#### 1. **HttpMonitorService** (PRIMARY FOCUS)

**Why it's core:**
- 🎯 Orchestrates the entire monitoring workflow
- ⏰ Handles scheduled pings (business logic)
- 💾 Manages data persistence
- 📡 Coordinates WebSocket broadcasts

**Test Coverage:**
- ✅ Successful HTTP request handling
- ✅ Error response handling
- ✅ Random payload generation
- ✅ MongoDB data persistence
- ✅ WebSocket event broadcasting
- ✅ Timeout handling
- ✅ Manual trigger functionality

**Test Types:**
```typescript
// Unit Tests (16 tests)
- pingEndpoint() success scenarios
- pingEndpoint() error scenarios
- getHistoricalData() pagination
- getStatistics() calculations
- triggerManualPing() execution

// Integration Tests (23 tests)
- Full workflow: Trigger → Store → Broadcast → Retrieve
- REST API endpoints
- WebSocket communication
- Database operations
- EventsGateway instance verification
```

#### 2. **HttpMonitorController**

**Why it's core:**
- 🚀 Primary API interface
- 🔐 Request validation and transformation
- ⚠️ Error handling

**Test Coverage:**
- ✅ GET /api/responses (pagination)
- ✅ GET /api/responses/:id
- ✅ GET /api/responses/statistics
- ✅ POST /api/responses/trigger
- ✅ Input validation
- ✅ Error responses

#### 3. **EventsGateway**

**Why it's core:**
- 🔌 Real-time communication layer
- 👥 Client connection management

**Test Coverage:**
- ✅ Client connection handling
- ✅ Event broadcasting to multiple clients
- ✅ Connection lifecycle management
- ✅ Gateway instance availability

### Frontend Core Components

#### 1. **ResponseTable Component** (PRIMARY FOCUS)

**Why it's core:**
- 📊 Main data visualization component
- 🖱️ Complex user interactions
- 🎯 Critical for monitoring workflow

**Test Coverage:**
- ✅ Loading state rendering
- ✅ Empty state handling
- ✅ Data rendering with formatting
- ✅ Row expansion/collapse
- ✅ Pagination controls
- ✅ Status badge display
- ✅ Error display
- ✅ Accessibility attributes

**Test Types:**
```typescript
// Component Tests (15 tests)
- Rendering states (loading, empty, populated)
- User interactions (expand, paginate)
- Data formatting (dates, status codes)
- Edge cases (error display, boundary conditions)
```

#### 2. **useApi Hook**

**Why it's core:**
- 🌐 Centralized API communication
- ⚠️ Error handling and logging
- 🔄 Request/response transformation

#### 3. **useWebSocket Hook**

**Why it's core:**
- ⚡ Real-time data updates
- 🔌 Connection management
- 🔄 Automatic reconnection

---

## 📊 Test Categories

### Unit Tests

**Purpose:** Test individual functions and methods in isolation

**Backend Examples:**
- 🔧 Service method logic
- 🔄 Data transformation functions
- 🛠️ Utility functions
- ✅ Business logic validation

**Frontend Examples:**
- 🎨 Component rendering logic
- 🪝 Hook behavior
- 🛠️ Helper functions
- 📦 State management

### Integration Tests

**Purpose:** Test how components work together

**Backend Examples:**
- 🚀 Full API endpoint workflows
- 🗄️ Database + Service interaction
- 🔌 WebSocket + Service communication
- ⏰ Cron job + HTTP client + Database
- 🔗 Gateway instance verification

**Frontend Examples:**
- 🧩 Component + Hook integration
- 🌐 API calls + State updates
- 👤 User flow simulations

### End-to-End Tests (Future)

**Purpose:** Test complete user workflows

**Planned Examples:**
- 👁️ User views dashboard → sees real-time updates
- 🎯 User triggers manual ping → sees new response
- 📄 User navigates pages → data loads correctly

---

## 🧪 Running Tests Locally

### Backend

```bash
cd backend

# All tests (39 total)
npm run test:all

# Unit tests only (16 tests)
npm test

# Integration tests only (23 tests)
npm run test:e2e

# With coverage report
npm run test:cov

# Watch mode
npm run test:watch
```

### Frontend

```bash
cd frontend

# Run tests
npm test

# With coverage report
npm run test:coverage

# Watch mode
npm run test:watch
```

---

## 🚀 CI Pipeline Workflow

```
┌─────────────────┐
│   Push/PR       │
└────────┬────────┘
         │
         ├──────────────────┬──────────────────┐
         │                  │                  │
    ┌────▼─────┐      ┌────▼─────┐      ┌────▼─────┐
    │  Backend │      │ Frontend │      │  Docker  │
    │    CI    │      │    CI    │      │  Build   │
    └────┬─────┘      └────┬─────┘      └──────────┘
         │                  │
    ┌────▼─────┐      ┌────▼─────┐
    │   Lint   │      │   Lint   │
    └────┬─────┘      └────┬─────┘
         │                  │
    ┌────▼─────┐      ┌────▼─────┐
    │   Test   │      │   Test   │
    └────┬─────┘      └────┬─────┘
         │                  │
    ┌────▼─────┐      ┌────▼─────┐
    │  Build   │      │  Build   │
    └──────────┘      └──────────┘
```

---

## ✅ Success Criteria

**Pull requests must pass:**
- ✅ All linting checks
- ✅ All unit tests
- ✅ All integration tests
- ✅ Production build succeeds

---

## 🎯 Future Improvements

### Testing
- 🎭 Add E2E tests with Playwright
- 📈 Increase frontend test coverage to 90%+
- 📝 Add API contract tests
- ⚡ Performance benchmarks

### CI/CD
- 🚀 Add deployment workflows
- 🏷️ Implement semantic versioning
- 🐳 Docker image publishing
- 📋 Automated changelog generation

### Monitoring
- 📊 Add test performance tracking
- 🔍 Flaky test detection
- ⏱️ Build time optimization

---

## 📝 Best Practices

### Writing Tests

1. **Follow AAA Pattern**
   ```typescript
   // Arrange
   const mockData = createMockData();
   
   // Act
   const result = await service.method(mockData);
   
   // Assert
   expect(result).toBeDefined();
   ```

2. **Use Descriptive Names**
   ```typescript
   it('should return 404 when response ID does not exist')
   ```

3. **Test Behavior, Not Implementation**
   - 🎯 Focus on what the component does
   - ❌ Avoid testing internal implementation details

4. **Isolate Tests**
   - 🔒 Each test should be independent
   - 🧹 Use beforeEach/afterEach for setup/cleanup

### CI Optimization

1. **💾 Cache Dependencies**
   - npm cache is enabled in workflows
   - Speeds up build times

2. **⚡ Run Tests in Parallel**
   - Backend and frontend run simultaneously
   - Separate jobs for lint/test/build

3. **🎯 Skip Unnecessary Builds**
   - Workflows only trigger on relevant file changes
   - Saves CI minutes

---

## 🆘 Troubleshooting

### CI Failures

**Lint Errors:**
```bash
# Fix automatically
npm run format
npm run lint -- --fix
```

**Test Failures:**
```bash
# Run tests locally
npm test

# Check specific test
npm test -- -t "test name"
```

**Build Failures:**
```bash
# Clean and rebuild
rm -rf dist node_modules
npm install
npm run build
```

---

## 📚 Resources

- 📖 [GitHub Actions Documentation](https://docs.github.com/en/actions)
- 🧪 [Jest Testing Framework](https://jestjs.io/)
- ⚡ [Vitest Documentation](https://vitest.dev/)
- 🎯 [Testing Library](https://testing-library.com/)