import { Component, OnInit, OnDestroy, PLATFORM_ID, Inject } from '@angular/core';
import { CommonModule, DOCUMENT, isPlatformBrowser } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NgxEchartsModule } from 'ngx-echarts';
import { EChartsOption } from 'echarts';
import { inject } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { UserService } from '../../services/user.service';

interface Machine {
  id: number;
  name: string;
  status: 'running' | 'idle' | 'off' | 'breakdown' | 'interlock';
  availability: number;
  performance: number;
  quality: number;
  oee: number;
  currentParts: number;
  targetParts: number;
}

interface Zone {
  id: number;
  name: string;
  activeMachines: number;
  totalMachines: number;
  availability: number;
  performance: number;
  quality: number;
  oee: number;
  runningTimeHrs: number;
  idleTimeHrs: number;
  OffTimeHrs: number;
  breakdownTimeHrs: number;
  interlockTimeHrs: number;
  totalPartsProduced: number;
  machines: Machine[];
}

interface Plant {
  name: string;
  currentShift: string;
  shiftStartTime: string;
  shiftEndTime: string;
  availability: number;
  performance: number;
  quality: number;
  oee: number;
  targetOee: number;
  energyCost: number;
  opportunityCost: number;
  zones: Zone[];
}

type TrendMetric = 'availability' | 'performance' | 'quality' | 'oee';

interface TrendPoint {
  time: string;
  availability: number;
  performance: number;
  quality: number;
  oee: number;
}

@Component({
  selector: 'app-plant-dashboard',
  imports: [CommonModule, FormsModule, NgxEchartsModule],
  templateUrl: './plant-dashboard.html',
  styleUrl: './plant-dashboard.css',
})
export class PlantDashboard implements OnInit, OnDestroy {
    isTrainPaused = false;
    isZoneMachineTrainPaused = false;
    zoneDropdownSelectedId: number | null = null;
    machineDropdownSelectedId: number | null = null;
    zoneChartToggle: 'oee' | 'hourly' = 'oee';
    isZoneDropdownExpanded = false;
    showMachineHourlyChart = false;
    
    // Machine Status Timeline and Time Metrics
    showTimeMetricsModal = false;
    activeMachineTab: 'pms' | 'focas-cms' | 'alarm' | 'tool' | 'cycletime' = 'pms';
    
    // Time metrics data (based on image 5)
    timeMetrics = {
      power: { time: '68:00:12', percentage: 100, hours: 68.00333 },
      operating: { time: '13:36:00', percentage: 20, hours: 13.6 },
      cycle: { time: '00:00:10', percentage: 0.024, hours: 0.00277 },
      cutting: { time: '13:36:00', percentage: 20, hours: 13.6 },
      purposeTime: { time: '-', percentage: 0, hours: 0 }
    };
    
    // Machine information (based on images 2-4)
    machineInfo = {
      type: 'CNC',
      model: 'focas',
      manufacturer: 'WIMERA',
      operation: {
        execution: 'INTERRUPTED',
        control: 'Unavailable',
        emergency: '-',
        operatorMsg: '-',
        group: '-',
        toolId: '-'
      },
      program: {
        programNo: '0123',
        subProgramNo: '565102',
        programName: 'AGS-45G-565102'
      }
    };

    onTrainMouseEnter() {
      this.isTrainPaused = true;
    }

    onTrainMouseLeave() {
      this.isTrainPaused = false;
    }
    
    onZoneMachineTrainMouseEnter() {
      this.isZoneMachineTrainPaused = true;
    }

    onZoneMachineTrainMouseLeave() {
      this.isZoneMachineTrainPaused = false;
    }
    
    toggleZoneChart() {
      this.zoneChartToggle = this.zoneChartToggle === 'oee' ? 'hourly' : 'oee';
    }
    
    toggleZoneDropdown() {
      this.isZoneDropdownExpanded = !this.isZoneDropdownExpanded;
    }

    toggleMachineHourlyChart() {
      this.showMachineHourlyChart = !this.showMachineHourlyChart;
    }
    
    toggleTimeMetricsModal() {
      this.showTimeMetricsModal = !this.showTimeMetricsModal;
      if (this.showTimeMetricsModal) {
        this.timeMetricsDoughnutOption = { ...this.getTimeMetricsDoughnutOption(), notMerge: true };
      }
    }
    
    setActiveMachineTab(tab: 'pms' | 'focas-cms' | 'alarm' | 'tool' | 'cycletime') {
      this.activeMachineTab = tab;
    }
    
    onZoneDropdownChange() {
      if (this.zoneDropdownSelectedId != null) {
        const zone = this.plant.zones.find(z => z.id === +this.zoneDropdownSelectedId!);
        if (zone) {
          this.selectZone(zone);
        }
      }
    }
    
    onMachineDropdownChange() {
      if (this.machineDropdownSelectedId != null && this.selectedZone) {
        const machine = this.selectedZone.machines.find(m => m.id === +this.machineDropdownSelectedId!);
        if (machine) {
          this.selectMachine(machine);
        }
      }
    }
    
    getMachineStatusBorderClass(status: string): string {
      switch (status) {
        case 'running':
          return 'border-green-500 bg-green-50 dark:bg-green-900/20';
        case 'idle':
          return 'border-yellow-500 bg-yellow-50 dark:bg-yellow-900/20';
        case 'offline':
          return 'border-gray-500 bg-gray-50 dark:bg-gray-700';
        case 'breakdown':
          return 'border-red-500 bg-red-50 dark:bg-red-900/20';
        default:
          return 'border-gray-500 bg-gray-50 dark:bg-gray-700';
      }
    }
  private document = inject(DOCUMENT);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private platformId = inject(PLATFORM_ID);
  private userService = inject(UserService);
  private isBrowser: boolean;
  isMultiPlantUser = false;
  
  constructor() {
    this.isBrowser = isPlatformBrowser(this.platformId);
    this.isMultiPlantUser = this.userService.hasMultiplePlants();
  }
  
  get isClient(): boolean {
    return this.isBrowser;
  }
  
  plantId: string = '';
  currentView: 'plant' | 'zone' | 'machine' = 'plant';
  selectedZone: Zone | null = null;
  selectedMachine: Machine | null = null;
  lastUpdatedAt: Date = new Date();
  
  backToDashboard() {
    this.router.navigate(['/dashboard']);
  }
  
  trendView: 'daily' | 'weekly' | 'monthly' = 'weekly';
  showTrends: boolean = true;
  machineStatusFilter: string = 'all';
  activeTrendMetric: TrendMetric = 'oee';
  trendTooltipVisible = false;
  trendTooltipIndex = 0;
  trendTooltipLeftPercent = 50;
  
  // Toggle state for plant efficiency view
  plantEfficiencyView: 'today' | 'weekly' = 'today';
  
  // Chart type toggle for weekly trend
  weeklyChartType: 'bar' | 'line' = 'bar';

  readonly trendChartWidth = 760;
  readonly trendChartHeight = 230;
  readonly trendChartPadding = { top: 18, right: 16, bottom: 42, left: 40 };

  readonly trendMetricConfig: Record<TrendMetric, { label: string; color: string; barColor: string }> = {
    availability: { label: 'Availability', color: '#22c55e', barColor: '#93c5fd' },
    performance: { label: 'Performance', color: '#3b82f6', barColor: '#38bdf8' },
    quality: { label: 'Quality', color: '#d8b4fe', barColor: '#c084fc' },
    oee: { label: 'OEE', color: '#f59e0b', barColor: '#fcd34d' },
  };

