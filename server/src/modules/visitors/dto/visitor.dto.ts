import {
  IsEmail,
  IsOptional,
  IsString,
  IsBoolean,
  IsUUID,
  MaxLength,
  MinLength,
} from 'class-validator';

export class CreateVisitorDto {
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  name: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  phone?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  company?: string;

  @IsUUID()
  hostId: string;

  @IsOptional()
  @IsUUID()
  bookingId?: string;

  @IsOptional()
  @IsBoolean()
  isWalkIn?: boolean;
}

export class CheckInVisitorDto {
  @IsOptional()
  @IsString()
  @MaxLength(100)
  name?: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsString()
  company?: string;

  @IsOptional()
  @IsUUID()
  hostId?: string;

  @IsOptional()
  @IsUUID()
  bookingId?: string;
}

export class UpdateVisitorDto {
  @IsOptional()
  @IsString()
  @MaxLength(100)
  name?: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsString()
  company?: string;
}
