import {
  IsDecimal,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';

export class UpdateCompensationDto {
  @IsNumber()
  @Min(0)
  baseSalary: number;

  @IsOptional()
  @IsString()
  @MaxLength(3)
  currency?: string;

  @IsOptional()
  @IsString()
  payFrequency?: string; // MONTHLY | BIWEEKLY | WEEKLY
}

export class AddPayrollAdjustmentDto {
  @IsString()
  @IsNotEmpty()
  type: string; // BONUS | DEDUCTION | ARREARS | LOAN_REPAYMENT

  @IsNumber()
  @Min(0)
  amount: number;

  @IsString()
  @IsNotEmpty()
  @MaxLength(500)
  reason: string;

  @IsString()
  @IsNotEmpty()
  payrollPeriodId: string;
}

export class CreatePayrollPeriodDto {
  @IsString()
  @IsNotEmpty()
  name: string; // e.g. "June 2026"

  @IsString()
  startDate: string;

  @IsString()
  endDate: string;
}
