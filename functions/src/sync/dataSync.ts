import { Request, Response } from 'express';

export const dataSync = async (req: Request, res: Response) => {
  console.log('Data sync endpoint called');
  res.json({ status: 'ok', message: 'Data sync endpoint' });
};