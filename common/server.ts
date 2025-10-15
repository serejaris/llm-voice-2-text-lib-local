/**
 * Simplified server utilities for local-only MVP.
 * Removed unused authentication and encryption functions.
 */

import type { NextApiRequest, NextApiResponse } from 'next';

/**
 * Simple CORS middleware for local development.
 * Allows all origins and common HTTP methods.
 * 
 * For a local-only single-user application, CORS is minimally restrictive.
 */
export async function cors(req: NextApiRequest, res: NextApiResponse): Promise<void> {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Handle preflight OPTIONS request
  if (req.method === 'OPTIONS') {
    res.status(204).end();
    return;
  }
}
