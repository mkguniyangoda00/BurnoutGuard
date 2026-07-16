import { UserRepository } from '../repositories/UserRepository';
import { hashPassword, comparePassword } from '../utils/HashUtils';
import { generateToken } from '../utils/JwtUtils';
import { RegisterDto, LoginDto } from '../middleware/validators/AuthValidator';
import prisma from '../config/db';

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
      const err: any = new Error('Invalid email or password');
      err.statusCode = 401;
      throw err;
    }

    await this.userRepository.updateLastLogin((user as any).userId);

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
