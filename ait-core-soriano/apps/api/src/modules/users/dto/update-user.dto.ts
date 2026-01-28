import { PartialType } from '@nestjs/swagger';
import { CreateUserDto } from './create-user.dto';
import { IsOptional, IsBoolean } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

/**
 * Update User DTO
 *
 * Data Transfer Object for updating an existing user.
 * All fields are optional.
 *
 * @class UpdateUserDto
 */
export class UpdateUserDto extends PartialType(CreateUserDto) {
  @ApiPropertyOptional({
    description: 'Whether the user account is active',
    example: true,
  })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  @ApiPropertyOptional({
    description: 'Whether the user email is verified',
    example: true,
  })
  @IsBoolean()
  @IsOptional()
  emailVerified?: boolean;
}
