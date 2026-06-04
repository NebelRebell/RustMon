import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../auth/auth.service';
import { environment } from 'src/environments/environment';

@Component({
  selector: 'app-landing',
  templateUrl: './landing.component.html',
  styleUrls: ['./landing.component.scss']
})
export class LandingComponent implements OnInit {
  version = environment.version;
  apiUrl = environment.uDataApi;

  constructor(private router: Router, private auth: AuthService) {}

  ngOnInit() {
    if (this.auth.isLoggedIn()) this.router.navigateByUrl('/login');
  }

  goToLogin() { this.router.navigateByUrl('/login'); }

  oauthLogin(provider: string) {
    window.location.href = `${this.apiUrl}/auth/${provider}`;
  }
}
