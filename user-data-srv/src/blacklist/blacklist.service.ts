import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';
import { BlacklistEntry, BlacklistSeverity, BlacklistStore } from './blacklist.model';

const DATA_DIR = process.env.DATA_DIR || path.join(process.cwd(), 'data');
const BLACKLIST_FILE = path.join(DATA_DIR, 'blacklist.json');

@Injectable()
export class BlacklistService implements OnModuleInit {
  private readonly logger = new Logger(BlacklistService.name);
  private store: BlacklistStore = { entries: [] };

  onModuleInit() {
    this.load();
  }

  private load() {
    try {
      if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
      if (fs.existsSync(BLACKLIST_FILE)) {
        this.store = JSON.parse(fs.readFileSync(BLACKLIST_FILE, 'utf-8'));
      }
    } catch (e) {
      this.logger.error('Failed to load blacklist: ' + e.message);
    }
  }

  private save() {
    try {
      fs.writeFileSync(BLACKLIST_FILE, JSON.stringify(this.store, null, 2), 'utf-8');
    } catch (e) {
      this.logger.error('Failed to save blacklist: ' + e.message);
    }
  }

  getAll(): BlacklistEntry[] {
    return this.store.entries;
  }

  add(entry: Omit<BlacklistEntry, 'date'>): BlacklistEntry {
    const existing = this.store.entries.findIndex(e => e.steamId === entry.steamId);
    const full: BlacklistEntry = { ...entry, date: new Date().toISOString() };
    if (existing >= 0) {
      this.store.entries[existing] = full;
    } else {
      this.store.entries.push(full);
    }
    this.save();
    return full;
  }

  remove(steamId: string): boolean {
    const before = this.store.entries.length;
    this.store.entries = this.store.entries.filter(e => e.steamId !== steamId);
    const removed = this.store.entries.length < before;
    if (removed) this.save();
    return removed;
  }

  check(steamId: string): BlacklistEntry | null {
    return this.store.entries.find(e => e.steamId === steamId) || null;
  }

  exportJson(): string {
    return JSON.stringify(this.store, null, 2);
  }

  importJson(json: string): number {
    const imported: BlacklistStore = JSON.parse(json);
    let added = 0;
    for (const entry of imported.entries) {
      if (!this.store.entries.find(e => e.steamId === entry.steamId)) {
        this.store.entries.push(entry);
        added++;
      }
    }
    this.save();
    return added;
  }
}