  plant: Plant = {
    name: 'Manufacturing Plant A',
    currentShift: 'Shift 1',
    shiftStartTime: '06:00',
    shiftEndTime: '14:00',
    availability: 39.5,
    performance: 45.2,
    quality: 78,
    oee: 100,
    targetOee: 85,
    energyCost: 12500,
    opportunityCost: 8750,
    zones: [
      {
        id: 1,
        name: 'Assembly Zone',
        activeMachines: 8,
        totalMachines: 10,
        availability: 88.2,
        performance: 91.5,
        quality: 97.2,
        oee: 86.5,
        runningTimeHrs: 6.5,
        idleTimeHrs: 1.2,
        OffTimeHrs: 0.5,
        breakdownTimeHrs: 0.3,
        interlockTimeHrs: 0.5,
        totalPartsProduced: 3820,
        machines: [
          {
            id: 101,
            name: 'Machine A1',
            status: 'running',
            availability: 92.5,
            performance: 94.2,
            quality: 98.5,
            oee: 85.8,
            currentParts: 450,
            targetParts: 500
          },
          {
            id: 102,
            name: 'Machine A2',
            status: 'running',
            availability: 89.3,
            performance: 90.8,
            quality: 96.2,
            oee: 78.0,
            currentParts: 420,
            targetParts: 500
          },
          {
            id: 103,
            name: 'Machine A3',
            status: 'idle',
            availability: 75.0,
            performance: 85.0,
            quality: 95.0,
            oee: 60.5,
            currentParts: 0,
            targetParts: 500
          },
          {
            id: 104,
            name: 'Machine A4',
            status: 'running',
            availability: 91.0,
            performance: 93.5,
            quality: 99.0,
            oee: 84.2,
            currentParts: 480,
            targetParts: 500
          },
          {
            id: 105,
            name: 'Machine A5',
            status: 'breakdown',
            availability: 0,
            performance: 0,
            quality: 0,
            oee: 0,
            currentParts: 0,
            targetParts: 500
          },
        ]
      },
      {
        id: 2,
        name: 'Packaging Zone',
        activeMachines: 5,
        totalMachines: 6,
        availability: 82.8,
        performance: 89.2,
        quality: 96.5,
        oee: 76.3,
        runningTimeHrs: 5.8,
        idleTimeHrs: 1.5,
        breakdownTimeHrs: 0.7,
        OffTimeHrs: 0.5,
        interlockTimeHrs: 0.3,
        totalPartsProduced: 2280,
        machines: [
          {
            id: 201,
            name: 'Machine P1',
            status: 'running',
            availability: 88.5,
            performance: 92.0,
            quality: 97.5,
            oee: 79.3,
            currentParts: 380,
            targetParts: 450
          },
          {
            id: 202,
            name: 'Machine P2',
            status: 'running',
            availability: 85.2,
            performance: 88.5,
            quality: 96.0,
            oee: 72.4,
            currentParts: 360,
            targetParts: 450
          },
          {
            id: 203,
            name: 'Machine P3',
            status: 'off',
            availability: 0,
            performance: 0,
            quality: 0,
            oee: 0,
            currentParts: 0,
            targetParts: 450
          },
          {
            id: 204,
            name: 'Machine P4',
            status: 'interlock',
            availability: 0,
            performance: 0,
            quality: 0,
            oee: 0,
            currentParts: 0,
            targetParts: 450
          },
        ]
      },
      {
        id: 3,
        name: 'Quality Check Zone',
        activeMachines: 4,
        totalMachines: 5,
        runningTimeHrs: 6.2,
        idleTimeHrs: 1.0,
        OffTimeHrs: 0.5,
        breakdownTimeHrs: 0.8,
        interlockTimeHrs: 0.2,
        totalPartsProduced: 4120,
        availability: 86.5,
        performance: 95.8,
        quality: 98.2,
        oee: 52.4,
        machines: [
          {
            id: 301,
            name: 'Machine Q1',
            status: 'running',
            availability: 90.5,
            performance: 96.5,
            quality: 99.0,
            oee: 86.4,
            currentParts: 520,
            targetParts: 550
          },
          {
            id: 302,
            name: 'Machine Q2',
            status: 'running',
            availability: 88.0,
            performance: 95.0,
            quality: 98.5,
            oee: 82.3,
            currentParts: 510,
            targetParts: 550
          },
        ]
      },
       {
        id: 4,
        name: 'Parts Zone',
        activeMachines: 4,
        totalMachines: 5,
        availability: 86.5,
        performance: 95.8,
        quality: 98.2,
        oee: 29.6,
        runningTimeHrs: 4.5,
        idleTimeHrs: 2.0,
        OffTimeHrs: 0.5,
        breakdownTimeHrs: 1.5,
        interlockTimeHrs: 0.4,
        totalPartsProduced: 1850,
        machines: [
          {
            id: 401,
            name: 'Machine PT1',
            status: 'running',
            availability: 90.5,
            performance: 96.5,
            quality: 99.0,
            oee: 86.4,
            currentParts: 520,
            targetParts: 550
          },
          {
            id: 402,
            name: 'Machine PT2',
            status: 'running',
            availability: 88.0,
            performance: 95.0,
            quality: 98.5,
            oee: 82.3,
            currentParts: 510,
            targetParts: 550
          },
        ]
      }
    ]
  };

  // Trend data
  dailyTrends = [
    { time: '00:00', availability: 82, performance: 88, quality: 95, oee: 68 },
    { time: '04:00', availability: 85, performance: 90, quality: 96, oee: 73 },
    { time: '08:00', availability: 88, performance: 92, quality: 97, oee: 78 },
    { time: '12:00', availability: 86, performance: 93, quality: 97, oee: 77 },
    { time: '16:00', availability: 84, performance: 91, quality: 96, oee: 73 },
    { time: '20:00', availability: 83, performance: 89, quality: 95, oee: 70 },
  ];

  weeklyTrends: TrendPoint[] = [
    { time: '24/02/2026', availability: 80, performance: 46, quality: 20, oee: 55 },
    { time: '25/02/2026', availability: 60, performance: 33, quality: 100, oee: 72 },
    { time: '26/02/2026', availability: 72, performance: 46, quality: 100, oee: 63 },
    { time: '27/02/2026', availability: 76, performance: 50, quality: 100, oee: 74 },
    { time: '28/02/2026', availability: 70, performance: 37, quality: 90, oee: 69 },
    { time: '01/03/2026', availability: 58, performance: 80, quality: 80, oee: 65 },
    { time: '02/03/2026', availability: 52, performance: 46, quality: 80, oee: 61 },
  ];

  monthlyTrends = [
    { time: 'Week 1', availability: 85, performance: 91, quality: 96, oee: 74 },
    { time: 'Week 2', availability: 86, performance: 92, quality: 97, oee: 77 },
    { time: 'Week 3', availability: 87, performance: 93, quality: 97, oee: 78 },
    { time: 'Week 4', availability: 84, performance: 90, quality: 96, oee: 72 },
  ];

  // Hourly part count data for machine view
  hourlyPartCount = [
    { hour: '06:00', actual: 15, target: 60 },
    { hour: '07:00', actual: 97, target: 60 },
    { hour: '08:00', actual: 196, target: 60 },
    { hour: '09:00', actual: 45, target: 60 },
    { hour: '10:00', actual: 52, target: 60 },
    { hour: '11:00', actual: 37, target: 60 },
    { hour: '12:00', actual: 55, target: 60 },
  ];

  // Gantt chart data for machine view
  ganttData = [
    { status: 'Running', start: '00:00', duration: 2, color: 'bg-green-500' },
    { status: 'Idle', start: '02:00', duration: 0.5, color: 'bg-yellow-500' },
    { status: 'Running', start: '02:30', duration: 3, color: 'bg-green-500' },
    { status: 'Breakdown', start: '05:30', duration: 1, color: 'bg-red-500' },
    { status: 'Running', start: '06:30', duration: 5.5, color: 'bg-green-500' },
  ];

  // Gantt status segments (single source of truth used by chart + summary cards)
  ganttStatusData = [
    { status: 'Off',       start: 0,    end: 2,    color: '#6b7280' },
    { status: 'Running',   start: 2,    end: 4.5,  color: '#10b981' },
    { status: 'Idle',      start: 4.5,  end: 5,    color: '#eab308' },
    { status: 'Running',   start: 5,    end: 6,    color: '#10b981' },
    { status: 'Running',   start: 6,    end: 8.5,  color: '#10b981' },
    { status: 'Idle',      start: 8.5,  end: 9,    color: '#eab308' },
    { status: 'Running',   start: 9,    end: 9.5,  color: '#10b981' },
    { status: 'Breakdown', start: 9.5,  end: 10,   color: '#ef4444' },
    { status: 'Running',   start: 10,   end: 12,   color: '#10b981' },
    { status: 'Idle',      start: 12,   end: 12.5, color: '#eab308' },
    { status: 'Running',   start: 12.5, end: 14,   color: '#10b981' },
    { status: 'Running',   start: 14,   end: 16,   color: '#10b981' },
    { status: 'Interlock', start: 16,   end: 16.5, color: '#f97316' },
    { status: 'Running',   start: 16.5, end: 18,   color: '#10b981' },
    { status: 'Idle',      start: 18,   end: 18.5, color: '#eab308' },
    { status: 'Running',   start: 18.5, end: 20,   color: '#10b981' },
    { status: 'Off',       start: 20,   end: 20.5, color: '#6b7280' },
    { status: 'Running',   start: 20.5, end: 22,   color: '#10b981' },
    { status: 'Running',   start: 22,   end: 23,   color: '#10b981' },
    { status: 'Idle',      start: 23,   end: 23.5, color: '#eab308' },
    { status: 'Running',   start: 23.5, end: 24,   color: '#10b981' },
  ];

