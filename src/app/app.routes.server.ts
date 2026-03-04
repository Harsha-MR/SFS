import { RenderMode, ServerRoute } from '@angular/ssr';

export const serverRoutes: ServerRoute[] = [
  {
    path: 'dashboard/plant/:zoneName/:machineName',
    renderMode: RenderMode.Client
  },
  {
    path: 'dashboard/plant/:zoneName',
    renderMode: RenderMode.Client
  },
  {
    path: '**',
    renderMode: RenderMode.Prerender
  }
];
