import {
  IsEnum,
  IsISO8601,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  IsInt,
  Min,
  Max,
  IsNumber,
} from 'class-validator';
import { LeaveType } from '@prisma/client';

export class CreateLeaveRequestDto {
  @IsEnum(LeaveType)
  type: LeaveType;

  @IsISO8601()
  startDate: string;

  @IsISO8601()
  endDate: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(500)
  reason: string;
}

export class ReviewLeaveRequestDto {
  @IsOptional()
  @IsString()
  @MaxLength(500)
  reviewNote?: string;
}

export class InitLeaveBalanceDto {
  @IsEnum(LeaveType)
  leaveType: LeaveType;

  @IsNumber()
  @Min(0)
  @Max(365)
  totalDays: number;

  @IsInt()
  @Min(2020)
  @Max(2100)
  year: number;
}
