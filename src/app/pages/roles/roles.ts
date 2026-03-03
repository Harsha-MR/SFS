import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

interface Role {
  id: number;
  name: string;
  userCount: number;
  description: string;
  createdOn: string;
  updatedOn: string;
}

@Component({
  selector: 'app-roles',
  imports: [CommonModule, FormsModule],
  templateUrl: './roles.html',
  styleUrl: './roles.css'
})
export class RolesComponent implements OnInit {
  roles: Role[] = [
    {
      id: 1,
      name: 'CNC Machine Operator',
      userCount: 0,
      description: 'Operates CNC machines',
      createdOn: '06/02/26',
      updatedOn: '06/02/26'
    },
    {
      id: 2,
      name: 'OPERATOR',
      userCount: 5,
      description: 'Operator role with limited access to a shift(s) and machine(s)',
      createdOn: '19/08/25',
      updatedOn: '19/08/25'
    },
    {
      id: 3,
      name: 'SUPERVISOR',
      userCount: 3,
      description: 'Supervisor role with full access to a shift(s) and machine(s)',
      createdOn: '19/08/25',
      updatedOn: '19/08/25'
    }
  ];

  filteredRoles: Role[] = [];
  paginatedRoles: Role[] = [];
  selectedRoles: number[] = [];
  searchTerm = '';
  showCreateModal = false;
  
  // Pagination
  currentPage = 1;
  pageSize = 20;
  totalPages = 1;
  startIndex = 0;
  endIndex = 0;

  // Sorting
  sortAscending = true;

  // New role form
  newRole = {
    name: '',
    description: ''
  };

  ngOnInit() {
    this.filteredRoles = [...this.roles];
    this.updatePagination();
  }

  get allSelected(): boolean {
    return this.paginatedRoles.length > 0 && 
           this.paginatedRoles.every(role => this.selectedRoles.includes(role.id));
  }

  toggleSelectAll() {
    if (this.allSelected) {
      this.selectedRoles = this.selectedRoles.filter(
        id => !this.paginatedRoles.find(role => role.id === id)
      );
    } else {
      this.paginatedRoles.forEach(role => {
        if (!this.selectedRoles.includes(role.id)) {
          this.selectedRoles.push(role.id);
        }
      });
    }
  }

  toggleSelect(id: number) {
    const index = this.selectedRoles.indexOf(id);
    if (index > -1) {
      this.selectedRoles.splice(index, 1);
    } else {
      this.selectedRoles.push(id);
    }
  }

  filterRoles() {
    if (this.searchTerm) {
      this.filteredRoles = this.roles.filter(role =>
        role.name.toLowerCase().includes(this.searchTerm.toLowerCase())
      );
    } else {
      this.filteredRoles = [...this.roles];
    }
    this.currentPage = 1;
    this.updatePagination();
  }

  toggleSort() {
    this.sortAscending = !this.sortAscending;
    this.filteredRoles.sort((a, b) => {
      const dateA = new Date(a.createdOn).getTime();
      const dateB = new Date(b.createdOn).getTime();
      return this.sortAscending ? dateA - dateB : dateB - dateA;
    });
    this.updatePagination();
  }

  updatePagination() {
    this.totalPages = Math.ceil(this.filteredRoles.length / this.pageSize);
    this.startIndex = (this.currentPage - 1) * this.pageSize;
    this.endIndex = Math.min(this.startIndex + this.pageSize, this.filteredRoles.length);
    this.paginatedRoles = this.filteredRoles.slice(this.startIndex, this.endIndex);
  }

  onPageSizeChange() {
    this.currentPage = 1;
    this.updatePagination();
  }

  previousPage() {
    if (this.currentPage > 1) {
      this.currentPage--;
      this.updatePagination();
    }
  }

  nextPage() {
    if (this.currentPage < this.totalPages) {
      this.currentPage++;
      this.updatePagination();
    }
  }

  deleteSelected() {
    if (this.selectedRoles.length > 0) {
      if (confirm(`Are you sure you want to delete ${this.selectedRoles.length} role(s)?`)) {
        this.roles = this.roles.filter(role => !this.selectedRoles.includes(role.id));
        this.selectedRoles = [];
        this.filterRoles();
      }
    }
  }

  openCreateModal() {
    this.showCreateModal = true;
  }

  closeCreateModal() {
    this.showCreateModal = false;
    this.newRole = { name: '', description: '' };
  }

  createRole() {
    if (this.newRole.name) {
      const role: Role = {
        id: Math.max(...this.roles.map(r => r.id)) + 1,
        name: this.newRole.name,
        userCount: 0,
        description: this.newRole.description,
        createdOn: new Date().toLocaleDateString('en-GB'),
        updatedOn: new Date().toLocaleDateString('en-GB')
      };
      this.roles.push(role);
      this.filterRoles();
      this.closeCreateModal();
    }
  }

  openActionMenu(id: number) {
    // Action menu logic can be implemented here
    console.log('Open action menu for role:', id);
  }
}
