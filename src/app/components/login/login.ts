import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';

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

  constructor(private router: Router) {}

  onLogin() {
    // Dummy authentication
    if (this.credentials.employeeId === 'admin' && this.credentials.password === 'admin123') {
      this.errorMessage = '';
      // Store login state
      localStorage.setItem('isLoggedIn', 'true');
      localStorage.setItem('employeeId', this.credentials.employeeId);
      // Navigate to dashboard
      this.router.navigate(['/dashboard']);
    } else {
      this.errorMessage = 'Invalid Employee ID or Password';
    }
  }
}
