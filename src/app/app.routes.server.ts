import { RenderMode, ServerRoute } from '@angular/ssr';

export const serverRoutes: ServerRoute[] = [
  {
    path: 'dashboard/:plantId/:zoneName/:machineName',
    renderMode: RenderMode.Client
  },
  {
    path: 'dashboard/:plantId/:zoneName',
    renderMode: RenderMode.Client
  },
  {
    path: 'dashboard/:plantId',
    renderMode: RenderMode.Client
  },
  {
    path: '**',
    renderMode: RenderMode.Prerender
  }
];
