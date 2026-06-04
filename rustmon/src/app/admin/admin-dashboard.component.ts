import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from 'src/environments/environment';
import { AuthService } from '../auth/auth.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-admin-dashboard',
  templateUrl: './admin-dashboard.component.html',
  styleUrls: ['./admin-dashboard.component.scss']
})
export class AdminDashboardComponent implements OnInit {
  users: any[] = [];
  loading = false;

  constructor(private http: HttpClient, private auth: AuthService, private router: Router) {}

  ngOnInit() {
    if (!this.auth.isAdmin()) { this.router.navigateByUrl('/login'); return; }
    this.loadUsers();
  }

  loadUsers() {
    this.loading = true;
    this.http.get<any[]>(`${environment.uDataApi}/auth/users`).subscribe(
      users => { this.users = users; this.loading = false; },
      () => this.loading = false
    );
  }

  deleteUser(id: string) {
    if (!confirm('Delete this user?')) return;
    this.http.delete(`${environment.uDataApi}/auth/users/${id}`).subscribe(() => this.loadUsers());
  }
}
