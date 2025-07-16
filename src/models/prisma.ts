import { PrismaClient } from '@prisma/client';

// Создаем глобальную переменную для Prisma Client в development режиме
// чтобы избежать создания множественных подключений при hot reload
declare global {
  var __prisma: PrismaClient | undefined;
}

// Создаем единственный экземпляр Prisma Client
const prisma =
  globalThis.__prisma ||
  new PrismaClient({
    log:
      process.env['NODE_ENV'] === 'development'
        ? ['query', 'error', 'warn']
        : ['error'],
  });

// В development режиме сохраняем экземпляр в глобальной переменной
if (process.env['NODE_ENV'] === 'development') {
  globalThis.__prisma = prisma;
}

// Graceful shutdown - закрываем соединение при завершении процесса
process.on('beforeExit', async () => {
  await prisma.$disconnect();
});

process.on('SIGINT', async () => {
  await prisma.$disconnect();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  await prisma.$disconnect();
  process.exit(0);
});

export default prisma;
