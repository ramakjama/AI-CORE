import { Injectable } from '@nestjs/common';

@Injectable()
export class UsersService {
  // Mock data - TODO: Replace with database
  private users = [
    {
      id: '1',
      email: 'admin@ai-core.io',
      firstName: 'Admin',
      lastName: 'User',
      role: 'SUPER_ADMIN',
      status: 'ACTIVE',
      createdAt: new Date('2024-01-01'),
    },
    {
      id: '2',
      email: 'agent@ai-core.io',
      firstName: 'John',
      lastName: 'Doe',
      role: 'AGENT',
      status: 'ACTIVE',
      createdAt: new Date('2024-01-15'),
    },
  ];

  async findAll() {
    return this.users;
  }

  async findOne(id: string) {
    return this.users.find(user => user.id === id);
  }

  async findByEmail(email: string) {
    return this.users.find(user => user.email === email);
  }

  async create(userData: any) {
    const newUser = {
      id: Date.now().toString(),
      ...userData,
      status: 'ACTIVE',
      createdAt: new Date(),
    };
    this.users.push(newUser);
    return newUser;
  }

  async update(id: string, userData: any) {
    const index = this.users.findIndex(user => user.id === id);
    if (index !== -1) {
      this.users[index] = { ...this.users[index], ...userData };
      return this.users[index];
    }
    return null;
  }

  async remove(id: string) {
    const index = this.users.findIndex(user => user.id === id);
    if (index !== -1) {
      const user = this.users[index];
      this.users.splice(index, 1);
      return user;
    }
    return null;
  }
}
