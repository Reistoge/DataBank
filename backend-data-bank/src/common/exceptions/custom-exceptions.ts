// src/common/exceptions/custom-exceptions.ts
import { 
  BadRequestException, 
  NotFoundException, 
  UnauthorizedException, 
  ConflictException,
  InternalServerErrorException,
  HttpException,
  HttpStatus 
} from '@nestjs/common';

export class BusinessLogicException extends BadRequestException {
  constructor(message: string, context?: string) {
    super({
      message,
      error: 'Business Logic Error',
      context,
      timestamp: new Date().toISOString(),
    });
  }
}

export class ValidationException extends BadRequestException {
  constructor(message: string, field?: string) {
    super({
      message,
      error: 'Validation Error',
      field,
      timestamp: new Date().toISOString(),
    });
  }
}

export class DatabaseException extends InternalServerErrorException {
  constructor(message: string, operation?: string) {
    super({
      message,
      error: 'Database Error',
      operation,
      timestamp: new Date().toISOString(),
    });
  }
}

export class ExternalServiceException extends InternalServerErrorException {
  constructor(service: string, message: string) {
    super({
      message: `External service error: ${message}`,
      error: 'External Service Error',
      service,
      timestamp: new Date().toISOString(),
    });
  }
}