import { Component, OnInit, OnDestroy, ChangeDetectorRef, PLATFORM_ID, Inject } from '@angular/core';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { CommonModule, isPlatformBrowser, DOCUMENT } from '@angular/common';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';

interface MenuItem {
  label: string;
  icon: string;
  route: string;
}

@Component({
  selector: 'app-navbar',
  imports: [CommonModule, RouterLink, RouterLinkActive],
  templateUrl: './navbar.html',
  styleUrl: './navbar.css'
})
export class NavbarComponent implements OnInit, OnDestroy {
  currentTime = '';
  private timeInterval: any;
  isDarkTheme = false;
  isMenuOpen = false;
  private isBrowser: boolean;

  constructor(
    private router: Router, 
    private sanitizer: DomSanitizer,
    private cdr: ChangeDetectorRef,
    @Inject(PLATFORM_ID) platformId: Object,
    @Inject(DOCUMENT) private document: Document
  ) {
    this.isBrowser = isPlatformBrowser(platformId);
  }

  ngOnInit() {
    this.updateTime();
    this.timeInterval = setInterval(() => this.updateTime(), 1000);
    // Load theme preference (only in browser)
    if (this.isBrowser) {
      const savedTheme = localStorage.getItem('theme');
      if (savedTheme === 'dark' || savedTheme === 'light') {
        this.isDarkTheme = savedTheme === 'dark';
        this.applyTheme();
      } else {
        // No saved theme, set based on time
        const now = new Date();
        const hour = now.getHours();
        this.isDarkTheme = (hour >= 18 || hour < 7);
        this.applyTheme();
      }
      // Check time-based theme every minute (for automatic switching at 7 AM and 6 PM)
      setInterval(() => this.autoThemeCheck(), 60000);
    }
  }

  ngOnDestroy() {
    if (this.timeInterval) {
      clearInterval(this.timeInterval);
    }
  }

  getSafeHtml(html: string): SafeHtml {
    return this.sanitizer.bypassSecurityTrustHtml(html);
  }

  menuItems: MenuItem[] = [
    {
      label: 'Dashboard',
      icon: '<svg fill="currentColor" viewBox="0 0 24 24"><path d="M20 6h-4V4c0-1.11-.89-2-2-2h-4c-1.11 0-2 .89-2 2v2H4c-1.11 0-1.99.89-1.99 2L2 19c0 1.11.89 2 2 2h16c1.11 0 2-.89 2-2V8c0-1.11-.89-2-2-2zm-6 0h-4V4h4v2z"/></svg>',
      route: '/dashboard/plant'
    },
    {
      label: 'Analytics',
      icon: '<svg fill="currentColor" viewBox="0 0 24 24"><path d="M19 3h-4.18C14.4 1.84 13.3 1 12 1c-1.3 0-2.4.84-2.82 2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-7 0c.55 0 1 .45 1 1s-.45 1-1 1-1-.45-1-1 .45-1 1-1zm2 14H7v-2h7v2zm3-4H7v-2h10v2zm0-4H7V7h10v2z"/></svg>',
      route: '/dashboard/analytics'
    },
    {
      label: 'Preventive Scheduling',
      icon: '<svg fill="currentColor" viewBox="0 0 24 24"><path d="M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zM12 20c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm.5-13H11v6l5.25 3.15.75-1.23-4.5-2.67z"/></svg>',
      route: '/dashboard/preventive-scheduling'
    },
    {
      label: 'Configuration',
      icon: '<svg fill="currentColor" viewBox="0 0 24 24"><path d="M19.14 12.94c.04-.3.06-.61.06-.94 0-.32-.02-.64-.07-.94l2.03-1.58c.18-.14.23-.41.12-.61l-1.92-3.32c-.12-.22-.37-.29-.59-.22l-2.39.96c-.5-.38-1.03-.7-1.62-.94L14.4 2.81c-.04-.24-.24-.41-.48-.41h-3.84c-.24 0-.43.17-.47.41l-.36 2.54c-.59.24-1.13.57-1.62.94l-2.39-.96c-.22-.08-.47 0-.59.22L2.74 8.87c-.12.21-.08.47.12.61l2.03 1.58c-.05.3-.09.63-.09.94s.02.64.07.94l-2.03 1.58c-.18.14-.23.41-.12.61l1.92 3.32c.12.22.37.29.59.22l2.39-.96c.5.38 1.03.7 1.62.94l.36 2.54c.05.24.24.41.48.41h3.84c.24 0 .44-.17.47-.41l.36-2.54c.59-.24 1.13-.56 1.62-.94l2.39.96c.22.08.47 0 .59-.22l1.92-3.32c.12-.22.07-.47-.12-.61l-2.01-1.58zM12 15.6c-1.98 0-3.6-1.62-3.6-3.6s1.62-3.6 3.6-3.6 3.6 1.62 3.6 3.6-1.62 3.6-3.6 3.6z"/></svg>',
      route: '/dashboard/configuration'
    },
    {
      label: 'Energy Monitoring',
      icon: '<svg fill="currentColor" viewBox="0 0 24 24"><path d="M7 2v11h3v9l7-12h-4l4-8z"/></svg>',
      route: '/dashboard/energy-monitoring'
    }
  ];

  updateTime() {
    const now = new Date();
    this.currentTime = now.toLocaleTimeString('en-GB', { 
      hour: '2-digit', 
      minute: '2-digit', 
      second: '2-digit',
      hour12: false 
    });
    this.cdr.detectChanges();
  }
//toggle theme between dark and light mode: user explicit toggle always overrides time-based rule
  toggleTheme() {
    if (!this.isBrowser) return;
    this.isDarkTheme = !this.isDarkTheme;
    localStorage.setItem('theme', this.isDarkTheme ? 'dark' : 'light');
    this.applyTheme();
  }

  // Automatically set theme based on time - only at specific hours (7 AM and 6 PM)
  autoThemeCheck() {
    if (!this.isBrowser) return;
    const now = new Date();
    const hour = now.getHours();
    const minute = now.getMinutes();
    
    // Change theme at exactly 7 AM (to light) or 6 PM (to dark) - overrides user preference
    if (hour === 7 && minute === 0) {
      if (this.isDarkTheme) {
        this.isDarkTheme = false;
        localStorage.setItem('theme', 'light');
        this.applyTheme();
      }
    } else if (hour === 18 && minute === 0) {
      if (!this.isDarkTheme) {
        this.isDarkTheme = true;
        localStorage.setItem('theme', 'dark');
        this.applyTheme();
      }
    }
  }

  refreshTheme() {
  this.toggleTheme();
  window.location.reload();
}

  toggleMenu() {
    this.isMenuOpen = !this.isMenuOpen;
  }

  closeMenu() {
    this.isMenuOpen = false;
  }

  applyTheme() {
    if (!this.isBrowser) return;
    if (this.isDarkTheme) {
      this.document.documentElement.classList.add('dark');
    } else {
      this.document.documentElement.classList.remove('dark');
    }
  }

  logout() {
    if (this.isBrowser) {
      localStorage.removeItem('isLoggedIn');
      localStorage.removeItem('employeeId');
    }
    this.router.navigate(['/login']);
  }
}
