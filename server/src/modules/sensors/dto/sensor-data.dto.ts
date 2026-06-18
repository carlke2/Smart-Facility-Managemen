import { IsString, IsNotEmpty, IsNumber, IsObject } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateSensorDto {
  @ApiProperty({ example: 'room_101_occupancy' })
  @IsString()
  @IsNotEmpty()
  sensorId: string;

  @ApiProperty({ example: 'occupancy' })
  @IsString()
  @IsNotEmpty()
  type: string;

  @ApiProperty({ example: 1 })
  @IsNumber()
  value: number;

  @ApiProperty({ example: { unit: 'binary', location: 'Ceiling' } })
  @IsObject()
  metadata: any;
}
