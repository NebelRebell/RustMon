import { Module } from '@nestjs/common';
import { ScheduledCommandsController } from './scheduled-commands.controller';
import { ScheduledCommandsService } from './scheduled-commands.service';

@Module({
  controllers: [ScheduledCommandsController],
  providers: [ScheduledCommandsService],
  exports: [ScheduledCommandsService],
})
export class ScheduledCommandsModule {}
