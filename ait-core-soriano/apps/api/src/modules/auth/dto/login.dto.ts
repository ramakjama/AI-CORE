import { ApiProperty } from '@nestjs/swagger';
import { IsString, MinLength } from 'class-validator';

export class LoginDto {
  @ApiProperty({
    example: 'johndoe',
    description: 'Username',
  })
  @IsString()
  username: string;

  @ApiProperty({
    example: 'Password123!',
    description: 'User password',
  })
  @IsString()
  @MinLength(8)
  password: string;
}
