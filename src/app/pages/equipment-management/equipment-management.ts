import { Component, OnInit, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

interface Equipment {
  id: number;
  equipmentId: string;
  name: string;
  type: string;
  department: string;
  plant: string;
  monitoringGateway: string;
  powerRating: string;
  voltage: string;
}

@Component({
  selector: 'app-equipment-management',
  imports: [CommonModule, FormsModule],
  templateUrl: './equipment-management.html',
  styleUrl: './equipment-management.css'
})
export class EquipmentManagementComponent implements OnInit {
  equipment: Equipment[] = [
    { id: 1, equipmentId: '01K4TRV8M2GNN...', name: 'MC_PRESS_133', type: '01K4BB45M4ZYSy...', department: '01K4TRTGBAT4Q...', plant: 'Plant-8', monitoringGateway: '-', powerRating: '100 kW', voltage: '100 V' },
    { id: 2, equipmentId: '01K4TRV7G1CZ84...', name: 'MC_PRESS_105', type: '01K4BB45M4ZYSy...', department: '01K4TRTGBAT4Q...', plant: 'Plant-8', monitoringGateway: '-', powerRating: '100 kW', voltage: '100 V' }
  ];

  filteredEquipment: Equipment[] = [];
  paginatedEquipment: Equipment[] = [];
  selectedEquipment: number[] = [];
  searchTerm = '';
  showAddModal = false;
  activeActionMenu: number | null = null;
  
  currentPage = 1;
  pageSize = 20;
  totalPages = 1;
  startIndex = 0;
  endIndex = 0;

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent) {
    this.activeActionMenu = null;
  }

  ngOnInit() {
    this.filteredEquipment = [...this.equipment];
    this.updatePagination();
  }

  get allSelected(): boolean {
    return this.paginatedEquipment.length > 0 && 
           this.paginatedEquipment.every(eq => this.selectedEquipment.includes(eq.id));
  }

  toggleSelectAll() {
    if (this.allSelected) {
      this.selectedEquipment = this.selectedEquipment.filter(
        id => !this.paginatedEquipment.find(eq => eq.id === id)
      );
    } else {
      this.paginatedEquipment.forEach(eq => {
        if (!this.selectedEquipment.includes(eq.id)) {
          this.selectedEquipment.push(eq.id);
        }
      });
    }
  }

  toggleSelect(id: number) {
    const index = this.selectedEquipment.indexOf(id);
    if (index > -1) {
      this.selectedEquipment.splice(index, 1);
    } else {
      this.selectedEquipment.push(id);
    }
  }

  filterEquipment() {
    if (this.searchTerm) {
      this.filteredEquipment = this.equipment.filter(eq =>
        eq.name.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        eq.equipmentId.toLowerCase().includes(this.searchTerm.toLowerCase())
      );
    } else {
      this.filteredEquipment = [...this.equipment];
    }
    this.currentPage = 1;
    this.updatePagination();
  }

  updatePagination() {
    this.totalPages = Math.ceil(this.filteredEquipment.length / this.pageSize);
    this.startIndex = (this.currentPage - 1) * this.pageSize;
    this.endIndex = Math.min(this.startIndex + this.pageSize, this.filteredEquipment.length);
    this.paginatedEquipment = this.filteredEquipment.slice(this.startIndex, this.endIndex);
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
    if (this.selectedEquipment.length > 0) {
      if (confirm(`Are you sure you want to delete ${this.selectedEquipment.length} equipment(s)?`)) {
        this.equipment = this.equipment.filter(eq => !this.selectedEquipment.includes(eq.id));
        this.selectedEquipment = [];
        this.filterEquipment();
      }
    }
  }

  toggleActionMenu(id: number) {
    event?.stopPropagation();
    this.activeActionMenu = this.activeActionMenu === id ? null : id;
  }

  viewDetails(id: number) {
    console.log('View details for equipment:', id);
    this.activeActionMenu = null;
  }

  editEquipment(id: number) {
    console.log('Edit equipment:', id);
    this.activeActionMenu = null;
  }

  deleteEquipment(id: number) {
    if (confirm('Are you sure you want to delete this equipment?')) {
      this.equipment = this.equipment.filter(eq => eq.id !== id);
      this.filterEquipment();
    }
    this.activeActionMenu = null;
  }

  openAddModal() {
    this.showAddModal = true;
  }
}
