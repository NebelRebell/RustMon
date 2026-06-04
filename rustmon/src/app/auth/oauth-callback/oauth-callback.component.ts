import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';

@Component({ selector: 'app-oauth-callback', template: '<p style="color:#fff;padding:2rem">Logging in...</p>' })
export class OAuthCallbackComponent implements OnInit {
  constructor(private route: ActivatedRoute, private router: Router) {}
  ngOnInit() {
    const token = this.route.snapshot.queryParamMap.get('token');
    if (token) {
      localStorage.setItem('auth_token', token);
      this.router.navigateByUrl('/login');
    } else {
      this.router.navigateByUrl('/');
    }
  }
}
