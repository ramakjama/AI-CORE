import {
  IsString,
  IsNotEmpty,
  MinLength,
  Matches,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

/**
 * Change Password DTO
 *
 * Data Transfer Object for changing user password.
 *
 * @class ChangePasswordDto
 */
export class ChangePasswordDto {
  @ApiProperty({
    description: 'Current password',
    example: 'CurrentP@ssw0rd',
  })
  @IsString()
  @IsNotEmpty({ message: 'Current password is required' })
  currentPassword: string;

  @ApiProperty({
    description: 'New password (min 8 characters)',
    example: 'NewSecureP@ssw0rd',
    minLength: 8,
  })
  @IsString()
  @IsNotEmpty({ message: 'New password is required' })
  @MinLength(8, { message: 'New password must be at least 8 characters long' })
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/, {
    message:
      'New password must contain at least one uppercase letter, one lowercase letter, one number, and one special character',
  })
  newPassword: string;
}
