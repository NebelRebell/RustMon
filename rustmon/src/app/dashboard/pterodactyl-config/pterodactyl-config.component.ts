import { Component, EventEmitter, OnInit, Output } from '@angular/core';
import { MessageService } from 'primeng/api';
import { PterodactylConfig, PterodactylService } from 'src/app/api/pterodactyl.service';

@Component({
  selector: 'app-pterodactyl-config',
  templateUrl: './pterodactyl-config.component.html',
  styleUrls: ['./pterodactyl-config.component.scss']
})
export class PterodactylConfigComponent implements OnInit {

  @Output() close = new EventEmitter<void>();

  config: PterodactylConfig = {
    apiKey: '',
    panelUrl: '',
    serverId: '',
    sftpHost: '',
    sftpPort: 2022,
    sftpUsername: '',
    sftpPassword: ''
  };

  testing = false;
  testResult: { success: boolean; error?: string } | null = null;

  constructor(
    private pterodactylSrv: PterodactylService,
    private messageService: MessageService
  ) {}

  ngOnInit() {
    this.loadConfig();
  }

  loadConfig() {
    this.pterodactylSrv.getConnection().subscribe(
      cfg => { this.config = cfg; },
      () => {}
    );
  }

  testConnection() {
    this.testing = true;
    this.testResult = null;
    this.pterodactylSrv.testConnection(this.config).subscribe(
      result => {
        this.testing = false;
        if (result.success) {
          this.testResult = { success: true };
          this.messageService.add({ severity: 'success', summary: 'Connected', detail: 'Pterodactyl connection successful!' });
        } else {
          this.testResult = { success: false, error: result.message };
          this.messageService.add({ severity: 'error', summary: 'Failed', detail: result.message || 'Connection failed' });
        }
      },
      err => {
        this.testing = false;
        const msg = err?.error?.message || 'Connection failed';
        this.testResult = { success: false, error: msg };
        this.messageService.add({ severity: 'error', summary: 'Error', detail: msg });
      }
    );
  }

  save() {
    this.pterodactylSrv.saveConnection(this.config).subscribe(
      () => {
        this.messageService.add({ severity: 'success', summary: 'Saved', detail: 'Configuration saved' });
        this.close.emit();
      },
      err => {
        this.messageService.add({ severity: 'error', summary: 'Error', detail: err?.error?.message || 'Failed to save configuration' });
      }
    );
  }
}
