import { Routes } from '@angular/router';
import { LoginComponent } from './components/login/login';
import { DashboardComponent } from './components/dashboard/dashboard';
import { OperatorDashboard } from './pages/operator-dashboard/operator-dashboard';
import { SupervisorDashboard } from './pages/supervisor-dashboard/supervisor-dashboard';
import { Users } from './pages/users/users';
import { RolesComponent } from './pages/roles/roles';
import { Groups } from './pages/groups/groups';
import { Permissions } from './pages/permissions/permissions';
import { ShiftGroupsComponent } from './pages/shift-groups/shift-groups';
import { SupervisorMapping } from './pages/supervisor-mapping/supervisor-mapping';
import { DepartmentsComponent } from './pages/departments/departments';
import { Program } from './pages/program/program';
import { EquipmentManagementComponent } from './pages/equipment-management/equipment-management';
import { Alerts } from './pages/alerts/alerts';
import { MachineMonitoring } from './pages/machine-monitoring/machine-monitoring';
import { Production } from './pages/production/production';
import { ErpIntegration } from './pages/erp-integration/erp-integration';
import { Plants } from './pages/plants/plants';

export const routes: Routes = [
  { path: '', redirectTo: '/login', pathMatch: 'full' },
  { path: 'login', component: LoginComponent },
  {
    path: 'dashboard',
    component: DashboardComponent,
    children: [
      { path: '', redirectTo: 'supervisor', pathMatch: 'full' },
      { path: 'operator', component: OperatorDashboard },
      { path: 'supervisor', component: SupervisorDashboard },
      { path: 'users', component: Users },
      { path: 'roles', component: RolesComponent },
      { path: 'groups', component: Groups },
      { path: 'permissions', component: Permissions },
      { path: 'shift-groups', component: ShiftGroupsComponent },
      { path: 'supervisor-mapping', component: SupervisorMapping },
      { path: 'departments', component: DepartmentsComponent },
      { path: 'program', component: Program },
      { path: 'equipment', component: EquipmentManagementComponent },
      { path: 'alerts', component: Alerts },
      { path: 'machine-monitoring', component: MachineMonitoring },
      { path: 'production', component: Production },
      { path: 'erp-integration', component: ErpIntegration },
      { path: 'plants', component: Plants }
    ]
  },
  { path: '**', redirectTo: '/login' }
];