  formatDuration(hours: number): string {
    const h = Math.floor(hours);
    const m = Math.round((hours - h) * 60);
    return `${String(h).padStart(2, '0')}h ${String(m).padStart(2, '0')}m`;
  }

  get ganttStatusTimes() {
    const totals: Record<string, number> = { Running: 0, Idle: 0, Breakdown: 0, Off: 0, Interlock: 0 };
    this.ganttStatusData.forEach(seg => {
      if (totals[seg.status] !== undefined) {
        totals[seg.status] += seg.end - seg.start;
      }
    });
    return {
      running:   { label: 'Running',   time: this.formatDuration(totals['Running']),   hours: totals['Running'],   color: '#10b981' },
      idle:      { label: 'Idle',      time: this.formatDuration(totals['Idle']),      hours: totals['Idle'],      color: '#eab308' },
      breakdown: { label: 'Breakdown', time: this.formatDuration(totals['Breakdown']), hours: totals['Breakdown'], color: '#ef4444' },
      off:       { label: 'Off',       time: this.formatDuration(totals['Off']),       hours: totals['Off'],       color: '#6b7280' },
      interlock: { label: 'Interlock', time: this.formatDuration(totals['Interlock']), hours: totals['Interlock'], color: '#f97316' },
    };
  }

  // ECharts options
  plantOeeChartOption: EChartsOption = {};
  weeklyTrendChartOption: EChartsOption = {};
  hourlyPartCountChartOption: EChartsOption = {};
  machineGanttChartOption: EChartsOption = {};
  timeMetricsDoughnutOption: EChartsOption = {};
  
  // Gauge chart options for today's efficiency
  availabilityGaugeOption: EChartsOption = {};
  performanceGaugeOption: EChartsOption = {};
  qualityGaugeOption: EChartsOption = {};
  targetOeeGaugeOption: EChartsOption = {};
  oeeMainGaugeOption: EChartsOption = {};
  
  // Area chart and radar chart options for today's efficiency
  largeAreaChartOption: EChartsOption = {};
  metricsRadarChartOption: EChartsOption = {};
  
  // Plant highlights data with enhanced details
  plantHighlights = [
    { 
      zoneName: 'Assembly Zone', 
      machineName: 'Machine A5', 
      status: 'breakdown', 
      oee: 0,
      reason: 'Scheduled preventive breakdown in progress',
      highlight: 'requires immediate attention'
    },
    { 
      zoneName: 'Packaging Zone', 
      machineName: 'Machine P3', 
      status: 'off', 
      oee: 0,
      reason: 'System failure detected, technician dispatched',
      highlight: 'critical downtime'
    },
    { 
      zoneName: 'Quality Check Zone', 
      machineName: 'Machine Q1', 
      status: 'running', 
      oee: 86.4,
      reason: '',
      highlight: 'excellent performance'
    },
    { 
      zoneName: 'Assembly Zone', 
      machineName: 'Machine A3', 
      status: 'idle', 
      oee: 60.5,
      reason: 'Waiting for material supply',
      highlight: 'below target'
    },
    { 
      zoneName: 'Packaging Zone', 
      machineName: 'Machine P1', 
      status: 'running', 
      oee: 79.3,
      reason: '',
      highlight: 'good performance'
    },
  ];
  
  currentHighlightIndex = 0;
  highlightInterval: any;

  ngOnInit() {
    this.initCharts();
    this.startHighlightCarousel();
    
    // Subscribe to route parameters to determine current view
    this.route.params.subscribe(params => {
      const plantId = params['plantId'];
      const zoneName = params['zoneName'];
      const machineName = params['machineName'];
      
      // Store plantId for navigation
      if (plantId) {
        this.plantId = plantId;
      }
      
      if (machineName && zoneName) {
        // Machine view
        this.currentView = 'machine';
        this.selectedZone = this.plant.zones.find(z => this.encodeRouteName(z.name) === zoneName) || null;
        if (this.selectedZone) {
          this.selectedMachine = this.selectedZone.machines.find(m => this.encodeRouteName(m.name) === machineName) || null;
          this.zoneDropdownSelectedId = this.selectedZone.id;
          this.machineDropdownSelectedId = this.selectedMachine?.id || null;
        }
      } else if (zoneName) {
        // Zone view
        this.currentView = 'zone';
        this.selectedZone = this.plant.zones.find(z => this.encodeRouteName(z.name) === zoneName) || null;
        this.selectedMachine = null;
        this.machineDropdownSelectedId = null;
        if (this.selectedZone) {
          this.zoneDropdownSelectedId = this.selectedZone.id;
        }
      } else {
        // Plant view
        this.currentView = 'plant';
        this.selectedZone = null;
        this.selectedMachine = null;
        this.zoneDropdownSelectedId = null;
        this.machineDropdownSelectedId = null;
      }
    });
  }

  private updateChartTheme(isDark: boolean) {
    this.initCharts();
  }

  private isDarkMode(): boolean {
    if (!this.isBrowser) return false;
    return this.document.documentElement.classList.contains('dark');
  }

  private getTextColor(): string {
    return this.isDarkMode() ? '#ffffff' : '#374151';
  }

  private getAxisLineColor(): string {
    return this.isDarkMode() ? '#4b5563' : '#d1d5db';
  }

  private initCharts() {
    // Using notMerge and lazyUpdate to prevent "chart instance already initialized" warning
    this.plantOeeChartOption = { ...this.getOeeChartOption(this.plant.oee, this.plant.availability, this.plant.performance, this.plant.quality), notMerge: true };
    this.weeklyTrendChartOption = { ...this.getWeeklyTrendChartOption(), notMerge: true };
    this.hourlyPartCountChartOption = { ...this.getHourlyPartCountChartOption(), notMerge: true };
    this.machineGanttChartOption = { ...this.getMachineGanttChartOption(), notMerge: true };
    
    // Initialize gauge charts for today's efficiency and change the color of lable in dark mode to light color for better visibility
    this.availabilityGaugeOption = { ...this.getHalfGaugeOption('Availability', this.plant.availability, ), notMerge: true };
    this.performanceGaugeOption = { ...this.getHalfGaugeOption('Performance', this.plant.performance, '#22c55e'), notMerge: true };
    this.qualityGaugeOption = { ...this.getHalfGaugeOption('Quality', this.plant.quality, '#a78bfa'), notMerge: true };
    this.targetOeeGaugeOption = { ...this.getHalfGaugeOption('Target OEE', this.plant.targetOee, '#f59e0b'), notMerge: true };
    this.oeeMainGaugeOption = { ...this.getMainGaugeOption('OEE', this.plant.oee), notMerge: true };
    
    // Initialize area chart and radar chart
    this.largeAreaChartOption = { ...this.getLargeAreaChartOption(), notMerge: true };
    this.metricsRadarChartOption = { ...this.getMetricsRadarChartOption(), notMerge: true };
  }

