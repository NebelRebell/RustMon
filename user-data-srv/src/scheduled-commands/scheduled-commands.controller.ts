import { Body, Controller, Delete, Get, Param, Post, Put } from '@nestjs/common';
import { ScheduledCommandsService } from './scheduled-commands.service';

@Controller('scheduled-commands')
export class ScheduledCommandsController {
  constructor(private readonly svc: ScheduledCommandsService) {}

  @Get()
  getAll() {
    return this.svc.getAll();
  }

  @Post()
  create(@Body() body: { command: string; intervalSeconds: number; description: string; active: boolean }) {
    return this.svc.create(body);
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() body: any) {
    return this.svc.update(id, body) || { error: 'not found' };
  }

  @Delete(':id')
  delete(@Param('id') id: string) {
    return { removed: this.svc.delete(id) };
  }

  /** Frontend polls for commands due for execution **/
  @Get('pending')
  getPending() {
    return this.svc.getAll().filter(c => c.active);
  }

  /** Frontend confirms a command was executed via RCON **/
  @Post(':id/executed')
  markExecuted(@Param('id') id: string) {
    return this.svc.update(id, { lastRun: new Date().toISOString() }) || { error: 'not found' };
  }
}
