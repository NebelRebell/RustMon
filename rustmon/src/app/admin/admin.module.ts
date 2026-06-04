import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AdminDashboardComponent } from './admin-dashboard.component';
import { AdminGuard } from './admin-guard';

@NgModule({
  declarations: [AdminDashboardComponent],
  imports: [
    CommonModule,
    RouterModule.forChild([
      { path: '', component: AdminDashboardComponent, canActivate: [AdminGuard] }
    ])
  ],
  providers: [AdminGuard],
})
export class AdminModule {}