  getOeeChartOption(oee: number, availability: number, performance: number, quality: number): EChartsOption {
    const isDark = this.isDarkMode();
    const textColor = this.getTextColor();
    
    return {
      tooltip: {
        show: true,
        trigger: 'item',
        backgroundColor: isDark ? '#1f2937' : '#ffffff',
        borderColor: isDark ? '#4b5563' : '#e5e7eb',
        textStyle: {
          color: textColor,
          fontSize: 11
        },
        formatter: () => {
          return [
            `<div style='min-width:100px; font-size:11px'>`,
            `<strong>OEE:</strong> <strong>${oee}%</strong><br/>`,
            `<strong>Availability:</strong> ${availability}%<br/>`,
            `<strong>Performance:</strong> ${performance}%<br/>`,
            `<strong>Quality:</strong> ${quality}%`,
            `</div>`
          ].join('');
        },
        confine: true,
        position: function (point, params, dom, rect, size) {
          var x = point[0];
          var y = point[1];
          var viewWidth = size.viewSize[0];
          var viewHeight = size.viewSize[1];
          var boxWidth = size.contentSize[0];
          var boxHeight = size.contentSize[1];
          var posX = x + 10;
          var posY = y + 10;
          if (x + boxWidth + 10 > viewWidth) {
            posX = x - boxWidth - 10;
          }
          if (y + boxHeight + 10 > viewHeight) {
            posY = y - boxHeight - 10;
          }
          if (posX < 0) posX = 10;
          if (posY < 0) posY = 10;
          return [posX, posY];
        }
      },
      series: [
        {
          name: 'OEE',
          type: 'pie',
          radius: ['70%', '90%'],
          avoidLabelOverlap: false,
          label: {
            show: true,
            position: 'center',
            fontSize: 18,
            fontWeight: 'bold',
            color: this.getOeeStrokeColor(oee),
            formatter: () => `OEE\n ${oee}%`
          },
          labelLine: {
            show: false
          },
          emphasis: {
            scale: true,
            scaleSize: 5
          },
          data: [
            { 
              value: oee, 
              itemStyle: { 
                color: this.getOeeStrokeColor(oee)
              } 
            },
            { 
              value: 100 - oee, 
              itemStyle: { 
                color: isDark ? '#374151' : '#e5e7eb'
              } 
            }
          ]
        }
      ]
    };
  }

  getWeeklyTrendChartOption(): EChartsOption {
    const isDark = this.isDarkMode();
    const textColor = this.getTextColor();
    const axisLineColor = this.getAxisLineColor();
    
    return {
      tooltip: {
        trigger: 'axis',
        backgroundColor: isDark ? '#1f2937' : '#ffffff',
        borderColor: isDark ? '#4b5563' : '#e5e7eb',
        textStyle: {
          color: textColor
        },
        axisPointer: {
          type: 'cross'
        }
      },
      legend: {
        data: ['Availability', 'Performance', 'Quality', 'OEE'],
        bottom: 0,
        left: 'center',
        orient: 'horizontal',
        itemGap: 20,
        itemWidth: 20,
        itemHeight: 12,
        textStyle: {
          color: textColor,
          fontSize: 11
        }
      },
      grid: {
        left: '2%',
        right: '4%',
        bottom: '25%',
        top: '5%',
        containLabel: true
      },
      xAxis: {
        type: 'category',
        boundaryGap: true,
        data: this.weeklyTrends.map(t => t.time),
        axisLine: {
          lineStyle: {
            color: axisLineColor
          }
        },
        axisLabel: {
          color: isDark ? '#ffffff' : '#6e7480',
        }
      },
      yAxis: {
        type: 'value',
        min: 0,
        max: 100,
        axisLine: {
          lineStyle: {
            color: axisLineColor
          }
        },
        axisLabel: {
          color: textColor,
          formatter: '{value}%'
        },
        splitLine: {
          lineStyle: {
            color: isDark ? '#b3aeae' : '#6e7480'
          }
        }
      },
      series: [
        {
          name: 'Availability',
          type: this.weeklyChartType,
          data: this.weeklyTrends.map(t => t.availability),
          itemStyle: {
            color: '#81acdc'
          },
          smooth: this.weeklyChartType === 'line',
          lineStyle: this.weeklyChartType === 'line' ? { width: 2 } : undefined,
          symbolSize: this.weeklyChartType === 'line' ? 6 : undefined
        },
        {
          name: 'Performance',
          type: this.weeklyChartType,
          data: this.weeklyTrends.map(t => t.performance),
          itemStyle: {
            color: '#5bf838'
          },
          smooth: this.weeklyChartType === 'line',
          lineStyle: this.weeklyChartType === 'line' ? { width: 2 } : undefined,
          symbolSize: this.weeklyChartType === 'line' ? 6 : undefined
        },
        {
          name: 'Quality',
          type: this.weeklyChartType,
          data: this.weeklyTrends.map(t => t.quality),
          itemStyle: {
            color: '#c084fc'
          },
          smooth: this.weeklyChartType === 'line',
          lineStyle: this.weeklyChartType === 'line' ? { width: 2 } : undefined,
          symbolSize: this.weeklyChartType === 'line' ? 6 : undefined
        },
        {
          name: 'OEE',
          type: 'line',
          data: this.weeklyTrends.map(t => t.oee),
          smooth: true,
          itemStyle: {
            color: '#f59e0b'
          },
          lineStyle: {
            width: 2,
            color: '#f59e0b'
          },
          symbolSize: 8
        }
      ]
    };
  }

  getHourlyPartCountChartOption(): EChartsOption {
    const isDark = this.isDarkMode();
    const textColor = this.getTextColor();
    const axisLineColor = this.getAxisLineColor();
    
    const maxValue = Math.max(...this.hourlyPartCount.map(h => Math.max(h.actual, h.target)));
    
    return {
      tooltip: {
        trigger: 'axis',
        backgroundColor: isDark ? '#1f2937' : '#ffffff',
        borderColor: isDark ? '#4b5563' : '#e5e7eb',
        textStyle: {
          color: textColor
        },
        axisPointer: {
          type: 'shadow'
        },
        formatter: (params: any) => {
          // params is an array of series data for the hovered point
          const dataIndex = params[0].dataIndex;
          const hours = this.hourlyPartCount.map(h => h.hour);
          const startTime = hours[dataIndex];
          const endTime = dataIndex < hours.length - 1 ? hours[dataIndex + 1] : 'End';
          const actual = this.hourlyPartCount[dataIndex]?.actual ?? '-';
          const target = this.hourlyPartCount[dataIndex]?.target ?? '-';
          return `<div style="font-size: 12px;">
            <strong>Time:</strong> ${startTime} - ${endTime}<br/>
            <strong>Produced:</strong> ${actual}<br/>
            <strong>Target:</strong> ${target}
          </div>`;
        }
      },
      legend: {
        data: ['Actual', 'Target'],
        bottom: 0,
        textStyle: {
          color: textColor
        }
      },
      grid: {
        left: '3%',
        right: '4%',
        bottom: '12%',
        top: '5%',
        containLabel: true
      },
      xAxis: {
        type: 'category',
        data: this.hourlyPartCount.map(h => h.hour),
        axisLine: {
          lineStyle: {
            color: axisLineColor
          }
        },
        axisLabel: {
          color: textColor
        }
      },
      yAxis: {
        type: 'value',
        min: 0,
        max: Math.ceil(maxValue * 1.2 / 10) * 10,
        axisLine: {
          lineStyle: {
            color: axisLineColor
          }
        },
        axisLabel: {
          color: textColor
        },
        splitLine: {
          lineStyle: {
            color: isDark ? '#374151' : '#f3f4f6'
          }
        }
      },
      series: [
        {
          name: 'Actual',
          type: 'bar',
          data: this.hourlyPartCount.map(h => h.actual),
          itemStyle: {
            color: '#76afdd'
          },
          barMaxWidth: 40
        },
        {
          name: 'Target',
          type: 'line',
          data: this.hourlyPartCount.map(h => h.target),
          smooth: false,
          itemStyle: {
            color: '#ef4444'
          },
          lineStyle: {
            width: 2,
            color: '#ef4444',
            type: 'dashed'
          },
          symbolSize: 6
        }
      ]
    };
  }

