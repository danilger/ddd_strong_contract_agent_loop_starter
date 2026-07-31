import { Module } from '@nestjs/common';
import { AuthModule } from './auth/auth.module';
import { DrizzleModule } from './db/drizzle.module';
import { HealthController } from './health/health.controller';

/** Корневой модуль приложения */
@Module({
  imports: [DrizzleModule, AuthModule],
  controllers: [HealthController],
})
export class AppModule {}
