import { PartialType } from '@nestjs/mapped-types';
import { CreateFraudSystemDto } from './create-fraud-system.dto';

export class UpdateFraudSystemDto extends PartialType(CreateFraudSystemDto) {}