  getMachineGanttChartOption(): EChartsOption {
    const isDark = this.isDarkMode();
    const textColor = this.getTextColor();
    const axisLineColor = this.getAxisLineColor();
    
    // Calculate total time for percentage calculation
    const totalTime = 24; // 24 hours
    
    // Use shared ganttStatusData
    const statusData = this.ganttStatusData;
    
    // Create series data for custom rendering
    const seriesData = statusData.map(segment => {
      const duration = segment.end - segment.start;
      const percentage = ((duration / totalTime) * 100).toFixed(2);
      
      return {
        value: [0, segment.start, segment.end],
        itemStyle: {
          color: segment.color
        },
        status: segment.status,
        startTime: segment.start,
        endTime: segment.end,
        duration: duration,
        percentage: percentage
      };
    });
    
    return {
      tooltip: {
        trigger: 'item',
        formatter: (params: any) => {
          if (params.data) {
            const startHours = Math.floor(params.data.startTime);
            const startMins = Math.round((params.data.startTime - startHours) * 60);
            const endHours = Math.floor(params.data.endTime);
            const endMins = Math.round((params.data.endTime - endHours) * 60);
            const durationHours = Math.floor(params.data.duration);
            const durationMins = Math.round((params.data.duration - durationHours) * 60);
            
            return `<div style="padding: 8px; font-size: 12px;">
                      <div style="font-weight: 600; margin-bottom: 6px; color: ${params.data.itemStyle.color}; font-size: 13px;">
                        ${params.data.status}
                      </div>
                      <div style="margin-bottom: 3px;">
                        <strong>Time Interval:</strong> ${String(startHours).padStart(2, '0')}:${String(startMins).padStart(2, '0')} - ${String(endHours).padStart(2, '0')}:${String(endMins).padStart(2, '0')}
                      </div>
                      <div style="margin-bottom: 3px;">
                        <strong>Duration:</strong> ${durationHours}h ${durationMins}m
                      </div>
                      <div style="font-weight: 600; color: ${params.data.itemStyle.color};">
                        <strong>Percentage:</strong> ${params.data.percentage}%
                      </div>
                    </div>`;
          }
          return '';
        },
        backgroundColor: isDark ? '#1f2937' : '#ffffff',
        borderColor: isDark ? '#4b5563' : '#e5e7eb',
        textStyle: {
          color: textColor,
          fontSize: 12
        }
      },
      grid: {
        left: 20,
        right: 20,
        top: 20,
        bottom: 30,
        containLabel: false
      },
      xAxis: {
        type: 'value',
        min: 0,
        max: 24,
        interval: 2,
        axisLabel: {
          formatter: (value: number) => {
            const hour = Math.floor(value);
            return `${String(hour).padStart(2, '0')}:00`;
          },
          color: textColor,
          fontSize: 10,
          rotate: 0
        },
        axisLine: {
          show: true,
          lineStyle: {
            color: axisLineColor,
            width: 1
          }
        },
        axisTick: {
          show: true,
          lineStyle: {
            color: axisLineColor
          }
        },
        splitLine: {
          show: true,
          lineStyle: {
            color: isDark ? '#374151' : '#e5e7eb',
            type: 'dashed',
            opacity: 0.3
          }
        }
      },
      yAxis: {
        type: 'category',
        data: [''],
        axisLabel: {
          show: false
        },
        axisLine: {
          show: false
        },
        axisTick: {
          show: false
        },
        splitLine: {
          show: false
        }
      },
      series: [
        {
          type: 'custom',
          renderItem: (params: any, api: any) => {
            const categoryIndex = api.value(0);
            const start = api.coord([api.value(1), categoryIndex]);
            const end   = api.coord([api.value(2), categoryIndex]);
            const height = Math.max(api.size([0, 1])[1] * 0.7, 20);
            const y = start[1] - height / 2;
            const color = (params.data as any).itemStyle?.color ?? '#888';
            
            return {
              type: 'rect',
              shape: {
                x: start[0],
                y: y,
                width: Math.max(end[0] - start[0], 2),
                height: height
              },
              style: {
                fill: color,
                stroke: 'none'
              }
            };
          },
          encode: {
            x: [1, 2],
            y: 0
          },
          data: seriesData
        }
      ]
    };
  }

  getTimeMetricsDoughnutOption(): EChartsOption {
    const isDark = this.isDarkMode();
    const textColor = this.getTextColor();
    
    const st = this.ganttStatusTimes;
    const totalHours = 24;
    const chartData = [
      {
        name: 'Running',
        value: st.running.hours,
        percentage: +((st.running.hours / totalHours) * 100).toFixed(1),
        time: st.running.time,
        itemStyle: { color: '#10b981' }
      },
      {
        name: 'Idle',
        value: st.idle.hours,
        percentage: +((st.idle.hours / totalHours) * 100).toFixed(1),
        time: st.idle.time,
        itemStyle: { color: '#eab308' }
      },
      {
        name: 'Breakdown',
        value: st.breakdown.hours,
        percentage: +((st.breakdown.hours / totalHours) * 100).toFixed(1),
        time: st.breakdown.time,
        itemStyle: { color: '#ef4444' }
      },
      {
        name: 'Off',
        value: st.off.hours,
        percentage: +((st.off.hours / totalHours) * 100).toFixed(1),
        time: st.off.time,
        itemStyle: { color: '#6b7280' }
      },
      {
        name: 'Interlock',
        value: st.interlock.hours,
        percentage: +((st.interlock.hours / totalHours) * 100).toFixed(1),
        time: st.interlock.time,
        itemStyle: { color: '#f97316' }
      }
    ].filter(item => item.value > 0);
    
    return {
      tooltip: {
        trigger: 'item',
        formatter: (params: any) => {
          return `<div style="padding: 8px; font-size: 12px;">
                    <div style="font-weight: 600; margin-bottom: 6px; color: ${params.color}; font-size: 13px;">
                      ${params.name}
                    </div>
                    <div style="margin-bottom: 3px;">
                      <strong>Time:</strong> ${params.data.time}
                    </div>
                    <div style="margin-bottom: 3px;">
                      <strong>Hours:</strong> ${params.value.toFixed(2)}h
                    </div>
                    <div style="font-weight: 600;">
                      <strong>Percentage:</strong> ${params.data.percentage.toFixed(2)}%
                    </div>
                  </div>`;
        },
        backgroundColor: isDark ? '#1f2937' : '#ffffff',
        borderColor: isDark ? '#4b5563' : '#e5e7eb',
        textStyle: {
          color: textColor
        }
      },
      legend: {
        orient: 'vertical',
        right: '10%',
        top: 'center',
        textStyle: {
          color: textColor,
          fontSize: 12
        },
        formatter: (name: string) => {
          const item = chartData.find(d => d.name === name);
          return `${name}: ${item?.percentage.toFixed(1)}%`;
        }
      },
      series: [
        {
          name: 'Time Metrics',
          type: 'pie',
          radius: ['40%', '70%'],
          center: ['35%', '50%'],
          avoidLabelOverlap: true,
          label: {
            show: true,
            position: 'outside',
            formatter: '{b}\n{d}%',
            color: textColor,
            fontSize: 11
          },
          emphasis: {
            label: {
              show: true,
              fontSize: 14,
              fontWeight: 'bold'
            },
            itemStyle: {
              shadowBlur: 10,
              shadowOffsetX: 0,
              shadowColor: 'rgba(0, 0, 0, 0.5)'
            }
          },
          labelLine: {
            show: true,
            lineStyle: {
              color: textColor
            }
          },
          data: chartData
        }
      ]
    };
  }

  parseTimeToHours(timeStr: string): number {
    const [hours, minutes] = timeStr.split(':').map(Number);
    return hours + (minutes || 0) / 60;
  }

