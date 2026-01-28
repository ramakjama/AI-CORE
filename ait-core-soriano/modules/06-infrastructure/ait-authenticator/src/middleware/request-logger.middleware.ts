import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger.utils';

export const requestLogger = (req: Request, res: Response, next: NextFunction): void => {
  const start = Date.now();

  res.on('finish', () => {
    const duration = Date.now() - start;
    const log = {
      method: req.method,
      url: req.url,
      status: res.statusCode,
      duration: `${duration}ms`,
      ip: req.ip,
      userAgent: req.get('user-agent')
    };

    if (res.statusCode >= 500) {
      logger.error('Request failed', log);
    } else if (res.statusCode >= 400) {
      logger.warn('Request warning', log);
    } else {
      logger.info('Request completed', log);
    }
  });

  next();
};
