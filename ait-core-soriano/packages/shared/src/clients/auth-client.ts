/**
 * Auth Client - Interact with ait-authenticator
 */

import axios, { AxiosInstance } from 'axios';
import { User, AuthToken, APIResponse } from '../types';

export class AuthClient {
  private client: AxiosInstance;

  constructor(config: { baseURL: string; apiKey?: string }) {
    this.client = axios.create({
      baseURL: config.baseURL,
      headers: config.apiKey ? { 'X-API-Key': config.apiKey } : {}
    });

    this.client.interceptors.response.use(
      (response) => response.data,
      (error) => {
        console.error('Auth Client Error:', error.response?.data || error.message);
        throw error;
      }
    );
  }

  async login(email: string, password: string): Promise<{ user: User; tokens: AuthToken }> {
    const response = await this.client.post<APIResponse<any>>('/auth/login', {
      email,
      password
    });
    return response.data!;
  }

  async refresh(refreshToken: string): Promise<AuthToken> {
    const response = await this.client.post<APIResponse<AuthToken>>('/auth/refresh', {
      refreshToken
    });
    return response.data!;
  }

  async logout(refreshToken: string): Promise<void> {
    await this.client.post('/auth/logout', { refreshToken });
  }

  async verifyToken(accessToken: string): Promise<User> {
    const response = await this.client.post<APIResponse<User>>('/auth/verify', {
      token: accessToken
    });
    return response.data!;
  }

  async getUser(accessToken: string): Promise<User> {
    const response = await this.client.get<APIResponse<User>>('/auth/me', {
      headers: { Authorization: `Bearer ${accessToken}` }
    });
    return response.data!;
  }
}
