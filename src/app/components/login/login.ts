import { Component, PLATFORM_ID, Inject } from '@angular/core';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { isPlatformBrowser } from '@angular/common';

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
    @Inject(PLATFORM_ID) platformId: Object
  ) {
    this.isBrowser = isPlatformBrowser(platformId);
  }

  onLogin() {
    // Dummy authentication
    if (this.credentials.employeeId === 'admin' && this.credentials.password === 'admin123') {
      this.errorMessage = '';
      // Store login state (only in browser)
      if (this.isBrowser) {
        localStorage.setItem('isLoggedIn', 'true');
        localStorage.setItem('employeeId', this.credentials.employeeId);
      }
      // Navigate to dashboard
      this.router.navigate(['/dashboard']);
    } else {
      this.errorMessage = 'Invalid Employee ID or Password';
    }
  }
}
