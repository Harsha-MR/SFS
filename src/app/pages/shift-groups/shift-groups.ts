import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

interface ShiftGroup {
  id: number;
  name: string;
  shifts: number;
  totalDuration: string;
  plannedDowntimes: string;
  allowOverlap: string;
  addedOn: string;
  updatedOn: string;
}

@Component({
  selector: 'app-shift-groups',
  imports: [CommonModule, FormsModule],
  templateUrl: './shift-groups.html',
  styleUrl: './shift-groups.css'
})
export class ShiftGroupsComponent implements OnInit {
  shiftGroups: ShiftGroup[] = [
    { id: 1, name: 'Test_Wimera', shifts: 4, totalDuration: '32 hrs', plannedDowntimes: '6 downtimes', allowOverlap: 'Yes', addedOn: '2/17/2026', updatedOn: '2/17/2026' },
    { id: 2, name: 'Testing', shifts: 3, totalDuration: '18 hrs', plannedDowntimes: '3 downtimes', allowOverlap: 'Yes', addedOn: '2/17/2026', updatedOn: '2/17/2026' },
    { id: 3, name: 'hellos', shifts: 2, totalDuration: '16 hrs', plannedDowntimes: '2 downtimes', allowOverlap: 'Yes', addedOn: '2/17/2026', updatedOn: '2/17/2026' },
    { id: 4, name: 'KK', shifts: 2, totalDuration: '16 hrs', plannedDowntimes: '1 downtime', allowOverlap: 'Yes', addedOn: '2/16/2026', updatedOn: '2/16/2026' },
    { id: 5, name: 'Test3', shifts: 8, totalDuration: '64 hrs', plannedDowntimes: '6 downtimes', allowOverlap: 'Yes', addedOn: '2/12/2026', updatedOn: '2/12/2026' },
    { id: 6, name: 'Test2', shifts: 8, totalDuration: '72 hrs', plannedDowntimes: '', allowOverlap: 'Yes', addedOn: '2/12/2026', updatedOn: '2/12/2026' },
    { id: 7, name: 'Test1', shifts: 5, totalDuration: '48 hrs', plannedDowntimes: '1 downtime', allowOverlap: 'Yes', addedOn: '2/11/2026', updatedOn: '2/11/2026' },
    { id: 8, name: 'Test Group 22', shifts: 5, totalDuration: '40 hrs', plannedDowntimes: '', allowOverlap: 'Yes', addedOn: '1/29/2026', updatedOn: '1/29/2026' }
  ];

  filteredShiftGroups: ShiftGroup[] = [];
  paginatedShiftGroups: ShiftGroup[] = [];
  searchTerm = '';
  showCreateModal = false;
  
  currentPage = 1;
  pageSize = 20;
  totalPages = 1;
  startIndex = 0;
  endIndex = 0;

  ngOnInit() {
    this.filteredShiftGroups = [...this.shiftGroups];
    this.updatePagination();
  }

  filterShiftGroups() {
    if (this.searchTerm) {
      this.filteredShiftGroups = this.shiftGroups.filter(group =>
        group.name.toLowerCase().includes(this.searchTerm.toLowerCase())
      );
    } else {
      this.filteredShiftGroups = [...this.shiftGroups];
    }
    this.currentPage = 1;
    this.updatePagination();
  }

  updatePagination() {
    this.totalPages = Math.ceil(this.filteredShiftGroups.length / this.pageSize);
    this.startIndex = (this.currentPage - 1) * this.pageSize;
    this.endIndex = Math.min(this.startIndex + this.pageSize, this.filteredShiftGroups.length);
    this.paginatedShiftGroups = this.filteredShiftGroups.slice(this.startIndex, this.endIndex);
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

  openCreateModal() {
    this.showCreateModal = true;
  }
}
