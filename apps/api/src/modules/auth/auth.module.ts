import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller.js';
import { StaffController } from './staff.controller.js';
import { AuthRepository } from './auth.repository.js';
import { AuthService } from './auth.service.js';
@Module({ controllers: [AuthController, StaffController], providers: [AuthRepository, AuthService] })
export class AuthModule {}
