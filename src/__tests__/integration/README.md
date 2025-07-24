# Integration Tests

Этот каталог содержит integration тесты для REST API. Integration тесты проверяют полный поток от HTTP запроса до операций с базой данных.

## Структура тестов

### Файлы тестов

- **`auth.integration.test.ts`** - Тесты для endpoints аутентификации
  - Регистрация пользователей
  - Вход в систему
  - Выход из системы
  - Получение профиля текущего пользователя

- **`users.integration.test.ts`** - Тесты для endpoints управления пользователями
  - Получение списка пользователей
  - Получение пользователя по ID
  - Обновление профиля пользователя
  - Блокировка/разблокировка пользователей
  - Удаление пользователей
  - Статистика пользователей
  - Поиск пользователей

- **`api.integration.test.ts`** - Общие тесты API
  - Health check
  - Обработка ошибок 404
  - Валидация Content-Type
  - Rate limiting
  - CORS headers
  - Security headers
  - Форматирование ответов об ошибках

- **`security.integration.test.ts`** - Тесты безопасности
  - JWT token security
  - Input validation security
  - Authorization security
  - Rate limiting security
  - Password security
  - Content security
  - Error information disclosure
  - CORS security

### Вспомогательные файлы

- **`test-helpers.ts`** - Утилиты для тестов
  - Настройка тестовой базы данных
  - Создание тестовых пользователей
  - Генерация JWT токенов
  - Валидация ответов API
  - Очистка базы данных

- **`setup.ts`** - Настройка окружения для тестов
  - Загрузка переменных окружения
  - Глобальная настройка тестов
  - Обработка ошибок

## Запуск тестов

### Все integration тесты
```bash
npm run test:integration
```

### Integration тесты с покрытием кода
```bash
npm run test:integration:coverage
```

### Integration тесты в watch режиме
```bash
npm run test:integration:watch
```

### Все тесты (unit + integration)
```bash
npm run test:all
```

## Конфигурация

### Jest конфигурация
Integration тесты используют отдельную конфигурацию Jest (`jest.integration.config.js`):
- Увеличенный timeout (30 секунд)
- Запуск в одном потоке для избежания конфликтов БД
- Отдельная папка для coverage отчетов
- Специальные setup файлы

### Переменные окружения
Тесты используют файл `.env.test` с настройками для тестовой среды:
- Тестовая база данных SQLite
- Специальный JWT secret
- Более мягкие ограничения rate limiting
- Минимальное логирование

## Тестовые данные

### Тестовые пользователи
```typescript
testUsers = {
  admin: {
    email: 'admin@test.com',
    password: 'AdminPass123!',
    role: 'ADMIN',
    status: 'ACTIVE'
  },
  user: {
    email: 'user@test.com', 
    password: 'UserPass123!',
    role: 'USER',
    status: 'ACTIVE'
  },
  inactiveUser: {
    email: 'inactive@test.com',
    password: 'InactivePass123!',
    role: 'USER',
    status: 'INACTIVE'
  }
}
```

### Утилиты для тестов
- `setupTestDatabase()` - Создает тестовых пользователей
- `cleanupDatabase()` - Очищает базу данных
- `generateTestToken()` - Создает JWT токен для тестов
- `createAuthHeader()` - Создает заголовок авторизации
- `validateApiResponse()` - Проверяет структуру ответа API
- `validateErrorResponse()` - Проверяет структуру ошибки

## Покрываемые сценарии

### Аутентификация
- ✅ Успешная регистрация
- ✅ Регистрация с невалидными данными
- ✅ Регистрация с дублирующимся email
- ✅ Успешный вход
- ✅ Вход с неверными данными
- ✅ Вход заблокированного пользователя
- ✅ Выход из системы
- ✅ Получение профиля

### Управление пользователями
- ✅ Получение списка пользователей (админ)
- ✅ Получение пользователя по ID
- ✅ Доступ к собственному профилю
- ✅ Обновление профиля (собственного/чужого)
- ✅ Блокировка/разблокировка пользователей
- ✅ Удаление пользователей
- ✅ Статистика пользователей
- ✅ Поиск пользователей

### Безопасность
- ✅ JWT token validation
- ✅ Input validation (XSS, SQL injection)
- ✅ Authorization checks
- ✅ Rate limiting
- ✅ Password security
- ✅ Error information disclosure
- ✅ CORS security

### Общие функции API
- ✅ Health check
- ✅ 404 error handling
- ✅ Content-Type validation
- ✅ Security headers
- ✅ Error response format
- ✅ Request logging

## Лучшие практики

1. **Изоляция тестов** - Каждый тест очищает и настраивает свои данные
2. **Реалистичные данные** - Используются реальные форматы данных
3. **Полное покрытие** - Тестируются как успешные, так и ошибочные сценарии
4. **Безопасность** - Специальные тесты для проверки уязвимостей
5. **Производительность** - Тесты оптимизированы для быстрого выполнения

## Отладка тестов

### Просмотр логов
```bash
DEBUG=* npm run test:integration
```

### Запуск отдельного файла тестов
```bash
npx jest --config jest.integration.config.js auth.integration.test.ts
```

### Запуск отдельного теста
```bash
npx jest --config jest.integration.config.js -t "should register a new user successfully"
```
