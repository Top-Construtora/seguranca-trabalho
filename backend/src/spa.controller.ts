import { Controller, Get, Res } from '@nestjs/common';
import { Response } from 'express';
import * as path from 'path';
import * as fs from 'fs';

@Controller()
export class SpaController {
  @Get('*')
  serveSpa(@Res() res: Response): void {
    // Only serve SPA in production
    if (process.env.NODE_ENV !== 'production') {
      return res.status(404).send('Not Found - Use frontend dev server in development');
    }

    const indexPath = path.join(process.cwd(), '..', 'frontend', 'dist', 'index.html');

    // Check if file exists
    if (fs.existsSync(indexPath)) {
      return res.sendFile(indexPath);
    }

    return res.status(404).send('Frontend not found. Please build the frontend first.');
  }
}
