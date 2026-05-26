import { Body, Controller, Delete, Get, Param, Post, Res } from '@nestjs/common';
import { Response } from 'express';
import { BlacklistEntry, BlacklistSeverity } from './blacklist.model';
import { BlacklistService } from './blacklist.service';

@Controller('blacklist')
export class BlacklistController {
  constructor(private readonly svc: BlacklistService) {}

  @Get()
  getAll() {
    return this.svc.getAll();
  }

  @Post()
  add(@Body() body: { steamId: string; reason: string; addedBy: string; severity: BlacklistSeverity }) {
    return this.svc.add(body);
  }

  @Delete(':steamId')
  remove(@Param('steamId') steamId: string) {
    const removed = this.svc.remove(steamId);
    return { removed };
  }

  @Get('check/:steamId')
  check(@Param('steamId') steamId: string) {
    return this.svc.check(steamId) || { found: false };
  }

  @Get('export')
  exportJson(@Res() res: Response) {
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', 'attachment; filename="rustadmin-blacklist.json"');
    res.send(this.svc.exportJson());
  }

  @Post('import')
  importJson(@Body() body: { json: string }) {
    const added = this.svc.importJson(body.json);
    return { added };
  }
}
