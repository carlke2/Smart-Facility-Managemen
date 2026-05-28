import { Injectable, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { UsersService } from '../users/users.service';
import { LoginDto, RegisterDto, ChangePasswordDto, VerifyOtpDto, GoogleLoginDto } from './dto/auth.dto';
import { Resend } from 'resend';

@Injectable()
export class AuthService {
  private resend: Resend;

  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
  ) {
    this.resend = new Resend(process.env.RESEND_API_KEY || 're_placeholder');
  }

  async register(registerDto: RegisterDto) {
    // Generate a 6 digit OTP
    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpiresAt = new Date();
    otpExpiresAt.setMinutes(otpExpiresAt.getMinutes() + 15);

    const user = await this.usersService.createWithOtp(registerDto, otpCode, otpExpiresAt);

    try {
      await this.resend.emails.send({
        from: 'Acme <onboarding@resend.dev>', // User must configure their Resend domain
        to: user.email,
        subject: 'Verify your email - Smart Facility',
        html: `<p>Your verification code is: <strong>${otpCode}</strong></p>`,
      });
    } catch (e) {
      console.error('Failed to send email via Resend', e);
    }

    return { message: 'Registration successful. Please verify your email with the OTP sent.', userId: user.id };
  }

  async verifyOtp(verifyDto: VerifyOtpDto) {
    const user = await this.usersService.findRawByEmail(verifyDto.email);
    if (!user) throw new BadRequestException('Invalid email or OTP');
    if (user.isEmailVerified) throw new BadRequestException('Email already verified');
    if (user.otpCode !== verifyDto.otp) throw new BadRequestException('Invalid OTP');
    if (!user.otpExpiresAt || new Date() > new Date(user.otpExpiresAt)) throw new BadRequestException('OTP expired');

    await this.usersService.markEmailVerified(user.id);
    
    const payload = { sub: user.id, email: user.email, role: user.role };
    const accessToken = this.jwtService.sign(payload);
    
    return { accessToken, user: { id: user.id, name: user.name, email: user.email, role: user.role } };
  }

  async googleLogin(googleDto: GoogleLoginDto) {
    let user = await this.usersService.findRawByEmail(googleDto.email);
    
    if (!user) {
      user = await this.usersService.createGoogleUser(googleDto);
    } else if (!user.googleId) {
      await this.usersService.linkGoogleAccount(user.id, googleDto.googleId);
    }
    
    const payload = { sub: user.id, email: user.email, role: user.role };
    const accessToken = this.jwtService.sign(payload);
    
    return { accessToken, user: { id: user.id, name: user.name, email: user.email, role: user.role } };
  }

  async login(loginDto: LoginDto) {
    const user = await this.usersService.findRawByEmail(loginDto.email);
    if (!user || !user.password) {
      throw new UnauthorizedException('Invalid credentials.');
    }

    const isPasswordValid = await bcrypt.compare(loginDto.password, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials.');
    }

    if (!user.isActive) {
      throw new UnauthorizedException('Your account has been deactivated. Contact an administrator.');
    }

    if (!user.isEmailVerified) {
      throw new UnauthorizedException('Please verify your email before logging in.');
    }

    const payload = { sub: user.id, email: user.email, role: user.role };
    const accessToken = this.jwtService.sign(payload);

    return {
      accessToken,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    };
  }

  async getProfile(userId: string) {
    return this.usersService.findOne(userId);
  }

  async changePassword(userId: string, dto: ChangePasswordDto) {
    // findOne strips password — use a direct DB lookup via the user's own record
    const user = await this.usersService.findRawById(userId);
    if (!user) throw new UnauthorizedException('User not found.');

    if (!user.password) throw new BadRequestException('Password not set. Please use Google login.');
    const isCurrentValid = await bcrypt.compare(dto.currentPassword, user.password);
    if (!isCurrentValid) {
      throw new BadRequestException('Current password is incorrect.');
    }

    if (dto.currentPassword === dto.newPassword) {
      throw new BadRequestException('New password must be different from the current password.');
    }

    const hashed = await bcrypt.hash(dto.newPassword, 12);
    await this.usersService.updatePassword(userId, hashed);

    return { message: 'Password changed successfully.' };
  }
}