  getZoneOeeComparisonChartOption(): EChartsOption {
    const isDark = this.isDarkMode();
    const textColor = this.getTextColor();
    const axisLineColor = this.getAxisLineColor();
    
    // Mock data for yesterday and today OEE by hour
    const hours = ['00:00', '02:00', '04:00', '06:00', '08:00', '10:00', '12:00', '14:00', '16:00', '18:00', '20:00', '22:00'];
    const yesterdayOee = [65, 68, 70, 72, 75, 78, 76, 74, 50, 70, 68, 66];
    const todayOee = [70, 72, 65, 67, 80, 82, 85, 83, 81, 79, 90, 74];
    const availability = [75, 87, 88, 90, 92, 67, 89, 88, 86, 85, 83, 82];
    const performance = [78, 80, 82, 85, 88, 90, 92, 91, 89, 87, 85, 83];
    const quality = [95, 96, 96, 97, 97, 98, 98, 97, 97, 96, 95, 95];
    
    return {
      tooltip: {
        trigger: 'axis',
        backgroundColor: isDark ? '#1f2937' : '#ffffff',
        borderColor: isDark ? '#4b5563' : '#e5e7eb',
        textStyle: {
          color: textColor
        },
        formatter: (params: any) => {
          const dataIndex = params[0].dataIndex;
          const startTime = hours[dataIndex];
          const endTime = dataIndex < hours.length - 1 ? hours[dataIndex + 1] : '23:59';
          let result = `<div style="font-size: 11px;"><strong>Time:</strong> ${startTime} - ${endTime}<br/>`;
          params.forEach((param: any) => {
            result += `<strong>${param.seriesName}:</strong> ${param.value}%<br/>`;
          });
          result += '</div>';
          return result;
        },
        confine: true
      },
      legend: {
        data: ['Yesterday OEE', 'Today OEE', 'Availability', 'Performance', 'Quality'],
        bottom: 0,
        textStyle: {
          color: textColor,
          fontSize: 10
        },
        itemWidth: 18,
        itemHeight: 10,
        itemGap: 8
      },
      grid: {
        left: '3%',
        right: '4%',
        bottom: '18%',
        top: '10%',
        containLabel: true
      },
      xAxis: {
        type: 'category',
        data: hours,
        axisLine: {
          lineStyle: {
            color: axisLineColor
          }
        },
        axisLabel: {
          color: textColor,
          fontSize: 10
        }
      },
      yAxis: {
        type: 'value',
        min: 0,
        max: 100,
        axisLine: {
          lineStyle: {
            color: axisLineColor
          }
        },
        axisLabel: {
          color: textColor,
          formatter: '{value}%'
        },
        splitLine: {
          lineStyle: {
            color: isDark ? '#374151' : '#f3f4f6'
          }
        }
      },
      series: [
        {
          name: 'Yesterday OEE',
          type: 'line',
          data: yesterdayOee,
          itemStyle: {
            color: '#9ca3af'
          },
          lineStyle: {
            width: 2,
            color: '#9ca3af',
            type: 'dashed'
          },
          symbolSize: 5
        },
        {
          name: 'Today OEE',
          type: 'line',
          data: todayOee,
          smooth: true,
          itemStyle: {
            color: '#14b8a6'
          },
          lineStyle: {
            width: 2,
            color: '#14b8a6'
          },
          symbolSize: 5
        },
        {
          name: 'Availability',
          type: 'line',
          data: availability,
          smooth: true,
          itemStyle: {
            color: '#22c55e'
          },
          lineStyle: {
            width: 2,
            color: '#22c55e'
          },
          symbolSize: 5
        },
        {
          name: 'Performance',
          type: 'line',
          data: performance,
          smooth: true,
          itemStyle: {
            color: '#3b82f6'
          },
          lineStyle: {
            width: 2,
            color: '#3b82f6'
          },
          symbolSize: 5
        },
        {
          name: 'Quality',
          type: 'line',
          data: quality,
          smooth: true,
          itemStyle: {
            color: '#a78bfa'
          },
          lineStyle: {
            width: 2,
            color: '#a78bfa'
          },
          symbolSize: 5
        }
      ]
    };
  }

  getZoneHourlyPartCountChartOption(): EChartsOption {
    const isDark = this.isDarkMode();
    const textColor = this.getTextColor();
    const axisLineColor = this.getAxisLineColor();
    
    // Mock hourly data for zone
    const hours = ['06:00', '07:00', '08:00', '09:00', '10:00', '11:00', '12:00', '13:00', '14:00'];
    const actualParts = [45, 52, 48, 55, 50, 47, 53, 49, 51];
    const targetParts = [60, 60, 60, 60, 60, 60, 60, 60, 60];
    
    return {
      tooltip: {
        trigger: 'axis',
        backgroundColor: isDark ? '#1f2937' : '#ffffff',
        borderColor: isDark ? '#4b5563' : '#e5e7eb',
        textStyle: {
          color: textColor
        },
        formatter: (params: any) => {
          const dataIndex = params[0].dataIndex;
          const startTime = hours[dataIndex];
          const endTime = dataIndex < hours.length - 1 ? hours[dataIndex + 1] : hours[dataIndex];
          let result = `<div style="font-size: 11px;"><strong>Time:</strong> ${startTime} - ${endTime}<br/>`;
          params.forEach((param: any) => {
            result += `<strong>${param.seriesName}:</strong> ${param.value}<br/>`;
          });
          result += '</div>';
          return result;
        },
        confine: true,
        axisPointer: {
          type: 'shadow'
        }
      },
      legend: {
        data: ['Actual Parts', 'Target Parts'],
        bottom: 0,
        textStyle: {
          color: textColor,
          fontSize: 10
        }
      },
      grid: {
        left: '3%',
        right: '4%',
        bottom: '15%',
        top: '10%',
        containLabel: true
      },
      xAxis: {
        type: 'category',
        data: hours,
        axisLine: {
          lineStyle: {
            color: axisLineColor
          }
        },
        axisLabel: {
          color: textColor,
          fontSize: 10
        }
      },
      yAxis: {
        type: 'value',
        min: 0,
        axisLine: {
          lineStyle: {
            color: axisLineColor
          }
        },
        axisLabel: {
          color: textColor
        },
        splitLine: {
          lineStyle: {
            color: isDark ? '#374151' : '#f3f4f6'
          }
        }
      },
      series: [
        {
          name: 'Actual Parts',
          type: 'bar',
          data: actualParts,
          itemStyle: {
            color: '#14b8a6'
          },
          barMaxWidth: 20,
          barGap: '10%'
        },
        {
          name: 'Target Parts',
          type: 'bar',
          data: targetParts,
          itemStyle: {
            color: '#f59e0b'
          },
          barMaxWidth: 20
        }
      ]
    };
  }

  getHalfGaugeOption(name: string, value: number, color?: string): EChartsOption {
    const isDark = this.isDarkMode();
    const textColor = this.getTextColor();
    // Use dynamic color logic for OEE and similar metrics
    let gaugeColor: string;
    if (!color || name.toLowerCase().includes('oee') || name.toLowerCase().includes('availability') || name.toLowerCase().includes('performance') || name.toLowerCase().includes('quality')) {
      gaugeColor = this.getOeeStrokeColor(value);
    } else {
      gaugeColor = color;
    }
    // Fallback to a default color if still undefined
    if (!gaugeColor) gaugeColor = '#3b82f6';
    return {
      series: [
        {
          type: 'gauge',
          startAngle: 180,
          endAngle: 0,
          min: 0,
          max: 100,
          radius: '90%',
          center: ['50%', '75%'],
          splitNumber: 5,
          axisLine: {
            lineStyle: {
              width: 20,
              color: [
                [value / 100, gaugeColor],
                [1, isDark ? '#374151' : '#e5e7eb']
              ]
            }
          },
          pointer: {
            show: false
          },
          axisTick: {
            show: false
          },
          splitLine: {
            show: false
          },
          axisLabel: {
            show: false
          },
          anchor: {
            show: false
          },
          title: {
            show: true,
            offsetCenter: [0, '20%'],
            fontSize: 13,
            color: isDark ? '#ffffff' : '#4b5563',
            fontWeight: 400
          },
          detail: {
            valueAnimation: true,
            formatter: '{value}%',
            color: gaugeColor,
            fontSize: 24,
            fontWeight: 'bold',
            offsetCenter: [0, '-10%']
          },
          data: [
            {
              value: value,
              name: name
            }
          ]
        }
      ]
    };
  }

