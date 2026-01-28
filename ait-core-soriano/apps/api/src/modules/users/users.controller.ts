import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  HttpCode,
  HttpStatus,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { UserQueryDto } from './dto/user-query.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Public } from '../../common/decorators/public.decorator';

/**
 * Users Controller
 *
 * Handles HTTP requests for user management operations.
 *
 * Endpoints:
 * - GET /users - Get all users (paginated)
 * - GET /users/:id - Get user by ID
 * - POST /users - Create new user
 * - PATCH /users/:id - Update user
 * - DELETE /users/:id - Delete user
 * - POST /users/:id/change-password - Change password
 * - POST /users/:id/reset-password - Reset password (admin)
 * - POST /users/:id/activate - Activate user
 * - POST /users/:id/deactivate - Deactivate user
 * - POST /users/:id/verify-email - Verify email
 * - GET /users/statistics - Get user statistics
 * - GET /users/me - Get current user profile
 *
 * @controller users
 */
@ApiTags('Users')
@ApiBearerAuth('JWT-auth')
@Controller({ path: 'users', version: '1' })
@UseGuards(JwtAuthGuard, RolesGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  /**
   * Create a new user
   */
  @Post()
  @Roles('ADMIN', 'SUPER_ADMIN')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Create new user',
    description: 'Create a new user account. Admin access required.',
  })
  @ApiResponse({
    status: 201,
    description: 'User created successfully',
    schema: {
      example: {
        id: '123e4567-e89b-12d3-a456-426614174000',
        email: 'user@example.com',
        firstName: 'John',
        lastName: 'Doe',
        role: 'USER',
        isActive: true,
        emailVerified: false,
        createdAt: '2024-01-01T00:00:00.000Z',
        updatedAt: '2024-01-01T00:00:00.000Z',
      },
    },
  })
  @ApiResponse({ status: 400, description: 'Invalid input data' })
  @ApiResponse({ status: 409, description: 'Email already exists' })
  create(@Body() createUserDto: CreateUserDto) {
    return this.usersService.create(createUserDto);
  }

  /**
   * Get all users with pagination and filters
   */
  @Get()
  @Roles('ADMIN', 'SUPER_ADMIN', 'MANAGER')
  @ApiOperation({
    summary: 'Get all users',
    description: 'Get paginated list of users with optional filters',
  })
  @ApiQuery({
    name: 'page',
    required: false,
    type: Number,
    description: 'Page number',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: 'Items per page',
  })
  @ApiQuery({
    name: 'search',
    required: false,
    type: String,
    description: 'Search by email, first name, or last name',
  })
  @ApiQuery({
    name: 'role',
    required: false,
    type: String,
    description: 'Filter by role',
  })
  @ApiQuery({
    name: 'isActive',
    required: false,
    type: Boolean,
    description: 'Filter by active status',
  })
  @ApiQuery({
    name: 'emailVerified',
    required: false,
    type: Boolean,
    description: 'Filter by email verification status',
  })
  @ApiQuery({
    name: 'sortBy',
    required: false,
    type: String,
    description: 'Sort by field (default: createdAt)',
  })
  @ApiQuery({
    name: 'sortOrder',
    required: false,
    enum: ['asc', 'desc'],
    description: 'Sort order (default: desc)',
  })
  @ApiResponse({
    status: 200,
    description: 'Users retrieved successfully',
    schema: {
      example: {
        data: [
          {
            id: '123e4567-e89b-12d3-a456-426614174000',
            email: 'user@example.com',
            firstName: 'John',
            lastName: 'Doe',
            role: 'USER',
            isActive: true,
            emailVerified: true,
            createdAt: '2024-01-01T00:00:00.000Z',
          },
        ],
        meta: {
          total: 100,
          page: 1,
          limit: 10,
          totalPages: 10,
        },
      },
    },
  })
  findAll(@Query() query: UserQueryDto) {
    return this.usersService.findAll(query);
  }

  /**
   * Get current user profile
   */
  @Get('me')
  @ApiOperation({
    summary: 'Get current user profile',
    description: 'Get the profile of the currently authenticated user',
  })
  @ApiResponse({ status: 200, description: 'User profile retrieved successfully' })
  getProfile(@CurrentUser('id') userId: string) {
    return this.usersService.findOne(userId);
  }

  /**
   * Get user statistics
   */
  @Get('statistics')
  @Roles('ADMIN', 'SUPER_ADMIN')
  @ApiOperation({
    summary: 'Get user statistics',
    description: 'Get statistical data about users',
  })
  @ApiResponse({
    status: 200,
    description: 'Statistics retrieved successfully',
    schema: {
      example: {
        total: 1000,
        active: 950,
        inactive: 50,
        verified: 900,
        unverified: 100,
        byRole: {
          USER: 800,
          ADMIN: 10,
          MANAGER: 190,
        },
      },
    },
  })
  getStatistics() {
    return this.usersService.getStatistics();
  }

  /**
   * Get user by ID
   */
  @Get(':id')
  @ApiOperation({
    summary: 'Get user by ID',
    description: 'Get detailed information about a specific user',
  })
  @ApiResponse({ status: 200, description: 'User retrieved successfully' })
  @ApiResponse({ status: 404, description: 'User not found' })
  findOne(@Param('id') id: string) {
    return this.usersService.findOne(id);
  }

  /**
   * Update user
   */
  @Patch(':id')
  @Roles('ADMIN', 'SUPER_ADMIN')
  @ApiOperation({
    summary: 'Update user',
    description: 'Update user information. Admin access required.',
  })
  @ApiResponse({ status: 200, description: 'User updated successfully' })
  @ApiResponse({ status: 404, description: 'User not found' })
  @ApiResponse({ status: 409, description: 'Email already in use' })
  update(@Param('id') id: string, @Body() updateUserDto: UpdateUserDto) {
    return this.usersService.update(id, updateUserDto);
  }

  /**
   * Update current user profile
   */
  @Patch('me/profile')
  @ApiOperation({
    summary: 'Update own profile',
    description: 'Update the profile of the currently authenticated user',
  })
  @ApiResponse({ status: 200, description: 'Profile updated successfully' })
  updateProfile(
    @CurrentUser('id') userId: string,
    @Body() updateUserDto: UpdateUserDto,
  ) {
    return this.usersService.update(userId, updateUserDto);
  }

  /**
   * Delete user (soft delete)
   */
  @Delete(':id')
  @Roles('ADMIN', 'SUPER_ADMIN')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Delete user',
    description: 'Soft delete user by deactivating their account',
  })
  @ApiResponse({ status: 204, description: 'User deleted successfully' })
  @ApiResponse({ status: 404, description: 'User not found' })
  remove(@Param('id') id: string) {
    return this.usersService.remove(id);
  }

  /**
   * Permanently delete user
   */
  @Delete(':id/permanent')
  @Roles('SUPER_ADMIN')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Permanently delete user',
    description: 'Permanently delete user from database. Super admin only.',
  })
  @ApiResponse({ status: 204, description: 'User permanently deleted' })
  @ApiResponse({ status: 404, description: 'User not found' })
  permanentlyDelete(@Param('id') id: string) {
    return this.usersService.permanentlyDelete(id);
  }

  /**
   * Change user password
   */
  @Post(':id/change-password')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Change user password',
    description: 'Change user password with current password verification',
  })
  @ApiResponse({ status: 204, description: 'Password changed successfully' })
  @ApiResponse({ status: 400, description: 'Current password is incorrect' })
  @ApiResponse({ status: 404, description: 'User not found' })
  changePassword(
    @Param('id') id: string,
    @Body() changePasswordDto: ChangePasswordDto,
  ) {
    return this.usersService.changePassword(id, changePasswordDto);
  }

  /**
   * Change own password
   */
  @Post('me/change-password')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Change own password',
    description: 'Change the password of the currently authenticated user',
  })
  @ApiResponse({ status: 204, description: 'Password changed successfully' })
  @ApiResponse({ status: 400, description: 'Current password is incorrect' })
  changeOwnPassword(
    @CurrentUser('id') userId: string,
    @Body() changePasswordDto: ChangePasswordDto,
  ) {
    return this.usersService.changePassword(userId, changePasswordDto);
  }

  /**
   * Reset user password (admin)
   */
  @Post(':id/reset-password')
  @Roles('ADMIN', 'SUPER_ADMIN')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Reset user password',
    description: 'Reset user password without current password. Admin access required.',
  })
  @ApiResponse({ status: 204, description: 'Password reset successfully' })
  @ApiResponse({ status: 404, description: 'User not found' })
  resetPassword(
    @Param('id') id: string,
    @Body('newPassword') newPassword: string,
  ) {
    return this.usersService.resetPassword(id, newPassword);
  }

  /**
   * Activate user
   */
  @Post(':id/activate')
  @Roles('ADMIN', 'SUPER_ADMIN')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Activate user',
    description: 'Activate a deactivated user account',
  })
  @ApiResponse({ status: 204, description: 'User activated successfully' })
  @ApiResponse({ status: 404, description: 'User not found' })
  activate(@Param('id') id: string) {
    return this.usersService.activate(id);
  }

  /**
   * Deactivate user
   */
  @Post(':id/deactivate')
  @Roles('ADMIN', 'SUPER_ADMIN')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Deactivate user',
    description: 'Deactivate a user account',
  })
  @ApiResponse({ status: 204, description: 'User deactivated successfully' })
  @ApiResponse({ status: 404, description: 'User not found' })
  deactivate(@Param('id') id: string) {
    return this.usersService.deactivate(id);
  }

  /**
   * Verify user email
   */
  @Post(':id/verify-email')
  @Roles('ADMIN', 'SUPER_ADMIN')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Verify user email',
    description: 'Mark user email as verified',
  })
  @ApiResponse({ status: 204, description: 'Email verified successfully' })
  @ApiResponse({ status: 404, description: 'User not found' })
  verifyEmail(@Param('id') id: string) {
    return this.usersService.verifyEmail(id);
  }

  /**
   * Bulk create users
   */
  @Post('bulk/create')
  @Roles('SUPER_ADMIN')
  @ApiOperation({
    summary: 'Bulk create users',
    description: 'Create multiple users at once. Super admin only.',
  })
  @ApiResponse({ status: 201, description: 'Users created successfully' })
  bulkCreate(@Body() users: CreateUserDto[]) {
    return this.usersService.bulkCreate(users);
  }

  /**
   * Bulk update users
   */
  @Patch('bulk/update')
  @Roles('SUPER_ADMIN')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Bulk update users',
    description: 'Update multiple users at once. Super admin only.',
  })
  @ApiResponse({ status: 204, description: 'Users updated successfully' })
  bulkUpdate(@Body() updates: Array<{ id: string; data: UpdateUserDto }>) {
    return this.usersService.bulkUpdate(updates);
  }

  /**
   * Bulk delete users
   */
  @Delete('bulk/delete')
  @Roles('SUPER_ADMIN')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Bulk delete users',
    description: 'Deactivate multiple users at once. Super admin only.',
  })
  @ApiResponse({ status: 204, description: 'Users deleted successfully' })
  bulkDelete(@Body() ids: string[]) {
    return this.usersService.bulkDelete(ids);
  }
}
