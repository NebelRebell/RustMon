export interface ScheduledCommand {
  id: string;
  command: string;
  intervalSeconds: number;
  description: string;
  active: boolean;
  lastRun: string | null;
}

export interface ScheduledCommandsStore {
  commands: ScheduledCommand[];
}
