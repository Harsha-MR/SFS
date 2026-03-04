import { Component, OnInit } from '@angular/core';
import { CommonModule, DOCUMENT } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NgxEchartsModule } from 'ngx-echarts';
import { EChartsOption } from 'echarts';
import { inject } from '@angular/core';

interface Machine {
  id: number;
  name: string;
  status: 'running' | 'idle' | 'offline' | 'maintenance';
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
export class PlantDashboard implements OnInit {
  private document = inject(DOCUMENT);
  currentView: 'plant' | 'zone' | 'machine' = 'plant';
  selectedZone: Zone | null = null;
  selectedMachine: Machine | null = null;
  
  trendView: 'daily' | 'weekly' | 'monthly' = 'weekly';
  showTrends: boolean = true;
  machineStatusFilter: string = 'all';
  activeTrendMetric: TrendMetric = 'oee';
  trendTooltipVisible = false;
  trendTooltipIndex = 0;
  trendTooltipLeftPercent = 50;

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
    availability: 85.5,
    performance: 92.3,
    quality: 96.8,
    oee: 76.4,
    zones: [
      {
        id: 1,
        name: 'Assembly Zone',
        activeMachines: 8,
        totalMachines: 10,
        availability: 88.2,
        performance: 91.5,
        quality: 97.2,
        oee: 78.5,
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
            status: 'maintenance',
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
        oee: 71.3,
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
            status: 'offline',
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
        availability: 86.5,
        performance: 95.8,
        quality: 98.2,
        oee: 81.3,
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
    { time: '24/02', availability: 80, performance: 46, quality: 20, oee: 55 },
    { time: '25/02', availability: 60, performance: 33, quality: 100, oee: 72 },
    { time: '26/02', availability: 72, performance: 46, quality: 100, oee: 63 },
    { time: '27/02', availability: 76, performance: 50, quality: 100, oee: 74 },
    { time: '28/02', availability: 70, performance: 37, quality: 90, oee: 69 },
    { time: '01/03', availability: 58, performance: 80, quality: 80, oee: 65 },
    { time: '02/03', availability: 52, performance: 46, quality: 80, oee: 61 },
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
    { status: 'Maintenance', start: '05:30', duration: 1, color: 'bg-red-500' },
    { status: 'Running', start: '06:30', duration: 5.5, color: 'bg-green-500' },
  ];

  // ECharts options
  plantOeeChartOption: EChartsOption = {};
  weeklyTrendChartOption: EChartsOption = {};
  hourlyPartCountChartOption: EChartsOption = {};

  ngOnInit() {
    this.initCharts();
  }

  private updateChartTheme(isDark: boolean) {
    this.initCharts();
  }

  private isDarkMode(): boolean {
    return this.document.documentElement.classList.contains('dark');
  }

  private getTextColor(): string {
    return this.isDarkMode() ? '#e5e7eb' : '#374151';
  }

  private getAxisLineColor(): string {
    return this.isDarkMode() ? '#4b5563' : '#d1d5db';
  }

  private initCharts() {
    this.plantOeeChartOption = this.getOeeChartOption(this.plant.oee, this.plant.availability, this.plant.performance, this.plant.quality);
    this.weeklyTrendChartOption = this.getWeeklyTrendChartOption();
    this.hourlyPartCountChartOption = this.getHourlyPartCountChartOption();
  }

  getOeeChartOption(oee: number, availability: number, performance: number, quality: number): EChartsOption {
    const isDark = this.isDarkMode();
    const textColor = this.getTextColor();
    
    return {
      tooltip: {
        show: false
      },
      series: [
        {
          name: 'OEE',
          type: 'pie',
          radius: ['70%', '90%'],
          avoidLabelOverlap: false,
          silent: true,
          label: {
            show: true,
            position: 'center',
            fontSize: 20,
            fontWeight: 'bold',
            color: this.getOeeStrokeColor(oee),
            formatter: () => `${oee}%`
          },
          labelLine: {
            show: false
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
        boundaryGap: true,
        data: this.weeklyTrends.map(t => t.time),
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
          name: 'Availability',
          type: 'bar',
          data: this.weeklyTrends.map(t => t.availability),
          itemStyle: {
            color: '#93c5fd'
          }
        },
        {
          name: 'Performance',
          type: 'bar',
          data: this.weeklyTrends.map(t => t.performance),
          itemStyle: {
            color: '#38bdf8'
          }
        },
        {
          name: 'Quality',
          type: 'bar',
          data: this.weeklyTrends.map(t => t.quality),
          itemStyle: {
            color: '#c084fc'
          }
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
            color: '#14b8a6'
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

  selectZone(zone: Zone) {
    this.selectedZone = zone;
    this.currentView = 'zone';
    this.machineStatusFilter = 'all';
  }

  selectMachine(machine: Machine) {
    this.selectedMachine = machine;
    this.currentView = 'machine';
  }

  backToPlant() {
    this.currentView = 'plant';
    this.selectedZone = null;
    this.selectedMachine = null;
  }

  backToZone() {
    this.currentView = 'zone';
    this.selectedMachine = null;
  }

  getMachineStatusClass(status: string): string {
    switch (status) {
      case 'running':
        return 'bg-green-100 text-green-800 border-green-300 dark:bg-green-900 dark:text-green-300 dark:border-green-700';
      case 'idle':
        return 'bg-yellow-100 text-yellow-800 border-yellow-300 dark:bg-yellow-900 dark:text-yellow-300 dark:border-yellow-700';
      case 'offline':
        return 'bg-gray-100 text-gray-800 border-gray-300 dark:bg-gray-700 dark:text-gray-300 dark:border-gray-600';
      case 'maintenance':
        return 'bg-red-100 text-red-800 border-red-300 dark:bg-red-900 dark:text-red-300 dark:border-red-700';
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
      case 'offline':
        return '○';
      case 'maintenance':
        return '⚙';
      default:
        return '○';
    }
  }

  getOeeColor(oee: number): string {
    if (oee >= 85) return 'text-green-600 dark:text-green-400';
    if (oee >= 70) return 'text-yellow-600 dark:text-yellow-400';
    return 'text-red-600 dark:text-red-400';
  }

  getOeeStrokeColor(oee: number): string {
    if (oee >= 85) return '#22c55e';
    if (oee >= 70) return '#f59e0b';
    return '#ef4444';
  }

  getOeeBgColor(oee: number): string {
    if (oee >= 85) return 'bg-green-500';
    if (oee >= 70) return 'bg-yellow-500';
    return 'bg-red-500';
  }

  getOeeTextColor(oee: number): string {
    if (oee >= 85) return 'text-green-600 dark:text-green-400';
    if (oee >= 70) return 'text-yellow-600 dark:text-yellow-400';
    return 'text-red-600 dark:text-red-400';
  }

  getCurrentTime(): string {
    return new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  }

  getZoneStatus(active: number, total: number): string {
    const percentage = (active / total) * 100;
    if (percentage === 100) return 'Optimal';
    if (percentage >= 75) return 'Good';
    if (percentage >= 50) return 'Warning';
    return 'Critical';
  }

  getZoneStatusClass(active: number, total: number): string {
    const percentage = (active / total) * 100;
    if (percentage === 100) return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
    if (percentage >= 75) return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300';
    if (percentage >= 50) return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300';
    return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300';
  }
}
