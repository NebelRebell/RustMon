import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root'
})
export class PterodactylService {

  constructor(private http: HttpClient) { }

  testConnection(config: PterodactylConfig): Observable<{ success: boolean; message?: string }> {
    return this.http.post<{ success: boolean; message?: string }>(`${environment.uDataApi}/pterodactyl/test`, config);
  }

  saveConnection(config: PterodactylConfig): Observable<any> {
    return this.http.post(`${environment.uDataApi}/pterodactyl/config`, config);
  }

  getConnection(): Observable<PterodactylConfig> {
    return this.http.get<PterodactylConfig>(`${environment.uDataApi}/pterodactyl/config`);
  }

  getInstalledPlugins(): Observable<PluginInfo[]> {
    return this.http.get<PluginInfo[]>(`${environment.uDataApi}/pterodactyl/plugins`);
  }

  uploadPlugin(file: File): Observable<any> {
    const formData = new FormData();
    formData.append('plugin', file);
    return this.http.post(`${environment.uDataApi}/pterodactyl/plugins/upload`, formData);
  }

  deletePlugin(filename: string): Observable<any> {
    return this.http.delete(`${environment.uDataApi}/pterodactyl/plugins/${filename}`);
  }

  updatePlugin(pluginId: string): Observable<any> {
    return this.http.post(`${environment.uDataApi}/pterodactyl/plugins/${pluginId}/update`, {});
  }

  getConVars(): Observable<ConVar[]> {
    return this.http.get<ConVar[]>(`${environment.uDataApi}/pterodactyl/convars`);
  }

  updateConVar(name: string, value: string): Observable<any> {
    return this.http.put(`${environment.uDataApi}/pterodactyl/convars/${name}`, { value });
  }

  getConVarDescriptions(): Observable<ConVarDescription[]> {
    return this.http.get<ConVarDescription[]>(`${environment.uDataApi}/pterodactyl/convars/descriptions`);
  }
}

export interface PterodactylConfig {
  apiKey: string;
  panelUrl: string;
  serverId: string;
  sftpHost: string;
  sftpPort: number;
  sftpUsername: string;
  sftpPassword: string;
}

export interface PluginInfo {
  filename: string;
  name: string;
  version: string;
  author: string;
  description: string;
  enabled: boolean;
  hasUpdate: boolean;
  latestVersion?: string;
  umodUrl?: string;
}

export interface ConVar {
  name: string;
  value: string;
  type: 'string' | 'number' | 'boolean';
  category: string;
  description?: string;
  editing?: boolean;
  newValue?: string;
  modified?: boolean;
}

export interface ConVarDescription {
  name: string;
  description: string;
  defaultValue: string;
  category: string;
}
