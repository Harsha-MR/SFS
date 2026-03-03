import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

interface Department {
  id: number;
  deptId: string;
  name: string;
  shiftEnabled: string;
  shiftGroup: string;
  createdOn: string;
  updatedOn: string;
  selected?: boolean;
}

@Component({
  selector: 'app-departments',
  imports: [CommonModule, FormsModule],
  templateUrl: './departments.html',
  styleUrl: './departments.css'
})
export class DepartmentsComponent implements OnInit {
  departments: Department[] = [
    { id: 1, deptId: '01K4TRTGBAT4QHK...', name: 'Department-3', shiftEnabled: 'Yes', shiftGroup: 'Test1', createdOn: '11/09/25', updatedOn: '12/02/26' },
    { id: 2, deptId: '01KH86NZTS79NZ9...', name: 'TestDepart', shiftEnabled: 'Yes', shiftGroup: 'Test2', createdOn: '12/02/26', updatedOn: '12/02/26' },
    { id: 3, deptId: '01KH8TVW8H55GC...', name: 'Department3', shiftEnabled: 'Yes', shiftGroup: 'Test2', createdOn: '12/02/26', updatedOn: '12/02/26' },
    { id: 4, deptId: '01KG4A1PD58CA0B...', name: 'Shift Group Department 1', shiftEnabled: 'Yes', shiftGroup: 'Test Group 22', createdOn: '29/01/26', updatedOn: '29/01/26' }
  ];

  filteredDepartments: Department[] = [];
  paginatedDepartments: Department[] = [];
  selectedDepartments: number[] = [];
  searchTerm = '';
  showAddModal = false;
  
  currentPage = 1;
  pageSize = 20;
  totalPages = 1;
  startIndex = 0;
  endIndex = 0;

  ngOnInit() {
    this.filteredDepartments = [...this.departments];
    this.updatePagination();
  }

  filterDepartments() {
    if (this.searchTerm) {
      this.filteredDepartments = this.departments.filter(dept =>
        dept.name.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        dept.deptId.toLowerCase().includes(this.searchTerm.toLowerCase())
      );
    } else {
      this.filteredDepartments = [...this.departments];
    }
    this.currentPage = 1;
    this.updatePagination();
  }

  updatePagination() {
    this.totalPages = Math.ceil(this.filteredDepartments.length / this.pageSize);
    this.startIndex = (this.currentPage - 1) * this.pageSize;
    this.endIndex = Math.min(this.startIndex + this.pageSize, this.filteredDepartments.length);
    this.paginatedDepartments = this.filteredDepartments.slice(this.startIndex, this.endIndex);
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

  openAddModal() {
    this.showAddModal = true;
  }

  closeAddModal() {
    this.showAddModal = false;
  }
}
