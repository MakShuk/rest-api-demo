# REST API Project

<p align="right">
  <a href="README.ru.md"><img src="https://img.shields.io/badge/Русский-red?style=for-the-badge&logo=github" alt="Русский"></a>
</p>

A modern REST API built with Node.js, Express, TypeScript, and Prisma for user and task management.

## 🚀 Features

- **User Management**: Registration, authentication, profile management
- **Task Management**: CRUD operations for tasks with priorities and statuses
- **JWT Authentication**: Secure token-based authentication
- **Role-based Access Control**: Admin and User roles
- **API Documentation**: Swagger/OpenAPI documentation
- **Database**: SQLite with Prisma ORM
- **Security**: Helmet, CORS, rate limiting
- **Testing**: Unit and integration tests with Jest
- **Logging**: Winston logger with multiple log levels
- **Validation**: Express-validator for request validation

## 📋 Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** (version 18.0.0 or higher)
- **npm** (comes with Node.js)
- **Git** (for cloning the repository)

## 🛠️ Installation

### 1. Clone the Repository

```bash
git clone <repository-url>
cd rest-api
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Environment Configuration

Create a `.env` file in the root directory:

```bash
cp .env.example .env
```

Or create `.env` manually with the following content:

```env
# Database
DATABASE_URL="file:./prisma/dev.db"

# JWT
JWT_SECRET="your-super-secret-jwt-key-here"
JWT_EXPIRES_IN="24h"

# Server
PORT=3000
NODE_ENV="development"

# Logging
LOG_LEVEL="info"
```

**Important**: Replace `your-super-secret-jwt-key-here` with a strong, unique secret key.

### 4. Database Setup

Generate Prisma client and run migrations:

```bash
# Generate Prisma client
npm run prisma:generate

# Run database migrations
npm run prisma:migrate
```

### 5. Build the Project

```bash
npm run build
```

## 🚀 Running the Application

### Development Mode

```bash
npm run dev
```

The server will start on `http://localhost:3000` with hot reload enabled.

### Production Mode

```bash
npm start
```

## 📚 API Documentation

Once the server is running, you can access the API documentation at:

- **Swagger UI**: `http://localhost:3000/api-docs`

## 🧪 Testing

### Run All Tests

```bash
npm test
```

### Run Unit Tests Only

```bash
npm run test:unit
```

### Run Integration Tests Only

```bash
npm run test:integration
```

### Run Tests with Coverage

```bash
npm run test:coverage
```

### Watch Mode

```bash
npm run test:watch
```

## 📊 Database Management

### View Database

```bash
npm run prisma:studio
```

This opens Prisma Studio at `http://localhost:5555` for database visualization.

### Reset Database

```bash
npx prisma migrate reset
```

## 🔧 Development Tools

### Linting

```bash
# Check for linting errors
npm run lint

# Fix linting errors automatically
npm run lint:fix
```

### Code Formatting

The project uses Prettier for code formatting. Configure your IDE to format on save.

## 📁 Project Structure

```
rest-api/
├── src/
│   ├── controllers/     # Request handlers
│   ├── middleware/      # Express middleware
│   ├── routes/         # API routes
│   ├── services/       # Business logic
│   ├── models/         # Database models
│   ├── utils/          # Utility functions
│   ├── types/          # TypeScript type definitions
│   ├── config/         # Configuration files
│   └── __tests__/      # Test files
├── prisma/
│   ├── schema.prisma   # Database schema
│   └── migrations/     # Database migrations
├── dist/               # Compiled JavaScript files
├── docs/               # Documentation
└── logs/               # Application logs
```

## 🔐 API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login

### Users
- `GET /api/users` - Get all users (Admin only)
- `GET /api/users/profile` - Get current user profile
- `PUT /api/users/profile` - Update current user profile
- `DELETE /api/users/:id` - Delete user (Admin only)

### Tasks
- `GET /api/tasks` - Get user's tasks
- `POST /api/tasks` - Create new task
- `PUT /api/tasks/:id` - Update task
- `DELETE /api/tasks/:id` - Delete task

## 🐛 Troubleshooting

### Common Issues

1. **Port already in use**
   ```bash
   Error: listen EADDRINUSE: address already in use :::3000
   ```
   Solution: Change the PORT in `.env` file or kill the process using port 3000.

2. **Database connection issues**
   ```bash
   Error: P1003: Database does not exist
   ```
   Solution: Run `npm run prisma:migrate` to create the database.

3. **JWT Secret not set**
   ```bash
   Error: JWT_SECRET is not defined
   ```
   Solution: Set JWT_SECRET in your `.env` file.

## 📝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the ISC License.

## 🤝 Support

If you have any questions or need help, please open an issue in the repository.
