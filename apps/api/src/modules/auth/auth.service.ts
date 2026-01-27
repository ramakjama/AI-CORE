import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
  constructor(private jwtService: JwtService) {}

  async validateUser(email: string, password: string): Promise<any> {
    // TODO: Implementar validación con base de datos
    // const user = await this.usersService.findByEmail(email);
    // if (user && await bcrypt.compare(password, user.passwordHash)) {
    //   const { passwordHash, ...result } = user;
    //   return result;
    // }
    
    // Mock para desarrollo
    if (email === 'admin@ai-core.io' && password === 'admin123') {
      return {
        id: '1',
        email: 'admin@ai-core.io',
        firstName: 'Admin',
        lastName: 'User',
        role: 'SUPER_ADMIN',
      };
    }
    
    return null;
  }

  async login(user: any) {
    const payload = { 
      email: user.email, 
      sub: user.id,
      role: user.role,
    };
    
    return {
      access_token: this.jwtService.sign(payload),
      refresh_token: this.jwtService.sign(payload, { expiresIn: '7d' }),
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
      },
    };
  }

  async register(userData: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
  }) {
    // TODO: Implementar registro con base de datos
    // const hashedPassword = await bcrypt.hash(userData.password, 10);
    // const user = await this.usersService.create({
    //   ...userData,
    //   passwordHash: hashedPassword,
    // });
    
    // Mock para desarrollo
    const user = {
      id: Date.now().toString(),
      email: userData.email,
      firstName: userData.firstName,
      lastName: userData.lastName,
      role: 'AGENT',
    };
    
    return this.login(user);
  }

  async refreshToken(refreshToken: string) {
    try {
      const payload = this.jwtService.verify(refreshToken);
      const newPayload = {
        email: payload.email,
        sub: payload.sub,
        role: payload.role,
      };
      
      return {
        access_token: this.jwtService.sign(newPayload),
        refresh_token: this.jwtService.sign(newPayload, { expiresIn: '7d' }),
      };
    } catch (error) {
      throw new UnauthorizedException('Invalid refresh token');
    }
  }

  async validateToken(token: string) {
    try {
      return this.jwtService.verify(token);
    } catch (error) {
      throw new UnauthorizedException('Invalid token');
    }
  }
}
