# HTTP Response Monitor Dashboard

Real-time HTTP monitoring dashboard built with React, TypeScript, and WebSocket for monitoring httpbin.org endpoint responses.

## 📋 Table of Contents

- [Features](#features)
- [Technology Stack](#technology-stack)
- [Architecture Overview](#architecture-overview)
- [Setup Instructions](#setup-instructions)
- [Testing Strategy](#testing-strategy)
- [Deployment](#deployment)
- [Future Improvements](#future-improvements)

## ✨ Features

- 🔄 Real-time response monitoring via WebSocket
- 📊 Paginated historical data display
- 🔍 Expandable row details for request/response inspection
- 📈 Statistics dashboard with success/failure metrics
- 🎯 Manual ping triggering
- 📱 Responsive design with loading and error states
- ⚠️ Professional error handling and user feedback

## 🛠️ Technology Stack

### Core Technologies

- ⚛️ **React 19.1** - UI library
- 🔷 **TypeScript 5.9** - Type safety
- ⚡ **Vite 7.1** - Build tool and dev server

### Key Libraries

- ![Socket.IO](https://img.shields.io/badge/Socket.IO_Client-v4.8-010101?logo=socket.io&logoColor=white) - WebSocket real-time communication
- ![Axios](https://img.shields.io/badge/Axios-v1.12-5A29E4?logo=axios&logoColor=white) - HTTP client with interceptors
- ![Vitest](https://img.shields.io/badge/Vitest-v3.2-6E9F18?logo=vitest&logoColor=white) - Unit testing framework
- ![React Testing Library](https://img.shields.io/badge/React_Testing_Library-v16.3-E33332?logo=testing-library&logoColor=white) - Component testing

### Choice of Technologies and Reasoning

#### React with Vite

- **Fast Development**: Vite provides instant HMR and optimized builds
- **Modern Tooling**: Native ES modules, minimal configuration
- **TypeScript Integration**: First-class TypeScript support
- **Performance**: Efficient bundling and code splitting

#### TypeScript

- **Type Safety**: Catch errors at compile time
- **Better IDE Support**: Autocomplete and refactoring
- **Code Documentation**: Interfaces serve as documentation
- **Maintainability**: Easier to refactor and scale

#### Socket.IO

- **Real-time Updates**: Bi-directional communication
- **Auto-reconnection**: Built-in reconnection logic
- **Fallback Support**: Works with polling if WebSocket unavailable
- **Cross-browser**: Consistent behavior across browsers

#### Custom Hooks Pattern

- **Separation of Concerns**: Business logic separate from UI
- **Reusability**: Hooks can be reused across components
- **Testability**: Easier to test isolated logic
- **Clean Code**: Keeps components focused on rendering

## 🏗️ Architecture Overview

### Project Structure

```
frontend/
├── src/
│   ├── components/          # React components
│   │   ├── ResponseTable.tsx
│   │   ├── ResponseTable.test.tsx
│   │   ├── ResponseTable.css
│   │   ├── Statistics.tsx
│   │   └── Statistics.css
│   ├── hooks/               # Custom React hooks
│   │   ├── useApi.ts       # API methods with axios
│   │   └── useWebSocket.ts # WebSocket connection
│   ├── types.ts            # TypeScript interfaces
│   ├── App.tsx             # Root component
│   ├── App.css
│   ├── main.tsx            # Entry point
│   └── index.css
├── public/                  # Static assets
├── Dockerfile              # Container configuration
├── nginx.conf              # Production server config
├── docker-compose.yml      # Local container orchestration
├── .env                    # Environment variables
├── package.json
├── tsconfig.json
├── vite.config.ts
└── vitest.config.ts
```

### Component Architecture

```
App (Root)
├── Statistics (Dashboard Cards)
└── ResponseTable (Data Display)
    └── Expandable Rows (Detail View)

Hooks (Shared Logic)
├── useApi (HTTP Requests)
└── useWebSocket (Real-time Updates)
```

### Data Flow

1. **Initial Load**: App fetches paginated responses and statistics via `useApi`
2. **Real-time Updates**: WebSocket hook listens for new responses
3. **User Actions**: Manual ping and refresh trigger API calls
4. **State Management**: React hooks manage local component state
5. **Error Handling**: Centralized error handling in API interceptors

### State Management

- **Local State**: React `useState` for component-specific state
- **Effect Hook**: `useEffect` for data fetching and WebSocket setup
- **Custom Hooks**: Encapsulate reusable logic (API, WebSocket)
- **No Global State**: Application complexity doesn't require Redux/Context

## 🚀 Setup Instructions

### Prerequisites

- Node.js 20+ and npm
- Backend server running on port 3001

### Local Development

```bash
# Install dependencies
npm install

# Create environment file
cp .env.example .env

# Start development server
npm run dev
```

Access at: http://localhost:5173

### Production Build

```bash
# Build optimized production bundle
npm run build

# Preview production build locally
npm run preview
```

### Docker Setup

```bash
# Build and run with Docker
docker-compose up --build

# Stop containers
docker-compose down
```

Access at: http://localhost:3000

### Environment Variables

Create `.env` file:

```properties
VITE_API_URL=http://localhost:3001
```

For production, update `VITE_API_URL` to your backend URL.

## 🧪 Testing Strategy

### Testing Approach

- **Unit Tests**: Component logic and rendering
- **Integration Tests**: User interactions and state changes
- **Manual Testing**: Visual and functional verification

### Core Components Tested

1. **ResponseTable Component**
   - Loading and empty states
   - Data rendering with correct formatting
   - Row expansion/collapse functionality
   - Pagination controls
   - Error display

### Running Tests

```bash
# Run all tests
npm test

# Run with coverage
npm run test:coverage
```

### Test Coverage

- ResponseTable: 15 test cases covering all major functionality
- Focus on user interactions and edge cases
- Accessibility attributes validated

### Testing Tools

- **Vitest**: Fast unit test runner with Jest-compatible API
- **React Testing Library**: User-centric component testing
- **@testing-library/jest-dom**: Custom Jest matchers

## 🌐 Deployment

The application can be deployed on various platforms:

- **Vercel** - Automatic deployments, optimized for React/Vite
- **Railway** - Full-stack deployment with backend integration
- **Netlify** - Simple static site hosting
- **Docker** - Container-based deployment on any platform

Configure `VITE_API_URL` environment variable to point to your backend service.

## 📝 Assumptions Made

1. **Backend Availability**: Backend server is accessible at configured URL
2. **Browser Support**: Modern browsers with WebSocket support
3. **Network Stability**: Reasonable internet connection for WebSocket
4. **Data Volume**: Pagination handles large datasets efficiently
5. **Time Zones**: Timestamps displayed in user's local timezone
6. **Single User**: No authentication or user management required

## 🔮 Future Improvements

### Features
- Advanced filtering (status code, date range, response time)
- Data visualization with charts and graphs
- Export functionality (CSV, JSON, PDF)
- Real-time alerts and notifications

### Technical
- E2E tests with Playwright/Cypress
- Dark mode support
- Virtual scrolling for performance
- Enhanced mobile responsiveness

### Developer Experience
- Storybook for component documentation
- CI/CD pipeline improvements
- Pre-commit hooks for code quality

## 🤝 Contributing

### Development Workflow

1. Create feature branch from `main`
2. Make changes with tests
3. Run `npm test` and `npm run lint`
4. Submit pull request

### Code Style

- Follow existing TypeScript patterns
- Use functional components with hooks
- Keep components under 300 lines
- Write self-documenting code
- Add comments for complex logic only

## 📄 License

MIT License - feel free to use for learning and projects.

## 💬 Support

For issues or questions, open a GitHub issue or review existing documentation.