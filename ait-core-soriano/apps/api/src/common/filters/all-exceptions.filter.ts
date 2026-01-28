import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';
import { ThrottlerException } from '@nestjs/throttler';

/**
 * Global Exception Filter
 *
 * Catches ALL exceptions thrown in the application and formats them
 * into a consistent error response structure.
 *
 * Features:
 * - Handles all exception types (HTTP, Prisma, Throttler, unknown)
 * - Provides detailed error information in development
 * - Sanitizes error messages in production
 * - Logs all errors for monitoring
 * - Returns consistent error response format
 *
 * Error Response Format:
 * {
 *   statusCode: number,
 *   timestamp: string,
 *   path: string,
 *   method: string,
 *   message: string | string[],
 *   error: string,
 *   requestId?: string,
 *   stack?: string (only in development)
 * }
 */
@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    // Extract request information
    const requestId = request.headers['x-request-id'] as string;
    const method = request.method;
    const url = request.url;
    const timestamp = new Date().toISOString();

    // Determine status code and error message based on exception type
    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message: string | string[] = 'Internal server error';
    let error = 'Internal Server Error';
    let details: any = null;

    // Handle different exception types
    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const exceptionResponse = exception.getResponse();

      if (typeof exceptionResponse === 'object') {
        message = (exceptionResponse as any).message || exception.message;
        error = (exceptionResponse as any).error || exception.name;
        details = (exceptionResponse as any).details;
      } else {
        message = exceptionResponse;
        error = exception.name;
      }
    } else if (exception instanceof PrismaClientKnownRequestError) {
      // Handle Prisma database errors
      const prismaError = this.handlePrismaError(exception);
      status = prismaError.status;
      message = prismaError.message;
      error = prismaError.error;
      details = prismaError.details;
    } else if (exception instanceof ThrottlerException) {
      // Handle rate limiting errors
      status = HttpStatus.TOO_MANY_REQUESTS;
      message = 'Too many requests, please try again later';
      error = 'Rate Limit Exceeded';
    } else if (exception instanceof Error) {
      // Handle standard JavaScript errors
      message = exception.message;
      error = exception.name;
    }

    // Construct error response
    const errorResponse: any = {
      statusCode: status,
      timestamp,
      path: url,
      method,
      message,
      error,
    };

    // Add request ID if present
    if (requestId) {
      errorResponse.requestId = requestId;
    }

    // Add details if present
    if (details) {
      errorResponse.details = details;
    }

    // Add stack trace in development mode
    if (process.env.NODE_ENV !== 'production' && exception instanceof Error) {
      errorResponse.stack = exception.stack;
    }

    // Log the error
    this.logError(exception, request, status);

    // Send error response
    response.status(status).json(errorResponse);
  }

  /**
   * Handle Prisma database errors and convert them to user-friendly messages
   */
  private handlePrismaError(exception: PrismaClientKnownRequestError): {
    status: number;
    message: string;
    error: string;
    details: any;
  } {
    const code = exception.code;
    const meta = exception.meta;

    switch (code) {
      case 'P2000':
        return {
          status: HttpStatus.BAD_REQUEST,
          message: 'The provided value is too long for the column',
          error: 'Database Validation Error',
          details: meta,
        };

      case 'P2001':
        return {
          status: HttpStatus.NOT_FOUND,
          message: 'The record searched for in the where condition does not exist',
          error: 'Record Not Found',
          details: meta,
        };

      case 'P2002':
        return {
          status: HttpStatus.CONFLICT,
          message: `Unique constraint failed on the field: ${(meta?.target as string[])?.join(', ')}`,
          error: 'Duplicate Entry',
          details: meta,
        };

      case 'P2003':
        return {
          status: HttpStatus.BAD_REQUEST,
          message: 'Foreign key constraint failed',
          error: 'Invalid Reference',
          details: meta,
        };

      case 'P2004':
        return {
          status: HttpStatus.BAD_REQUEST,
          message: 'A constraint failed on the database',
          error: 'Constraint Violation',
          details: meta,
        };

      case 'P2005':
        return {
          status: HttpStatus.BAD_REQUEST,
          message: `The value stored in the database is invalid for the field's type`,
          error: 'Invalid Field Value',
          details: meta,
        };

      case 'P2006':
        return {
          status: HttpStatus.BAD_REQUEST,
          message: 'The provided value is not valid',
          error: 'Invalid Value',
          details: meta,
        };

      case 'P2007':
        return {
          status: HttpStatus.BAD_REQUEST,
          message: 'Data validation error',
          error: 'Validation Error',
          details: meta,
        };

      case 'P2008':
        return {
          status: HttpStatus.INTERNAL_SERVER_ERROR,
          message: 'Failed to parse the query',
          error: 'Query Parse Error',
          details: meta,
        };

      case 'P2009':
        return {
          status: HttpStatus.INTERNAL_SERVER_ERROR,
          message: 'Failed to validate the query',
          error: 'Query Validation Error',
          details: meta,
        };

      case 'P2010':
        return {
          status: HttpStatus.INTERNAL_SERVER_ERROR,
          message: 'Raw query failed',
          error: 'Query Execution Error',
          details: meta,
        };

      case 'P2011':
        return {
          status: HttpStatus.BAD_REQUEST,
          message: 'Null constraint violation',
          error: 'Required Field Missing',
          details: meta,
        };

      case 'P2012':
        return {
          status: HttpStatus.BAD_REQUEST,
          message: 'Missing a required value',
          error: 'Missing Required Value',
          details: meta,
        };

      case 'P2013':
        return {
          status: HttpStatus.BAD_REQUEST,
          message: 'Missing the required argument',
          error: 'Missing Argument',
          details: meta,
        };

      case 'P2014':
        return {
          status: HttpStatus.BAD_REQUEST,
          message: 'The change would violate the required relation',
          error: 'Relation Violation',
          details: meta,
        };

      case 'P2015':
        return {
          status: HttpStatus.NOT_FOUND,
          message: 'A related record could not be found',
          error: 'Related Record Not Found',
          details: meta,
        };

      case 'P2016':
        return {
          status: HttpStatus.BAD_REQUEST,
          message: 'Query interpretation error',
          error: 'Query Error',
          details: meta,
        };

      case 'P2017':
        return {
          status: HttpStatus.BAD_REQUEST,
          message: 'The records for relation are not connected',
          error: 'Records Not Connected',
          details: meta,
        };

      case 'P2018':
        return {
          status: HttpStatus.BAD_REQUEST,
          message: 'The required connected records were not found',
          error: 'Connected Records Not Found',
          details: meta,
        };

      case 'P2019':
        return {
          status: HttpStatus.BAD_REQUEST,
          message: 'Input error',
          error: 'Input Error',
          details: meta,
        };

      case 'P2020':
        return {
          status: HttpStatus.BAD_REQUEST,
          message: 'Value out of range for the type',
          error: 'Value Out of Range',
          details: meta,
        };

      case 'P2021':
        return {
          status: HttpStatus.INTERNAL_SERVER_ERROR,
          message: 'The table does not exist in the current database',
          error: 'Table Does Not Exist',
          details: meta,
        };

      case 'P2022':
        return {
          status: HttpStatus.INTERNAL_SERVER_ERROR,
          message: 'The column does not exist in the current database',
          error: 'Column Does Not Exist',
          details: meta,
        };

      case 'P2023':
        return {
          status: HttpStatus.INTERNAL_SERVER_ERROR,
          message: 'Inconsistent column data',
          error: 'Inconsistent Column Data',
          details: meta,
        };

      case 'P2024':
        return {
          status: HttpStatus.REQUEST_TIMEOUT,
          message: 'Timed out fetching a new connection from the connection pool',
          error: 'Connection Pool Timeout',
          details: meta,
        };

      case 'P2025':
        return {
          status: HttpStatus.NOT_FOUND,
          message: 'Record to delete does not exist',
          error: 'Record Not Found',
          details: meta,
        };

      case 'P2026':
        return {
          status: HttpStatus.BAD_REQUEST,
          message: 'The current database provider does not support a feature',
          error: 'Unsupported Feature',
          details: meta,
        };

      case 'P2027':
        return {
          status: HttpStatus.INTERNAL_SERVER_ERROR,
          message: 'Multiple errors occurred on the database during query execution',
          error: 'Multiple Database Errors',
          details: meta,
        };

      default:
        return {
          status: HttpStatus.INTERNAL_SERVER_ERROR,
          message: 'An unexpected database error occurred',
          error: 'Database Error',
          details: { code, ...meta },
        };
    }
  }

  /**
   * Log error with appropriate level based on status code
   */
  private logError(exception: unknown, request: Request, status: number): void {
    const userId = (request as any).user?.id || 'anonymous';
    const requestId = request.headers['x-request-id'];
    const method = request.method;
    const url = request.url;

    const logContext = {
      userId,
      requestId,
      method,
      url,
      status,
    };

    // Log at different levels based on status code
    if (status >= 500) {
      this.logger.error(
        `${method} ${url} - ${status}`,
        exception instanceof Error ? exception.stack : String(exception),
        JSON.stringify(logContext),
      );
    } else if (status >= 400) {
      this.logger.warn(
        `${method} ${url} - ${status}`,
        JSON.stringify({
          ...logContext,
          message: exception instanceof Error ? exception.message : String(exception),
        }),
      );
    } else {
      this.logger.log(`${method} ${url} - ${status}`, JSON.stringify(logContext));
    }
  }
}
