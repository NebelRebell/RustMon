import { Component, EventEmitter, OnInit, Output } from '@angular/core';
import { PlayerToolsService } from './player-tools.service';

export interface ItemGiveList {
  name: string;
  items: ItemGiveEntry[];
}

export interface ItemGiveEntry {
  itemName: string;
  amount: number;
  targetSteamId: string;
}

const ITEM_LISTS_KEY = 'rustadmin_item_lists';

@Component({
  selector: 'app-player-tools',
  templateUrl: './player-tools.component.html',
  styleUrls: ['./player-tools.component.scss']
})
export class PlayerToolsComponent implements OnInit {

  @Output()
  public close: EventEmitter<void> = new EventEmitter<void>();

  public maxPingAllowed: number = 0;
  public message: string = '';
  public tab = 0;

  // Item give lists
  public savedLists: ItemGiveList[] = [];
  public currentList: ItemGiveEntry[] = [];
  public newListName: string = '';
  public selectedListName: string = '';
  public newItem: ItemGiveEntry = { itemName: '', amount: 1, targetSteamId: '' };

  constructor(private playerTool: PlayerToolsService) {}

  ngOnInit() {
    const autokick = this.playerTool.getAutoKick();
    if (autokick) {
      this.maxPingAllowed = autokick.ping;
      this.message = autokick.message;
    }
    this.loadItemLists();
  }

  save() {
    this.playerTool.saveAutoKick(this.maxPingAllowed, this.message);
    this.close.emit();
  }

  private loadItemLists() {
    try {
      const raw = localStorage.getItem(ITEM_LISTS_KEY);
      if (raw) this.savedLists = JSON.parse(raw);
    } catch (_) {}
  }

  private persistItemLists() {
    localStorage.setItem(ITEM_LISTS_KEY, JSON.stringify(this.savedLists));
  }

  addItemToList() {
    if (!this.newItem.itemName) return;
    this.currentList = [...this.currentList, { ...this.newItem }];
    this.newItem = { itemName: '', amount: 1, targetSteamId: '' };
  }

  removeItemFromList(index: number) {
    this.currentList = this.currentList.filter((_, i) => i !== index);
  }

  saveCurrentList() {
    if (!this.newListName || this.currentList.length === 0) return;
    const existing = this.savedLists.findIndex(l => l.name === this.newListName);
    const list: ItemGiveList = { name: this.newListName, items: [...this.currentList] };
    if (existing >= 0) {
      this.savedLists[existing] = list;
    } else {
      this.savedLists = [...this.savedLists, list];
    }
    this.persistItemLists();
    this.newListName = '';
  }

  loadList(name: string) {
    const list = this.savedLists.find(l => l.name === name);
    if (list) {
      this.currentList = list.items.map(i => ({ ...i }));
      this.newListName = list.name;
    }
  }

  deleteList(name: string) {
    this.savedLists = this.savedLists.filter(l => l.name !== name);
    this.persistItemLists();
  }

  get savedListNames(): string[] {
    return this.savedLists.map(l => l.name);
  }
}
