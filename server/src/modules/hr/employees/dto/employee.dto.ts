import {
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  IsDateString,
} from 'class-validator';
import { EmploymentStatus, EmploymentType } from '@prisma/client';

export class OnboardEmployeeDto {
  @IsUUID()
  userId: string;

  @IsUUID()
  organizationId: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  employeeId?: string;

  @IsOptional()
  @IsUUID()
  siteId?: string;

  @IsOptional()
  @IsUUID()
  departmentId?: string;

  @IsOptional()
  @IsUUID()
  teamId?: string;

  @IsOptional()
  @IsUUID()
  designationId?: string;

  @IsOptional()
  @IsEnum(EmploymentStatus)
  status?: EmploymentStatus;

  @IsOptional()
  @IsEnum(EmploymentType)
  employmentType?: EmploymentType;

  @IsOptional()
  @IsDateString()
  joiningDate?: string;

  @IsOptional()
  @IsUUID()
  reportingToId?: string;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  phoneNumber?: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  emergencyContact?: string;
}

export class UpdateEmployeeDto {
  @IsOptional()
  @IsUUID()
  siteId?: string;

  @IsOptional()
  @IsUUID()
  departmentId?: string;

  @IsOptional()
  @IsUUID()
  teamId?: string;

  @IsOptional()
  @IsUUID()
  designationId?: string;

  @IsOptional()
  @IsEnum(EmploymentStatus)
  status?: EmploymentStatus;

  @IsOptional()
  @IsEnum(EmploymentType)
  employmentType?: EmploymentType;

  @IsOptional()
  @IsUUID()
  reportingToId?: string;

  @IsOptional()
  @IsString()
  phoneNumber?: string;

  @IsOptional()
  @IsString()
  emergencyContact?: string;
}
