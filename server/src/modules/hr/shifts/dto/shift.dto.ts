import {
  IsEnum,
  IsISO8601,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
} from 'class-validator';
import { ShiftType } from '@prisma/client';

export class CreateShiftDto {
  @IsUUID()
  employeeId: string;

  @IsEnum(ShiftType)
  type: ShiftType;

  @IsISO8601()
  date: string; // The calendar date e.g. "2026-07-01"

  @IsString()
  @IsNotEmpty()
  startTime: string; // "HH:MM" e.g. "08:00"

  @IsString()
  @IsNotEmpty()
  endTime: string; // "HH:MM" e.g. "16:00"

  @IsOptional()
  @IsString()
  @MaxLength(500)
  notes?: string;
}

export class UpdateShiftDto {
  @IsOptional()
  @IsEnum(ShiftType)
  type?: ShiftType;

  @IsOptional()
  @IsString()
  startTime?: string;

  @IsOptional()
  @IsString()
  endTime?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  notes?: string;
}
