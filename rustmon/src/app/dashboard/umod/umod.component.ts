import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { UserDataService } from 'src/app/api/user-data.service';
import { RustEvent } from 'src/app/rustRCON/RustEvent';
import { RustService } from 'src/app/rustRCON/rust.service';

export interface Plugin {
  id: string;
  name: string;
  author: string;
  file: string;
  sizeBytes: number;
  size: string;
  timeMs: number;
  time: string;
  version: string;
  loaded: boolean;
  loading?: boolean;
  slug?: string;
  updates?: boolean;
  latest_release_version?: string;
}

@Component({
  selector: 'app-umod',
  templateUrl: './umod.component.html',
  styleUrls: ['./umod.component.scss']
})
export class UmodComponent implements OnInit {

  @Output() close = new EventEmitter<void>();
  @Input() visible: boolean = false;
  @Input() version: string = '0.0.1';
  @Output() pluginUpdates = new EventEmitter<void>();

  constructor(
    private rustSrv: RustService,
    private readonly userDS: UserDataService
  ) { }

  public plugins: Plugin[] = [];
  public sortField: string = 'id';
  public sortOrder: number = 1;
  public filterTerm: string = '';

  get filteredPlugins(): Plugin[] {
    if (!this.filterTerm) return this.plugins;
    const term = this.filterTerm.toLowerCase();
    return this.plugins.filter(p =>
      p.id.toLowerCase().includes(term) || (p.author || '').toLowerCase().includes(term)
    );
  }

  public pluginsCols = [
    { field: 'id', header: 'Name', width: '250px' },
    { field: 'author', header: 'Author', width: '250px' },
    { field: 'sizeBytes', header: 'Size', width: '100px' },
    { field: 'timeMs', header: 'Load Time', width: '100px' },
    { field: 'actions', header: 'Actions', width: '300px' },
  ];

  ngOnInit(): void {
    this.rustSrv.oplugins();
    this.rustSrv.getEvtRust().subscribe((d: RustEvent) => {
      if (d.type == 1005) {
        const lines = d.raw.split('\n');
        if (lines.length < 2) return;
        this.plugins = lines.splice(1).map((p: string) => {
          const result = /([0-9]+)\s(\"([^\"]+)\"\s\(([0-9]+\.[0-9]+\.[0-9]+)\)\sby\s([^\(]+)(\([^\)]+\))\s-\s)?([^\s]+)(\s-\sUnloaded)?/gm.exec(p);
          const id = result[7].replace('.cs', '').trim();
          const timeSize = result[6]?.replace('(', '').replace(')', '').split('/');
          const sizeStr = timeSize ? timeSize[1] : undefined;
          const timeStr = timeSize ? timeSize[0] : undefined;
          return {
            name: result[3] ? result[3] : result[7],
            file: `${id}.cs`,
            sizeBytes: sizeStr ? this.convertMBKBtoBytes(sizeStr) : 0,
            size: sizeStr || '-',
            timeMs: timeStr ? parseFloat(timeStr.replace('s', '')) * 1000 : 0,
            time: timeStr || '-',
            version: result[4],
            author: result[5],
            id: id,
            loaded: !result[8],
            loading: false,
            slug: id.replace(/([a-z])([A-Z])/g, '$1-$2').toLowerCase(),
          } as Plugin;
        });
        this.calcStats(this.plugins);
        this.userDS.getPluginUpdates(this.plugins).subscribe((r: any) => {
          let updates = false;
          r.forEach((update: any) => {
            const plugin = this.plugins.find(p => p.id == update.id);
            if (!update.meta.slug) return;
            if (this.vStd(plugin.version.trim()) != this.vStd(update.meta.latest_release_version.trim())) {
              plugin.updates = true;
              plugin.latest_release_version = update.meta.latest_release_version;
              updates = true;
            } else {
              plugin.updates = false;
              plugin.latest_release_version = update.meta.latest_release_version;
            }
          });
          if (updates) {
            this.pluginUpdates.emit();
          }
        });
      }
      if (d.type == 1006) {
        this.rustSrv.oplugins();
      }
      if (d.type == 1007) {
        this.rustSrv.oplugins();
      }
      if (d.type == 1008) {
        this.rustSrv.oplugins();
      }
    });
  }

  sortPlugins(field: string) {
    if (this.sortField === field) {
      this.sortOrder = this.sortOrder === 1 ? -1 : 1;
    } else {
      this.sortField = field;
      this.sortOrder = 1;
    }
    this.plugins = [...this.plugins].sort((a: any, b: any) => {
      const valA = a[field] ?? '';
      const valB = b[field] ?? '';
      if (typeof valA === 'number' && typeof valB === 'number') {
        return (valA - valB) * this.sortOrder;
      }
      return valA.toString().localeCompare(valB.toString()) * this.sortOrder;
    });
  }

  getSortIcon(field: string): string {
    if (this.sortField !== field) return '↕';
    return this.sortOrder === 1 ? '↑' : '↓';
  }

  getStringFromInputEvent(evt: any): string {
    return evt.target.value;
  }

  vStd(version: string): string {
    const parts = version.split('.');
    if (parts.length == 2) parts.push('0');
    if (parts.length == 1) parts.push('0', '0');
    if (parts.length > 3) parts.splice(3, parts.length - 3);
    return parts.map(v => v.padStart(3, '0')).join('');
  }

  stats = {
    loaded: 0,
    size: '0kb',
    time: '0s',
    unloaded: 0
  };

  calcStats(plugins: Plugin[]) {
    const loaded = plugins.filter(p => p.loaded).length;
    const unloaded = plugins.filter(p => !p.loaded).length;
    const totalBytes = plugins.reduce((a, p) => a + (p.sizeBytes || 0), 0);
    const totalTimeMs = plugins.reduce((a, p) => a + (p.timeMs || 0), 0);
    this.stats = {
      loaded,
      size: this.convertBytesToMBKB(totalBytes),
      time: (totalTimeMs / 1000).toFixed(2) + 's',
      unloaded
    };
  }

  convertMBKBtoBytes(size: string): number {
    if (size.includes('MB')) {
      return parseFloat(size.replace('MB', '').trim()) * 1024 * 1024;
    } else if (size.includes('KB')) {
      return parseFloat(size.replace('KB', '').trim()) * 1024;
    } else {
      return parseFloat(size.replace('B', '').trim()) || 0;
    }
  }

  convertBytesToMBKB(size: number): string {
    if (size > 1024 * 1024) {
      return `${(size / 1024 / 1024).toFixed(2)} MB`;
    } else if (size > 1024) {
      return `${(size / 1024).toFixed(2)} KB`;
    } else {
      return `${size} B`;
    }
  }

  reload(name: string) { this.rustSrv.oreload(name); }
  unload(name: string) { this.rustSrv.ounload(name); }
  load(name: string) { this.rustSrv.oload(name); }
}
