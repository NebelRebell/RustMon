import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from 'src/environments/environment';
import { tap } from 'rxjs/operators';

@Injectable({ providedIn: 'root' })
export class AuthService {
  constructor(private http: HttpClient) {}

  login(email: string, password: string) {
    return this.http.post<{ access_token: string; user: any }>(
      `${environment.uDataApi}/auth/login`, { email, password }
    ).pipe(tap(res => {
      localStorage.setItem('auth_token', res.access_token);
      localStorage.setItem('auth_user', JSON.stringify(res.user));
    }));
  }

  logout() {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('auth_user');
  }

  getToken(): string | null { return localStorage.getItem('auth_token'); }
  getUser(): any { try { return JSON.parse(localStorage.getItem('auth_user') || ''); } catch { return null; } }
  isLoggedIn(): boolean { return !!this.getToken(); }
  isAdmin(): boolean { return this.getUser()?.role === 'admin'; }
}
