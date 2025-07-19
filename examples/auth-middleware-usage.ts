/**
 * Примеры использования middleware для аутентификации и авторизации
 * Этот файл демонстрирует различные способы применения созданных middleware
 */

import express from 'express';
import {
  // Аутентификация
  authenticateToken,
  optionalAuth,
  requireRole,
  requireAdmin,
  requireOwnershipOrAdmin,
  authAndRole,
  extractUserIdFromToken,
  
  // Безопасность
  authRateLimit,
  apiRateLimit,
  adminRateLimit,
  requireHTTPS,
  validateOrigin,
  logSecurityEvent,
  
  // Разрешения
  Permission,
  requirePermission,
  canAccessOwnProfile,
  canModifyUser,
  
  // Валидация
  validate,
  validateContentType,
} from '../src/middleware';

import { generateToken, createTokenPayload } from '../src/utils';

const app = express();

// Применение общих middleware
app.use(express.json());
app.use(requireHTTPS); // HTTPS в продакшене
app.use(validateOrigin(['https://myapp.com', 'https://admin.myapp.com']));

// =============================================================================
// ПУБЛИЧНЫЕ МАРШРУТЫ (без аутентификации)
// =============================================================================

// Регистрация с ограничением запросов
app.post('/auth/register',
  authRateLimit,
  validateContentType('application/json'),
  // validate(registerValidation), // из validation.utils.ts
  async (req, res) => {
    // Логика регистрации
    const user = { id: '123', email: 'user@example.com', role: 'USER' as const };
    const payload = createTokenPayload(user);
    const token = generateToken(payload);
    
    res.json({
      success: true,
      data: { user, token }
    });
  }
);

// Вход с ограничением запросов
app.post('/auth/login',
  authRateLimit,
  validateContentType('application/json'),
  // validate(loginValidation),
  async (req, res) => {
    // Логика входа
    res.json({ success: true, message: 'Login successful' });
  }
);

// =============================================================================
// МАРШРУТЫ С ОПЦИОНАЛЬНОЙ АУТЕНТИФИКАЦИЕЙ
// =============================================================================

// Публичный контент с дополнительной информацией для авторизованных пользователей
app.get('/public/content',
  apiRateLimit,
  optionalAuth,
  (req, res) => {
    const isAuthenticated = !!req.user;
    res.json({
      success: true,
      data: {
        content: 'Публичный контент',
        premium: isAuthenticated ? 'Дополнительный контент для пользователей' : null
      }
    });
  }
);

// =============================================================================
// ЗАЩИЩЕННЫЕ МАРШРУТЫ (требуют аутентификации)
// =============================================================================

// Базовая защита - только аутентификация
app.get('/profile',
  apiRateLimit,
  authenticateToken,
  (req, res) => {
    res.json({
      success: true,
      data: { user: req.user }
    });
  }
);

// Получение собственного профиля (поддержка /users/me)
app.get('/users/me',
  apiRateLimit,
  authenticateToken,
  extractUserIdFromToken, // Заменяет 'me' на реальный ID пользователя
  canAccessOwnProfile,
  (req, res) => {
    res.json({
      success: true,
      data: { userId: req.params.id, user: req.user }
    });
  }
);

// Получение профиля пользователя (свой или админ может любой)
app.get('/users/:id',
  apiRateLimit,
  authenticateToken,
  canAccessOwnProfile,
  (req, res) => {
    res.json({
      success: true,
      data: { userId: req.params.id }
    });
  }
);

// Обновление профиля пользователя
app.patch('/users/:id',
  apiRateLimit,
  authenticateToken,
  canModifyUser,
  validateContentType('application/json'),
  // validate(updateUserValidation),
  (req, res) => {
    res.json({
      success: true,
      message: 'Профиль обновлен'
    });
  }
);

// =============================================================================
// МАРШРУТЫ ТОЛЬКО ДЛЯ ПОЛЬЗОВАТЕЛЕЙ
// =============================================================================

// Доступ для всех авторизованных пользователей
app.get('/user/dashboard',
  apiRateLimit,
  ...authAndRole('USER', 'ADMIN'), // Комбинированная проверка
  (req, res) => {
    res.json({
      success: true,
      data: { dashboard: 'Пользовательская панель' }
    });
  }
);

// =============================================================================
// АДМИНСКИЕ МАРШРУТЫ
// =============================================================================

// Получение списка всех пользователей (только админы)
app.get('/admin/users',
  adminRateLimit,
  authenticateToken,
  requireAdmin,
  logSecurityEvent('ADMIN_USER_LIST_ACCESS'),
  (req, res) => {
    res.json({
      success: true,
      data: { users: [] }
    });
  }
);

// Блокировка пользователя (только админы)
app.patch('/admin/users/:id/block',
  adminRateLimit,
  authenticateToken,
  requirePermission(Permission.BLOCK_USER),
  logSecurityEvent('USER_BLOCK'),
  (req, res) => {
    res.json({
      success: true,
      message: `Пользователь ${req.params.id} заблокирован`
    });
  }
);

// Удаление пользователя (только админы с системными правами)
app.delete('/admin/users/:id',
  adminRateLimit,
  authenticateToken,
  requirePermission(Permission.DELETE_ANY_USER),
  logSecurityEvent('USER_DELETION'),
  (req, res) => {
    res.json({
      success: true,
      message: `Пользователь ${req.params.id} удален`
    });
  }
);

// Системные операции (только админы с системными правами)
app.post('/admin/system/maintenance',
  adminRateLimit,
  authenticateToken,
  requirePermission(Permission.MANAGE_SYSTEM),
  logSecurityEvent('SYSTEM_MAINTENANCE'),
  (req, res) => {
    res.json({
      success: true,
      message: 'Режим обслуживания активирован'
    });
  }
);

// =============================================================================
// КОМПЛЕКСНЫЕ ПРИМЕРЫ
// =============================================================================

// Сложная защита с множественными проверками
app.delete('/admin/critical-operation',
  requireHTTPS,                    // HTTPS обязателен
  adminRateLimit,                  // Строгие ограничения
  authenticateToken,               // Аутентификация
  requireAdmin,                    // Только админы
  requirePermission(Permission.MANAGE_SYSTEM), // Системные права
  logSecurityEvent('CRITICAL_OPERATION'),      // Логирование
  (req, res) => {
    res.json({
      success: true,
      message: 'Критическая операция выполнена'
    });
  }
);

// Маршрут с проверкой владения ресурсом
app.get('/documents/:id',
  apiRateLimit,
  authenticateToken,
  requireOwnershipOrAdmin('id'), // Пользователь может получить только свои документы
  (req, res) => {
    res.json({
      success: true,
      data: { documentId: req.params.id }
    });
  }
);

// =============================================================================
// ОБРАБОТКА ОШИБОК
// =============================================================================

// Глобальный обработчик ошибок (должен быть в конце)
app.use((error: any, req: any, res: any, next: any) => {
  console.error('Error:', error);
  
  const statusCode = error.statusCode || 500;
  const message = error.message || 'Internal Server Error';
  
  res.status(statusCode).json({
    success: false,
    message,
    timestamp: new Date().toISOString()
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.originalUrl} not found`
  });
});

export default app;
