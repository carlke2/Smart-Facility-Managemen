import { IsNotEmpty, IsString, IsInt, IsOptional, IsBoolean, Min } from 'class-validator';

export class CreateRoomDto {
  @IsNotEmpty()
  @IsString()
  name: string;

  @IsNotEmpty()
  @IsString()
  location: string;

  @IsInt()
  @Min(1)
  capacity: number;

  @IsOptional()
  @IsString()
  description?: string;
}

export class UpdateRoomDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  location?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  capacity?: number;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
