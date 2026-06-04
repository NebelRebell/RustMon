import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { OAuthCallbackComponent } from './oauth-callback/oauth-callback.component';

@NgModule({
  declarations: [OAuthCallbackComponent],
  imports: [
    CommonModule,
    RouterModule.forChild([
      { path: 'callback', component: OAuthCallbackComponent }
    ])
  ],
})
export class AuthModule {}