  getMainGaugeOption(name: string, value: number): EChartsOption {
    const isDark = this.isDarkMode();
    const textColor = this.getTextColor();
    const gaugeColor = this.getOeeStrokeColor(value);
    
    return {
      series: [
        {
          type: 'gauge',
          startAngle: 225,
          endAngle: -45,
          min: 0,
          max: 100,
          radius: '90%',
          center: ['50%', '60%'],
          splitNumber: 10,
          axisLine: {
            lineStyle: {
              width: 30,
              color: [
                [value / 100, gaugeColor],
                [1, isDark ? '#0e1013' : '#ffffff']
              ]
            }
          },
          pointer: {
            itemStyle: {
              color: gaugeColor
            },
            width: 3,
            length: '60%'
          },
          axisTick: {
            distance: -30,
            length: 6,
            lineStyle: {
              color: isDark ? '#ffffff' : '#727272',
              width: 2
            }
          },
          splitLine: {
            distance: -30,
            length: 12,
            lineStyle: {
              color: isDark ? '#ffffff' : '#727272',
              width: 3
            }
          },
          axisLabel: {
            color: isDark ? '#ffffff' : '#4b5563',
            distance: 35,
            fontSize: 10
          },
          anchor: {
            show: true,
            showAbove: true,
            size: 15,
            itemStyle: {
              borderWidth: 5,
              borderColor: gaugeColor
            }
          },
          title: {
            show: true,
            offsetCenter: [0, '-20%'],
            fontSize: 13,
            color: isDark ? '#d1d5db' : '#4b5563',
            fontWeight: "bold"
          },
          detail: {
            valueAnimation: true,
            formatter: '{value}%',
            color: gaugeColor,
            fontSize: 22,
            fontWeight: 'bold',
            offsetCenter: [0, '75%']
          },
          data: [
            {
              value: value,
              name: name
            }
          ]
        }
      ]
    };
  }

  togglePlantEfficiencyView() {
    this.plantEfficiencyView = this.plantEfficiencyView === 'today' ? 'weekly' : 'today';
  }
  
  toggleWeeklyChartType() {
    this.weeklyChartType = this.weeklyChartType === 'bar' ? 'line' : 'bar';
    this.weeklyTrendChartOption = this.getWeeklyTrendChartOption();
  }

  getLargeAreaChartOption(): EChartsOption {
    const isDark = this.isDarkMode();
    const textColor = this.getTextColor();
    const axisLineColor = this.getAxisLineColor();
    
    // Generate data
    let base = +new Date(1988, 9, 3);
    const oneDay = 24 * 3600 * 1000;
    const data: [number, number][] = [[base, Math.random() * 300]];
    for (let i = 1; i < 20000; i++) {
      const now = new Date((base += oneDay));
      data.push([+now, Math.round((Math.random() - 0.5) * 20 + data[i - 1][1])]);
    }
    
    return {
      tooltip: {
        trigger: 'axis',
        position: function (pt) {
          return [pt[0], '10%'];
        },
        backgroundColor: isDark ? '#1f2937' : '#ffffff',
        borderColor: isDark ? '#4b5563' : '#e5e7eb',
        textStyle: {
          color: textColor
        }
      },
      title: {
        left: 'center',
        text: 'Large Area Chart',
        textStyle: {
          color: textColor,
          fontSize: 16,
          fontWeight: 600
        }
      },
      toolbox: {
        feature: {
          dataZoom: {
            yAxisIndex: 'none'
          },
          restore: {},
          saveAsImage: {}
        },
        iconStyle: {
          borderColor: textColor
        }
      },
      xAxis: {
        type: 'time',
        axisLine: {
          lineStyle: {
            color: axisLineColor
          }
        },
        axisLabel: {
          color: textColor
        }
      },
      yAxis: {
        type: 'value',
        boundaryGap: [0, '100%'],
        axisLine: {
          lineStyle: {
            color: axisLineColor
          }
        },
        axisLabel: {
          color: textColor
        },
        splitLine: {
          lineStyle: {
            color: isDark ? '#374151' : '#f3f4f6'
          }
        }
      },
      dataZoom: [
        {
          type: 'inside',
          start: 0,
          end: 20
        },
        {
          start: 0,
          end: 20,
          textStyle: {
            color: textColor
          },
          borderColor: isDark ? '#4b5563' : '#d1d5db',
          fillerColor: isDark ? 'rgba(59, 130, 246, 0.2)' : 'rgba(59, 130, 246, 0.1)'
        }
      ],
      series: [
        {
          name: 'Fake Data',
          type: 'line',
          smooth: true,
          symbol: 'none',
          areaStyle: {
            color: isDark ? 'rgba(59, 130, 246, 0.3)' : 'rgba(59, 130, 246, 0.2)'
          },
          lineStyle: {
            color: '#3b82f6',
            width: 2
          },
          data: data
        }
      ]
    };
  }

  getMetricsRadarChartOption(): EChartsOption {
    const isDark = this.isDarkMode();
    const textColor = this.getTextColor();
    
    return {
      title: {
        text: 'Plant Metrics',
        left: 'center',
        top: 10,
        textStyle: {
          color: textColor,
          fontSize: 14,
          fontWeight: 600
        }
      },
      tooltip: {
        backgroundColor: isDark ? '#1f2937' : '#ffffff',
        borderColor: isDark ? '#4b5563' : '#e5e7eb',
        textStyle: {
          color: textColor
        }
      },
      radar: {
        indicator: [
          { name: 'Availability', max: 100 },
          { name: 'Performance', max: 100 },
          { name: 'Quality', max: 100 },
          { name: 'OEE', max: 100 },
          { name: 'Target OEE', max: 100 }
        ],
        center: ['50%', '55%'],
        radius: '65%',
        axisName: {
          color: textColor,
          fontSize: 11,
          fontWeight: 500
        },
        splitArea: {
          areaStyle: {
            color: isDark 
              ? ['rgba(59, 130, 246, 0.05)', 'rgba(59, 130, 246, 0.1)', 'rgba(59, 130, 246, 0.15)', 'rgba(59, 130, 246, 0.2)']
              : ['rgba(114, 192, 249, 0.05)', 'rgba(114, 192, 249, 0.1)', 'rgba(114, 192, 249, 0.15)', 'rgba(114, 192, 249, 0.2)']
          }
        },
        axisLine: {
          lineStyle: {
            color: isDark ? '#4b5563' : '#d1d5db'
          }
        },
        splitLine: {
          lineStyle: {
            color: isDark ? '#4b5563' : '#d1d5db'
          }
        }
      },
      series: [
        {
          type: 'radar',
          data: [
            {
              value: [
                this.plant.availability,
                this.plant.performance,
                this.plant.quality,
                this.plant.oee,
                this.plant.targetOee
              ],
              name: 'Current Metrics',
              areaStyle: {
                color: 'rgba(59, 130, 246, 0.3)'
              },
              lineStyle: {
                color: '#3b82f6',
                width: 2
              },
              itemStyle: {
                color: '#3b82f6'
              }
            }
          ],
          emphasis: {
            lineStyle: {
              width: 3
            }
          }
        }
      ]
    };
  }

  getZoneOeeChartOption(zone: Zone): EChartsOption {
    return this.getOeeChartOption(zone.oee, zone.availability, zone.performance, zone.quality);
  }

  get currentTrends() {
    switch (this.trendView) {
      case 'daily':
        return this.dailyTrends;
      case 'weekly':
        return this.weeklyTrends;
      case 'monthly':
        return this.monthlyTrends;
      default:
        return this.dailyTrends;
    }
  }

  get filteredMachines() {
    if (!this.selectedZone) return [];
    if (this.machineStatusFilter === 'all') {
      return this.selectedZone.machines;
    }
    return this.selectedZone.machines.filter(m => m.status === this.machineStatusFilter);
  }

  encodeRouteName(name: string): string {
    return name.toLowerCase().replace(/\s+/g, '-');
  }

  selectZone(zone: Zone) {
    const zoneName = this.encodeRouteName(zone.name);
    this.router.navigate(['/dashboard', this.plantId, zoneName]);
    this.machineStatusFilter = 'all';
  }

  selectMachine(machine: Machine) {
    if (this.selectedZone) {
      const zoneName = this.encodeRouteName(this.selectedZone.name);
      const machineName = this.encodeRouteName(machine.name);
      this.router.navigate(['/dashboard', this.plantId, zoneName, machineName]);
    }
  }

  backToPlant() {
    this.router.navigate(['/dashboard', this.plantId]);
  }

  backToZone() {
    if (this.selectedZone) {
      const zoneName = this.encodeRouteName(this.selectedZone.name);
      this.router.navigate(['/dashboard', this.plantId, zoneName]);
    }
  }

  refreshData() {
    // Update the last updated timestamp
    this.lastUpdatedAt = new Date();
    
    // Reinitialize charts with fresh data
    this.initCharts();
    
    // In a real application, you would fetch data from an API here
    // For example:
    // this.dataService.getPlantData(this.plantId).subscribe(data => {
    //   this.plant = data;
    //   this.lastUpdatedAt = new Date();
    //   this.initCharts();
    // });
  }

