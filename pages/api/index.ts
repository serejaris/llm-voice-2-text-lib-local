import * as Server from '@common/server';

import type { NextApiRequest, NextApiResponse } from 'next';

export const config = {
  api: {
    responseLimit: false,
  },
};

export default async function apiIndex(req: NextApiRequest, res: NextApiResponse) {
  await Server.cors(req, res);

  return res.json({
    success: true,
    message: 'hey there, friend.',
  });
}
