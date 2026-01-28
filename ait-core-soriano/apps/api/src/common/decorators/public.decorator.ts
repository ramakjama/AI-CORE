import { SetMetadata } from '@nestjs/common';

/**
 * Public Decorator
 *
 * Marks a route as public, bypassing JWT authentication.
 * Use this decorator on routes that don't require authentication.
 *
 * @example
 * ```typescript
 * @Public()
 * @Get('public-endpoint')
 * publicRoute() {
 *   return 'This endpoint is publicly accessible';
 * }
 * ```
 */
export const IS_PUBLIC_KEY = 'isPublic';
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);
