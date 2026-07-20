import { UserRepository } from '../repositories/UserRepository';
import { hashPassword, comparePassword } from '../utils/HashUtils';
import { generateToken } from '../utils/JwtUtils';
import { RegisterDto, LoginDto } from '../middleware/validators/AuthValidator';
import prisma from '../config/db';
import { AuditLogRepository } from '../repositories/AuditLogRepository';
import { AuditLogService } from './AuditLogService';
import { OAuth2Client } from 'google-auth-library';
import { Env } from '../config/env';

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

    const valid = await comparePassword(dto.password, user.passwordHash || '');
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

  /**
   * Google OAuth login/registration.
   * Verifies the Google ID token server-side, then finds or creates a User.
   * Returns the same { user, token } shape as the email/password login.
   */
  async googleLogin(idToken: string) {
    const googleClient = new OAuth2Client(Env.GOOGLE_CLIENT_ID);

    let ticket;
    try {
      ticket = await googleClient.verifyIdToken({
        idToken,
        audience: Env.GOOGLE_CLIENT_ID,
      });
    } catch {
      const err: any = new Error('Invalid Google ID token');
      err.statusCode = 401;
      throw err;
    }

    const payload = ticket.getPayload();
    if (!payload || !payload.email) {
      const err: any = new Error('Google token missing required claims');
      err.statusCode = 401;
      throw err;
    }

    const { email, name, sub: googleId } = payload;

    // Try to find an existing user by googleId or email
    let user = await this.userRepository.findByGoogleId(googleId);
    if (!user) {
      user = await this.userRepository.findByEmail(email);
    }

    if (user) {
      // Link googleId if not already linked
      if (!(user as any).googleId) {
        await this.userRepository.updateGoogleId((user as any).userId, googleId);
      }
      await this.userRepository.updateLastLogin((user as any).userId);

      auditLogService.log({
        actorId: (user as any).userId,
        actorEmail: user.email,
        actorRole: user.role as string,
        action: 'GOOGLE_LOGIN',
        entityType: 'User',
        entityId: (user as any).userId,
        result: 'Success',
      });
    } else {
      // Create a new user — default role is Developer
      user = await this.userRepository.create({
        email,
        passwordHash: null,
        fullName: name || email.split('@')[0],
        role: 'Developer',
        googleId,
        createdBy: email,
        modifiedBy: email,
      });

      // Create DeveloperProfile for new Google users (default role is Developer)
      await prisma.developerProfile.create({
        data: {
          userId: (user as any).userId,
          createdBy: email,
          modifiedBy: email,
        },
      });

      auditLogService.log({
        actorEmail: email,
        actorRole: 'Developer',
        action: 'GOOGLE_REGISTER',
        entityType: 'User',
        entityId: (user as any).userId,
        result: 'Success',
      });
    }

    const token = generateToken((user as any).userId, (user as any).role as string);
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

  async updateSettings(userId: string, emailNotificationsEnabled: boolean) {
    const user = await this.userRepository.updateEmailNotifications(userId, emailNotificationsEnabled);
    const { passwordHash: _ph, ...safeUser } = user as any;
    return safeUser;
  }
}
