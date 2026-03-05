import { Component, OnInit, OnDestroy, PLATFORM_ID, Inject } from '@angular/core';
import { CommonModule, DOCUMENT, isPlatformBrowser } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NgxEchartsModule } from 'ngx-echarts';
import { EChartsOption } from 'echarts';
import { inject } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';

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
  private document = inject(DOCUMENT);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private platformId = inject(PLATFORM_ID);
  private isBrowser: boolean;
  
  constructor() {
    this.isBrowser = isPlatformBrowser(this.platformId);
  }
  
  get isClient(): boolean {
    return this.isBrowser;
  }
  
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
        oee: 76.3,
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
        id: 3,
        name: 'Parts Zone',
        activeMachines: 4,
        totalMachines: 5,
        availability: 86.5,
        performance: 95.8,
        quality: 98.2,
        oee:29.6,
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
        id: 3,
        name: 'Parts Zone',
        activeMachines: 4,
        totalMachines: 5,
        availability: 86.5,
        performance: 95.8,
        quality: 98.2,
        oee:29.6,
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
    { status: 'Maintenance', start: '05:30', duration: 1, color: 'bg-red-500' },
    { status: 'Running', start: '06:30', duration: 5.5, color: 'bg-green-500' },
  ];

  // ECharts options
  plantOeeChartOption: EChartsOption = {};
  weeklyTrendChartOption: EChartsOption = {};
  hourlyPartCountChartOption: EChartsOption = {};
  
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
      status: 'maintenance', 
      oee: 0,
      reason: 'Scheduled preventive maintenance in progress',
      highlight: 'requires immediate attention'
    },
    { 
      zoneName: 'Packaging Zone', 
      machineName: 'Machine P3', 
      status: 'offline', 
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
      const zoneName = params['zoneName'];
      const machineName = params['machineName'];
      
      if (machineName && zoneName) {
        // Machine view
        this.currentView = 'machine';
        this.selectedZone = this.plant.zones.find(z => this.encodeRouteName(z.name) === zoneName) || null;
        if (this.selectedZone) {
          this.selectedMachine = this.selectedZone.machines.find(m => this.encodeRouteName(m.name) === machineName) || null;
        }
      } else if (zoneName) {
        // Zone view
        this.currentView = 'zone';
        this.selectedZone = this.plant.zones.find(z => this.encodeRouteName(z.name) === zoneName) || null;
        this.selectedMachine = null;
      } else {
        // Plant view
        this.currentView = 'plant';
        this.selectedZone = null;
        this.selectedMachine = null;
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
    this.plantOeeChartOption = this.getOeeChartOption(this.plant.oee, this.plant.availability, this.plant.performance, this.plant.quality);
    this.weeklyTrendChartOption = this.getWeeklyTrendChartOption();
    this.hourlyPartCountChartOption = this.getHourlyPartCountChartOption();
    
    // Initialize gauge charts for today's efficiency and change the color of lable in dark mode to light color for better visibility
    this.availabilityGaugeOption = this.getHalfGaugeOption('Availability', this.plant.availability, );
    this.performanceGaugeOption = this.getHalfGaugeOption('Performance', this.plant.performance, '#22c55e');
    this.qualityGaugeOption = this.getHalfGaugeOption('Quality', this.plant.quality, '#a78bfa');
    this.targetOeeGaugeOption = this.getHalfGaugeOption('Target OEE', this.plant.targetOee, '#f59e0b');
    this.oeeMainGaugeOption = this.getMainGaugeOption('OEE', this.plant.oee);
    
    // Initialize area chart and radar chart
    this.largeAreaChartOption = this.getLargeAreaChartOption();
    this.metricsRadarChartOption = this.getMetricsRadarChartOption();
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
    this.router.navigate(['/dashboard/plant', zoneName]);
    this.machineStatusFilter = 'all';
  }

  selectMachine(machine: Machine) {
    if (this.selectedZone) {
      const zoneName = this.encodeRouteName(this.selectedZone.name);
      const machineName = this.encodeRouteName(machine.name);
      this.router.navigate(['/dashboard/plant', zoneName, machineName]);
    }
  }

  backToPlant() {
    this.router.navigate(['/dashboard/plant']);
  }

  backToZone() {
    if (this.selectedZone) {
      const zoneName = this.encodeRouteName(this.selectedZone.name);
      this.router.navigate(['/dashboard/plant', zoneName]);
    }
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
      case 'offline':
        return 'bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700';
      case 'maintenance':
        return 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800';
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
      case 'offline':
        return 'text-gray-600 dark:text-gray-400';
      case 'maintenance':
        return 'text-red-600 dark:text-red-400';
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
    } else if (highlight.status === 'maintenance' || highlight.status === 'offline') {
      return `${machine} in ${zone} is currently ${highlightText}. ${highlight.reason}`;
    } else {
      return `${machine} in ${zone} is demonstrating ${highlightText} with OEE at ${oee}.`;
    }
  }

  ngOnDestroy() {
    this.stopHighlightCarousel();
  }
}
