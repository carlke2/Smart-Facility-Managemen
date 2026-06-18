import { IsNotEmpty, IsString, IsOptional, IsEnum, IsDateString } from 'class-validator';
import { BookingStatus } from '@prisma/client';

export class CreateBookingDto {
  @IsNotEmpty()
  @IsString()
  title: string;

  @IsNotEmpty()
  @IsString()
  roomId: string;

  @IsDateString()
  date: string;

  @IsNotEmpty()
  @IsString()
  startTime: string;

  @IsNotEmpty()
  @IsString()
  endTime: string;

  @IsOptional()
  @IsString()
  notes?: string;
}

export class UpdateBookingDto {
  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsString()
  roomId?: string;

  @IsOptional()
  @IsDateString()
  date?: string;

  @IsOptional()
  @IsString()
  startTime?: string;

  @IsOptional()
  @IsString()
  endTime?: string;

  @IsOptional()
  @IsEnum(BookingStatus)
  status?: BookingStatus;

  @IsOptional()
  @IsString()
  notes?: string;
}
