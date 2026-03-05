import { Component, PLATFORM_ID, Inject } from '@angular/core';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { isPlatformBrowser } from '@angular/common';
import { UserService } from '../../services/user.service';

@Component({
  selector: 'app-login',
  imports: [FormsModule],
  templateUrl: './login.html',
  styleUrl: './login.css'
})
export class LoginComponent {
  credentials = {
    employeeId: '',
    password: ''
  };

  errorMessage = '';
  private isBrowser: boolean;

  constructor(
    private router: Router,
    private userService: UserService,
    @Inject(PLATFORM_ID) platformId: Object
  ) {
    this.isBrowser = isPlatformBrowser(platformId);
  }

  onLogin() {
    // Authenticate user
    const user = this.userService.authenticate(this.credentials.employeeId, this.credentials.password);
    
    if (user) {
      this.errorMessage = '';
      
      // Store login state (only in browser)
      if (this.isBrowser) {
        localStorage.setItem('isLoggedIn', 'true');
      }
      
      // Route based on number of plants
      if (user.plantIds.length === 1) {
        // Single plant user - navigate directly to plant dashboard
        this.router.navigate(['/dashboard', user.plantIds[0]]);
      } else {
        // Multi-plant user - navigate to plants overview
        this.router.navigate(['/dashboard']);
      }
    } else {
      this.errorMessage = 'Invalid Employee ID or Password';
    }
  }
}
