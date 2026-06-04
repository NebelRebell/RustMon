import { Component } from '@angular/core';
import { RustService } from 'src/app/rustRCON/rust.service';
import { MessageService } from 'primeng/api';

interface ItemList { name: string; commands: string[]; }

@Component({
  selector: 'app-item-lists',
  templateUrl: './item-lists.component.html',
  styleUrls: ['./item-lists.component.scss']
})
export class ItemListsComponent {
  lists: ItemList[] = [];
  currentListName = '';
  newCommand = '';
  selectedList: ItemList | null = null;

  constructor(private rustSrv: RustService, private messageService: MessageService) {
    this.load();
  }

  load() {
    try { this.lists = JSON.parse(localStorage.getItem('rustmon_item_lists') || '[]'); } catch { this.lists = []; }
  }

  save() { localStorage.setItem('rustmon_item_lists', JSON.stringify(this.lists)); }

  createList() {
    if (!this.currentListName.trim()) return;
    this.lists.push({ name: this.currentListName.trim(), commands: [] });
    this.currentListName = '';
    this.save();
  }

  addCommand() {
    if (!this.selectedList || !this.newCommand.trim()) return;
    this.selectedList.commands.push(this.newCommand.trim());
    this.newCommand = '';
    this.save();
  }

  executeList(list: ItemList) {
    list.commands.forEach(cmd => this.rustSrv.sendCommand(cmd));
    this.messageService.add({ severity: 'success', summary: 'Executed', detail: `${list.commands.length} commands sent` });
  }

  deleteList(i: number) { this.lists.splice(i, 1); this.save(); }
  removeCommand(list: ItemList, i: number) { list.commands.splice(i, 1); this.save(); }
}
