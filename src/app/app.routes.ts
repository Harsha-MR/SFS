import { Routes } from '@angular/router';
import { LoginComponent } from './components/login/login';
import { DashboardComponent } from './components/dashboard/dashboard';
import { PlantDashboard } from './pages/plant-dashboard/plant-dashboard';
import { AnalyticsComponent } from './pages/analytics/analytics';
import { PreventiveSchedulingComponent } from './pages/preventive-scheduling/preventive-scheduling';
import { ConfigurationComponent } from './pages/configuration/configuration';
import { EnergyMonitoringComponent } from './pages/energy-monitoring/energy-monitoring';

export const routes: Routes = [
  { path: '', redirectTo: '/login', pathMatch: 'full' },
  { path: 'login', component: LoginComponent },
  {
    path: 'dashboard',
    component: DashboardComponent,
    children: [
      { path: '', redirectTo: 'plant', pathMatch: 'full' },
      { path: 'plant', component: PlantDashboard },
      { path: 'analytics', component: AnalyticsComponent },
      { path: 'preventive-scheduling', component: PreventiveSchedulingComponent },
      { path: 'configuration', component: ConfigurationComponent },
      { path: 'energy-monitoring', component: EnergyMonitoringComponent }
    ]
  },
  { path: '**', redirectTo: '/login' }
];
