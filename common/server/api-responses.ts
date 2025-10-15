import type { NextApiResponse } from 'next';

/**
 * Sends a standardized success response.
 * 
 * @param res - Next.js API response object
 * @param data - The data payload to send
 * @param statusCode - HTTP status code (default: 200)
 */
export function successResponse(res: NextApiResponse, data: any, statusCode: number = 200) {
  return res.status(statusCode).json({
    success: true,
    data,
  });
}

/**
 * Sends a standardized error response.
 * 
 * @param res - Next.js API response object
 * @param statusCode - HTTP status code
 * @param message - Optional error message for debugging
 */
export function errorResponse(res: NextApiResponse, statusCode: number, message?: string) {
  const response: any = {
    error: true,
    data: null,
  };

  if (message) {
    response.message = message;
  }

  return res.status(statusCode).json(response);
}

/**
 * Sends a 404 Not Found response.
 * 
 * @param res - Next.js API response object
 * @param message - Optional error message
 */
export function notFoundResponse(res: NextApiResponse, message?: string) {
  return errorResponse(res, 404, message || 'Resource not found');
}

/**
 * Sends a 400 Bad Request response.
 * 
 * @param res - Next.js API response object
 * @param message - Optional error message
 */
export function badRequestResponse(res: NextApiResponse, message?: string) {
  return errorResponse(res, 400, message || 'Bad request');
}

/**
 * Sends a 500 Internal Server Error response.
 * 
 * @param res - Next.js API response object
 * @param message - Optional error message
 */
export function serverErrorResponse(res: NextApiResponse, message?: string) {
  return errorResponse(res, 500, message || 'Internal server error');
}

/**
 * Sends a 405 Method Not Allowed response.
 * 
 * @param res - Next.js API response object
 * @param allowedMethods - Array of allowed HTTP methods
 */
export function methodNotAllowedResponse(res: NextApiResponse, allowedMethods: string[] = ['POST']) {
  res.setHeader('Allow', allowedMethods.join(', '));
  return errorResponse(res, 405, `Method not allowed. Allowed methods: ${allowedMethods.join(', ')}`);
}

/**
 * Sends a 409 Conflict response.
 * 
 * @param res - Next.js API response object
 * @param message - Optional error message
 */
export function conflictResponse(res: NextApiResponse, message?: string) {
  return errorResponse(res, 409, message || 'Conflict');
}
