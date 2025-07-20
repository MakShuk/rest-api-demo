import swaggerJsdoc from 'swagger-jsdoc';
import { config } from './config';

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'REST API для работы с пользователями',
      version: '1.0.0',
      description: `
        Современный REST API для управления пользователями, построенный на Node.js, Express, TypeScript и Prisma ORM.
        
        ## Особенности
        - JWT аутентификация
        - Ролевая авторизация (Admin/User)
        - Валидация данных
        - Rate limiting
        - Безопасность (Helmet, CORS)
        - Централизованная обработка ошибок
        
        ## Аутентификация
        API использует JWT токены для аутентификации. Получите токен через endpoint /auth/login 
        и используйте его в заголовке Authorization: Bearer <token>
      `,
      contact: {
        name: 'API Support',
        email: 'support@example.com',
      },
      license: {
        name: 'ISC',
      },
    },
    servers: [
      {
        url:
          config.nodeEnv === 'production'
            ? 'https://api.example.com'
            : `http://localhost:${config.port}`,
        description:
          config.nodeEnv === 'production'
            ? 'Production server'
            : 'Development server',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'JWT токен для аутентификации. Формат: Bearer <token>',
        },
      },
      schemas: {
        // User schemas
        UserResponse: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              format: 'uuid',
              description: 'Уникальный идентификатор пользователя',
              example: '123e4567-e89b-12d3-a456-426614174000',
            },
            fullName: {
              type: 'string',
              description: 'Полное имя пользователя',
              example: 'Иван Иванов',
            },
            birthDate: {
              type: 'string',
              format: 'date-time',
              description: 'Дата рождения',
              example: '1990-01-15T00:00:00.000Z',
            },
            email: {
              type: 'string',
              format: 'email',
              description: 'Email адрес',
              example: 'ivan@example.com',
            },
            role: {
              type: 'string',
              enum: ['ADMIN', 'USER'],
              description: 'Роль пользователя',
              example: 'USER',
            },
            status: {
              type: 'string',
              enum: ['ACTIVE', 'INACTIVE'],
              description: 'Статус пользователя',
              example: 'ACTIVE',
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
              description: 'Дата создания',
              example: '2024-01-15T10:30:00.000Z',
            },
            updatedAt: {
              type: 'string',
              format: 'date-time',
              description: 'Дата последнего обновления',
              example: '2024-01-15T10:30:00.000Z',
            },
          },
          required: [
            'id',
            'fullName',
            'birthDate',
            'email',
            'role',
            'status',
            'createdAt',
            'updatedAt',
          ],
        },
        RegisterInput: {
          type: 'object',
          properties: {
            fullName: {
              type: 'string',
              minLength: 2,
              maxLength: 100,
              description: 'Полное имя пользователя',
              example: 'Иван Иванов',
            },
            birthDate: {
              type: 'string',
              format: 'date-time',
              description: 'Дата рождения',
              example: '1990-01-15T00:00:00.000Z',
            },
            email: {
              type: 'string',
              format: 'email',
              description: 'Email адрес',
              example: 'ivan@example.com',
            },
            password: {
              type: 'string',
              minLength: 8,
              description:
                'Пароль (минимум 8 символов, должен содержать буквы, цифры и спецсимволы)',
              example: 'Password123!',
            },
            role: {
              type: 'string',
              enum: ['ADMIN', 'USER'],
              description: 'Роль пользователя (опционально, по умолчанию USER)',
              example: 'USER',
            },
          },
          required: ['fullName', 'birthDate', 'email', 'password'],
        },
        LoginInput: {
          type: 'object',
          properties: {
            email: {
              type: 'string',
              format: 'email',
              description: 'Email адрес',
              example: 'ivan@example.com',
            },
            password: {
              type: 'string',
              description: 'Пароль',
              example: 'Password123!',
            },
          },
          required: ['email', 'password'],
        },
        UserUpdateInput: {
          type: 'object',
          properties: {
            fullName: {
              type: 'string',
              minLength: 2,
              maxLength: 100,
              description: 'Полное имя пользователя',
              example: 'Иван Петров',
            },
            birthDate: {
              type: 'string',
              format: 'date-time',
              description: 'Дата рождения',
              example: '1990-01-15T00:00:00.000Z',
            },
            email: {
              type: 'string',
              format: 'email',
              description: 'Email адрес',
              example: 'ivan.petrov@example.com',
            },
            role: {
              type: 'string',
              enum: ['ADMIN', 'USER'],
              description: 'Роль пользователя (только для админов)',
              example: 'USER',
            },
            status: {
              type: 'string',
              enum: ['ACTIVE', 'INACTIVE'],
              description: 'Статус пользователя (только для админов)',
              example: 'ACTIVE',
            },
          },
        },
        AuthResponse: {
          type: 'object',
          properties: {
            user: {
              $ref: '#/components/schemas/UserResponse',
            },
            token: {
              type: 'string',
              description: 'JWT токен для аутентификации',
              example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
            },
          },
          required: ['user', 'token'],
        },
        ApiResponse: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              description: 'Статус выполнения запроса',
              example: true,
            },
            message: {
              type: 'string',
              description: 'Сообщение о результате',
              example: 'Операция выполнена успешно',
            },
            data: {
              description: 'Данные ответа',
            },
            error: {
              type: 'string',
              description: 'Описание ошибки (только при success: false)',
              example: 'Validation error',
            },
          },
          required: ['success', 'message'],
        },
        PaginatedResponse: {
          allOf: [
            {
              $ref: '#/components/schemas/ApiResponse',
            },
            {
              type: 'object',
              properties: {
                data: {
                  type: 'array',
                  items: {
                    $ref: '#/components/schemas/UserResponse',
                  },
                },
                pagination: {
                  type: 'object',
                  properties: {
                    page: {
                      type: 'integer',
                      minimum: 1,
                      description: 'Текущая страница',
                      example: 1,
                    },
                    limit: {
                      type: 'integer',
                      minimum: 1,
                      maximum: 100,
                      description: 'Количество элементов на странице',
                      example: 10,
                    },
                    total: {
                      type: 'integer',
                      minimum: 0,
                      description: 'Общее количество элементов',
                      example: 50,
                    },
                    totalPages: {
                      type: 'integer',
                      minimum: 0,
                      description: 'Общее количество страниц',
                      example: 5,
                    },
                  },
                  required: ['page', 'limit', 'total', 'totalPages'],
                },
              },
            },
          ],
        },
        UserStats: {
          type: 'object',
          properties: {
            totalUsers: {
              type: 'integer',
              description: 'Общее количество пользователей',
              example: 150,
            },
            activeUsers: {
              type: 'integer',
              description: 'Количество активных пользователей',
              example: 140,
            },
            inactiveUsers: {
              type: 'integer',
              description: 'Количество неактивных пользователей',
              example: 10,
            },
            adminUsers: {
              type: 'integer',
              description: 'Количество администраторов',
              example: 5,
            },
            regularUsers: {
              type: 'integer',
              description: 'Количество обычных пользователей',
              example: 145,
            },
          },
          required: [
            'totalUsers',
            'activeUsers',
            'inactiveUsers',
            'adminUsers',
            'regularUsers',
          ],
        },
        Error: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              example: false,
            },
            message: {
              type: 'string',
              description: 'Сообщение об ошибке',
              example: 'Произошла ошибка',
            },
            error: {
              type: 'string',
              description: 'Детали ошибки',
              example: 'Validation failed',
            },
          },
          required: ['success', 'message'],
        },
      },
      responses: {
        UnauthorizedError: {
          description: 'Токен аутентификации отсутствует или недействителен',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/Error',
              },
              example: {
                success: false,
                message: 'Authentication required',
                error: 'No token provided',
              },
            },
          },
        },
        ForbiddenError: {
          description: 'Недостаточно прав для выполнения операции',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/Error',
              },
              example: {
                success: false,
                message: 'Access denied',
                error: 'Admin privileges required',
              },
            },
          },
        },
        NotFoundError: {
          description: 'Ресурс не найден',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/Error',
              },
              example: {
                success: false,
                message: 'Resource not found',
                error: 'User not found',
              },
            },
          },
        },
        ValidationError: {
          description: 'Ошибка валидации данных',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/Error',
              },
              example: {
                success: false,
                message: 'Validation failed',
                error: 'Email is required',
              },
            },
          },
        },
        RateLimitError: {
          description: 'Превышен лимит запросов',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/Error',
              },
              example: {
                success: false,
                message:
                  'Too many requests from this IP, please try again later.',
              },
            },
          },
        },
      },
    },
    tags: [
      {
        name: 'Authentication',
        description: 'Операции аутентификации и авторизации',
      },
      {
        name: 'Users',
        description: 'Управление пользователями',
      },
      {
        name: 'Health',
        description: 'Проверка состояния API',
      },
    ],
  },
  apis: [
    './src/routes/*.ts',
    './src/controllers/*.ts',
    './src/docs/*.ts',
    './src/app.ts',
  ],
};

export const swaggerSpec = swaggerJsdoc(options);