  getFormattedUpdateTime(): string {
    const now = new Date();
    const diff = now.getTime() - this.lastUpdatedAt.getTime();
    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(seconds / 60);
    
    if (minutes < 1) {
      return 'Just now';
    } else if (minutes === 1) {
      return '1 min ago';
    } else if (minutes < 60) {
      return `${minutes} mins ago`;
    } else {
      return this.lastUpdatedAt.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    }
  }

  getMachineStatusClass(status: string): string {
    switch (status) {
      case 'running':
        return 'bg-green-100 text-green-800 border-green-300 dark:bg-green-900 dark:text-green-300 dark:border-green-700';
      case 'idle':
        return 'bg-yellow-100 text-yellow-800 border-yellow-300 dark:bg-yellow-900 dark:text-yellow-300 dark:border-yellow-700';
      case 'off':
        return 'bg-gray-100 text-gray-800 border-gray-300 dark:bg-gray-700 dark:text-gray-300 dark:border-gray-600';
      case 'breakdown':
        return 'bg-red-100 text-red-800 border-red-300 dark:bg-red-900 dark:text-red-300 dark:border-red-700';
      case 'interlock':
        return 'bg-orange-100 text-orange-800 border-orange-300 dark:bg-orange-900 dark:text-orange-300 dark:border-orange-700';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300 dark:bg-gray-700 dark:text-gray-300 dark:border-gray-600';
    }
  }

  getMachineStatusIcon(status: string): string {
    switch (status) {
      case 'running':
        return '●';
      case 'idle':
        return '◐';
      case 'off':
        return '○';
      case 'breakdown':
        return '⚠';
      case 'interlock':
        return '⊗';
      default:
        return '○';
    }
  }

  getOeeColor(oee: number): string {
    if (oee >= 85) return 'text-green-600 dark:text-green-400';
    if (oee >= 60) return 'text-yellow-600 dark:text-yellow-400';
    if (oee >= 40) return 'text-orange-600 dark:text-orange-400';
    return 'text-red-600 dark:text-red-400';
  }

  getOeeStrokeColor(oee: number): string {
    if (oee >= 85) return '#22c55e';
    if (oee >= 60) return '#f5d20b';
    if (oee >= 40) return '#E67E22';
    return '#ef4444';
  }

  getOeeBgColor(oee: number): string {
    if (oee >= 85) return 'bg-green-500';
    if (oee >= 60) return 'bg-yellow-500';
    if (oee >= 40) return 'bg-orange-500';
    return 'bg-red-500';
  }

  getOeeTextColor(oee: number): string {
    if (oee >= 85) return 'text-green-600 dark:text-green-400';
    if (oee >= 60) return 'text-yellow-600 dark:text-yellow-400';
    if (oee >= 40) return 'text-orange-600 dark:text-orange-400';
    return 'text-red-600 dark:text-red-400';
  }

  getCurrentTime(): string {
    return new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  }

  getZoneStatus(percentage : number): string {
    
    if (percentage >= 85) return 'Good';
    if (percentage >= 60) return 'Warning';
    if (percentage >= 40) return 'Poor';
    return 'Critical';
  }

  getZoneStatusClass(percentage: number): string {
    
    if (percentage >= 85) return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
    if (percentage >= 60) return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300';
    if (percentage >= 40) return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300';
    return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300';
  }

  getMetricTextColor(value: number): string {
    if (value >= 85) return 'text-green-600 dark:text-green-400';
    if (value >= 60) return 'text-yellow-600 dark:text-yellow-400';
    if (value >= 40) return 'text-orange-600 dark:text-orange-400';
    return 'text-red-600 dark:text-red-400';
  }

  getMetricBarColor(value: number): string {
    if (value >= 85) return 'bg-green-500';
    if (value >= 60) return 'bg-yellow-500';
    if (value >= 40) return 'bg-orange-500';
    return 'bg-red-500';
  }

  getTruncatedName(name: string, maxLength: number = 15): string {
    if (name.length <= maxLength) return name;
    return name.substring(0, maxLength) + '...';
  }

  get criticalMachines() {
    const allMachines: Array<{shortName: string, oee: number, fullName: string}> = [];
    
    this.plant.zones.forEach(zone => {
      zone.machines.forEach(machine => {
        if (machine.oee < 60) {
          // Shorten machine name (e.g., "Machine A1" -> "MA-1")
          const nameParts = machine.name.split(' ');
          let shortName = machine.name;
          if (nameParts.length >= 2) {
            const prefix = nameParts[0].substring(0, 1) + nameParts[1].substring(0, 1);
            const number = nameParts[1].replace(/[^0-9]/g, '');
            shortName = `${prefix}-${number}`;
          }
          allMachines.push({
            shortName,
            oee: machine.oee,
            fullName: machine.name
          });
        }
      });
    });
    
    return allMachines.sort((a, b) => a.oee - b.oee);
  }

  getHighlightStatusClass(status: string): string {
    switch (status) {
      case 'running':
        return 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800';
      case 'idle':
        return 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800';
      case 'off':
        return 'bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700';
      case 'breakdown':
        return 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800';
      case 'interlock':
        return 'bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-800';
      default:
        return 'bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700';
    }
  }

  getHighlightStatusIcon(status: string): string {
    return this.getMachineStatusIcon(status);
  }

  getHighlightStatusColor(status: string): string {
    switch (status) {
      case 'running':
        return 'text-green-600 dark:text-green-400';
      case 'idle':
        return 'text-yellow-600 dark:text-yellow-400';
      case 'off':
        return 'text-gray-600 dark:text-gray-400';
      case 'breakdown':
        return 'text-red-600 dark:text-red-400';
      case 'interlock':
        return 'text-orange-600 dark:text-orange-400';
      default:
        return 'text-gray-600 dark:text-gray-400';
    }
  }

  startHighlightCarousel() {
    if (!this.isBrowser || this.plantHighlights.length <= 1) return;
    this.stopHighlightCarousel();
    this.highlightInterval = setInterval(() => {
      this.currentHighlightIndex = (this.currentHighlightIndex + 1) % this.plantHighlights.length;
    }, 5000);
  }


  stopHighlightCarousel() {
    if (this.highlightInterval) {
      clearInterval(this.highlightInterval);
    }
  }

  goToHighlight(index: number) {
    this.currentHighlightIndex = index;
    this.stopHighlightCarousel();
    this.startHighlightCarousel();
  }

  nextHighlight() {
    this.currentHighlightIndex = (this.currentHighlightIndex + 1) % this.plantHighlights.length;
    this.stopHighlightCarousel();
    this.startHighlightCarousel();
  }

  previousHighlight() {
    this.currentHighlightIndex = (this.currentHighlightIndex - 1 + this.plantHighlights.length) % this.plantHighlights.length;
    this.stopHighlightCarousel();
    this.startHighlightCarousel();
  }



  getHighlightSentence(highlight: any): string {
    const zone = `<span class="font-semibold text-teal-600 dark:text-teal-400">${highlight.zoneName}</span>`;
    const machine = `<span class="font-semibold text-gray-800 dark:text-white">${highlight.machineName}</span>`;
    const oeeClass = this.getOeeTextColor(highlight.oee).replace('text-', '');
    const oee = `<span class="font-bold ${this.getOeeTextColor(highlight.oee)}">${highlight.oee}%</span>`;
    const highlightText = `<span class="font-semibold ${this.getHighlightStatusColor(highlight.status)}">${highlight.highlight}</span>`;
    
    if (highlight.oee < 60) {
      return `${machine} in ${zone} is showing ${highlightText} with OEE at ${oee}. ${highlight.reason ? 'Reason: ' + highlight.reason : ''}`;
    } else if (highlight.status === 'breakdown' || highlight.status === 'offline') {
      return `${machine} in ${zone} is currently ${highlightText}. ${highlight.reason}`;
    } else {
      return `${machine} in ${zone} is demonstrating ${highlightText} with OEE at ${oee}.`;
    }
  }

  ngOnDestroy() {
    this.stopHighlightCarousel();
  }
}
