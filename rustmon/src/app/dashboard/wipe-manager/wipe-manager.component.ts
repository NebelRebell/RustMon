import { Component, EventEmitter, OnInit, Output } from '@angular/core';
import { MessageService } from 'primeng/api';
import { RustService } from 'src/app/rustRCON/rust.service';

interface WipeOptions {
  wipeMap: boolean;
  wipePlayerData: boolean;
  wipeBlueprintData: boolean;
  mapSize: number;
  randomSeed: boolean;
  customSeed?: number;
  customMapUrl?: string;
  startupCommands: string[];
}

interface WipeSchedule {
  enabled: boolean;
  frequency: 'weekly' | 'bi-weekly' | 'monthly' | 'first-thursday';
  dayOfWeek: number;
  dayOfMonth: number;
  time: string;
  options: WipeOptions;
}

@Component({
  selector: 'app-wipe-manager',
  templateUrl: './wipe-manager.component.html',
  styleUrls: ['./wipe-manager.component.scss']
})
export class WipeManagerComponent implements OnInit {

  @Output() close = new EventEmitter<void>();

  schedule: WipeSchedule = {
    enabled: false,
    frequency: 'weekly',
    dayOfWeek: 4,
    dayOfMonth: 1,
    time: '18:00',
    options: {
      wipeMap: true,
      wipePlayerData: true,
      wipeBlueprintData: false,
      mapSize: 4000,
      randomSeed: true,
      startupCommands: []
    }
  };

  customMapSize = 4000;

  frequencies = [
    { value: 'weekly', label: 'Weekly' },
    { value: 'bi-weekly', label: 'Bi-Weekly' },
    { value: 'monthly', label: 'Monthly' },
    { value: 'first-thursday', label: 'First Thursday (Official)' }
  ];

  daysOfWeek = [
    { value: 0, label: 'Sunday' },
    { value: 1, label: 'Monday' },
    { value: 2, label: 'Tuesday' },
    { value: 3, label: 'Wednesday' },
    { value: 4, label: 'Thursday' },
    { value: 5, label: 'Friday' },
    { value: 6, label: 'Saturday' }
  ];

  mapSizes = [
    { value: 2000, label: 'Small (2000)' },
    { value: 3000, label: 'Medium (3000)' },
    { value: 4000, label: 'Large (4000)' },
    { value: 4500, label: 'XL (4500)' },
    { value: 6000, label: 'XXL (6000)' },
    { value: 0, label: 'Custom...' }
  ];

  constructor(
    private rustSrv: RustService,
    private messageService: MessageService
  ) {}

  ngOnInit() {
    const saved = localStorage.getItem('wipe_schedule');
    if (saved) {
      try { this.schedule = JSON.parse(saved); } catch (_) {}
    }
  }

  getNextWipeDate(): string {
    const now = new Date();
    const next = new Date(now);

    if (this.schedule.frequency === 'first-thursday') {
      next.setDate(1);
      while (next.getDay() !== 4) next.setDate(next.getDate() + 1);
      if (next <= now) {
        next.setMonth(next.getMonth() + 1);
        next.setDate(1);
        while (next.getDay() !== 4) next.setDate(next.getDate() + 1);
      }
    } else if (this.schedule.frequency === 'weekly' || this.schedule.frequency === 'bi-weekly') {
      let daysUntil = (this.schedule.dayOfWeek - now.getDay() + 7) % 7 || 7;
      next.setDate(now.getDate() + daysUntil);
      if (this.schedule.frequency === 'bi-weekly') next.setDate(next.getDate() + 7);
    } else if (this.schedule.frequency === 'monthly') {
      next.setDate(this.schedule.dayOfMonth);
      if (next <= now) next.setMonth(next.getMonth() + 1);
    }

    const [h, m] = this.schedule.time.split(':');
    next.setHours(parseInt(h), parseInt(m), 0, 0);
    return next.toLocaleDateString('de-DE', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }) + ' ' + this.schedule.time;
  }

  saveSchedule() {
    localStorage.setItem('wipe_schedule', JSON.stringify(this.schedule));
    this.messageService.add({ severity: 'success', summary: 'Saved', detail: 'Wipe schedule saved' });
    this.close.emit();
  }

  executeWipeNow() {
    const commands: string[] = [];
    if (this.schedule.options.wipeBlueprintData) commands.push('wipe');
    if (this.schedule.options.wipePlayerData) commands.push('server.wipe');
    if (this.schedule.options.wipeMap) {
      const size = this.schedule.options.mapSize || this.customMapSize;
      if (!this.schedule.options.randomSeed && this.schedule.options.customSeed) {
        commands.push(`server.seed ${this.schedule.options.customSeed}`);
      }
      commands.push(`server.worldsize ${size}`);
    }
    commands.push('server.save');
    commands.forEach(cmd => this.rustSrv.sendCommand(cmd));
    if (this.schedule.options.startupCommands?.length) {
      setTimeout(() => {
        this.schedule.options.startupCommands.forEach(cmd => this.rustSrv.sendCommand(cmd));
      }, 5000);
    }
    this.messageService.add({ severity: 'warn', summary: 'Wipe Initiated', detail: 'Wipe commands sent to server' });
  }

  addStartupCommand() {
    const cmd = prompt('Enter startup command:');
    if (cmd?.trim()) {
      this.schedule.options.startupCommands = [...(this.schedule.options.startupCommands || []), cmd.trim()];
    }
  }

  removeStartupCommand(index: number) {
    this.schedule.options.startupCommands.splice(index, 1);
  }
}
