# API Routes Documentation

## Обзор

Этот документ описывает все доступные API маршруты для системы управления пользователями.

## Базовые URL

- **Аутентификация**: `/api/auth`
- **Пользователи**: `/api/users`

## Middleware

Все маршруты используют следующие middleware:

- **Rate Limiting**: Ограничение количества запросов
  - `authRateLimit`: Для аутентификации (более строгие лимиты)
  - `apiRateLimit`: Для обычных API запросов
  - `adminRateLimit`: Для админских операций

- **Аутентификация**: `authenticateToken` - проверка JWT токена
- **Авторизация**: 
  - `requireAdmin` - только для администраторов
  - `canAccessOwnProfile` - доступ к собственному профилю или админ
  - `canModifyUser` - возможность изменения пользователя

- **Валидация**: `validate()` с соответствующими схемами валидации
- **Безопасность**: `validateContentType()` для проверки типа контента

## Аутентификация (`/api/auth`)

### POST /api/auth/register
- **Описание**: Регистрация нового пользователя
- **Доступ**: Публичный
- **Body**: `{ email, password, fullName, birthDate, role? }`
- **Middleware**: `authRateLimit`, `validateContentType`, `validate(register)`

### POST /api/auth/login
- **Описание**: Вход пользователя и получение JWT токена
- **Доступ**: Публичный
- **Body**: `{ email, password }`
- **Middleware**: `authRateLimit`, `validateContentType`, `validate(login)`

### POST /api/auth/logout
- **Описание**: Выход пользователя (удаление токена на клиенте)
- **Доступ**: Приватный
- **Middleware**: `apiRateLimit`, `authenticateToken`

### GET /api/auth/me
- **Описание**: Получение профиля текущего пользователя
- **Доступ**: Приватный
- **Middleware**: `apiRateLimit`, `authenticateToken`

## Управление пользователями (`/api/users`)

### GET /api/users/stats
- **Описание**: Получение статистики пользователей
- **Доступ**: Только админ
- **Middleware**: `adminRateLimit`, `authenticateToken`, `requireAdmin`

### GET /api/users/search
- **Описание**: Поиск пользователей по запросу
- **Доступ**: Только админ
- **Query**: `{ q: string, page?: number, limit?: number }`
- **Middleware**: `adminRateLimit`, `authenticateToken`, `requireAdmin`, `validate(getUsers)`

### GET /api/users/me
- **Описание**: Получение собственного профиля (алиас для /users/:id)
- **Доступ**: Приватный
- **Middleware**: `apiRateLimit`, `authenticateToken`, `extractUserIdFromToken`, `canAccessOwnProfile`

### GET /api/users
- **Описание**: Получение всех пользователей с пагинацией
- **Доступ**: Только админ
- **Query**: `{ page?: number, limit?: number, search?: string }`
- **Middleware**: `adminRateLimit`, `authenticateToken`, `requireAdmin`, `validate(getUsers)`

### GET /api/users/:id
- **Описание**: Получение пользователя по ID
- **Доступ**: Приватный (свой профиль) или Админ (любой профиль)
- **Params**: `id` - UUID пользователя
- **Middleware**: `apiRateLimit`, `authenticateToken`, `validate(getUserById)`, `canAccessOwnProfile`

### PATCH /api/users/:id
- **Описание**: Обновление профиля пользователя
- **Доступ**: Приватный (свой профиль, ограниченные поля) или Админ (любой профиль, все поля)
- **Params**: `id` - UUID пользователя
- **Body**: `{ fullName?, birthDate?, email?, role?, status? }`
- **Middleware**: `apiRateLimit`, `authenticateToken`, `validateContentType`, `validate(updateUser)`, `canModifyUser`

### PATCH /api/users/:id/block
- **Описание**: Блокировка аккаунта пользователя
- **Доступ**: Только админ
- **Params**: `id` - UUID пользователя
- **Middleware**: `adminRateLimit`, `authenticateToken`, `requireAdmin`, `validate(blockUser)`

### PATCH /api/users/:id/unblock
- **Описание**: Разблокировка аккаунта пользователя
- **Доступ**: Только админ
- **Params**: `id` - UUID пользователя
- **Middleware**: `adminRateLimit`, `authenticateToken`, `requireAdmin`, `validate(blockUser)`

### DELETE /api/users/:id
- **Описание**: Удаление аккаунта пользователя (мягкое удаление)
- **Доступ**: Только админ
- **Params**: `id` - UUID пользователя
- **Middleware**: `adminRateLimit`, `authenticateToken`, `requireAdmin`, `validate(getUserById)`

## Порядок маршрутов

Важно соблюдать порядок маршрутов для избежания конфликтов:

1. **Статические маршруты** (например, `/stats`, `/search`, `/me`) должны быть определены **до** параметризованных маршрутов (например, `/:id`)
2. Это предотвращает перехват статических путей параметризованными маршрутами

## Безопасность

- Все маршруты защищены соответствующими middleware
- Используется многоуровневая система авторизации
- Применяется rate limiting для предотвращения злоупотреблений
- Валидация входных данных на всех уровнях
- Логирование безопасности для админских операций

## Ошибки

Все маршруты используют централизованную обработку ошибок через `errorHandler` middleware, который возвращает стандартизированные ответы об ошибках.
