import { Component, Output, EventEmitter } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { CommonModule } from '@angular/common';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';

interface MenuItem {
  label: string;
  icon: string;
  route?: string;
  children?: { label: string; route: string; badge?: string }[];
  expanded?: boolean;
  badge?: string;
}

@Component({
  selector: 'app-sidebar',
  imports: [RouterLink, RouterLinkActive, CommonModule],
  templateUrl: './sidebar.html',
  styleUrl: './sidebar.css'
})
export class SidebarComponent {
  @Output() collapseChange = new EventEmitter<boolean>();
  
  isCollapsed = false;

  constructor(private sanitizer: DomSanitizer) {}

  getSafeHtml(html: string): SafeHtml {
    return this.sanitizer.bypassSecurityTrustHtml(html);
  }

  menuItems: MenuItem[] = [
    {
      label: 'Dashboard',
      icon: '<svg fill="currentColor" viewBox="0 0 24 24"><path d="M3 13h8V3H3v10zm0 8h8v-6H3v6zm10 0h8V11h-8v10zm0-18v6h8V3h-8z"/></svg>',
      route: '/dashboard/operator'
    },
    {
      label: 'Supervisor Dashboard',
      icon: '<svg fill="currentColor" viewBox="0 0 24 24"><path d="M20 6h-4V4c0-1.11-.89-2-2-2h-4c-1.11 0-2 .89-2 2v2H4c-1.11 0-1.99.89-1.99 2L2 19c0 1.11.89 2 2 2h16c1.11 0 2-.89 2-2V8c0-1.11-.89-2-2-2zm-6 0h-4V4h4v2z"/></svg>',
      route: '/dashboard/supervisor'
    },
    {
      label: 'Users Management',
      icon: '<svg fill="currentColor" viewBox="0 0 24 24"><path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z"/></svg>',
      children: [
        { label: 'Users', route: '/dashboard/users' },
        { label: 'Roles', route: '/dashboard/roles' },
        { label: 'Groups', route: '/dashboard/groups' },
        { label: 'Permissions', route: '/dashboard/permissions' },
        { label: 'Tags', route: '/dashboard/tags', badge: 'COMING SOON' }
      ],
      expanded: false
    },
    {
      label: 'Shifts',
      icon: '<svg fill="currentColor" viewBox="0 0 24 24"><path d="M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zM12 20c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm.5-13H11v6l5.25 3.15.75-1.23-4.5-2.67z"/></svg>',
      children: [
        { label: 'Shift Groups', route: '/dashboard/shift-groups' },
        { label: 'Supervisor Mapping', route: '/dashboard/supervisor-mapping' }
      ],
      expanded: false
    },
    {
      label: 'Departments',
      icon: '<svg fill="currentColor" viewBox="0 0 24 24"><path d="M12 7V3H2v18h20V7H12zM6 19H4v-2h2v2zm0-4H4v-2h2v2zm0-4H4V9h2v2zm0-4H4V5h2v2zm4 12H8v-2h2v2zm0-4H8v-2h2v2zm0-4H8V9h2v2zm0-4H8V5h2v2zm10 12h-8v-2h2v-2h-2v-2h2v-2h-2V9h8v10zm-2-8h-2v2h2v-2zm0 4h-2v2h2v-2z"/></svg>',
      route: '/dashboard/departments'
    },
    {
      label: 'Program',
      icon: '<svg fill="currentColor" viewBox="0 0 24 24"><path d="M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8l-6-6zm2 16H8v-2h8v2zm0-4H8v-2h8v2zm-3-5V3.5L18.5 9H13z"/></svg>',
      route: '/dashboard/program'
    },
    
  ];

  toggleSidebar() {
    this.isCollapsed = !this.isCollapsed;
    this.collapseChange.emit(this.isCollapsed);
    
    // Collapse all submenus when sidebar is collapsed
    if (this.isCollapsed) {
      this.menuItems.forEach(item => item.expanded = false);
    }
  }

  toggleSubmenu(label: string) {
    const item = this.menuItems.find(i => i.label === label);
    if (item?.children) {
      item.expanded = !item.expanded;
    }
  }
}
