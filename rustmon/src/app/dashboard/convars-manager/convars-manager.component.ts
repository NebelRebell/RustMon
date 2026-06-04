import { Component, EventEmitter, OnInit, Output } from '@angular/core';
import { MessageService } from 'primeng/api';
import { ConVar, PterodactylService } from 'src/app/api/pterodactyl.service';

@Component({
  selector: 'app-convars-manager',
  templateUrl: './convars-manager.component.html',
  styleUrls: ['./convars-manager.component.scss']
})
export class ConvarsManagerComponent implements OnInit {

  @Output() close = new EventEmitter<void>();

  allConVars: ConVar[] = [];
  filteredConVars: ConVar[] = [];
  categories: string[] = [];
  selectedCategory = '';
  searchTerm = '';
  loading = false;

  constructor(
    private pterodactylSrv: PterodactylService,
    private messageService: MessageService
  ) {}

  ngOnInit() {
    this.refreshConVars();
  }

  refreshConVars() {
    this.loading = true;
    this.pterodactylSrv.getConVars().subscribe(
      convars => {
        this.allConVars = convars.map(cv => ({ ...cv, editing: false, newValue: cv.value, modified: false }));
        this.categories = [...new Set(this.allConVars.map(cv => cv.category))].sort();
        this.filterConVars();
        this.loading = false;
      },
      err => {
        this.loading = false;
        this.messageService.add({ severity: 'error', summary: 'Error', detail: err?.error?.message || 'Failed to load ConVars' });
      }
    );
  }

  filterConVars() {
    const term = this.searchTerm.toLowerCase();
    this.filteredConVars = this.allConVars.filter(cv => {
      const matchesSearch = !term || cv.name.toLowerCase().includes(term) || (cv.description || '').toLowerCase().includes(term);
      const matchesCategory = !this.selectedCategory || cv.category === this.selectedCategory;
      return matchesSearch && matchesCategory;
    });
  }

  editConVar(convar: ConVar) {
    convar.editing = true;
    convar.newValue = convar.value;
  }

  cancelEdit(convar: ConVar) {
    convar.editing = false;
    convar.newValue = convar.value;
  }

  saveConVar(convar: ConVar) {
    if (!this.validateValue(convar)) return;
    this.pterodactylSrv.updateConVar(convar.name, convar.newValue!).subscribe(
      () => {
        convar.value = convar.newValue!;
        convar.editing = false;
        convar.modified = true;
        this.messageService.add({ severity: 'success', summary: 'Updated', detail: `${convar.name} = ${convar.value}` });
      },
      err => {
        this.messageService.add({ severity: 'error', summary: 'Error', detail: err?.error?.message || `Failed to update ${convar.name}` });
      }
    );
  }

  private validateValue(convar: ConVar): boolean {
    const val = convar.newValue || '';
    if (convar.type === 'number' && isNaN(Number(val))) {
      this.messageService.add({ severity: 'warn', summary: 'Validation', detail: `${convar.name} requires a numeric value` });
      return false;
    }
    if (convar.type === 'boolean' && !['true', 'false', '1', '0'].includes(val.toLowerCase())) {
      this.messageService.add({ severity: 'warn', summary: 'Validation', detail: `${convar.name} requires true/false or 1/0` });
      return false;
    }
    return true;
  }
}
