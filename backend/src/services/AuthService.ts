import { UserRepository } from '../repositories/UserRepository';
import { hashPassword, comparePassword } from '../utils/HashUtils';
import { generateToken } from '../utils/JwtUtils';
import { RegisterDto, LoginDto } from '../middleware/validators/AuthValidator';
import prisma from '../config/db';
import { AuditLogRepository } from '../repositories/AuditLogRepository';
import { AuditLogService } from './AuditLogService';

const auditLogService = new AuditLogService(new AuditLogRepository());

export class AuthService {
  constructor(private userRepository: UserRepository) {}

  async register(dto: RegisterDto) {
    const existing = await this.userRepository.findByEmail(dto.email);
    if (existing) {
      const err: any = new Error('Email already in use');
      err.statusCode = 400;
      throw err;
    }

    const passwordHash = await hashPassword(dto.password);

    const user = await this.userRepository.create({
      email: dto.email,
      passwordHash,
      fullName: dto.fullName,
      role: dto.role,
      company: dto.company,
      createdBy: dto.email,
      modifiedBy: dto.email,
    });

    // If role is Developer, create an empty DeveloperProfile
    if (dto.role === 'Developer') {
      await prisma.developerProfile.create({
        data: {
          userId: (user as any).userId,
          createdBy: dto.email,
          modifiedBy: dto.email,
        },
      });
    }

    auditLogService.log({
      actorEmail: dto.email,
      actorRole: dto.role,
      action: 'REGISTER',
      entityType: 'User',
      entityId: (user as any).userId,
      result: 'Success',
    });

    const { passwordHash: _ph, ...safeUser } = user as any;
    return safeUser;
  }

  async login(dto: LoginDto) {
    const user = await this.userRepository.findByEmail(dto.email);
    if (!user) {
      const err: any = new Error('Invalid email or password');
      err.statusCode = 401;
      throw err;
    }

    const valid = await comparePassword(dto.password, user.passwordHash);
    if (!valid) {
      auditLogService.log({
        actorEmail: dto.email,
        actorRole: 'Unknown',
        action: 'LOGIN',
        entityType: 'User',
        result: 'Failed',
        details: 'Invalid credentials',
      });
      const err: any = new Error('Invalid email or password');
      err.statusCode = 401;
      throw err;
    }

    await this.userRepository.updateLastLogin((user as any).userId);

    auditLogService.log({
      actorId: (user as any).userId,
      actorEmail: user.email,
      actorRole: user.role as string,
      action: 'LOGIN',
      entityType: 'User',
      entityId: (user as any).userId,
      result: 'Success',
    });

    const token = generateToken((user as any).userId, user.role as string);
    const { passwordHash: _ph, ...safeUser } = user as any;
    return { user: safeUser, token };
  }

  async me(userId: string) {
    const user = await this.userRepository.findById(userId);
    if (!user) {
      const err: any = new Error('User not found');
      err.statusCode = 404;
      throw err;
    }
    const { passwordHash: _ph, ...safeUser } = user as any;
    return safeUser;
  }
}
