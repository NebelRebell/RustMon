export enum BlacklistSeverity {
  WARN = 'warn',
  KICK = 'kick',
  BAN = 'ban',
}

export interface BlacklistEntry {
  steamId: string;
  reason: string;
  addedBy: string;
  date: string;
  severity: BlacklistSeverity;
}

export interface BlacklistStore {
  entries: BlacklistEntry[];
}
