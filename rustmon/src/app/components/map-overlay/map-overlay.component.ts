import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { Subject, interval } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { RustService } from 'src/app/rustRCON/rust.service';
import { REType } from 'src/app/rustRCON/RustEvent';

export interface PlayerPosition {
  steamId: string;
  name: string;
  x: number;
  y: number;
  z: number;
  sleeping: boolean;
  pixelX?: number;
  pixelY?: number;
}

@Component({
  selector: 'app-map-overlay',
  templateUrl: './map-overlay.component.html',
  styleUrls: ['./map-overlay.component.scss']
})
export class MapOverlayComponent implements OnInit, OnDestroy {
  @Input() mapUrl: string = '';
  @Input() worldSize: number = 4000;

  public showPlayers: boolean = true;
  public players: PlayerPosition[] = [];
  public hoveredPlayer: PlayerPosition | null = null;
  public tooltipX: number = 0;
  public tooltipY: number = 0;

  private readonly MAP_IMAGE_SIZE = 1000;
  private readonly destroy$ = new Subject<void>();

  constructor(private rustSrv: RustService) {}

  ngOnInit(): void {
    this.rustSrv.getEvtRust()
      .pipe(takeUntil(this.destroy$))
      .subscribe(d => {
        if (d.type === REType.PLAYER_POSITIONS && d.data) {
          this.players = this.parsePlayers(d.data);
        }
      });

    interval(5000)
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => this.fetchPositions());

    this.fetchPositions();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private fetchPositions() {
    this.rustSrv.sendCommand('playerlist', REType.PLAYER_POSITIONS);
  }

  private parsePlayers(data: any[]): PlayerPosition[] {
    if (!Array.isArray(data)) return [];
    return data.map(p => {
      const pos = this.parseVec3(p.Position);
      const pixel = this.toPixel(pos.x, pos.z);
      return {
        steamId: p.SteamID || '',
        name: p.DisplayName || p.Name || '',
        x: pos.x,
        y: pos.y,
        z: pos.z,
        sleeping: !!p.Sleeping,
        pixelX: pixel.px,
        pixelY: pixel.py,
      };
    }).filter(p => p.pixelX !== undefined);
  }

  private parseVec3(posStr: string): { x: number; y: number; z: number } {
    if (!posStr) return { x: 0, y: 0, z: 0 };
    const match = posStr.replace(/[()]/g, '').split(',').map(Number);
    return { x: match[0] || 0, y: match[1] || 0, z: match[2] || 0 };
  }

  private toPixel(rustX: number, rustZ: number): { px: number; py: number } {
    const half = this.worldSize / 2;
    const px = ((rustX + half) / this.worldSize) * this.MAP_IMAGE_SIZE;
    // Rust Z axis is inverted relative to map Y (north is -Z in Rust)
    const py = ((half - rustZ) / this.worldSize) * this.MAP_IMAGE_SIZE;
    return { px, py };
  }

  onPlayerHover(player: PlayerPosition, event: MouseEvent) {
    this.hoveredPlayer = player;
    this.tooltipX = (event.target as SVGElement).getBoundingClientRect().left + 12;
    this.tooltipY = (event.target as SVGElement).getBoundingClientRect().top - 10;
  }

  onPlayerLeave() {
    this.hoveredPlayer = null;
  }
}
