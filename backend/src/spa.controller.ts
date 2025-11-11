import { Controller, Get, Res } from '@nestjs/common';
import { Response } from 'express';
import * as path from 'path';
import * as fs from 'fs';

@Controller()
export class SpaController {
  @Get('*')
  serveSpa(@Res() res: Response) {
    // Only serve SPA in production
    if (process.env.NODE_ENV !== 'production') {
      res.status(404).send('Not Found - Use frontend dev server in development');
      return;
    }

    const indexPath = path.join(process.cwd(), '..', 'frontend', 'dist', 'index.html');

    // Check if file exists
    if (fs.existsSync(indexPath)) {
      res.sendFile(indexPath);
      return;
    }

    res.status(404).send('Frontend not found. Please build the frontend first.');
  }
}
