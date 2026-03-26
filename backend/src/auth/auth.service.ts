import { Injectable, UnauthorizedException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import { v4 as uuidv4 } from 'uuid';
import { User, UserRole } from '../users/entities/user.entity';
import { Organisation } from '../organisations/entities/organisation.entity';
import { RefreshToken } from './entities/refresh-token.entity';
import { SignupDto } from './dto/signup.dto';
import { LoginDto } from './dto/login.dto';
import { RefreshDto } from './dto/refresh.dto';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User) private userRepo: Repository<User>,
    @InjectRepository(Organisation) private orgRepo: Repository<Organisation>,
    @InjectRepository(RefreshToken) private refreshRepo: Repository<RefreshToken>,
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

    const user = await this.userRepo.findOneOrFail({ where: { id: stored.userId } });
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
