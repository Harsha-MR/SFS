import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { UserService } from '../../services/user.service';

interface Plant {
  id: string;
  name: string;
  location: string;
  oee: number;
  status: 'good' | 'warning' | 'critical';
  activeMachines: number;
  totalMachines: number;
  availability: number;
  performance: number;
  quality: number;
  currentShift: string;
  shiftStartTime: string;
  shiftEndTime: string;
}

@Component({
  selector: 'app-plants-overview',
  imports: [CommonModule],
  templateUrl: './plants-overview.html',
  styleUrl: './plants-overview.css',
})
export class PlantsOverviewComponent implements OnInit {
  
  // All available plants in the system
  private allPlants: Plant[] = [
    {
      id: 'plant-001',
      name: 'Manufacturing Plant A',
      location: 'Building 1, Floor 2',
      oee: 76.5,
      status: 'good',
      activeMachines: 21,
      totalMachines: 26,
      availability: 88.2,
      performance: 91.5,
      quality: 97.2,
      currentShift: 'Shift 1',
      shiftStartTime: '06:00',
      shiftEndTime: '14:00',
    },
    {
      id: 'plant-002',
      name: 'Manufacturing Plant B',
      location: 'Building 2, Floor 1',
      oee: 62.3,
      status: 'warning',
      activeMachines: 15,
      totalMachines: 20,
      availability: 75.5,
      performance: 82.1,
      quality: 94.8,
      currentShift: 'Shift 2',
      shiftStartTime: '14:00',
      shiftEndTime: '22:00',
    },
    {
      id: 'plant-003',
      name: 'Manufacturing Plant C',
      location: 'Building 3, Floor 3',
      oee: 45.2,
      status: 'critical',
      activeMachines: 8,
      totalMachines: 15,
      availability: 58.3,
      performance: 68.5,
      quality: 89.2,
      currentShift: 'Shift 3',
      shiftStartTime: '22:00',
      shiftEndTime: '06:00',
    },
  ];

  // Plants accessible to current user
  plants: Plant[] = [];

  constructor(
    private router: Router,
    private userService: UserService
  ) {}

  ngOnInit() {
    // If not logged in, redirect to login
    if (!this.userService.isLoggedIn()) {
      this.router.navigate(['/login']);
      return;
    }

    // Get user's plant IDs
    const userPlantIds = this.userService.getUserPlantIds();
    // Filter plants to show only those assigned to the user
    this.plants = this.allPlants.filter(plant => userPlantIds.includes(plant.id));

    // If user has only one plant, navigate directly to that plant's dashboard
    if (this.plants.length === 1) {
      this.navigateToPlant(this.plants[0].id);
    }
    // If user has no plants but is logged in, stay on dashboard (do not redirect)
  }

  navigateToPlant(plantId: string) {
    this.router.navigate(['/dashboard', plantId]);
  }

  getStatusClass(status: string): string {
    const classes = {
      good: 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800',
      warning: 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800',
      critical: 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800',
    };
    return classes[status as keyof typeof classes] || classes.good;
  }

  getStatusBadgeClass(status: string): string {
    const classes = {
      good: 'bg-green-100 dark:bg-green-800 text-green-800 dark:text-green-100',
      warning: 'bg-yellow-100 dark:bg-yellow-800 text-yellow-800 dark:text-yellow-100',
      critical: 'bg-red-100 dark:bg-red-800 text-red-800 dark:text-red-100',
    };
    return classes[status as keyof typeof classes] || classes.good;
  }

  getOeeColor(oee: number): string {
    if (oee >= 85) return 'text-green-600 dark:text-green-400';
    if (oee >= 60) return 'text-yellow-600 dark:text-yellow-400';
    return 'text-red-600 dark:text-red-400';
  }

  getStatusLabel(status: string): string {
    const labels = {
      good: 'Good',
      warning: 'Warning',
      critical: 'Critical',
    };
    return labels[status as keyof typeof labels] || 'Unknown';
  }
}
