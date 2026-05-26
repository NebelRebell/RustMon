import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { ScheduledCommand, ScheduledCommandsStore } from './scheduled-commands.model';

const DATA_DIR = process.env.DATA_DIR || path.join(process.cwd(), 'data');
const FILE = path.join(DATA_DIR, 'scheduled-commands.json');

@Injectable()
export class ScheduledCommandsService implements OnModuleInit {
  private readonly logger = new Logger(ScheduledCommandsService.name);
  private store: ScheduledCommandsStore = { commands: [] };
  private timers: Map<string, NodeJS.Timeout> = new Map();
  private rconExecutor?: (cmd: string) => void;

  onModuleInit() {
    this.load();
    this.rescheduleAll();
  }

  setRconExecutor(fn: (cmd: string) => void) {
    this.rconExecutor = fn;
  }

  private load() {
    try {
      if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
      if (fs.existsSync(FILE)) {
        this.store = JSON.parse(fs.readFileSync(FILE, 'utf-8'));
      }
    } catch (e) {
      this.logger.error('Failed to load scheduled commands: ' + e.message);
    }
  }

  private save() {
    try {
      fs.writeFileSync(FILE, JSON.stringify(this.store, null, 2), 'utf-8');
    } catch (e) {
      this.logger.error('Failed to save scheduled commands: ' + e.message);
    }
  }

  private rescheduleAll() {
    this.timers.forEach(t => clearInterval(t));
    this.timers.clear();
    for (const cmd of this.store.commands) {
      if (cmd.active) this.schedule(cmd);
    }
  }

  private schedule(cmd: ScheduledCommand) {
    const timer = setInterval(() => {
      this.execute(cmd.id);
    }, cmd.intervalSeconds * 1000);
    this.timers.set(cmd.id, timer);
  }

  private execute(id: string) {
    const cmd = this.store.commands.find(c => c.id === id);
    if (!cmd || !cmd.active) return;
    cmd.lastRun = new Date().toISOString();
    this.save();
    if (this.rconExecutor) {
      this.rconExecutor(cmd.command);
    } else {
      this.logger.log(`[Scheduled] Would execute: ${cmd.command} (no RCON executor registered)`);
    }
  }

  getAll(): ScheduledCommand[] {
    return this.store.commands;
  }

  create(data: Omit<ScheduledCommand, 'id' | 'lastRun'>): ScheduledCommand {
    const cmd: ScheduledCommand = { ...data, id: uuidv4(), lastRun: null };
    this.store.commands.push(cmd);
    this.save();
    if (cmd.active) this.schedule(cmd);
    return cmd;
  }

  update(id: string, data: Partial<Omit<ScheduledCommand, 'id'>>): ScheduledCommand | null {
    const idx = this.store.commands.findIndex(c => c.id === id);
    if (idx < 0) return null;
    this.store.commands[idx] = { ...this.store.commands[idx], ...data };
    this.save();
    if (this.timers.has(id)) {
      clearInterval(this.timers.get(id));
      this.timers.delete(id);
    }
    if (this.store.commands[idx].active) this.schedule(this.store.commands[idx]);
    return this.store.commands[idx];
  }

  delete(id: string): boolean {
    const before = this.store.commands.length;
    this.store.commands = this.store.commands.filter(c => c.id !== id);
    if (this.timers.has(id)) {
      clearInterval(this.timers.get(id));
      this.timers.delete(id);
    }
    const removed = this.store.commands.length < before;
    if (removed) this.save();
    return removed;
  }
}
