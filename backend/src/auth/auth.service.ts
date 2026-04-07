import { Injectable, UnauthorizedException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, EntityNotFoundError } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import { v4 as uuidv4 } from 'uuid';
import { User, UserRole } from '../users/entities/user.entity';
import { Organisation } from '../organisations/entities/organisation.entity';
import { RefreshToken } from './entities/refresh-token.entity';
import { PasswordResetToken } from './entities/password-reset-token.entity';
import { SignupDto } from './dto/signup.dto';
import { LoginDto } from './dto/login.dto';
import { RefreshDto } from './dto/refresh.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User) private userRepo: Repository<User>,
    @InjectRepository(Organisation) private orgRepo: Repository<Organisation>,
    @InjectRepository(RefreshToken) private refreshRepo: Repository<RefreshToken>,
    @InjectRepository(PasswordResetToken) private resetTokenRepo: Repository<PasswordResetToken>,
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {}

  async signup(dto: SignupDto) {
    const existing = await this.userRepo.findOne({ where: { email: dto.email } });
    if (existing) throw new ConflictException('Unable to create account with the provided details');

    let slug = dto.displayName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') + '-org';
    const existingOrg = await this.orgRepo.findOne({ where: { slug } });
    if (existingOrg) {
      slug = slug + '-' + crypto.randomBytes(3).toString('hex');
    }
    const org = await this.orgRepo.save(this.orgRepo.create({
      name: `${dto.displayName}'s Org`,
      slug,
    }));

    const passwordHash = await bcrypt.hash(dto.password, 12);
    const user = await this.userRepo.save(this.userRepo.create({
      orgId: org.id,
      email: dto.email,
      passwordHash,
      displayName: dto.displayName,
      role: UserRole.OWNER,
    }));

    return this.generateTokens(user);
  }

  async login(dto: LoginDto) {
    const user = await this.userRepo.findOne({ where: { email: dto.email } });
    if (!user) throw new UnauthorizedException('Invalid credentials');

    const valid = await bcrypt.compare(dto.password, user.passwordHash);
    if (!valid) throw new UnauthorizedException('Invalid credentials');

    return this.generateTokens(user);
  }

  async refresh(dto: RefreshDto) {
    const tokenHash = crypto.createHash('sha256').update(dto.refreshToken).digest('hex');
    const stored = await this.refreshRepo.findOne({ where: { tokenHash } });
    if (!stored || stored.revokedAt || stored.expiresAt < new Date()) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    stored.revokedAt = new Date();
    await this.refreshRepo.save(stored);

    let user: User;
    try {
      user = await this.userRepo.findOneOrFail({ where: { id: stored.userId } });
    } catch (error) {
      if (error instanceof EntityNotFoundError) {
        throw new UnauthorizedException('User no longer exists');
      }
      throw error;
    }
    return this.generateTokens(user);
  }

  async logout(dto: RefreshDto) {
    const tokenHash = crypto.createHash('sha256').update(dto.refreshToken).digest('hex');
    const stored = await this.refreshRepo.findOne({ where: { tokenHash } });
    if (stored && !stored.revokedAt) {
      stored.revokedAt = new Date();
      await this.refreshRepo.save(stored);
    }
    return { message: 'Logged out' };
  }

  async forgotPassword(dto: ForgotPasswordDto): Promise<{ message: string }> {
    const user = await this.userRepo.findOne({ where: { email: dto.email } });
    // Always return success to prevent email enumeration
    if (!user) return { message: 'If an account exists, a reset link has been sent' };

    const rawToken = crypto.randomBytes(32).toString('hex');
    const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    await this.resetTokenRepo.save(
      this.resetTokenRepo.create({ userId: user.id, tokenHash, expiresAt }),
    );

    // In production, send email via provider (Resend/SendGrid — not yet integrated).
    // Only log reset URLs in development to avoid leaking tokens to production logs.
    if (this.configService.get<string>('NODE_ENV') !== 'production') {
      const frontendUrl = this.configService.get<string>('FRONTEND_URL', 'http://localhost:3000');
      const resetUrl = `${frontendUrl}/reset-password?token=${rawToken}`;
      console.log(`[Password Reset DEV] ${user.email}: ${resetUrl}`);
    }

    return { message: 'If an account exists, a reset link has been sent' };
  }

  async resetPassword(dto: ResetPasswordDto): Promise<{ message: string }> {
    const tokenHash = crypto.createHash('sha256').update(dto.token).digest('hex');

    // Atomic claim: mark token as used and return it only if it was unused.
    // Prevents race condition where two concurrent requests both read used=false.
    const claimed = await this.resetTokenRepo
      .createQueryBuilder()
      .update()
      .set({ used: true })
      .where('"tokenHash" = :tokenHash AND "used" = false AND "expiresAt" > NOW()', { tokenHash })
      .returning('*')
      .execute();

    if (!claimed.affected || claimed.affected === 0) {
      throw new UnauthorizedException('Invalid or expired reset token');
    }

    const stored = claimed.raw[0];
    const user = await this.userRepo.findOne({ where: { id: stored.userId } });
    if (!user) throw new UnauthorizedException('User not found');

    const updatedUser = { ...user, passwordHash: await bcrypt.hash(dto.newPassword, 12) };
    await this.userRepo.save(updatedUser);

    // Revoke all active refresh tokens for this user
    await this.refreshRepo
      .createQueryBuilder()
      .update()
      .set({ revokedAt: new Date() })
      .where('"userId" = :userId AND "revokedAt" IS NULL', { userId: user.id })
      .execute();

    return { message: 'Password reset successfully' };
  }

  private async generateTokens(user: User) {
    const payload = { sub: user.id, orgId: user.orgId, role: user.role };
    const accessToken = this.jwtService.sign(payload);

    const rawRefresh = uuidv4() + uuidv4();
    const tokenHash = crypto.createHash('sha256').update(rawRefresh).digest('hex');
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    await this.refreshRepo.save(this.refreshRepo.create({
      userId: user.id,
      tokenHash,
      expiresAt,
    }));

    return {
      accessToken,
      refreshToken: rawRefresh,
      user: {
        id: user.id,
        email: user.email,
        displayName: user.displayName,
        organisationId: user.orgId,
      },
    };
  }
}
