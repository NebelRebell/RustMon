import { Component, EventEmitter, OnInit, Output } from '@angular/core';
import { ConfirmationService, MessageService } from 'primeng/api';
import { PluginInfo, PterodactylService } from 'src/app/api/pterodactyl.service';
import { RustService } from 'src/app/rustRCON/rust.service';

@Component({
  selector: 'app-plugin-manager',
  templateUrl: './plugin-manager.component.html',
  styleUrls: ['./plugin-manager.component.scss']
})
export class PluginManagerComponent implements OnInit {

  @Output() close = new EventEmitter<void>();

  plugins: PluginInfo[] = [];
  loading = false;

  constructor(
    private pterodactylSrv: PterodactylService,
    private rustSrv: RustService,
    private messageService: MessageService,
    private confirmationService: ConfirmationService
  ) {}

  ngOnInit() {
    this.refreshPlugins();
  }

  refreshPlugins() {
    this.loading = true;
    this.pterodactylSrv.getInstalledPlugins().subscribe(
      plugins => {
        this.plugins = plugins;
        this.loading = false;
      },
      err => {
        this.loading = false;
        this.messageService.add({ severity: 'error', summary: 'Error', detail: err?.error?.message || 'Failed to load plugins' });
      }
    );
  }

  onFileSelected(event: any) {
    const file: File = event.target.files[0];
    if (!file) return;
    if (!file.name.endsWith('.cs')) {
      this.messageService.add({ severity: 'warn', summary: 'Invalid file', detail: 'Only .cs plugin files are supported' });
      return;
    }
    this.pterodactylSrv.uploadPlugin(file).subscribe(
      () => {
        this.messageService.add({ severity: 'success', summary: 'Uploaded', detail: `${file.name} uploaded successfully` });
        setTimeout(() => this.refreshPlugins(), 1000);
      },
      err => {
        this.messageService.add({ severity: 'error', summary: 'Upload failed', detail: err?.error?.message || 'Failed to upload plugin' });
      }
    );
  }

  updatePlugin(plugin: PluginInfo) {
    this.confirmationService.confirm({
      message: `Update ${plugin.name} to v${plugin.latestVersion}?`,
      accept: () => {
        this.pterodactylSrv.updatePlugin(plugin.name).subscribe(
          () => {
            this.rustSrv.sendCommand(`oxide.reload ${plugin.name}`);
            this.messageService.add({ severity: 'success', summary: 'Updated', detail: `${plugin.name} updated` });
            setTimeout(() => this.refreshPlugins(), 1000);
          },
          err => {
            this.messageService.add({ severity: 'error', summary: 'Update failed', detail: err?.error?.message || 'Failed to update plugin' });
          }
        );
      }
    });
  }

  togglePlugin(plugin: PluginInfo) {
    if (plugin.enabled) {
      this.rustSrv.sendCommand(`oxide.unload ${plugin.name}`);
      plugin.enabled = false;
      this.messageService.add({ severity: 'info', summary: 'Disabled', detail: `${plugin.name} unloaded` });
    } else {
      this.rustSrv.sendCommand(`oxide.load ${plugin.name}`);
      plugin.enabled = true;
      this.messageService.add({ severity: 'info', summary: 'Enabled', detail: `${plugin.name} loaded` });
    }
  }

  deletePlugin(plugin: PluginInfo) {
    this.confirmationService.confirm({
      message: `Delete ${plugin.name}? This cannot be undone.`,
      accept: () => {
        if (plugin.enabled) {
          this.rustSrv.sendCommand(`oxide.unload ${plugin.name}`);
        }
        this.pterodactylSrv.deletePlugin(plugin.filename).subscribe(
          () => {
            this.messageService.add({ severity: 'success', summary: 'Deleted', detail: `${plugin.name} deleted` });
            setTimeout(() => this.refreshPlugins(), 1000);
          },
          err => {
            this.messageService.add({ severity: 'error', summary: 'Delete failed', detail: err?.error?.message || 'Failed to delete plugin' });
          }
        );
      }
    });
  }
}
