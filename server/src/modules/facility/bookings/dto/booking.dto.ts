import {
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  MinLength,
} from 'class-validator';
import { BookingStatus, RecurrenceType } from '@prisma/client';

export class CreateBookingDto {
  @IsNotEmpty()
  @IsString()
  @MaxLength(200)
  title: string;

  @IsUUID()
  roomId: string;

  @IsString()
  @IsNotEmpty()
  date: string; // ISO date e.g. "2026-07-15"

  @IsString()
  @IsNotEmpty()
  startTime: string; // "HH:MM" e.g. "09:00"

  @IsString()
  @IsNotEmpty()
  endTime: string; // "HH:MM" e.g. "10:30"

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  notes?: string;

  @IsOptional()
  @IsEnum(RecurrenceType)
  recurrence?: RecurrenceType;

  @IsOptional()
  @IsString()
  recurrenceEndDate?: string;
}

export class UpdateBookingDto {
  @IsOptional()
  @IsString()
  @MaxLength(200)
  title?: string;

  @IsOptional()
  @IsString()
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
  @MaxLength(1000)
  notes?: string;
}

export class ApproveBookingDto {
  @IsOptional()
  @IsString()
  @MaxLength(500)
  notes?: string;
}

export class RejectBookingDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(500)
  reason: string;
}
