import { Injectable, PLATFORM_ID, Inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

export interface User {
  employeeId: string;
  name: string;
  
  plantIds: string[];
}

@Injectable({
  providedIn: 'root'
})
export class UserService {
  private isBrowser: boolean;
  
  // Dummy users database
  private users: { [key: string]: User } = {
    'user1': {
      employeeId: 'user1',
      name: 'John Doe',
      
      plantIds: ['plant-001', 'plant-002'] // Multi-plant user
    },
    'user2': {
      employeeId: 'user2',
      name: 'Jane Smith',
      
      plantIds: ['plant-001'] // Single-plant user
    }
  };

  constructor(@Inject(PLATFORM_ID) platformId: Object) {
    this.isBrowser = isPlatformBrowser(platformId);
  }

  // Authenticate user
  authenticate(employeeId: string, password: string): User | null {
    // Simple authentication - in real app, this would be an API call
    if (password === 'password123' && this.users[employeeId]) {
      const user = this.users[employeeId];
      if (this.isBrowser) {
        localStorage.setItem('currentUser', JSON.stringify(user));
      }
      return user;
    }
    return null;
  }

  // Get current logged-in user
  getCurrentUser(): User | null {
    if (!this.isBrowser) return null;
    const userStr = localStorage.getItem('currentUser');
    return userStr ? JSON.parse(userStr) : null;
  }

  // Check if user has multiple plants
  hasMultiplePlants(): boolean {
    const user = this.getCurrentUser();
    return user ? user.plantIds.length > 1 : false;
  }

  // Get user's plant IDs
  getUserPlantIds(): string[] {
    const user = this.getCurrentUser();
    return user ? user.plantIds : [];
  }

  // Get user's first plant ID (for single-plant users)
  getFirstPlantId(): string | null {
    const user = this.getCurrentUser();
    return user && user.plantIds.length > 0 ? user.plantIds[0] : null;
  }

  // Logout
  logout(): void {
    if (this.isBrowser) {
      localStorage.removeItem('currentUser');
      localStorage.removeItem('isLoggedIn');
    }
  }

  // Check if user is logged in
  isLoggedIn(): boolean {
    if (!this.isBrowser) return false;
    return localStorage.getItem('currentUser') !== null;
  }
}
