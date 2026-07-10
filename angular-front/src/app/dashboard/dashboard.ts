import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { NgxEchartsModule } from 'ngx-echarts';
import { Api, RecentFile } from '../services/api';

export interface KPIComparison {
  key: string;
  label: string;
  actual: number | string | null;
  target: number | string | null;
  unit: string;
  difference: number | null;
  achievementRate: number | null;
  status: 'success' | 'warning' | 'danger' | 'neutral';
}

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    NgxEchartsModule
  ],
  templateUrl: './dashboard.html',
  styleUrls: ['./dashboard.css']
})
export class Dashboard implements OnInit {

  recentFiles: RecentFile[] = [];
  selectedFileId: number | null = null;
  loading: boolean = false;
  filename: string = '';

  selectedView: string = "kpi";    
  sheets: string[] = [];        
  selectedSheet: string = "";   
  views: string[] = [];         

  allSheetsData: any = {};      
  kpis: any = {};               
  charts: any[] = [];           
  objectives: any[] = [];       
  filteredCharts: any[] = [];   

  combinedKpiCards: KPIComparison[] = [];

  constructor(
    private api: Api,
    private route: ActivatedRoute,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.loadRecentFiles();

    this.route.paramMap.subscribe(params => {
      const idParam = params.get('id');
      if (idParam) {
        this.loadDashboardFromFile(Number(idParam));
      } else {
        this.loading = false;
        this.cdr.detectChanges();
      }
    });
  }

  loadRecentFiles(): void {
    this.api.getRecentFiles().subscribe({
      next: (files) => {
        this.recentFiles = files || [];
        this.cdr.detectChanges();
      },
      error: (err) => console.error("Erreur fichiers récents:", err)
    });
  }

  loadDashboardFromFile(fileId: number): void {
    this.selectedFileId = fileId;
    this.loading = true;
    this.cdr.detectChanges();

    this.api.getFileDashboard(fileId).subscribe({
      next: (response: any) => {
        try {
          this.processApiResponse(response);
        } catch (err) {
          console.error("Erreur traitement JSON:", err);
        } finally {
          this.loading = false;
          this.cdr.detectChanges();
        }
      },
      error: (err) => {
        console.error("Erreur HTTP Backend:", err);
        this.loading = false;
        this.cdr.detectChanges();
      }
    });
  }

  onSelectFileFromDropdown(fileId: number): void {
    if (fileId) {
      this.router.navigate(['/dashboard', fileId]);
    }
  }

  private processApiResponse(response: any): void {
    if (!response) {
      this.allSheetsData = {};
      this.sheets = [];
      return;
    }

    this.filename = response.filename || '';
    this.allSheetsData = response.sheets ? response.sheets : response;
    this.sheets = Object.keys(this.allSheetsData || {});

    if (this.sheets.length > 0) {
      this.selectSheet(this.sheets[0]);
    }
  }

  selectSheet(sheetName: string): void {
    this.selectedSheet = sheetName;
    const sheetData = this.allSheetsData[sheetName] || {};

    this.kpis = sheetData.kpis || {};
    this.charts = Array.isArray(sheetData.charts) ? sheetData.charts : [];
    this.objectives = Array.isArray(sheetData.objectives) ? sheetData.objectives : [];

    if (this.charts.length > 0) {
      const dynamicGroups = this.charts
        .map((chart: any) => {
          if (!chart) return 'Autres';
          return chart.group || chart.category || this.mapToExactExcelHeaders(chart.title || '');
        })
        .filter((group: string, index: number, self: string[]) => group && self.indexOf(group) === index);

      this.views = dynamicGroups;
    } else {
      this.views = [];
    }

    this.buildKpiComparisons();
    this.selectedView = 'kpi';
    this.cdr.detectChanges();
  }

  private buildKpiComparisons(): void {
    this.combinedKpiCards = [];
    if (!this.kpis) return;

    // 1. Dictionnaire d'objectifs nettoyés
    const targetMap = new Map<string, number>();

    if (Array.isArray(this.objectives)) {
      this.objectives.forEach((obj: any) => {
        if (!obj) return;

        if (obj.metric && obj.target_value !== undefined) {
          targetMap.set(this.normalizeKey(obj.metric), Number(obj.target_value));
        } else if (Array.isArray(obj.series)) {
          const targetSerie = obj.series.find((s: any) => 
            s.name && (s.name.includes('Objectif') || s.name.includes('F1'))
          );
          if (targetSerie && Array.isArray(targetSerie.data)) {
            const validVals = targetSerie.data.filter((v: any) => typeof v === 'number' && !isNaN(v));
            if (validVals.length > 0) {
              const avg = validVals.reduce((a: number, b: number) => a + b, 0) / validVals.length;
              const key = obj.title ? obj.title.split(':')[0].trim() : '';
              if (key) targetMap.set(this.normalizeKey(key), avg);
            }
          }
        }
      });
    }

    // 2. Association des KPIs et Cibles
    Object.keys(this.kpis).forEach(key => {
      let rawVal = this.kpis[key];

      if (rawVal && typeof rawVal === 'object') {
        rawVal = rawVal.mean !== undefined ? rawVal.mean : rawVal.sum;
      }

      const numericVal = typeof rawVal === 'number' ? rawVal : parseFloat(rawVal);
      const isNum = !isNaN(numericVal);
      const normKey = this.normalizeKey(key);

      let targetVal = targetMap.get(normKey) ?? null;

      if (targetVal === null) {
        for (const [tKey, tVal] of targetMap.entries()) {
          const cleanNormKey = normKey.replace('f1', '');
          const cleanTKey = tKey.replace('f1', '');
          if (cleanNormKey.includes(cleanTKey) || cleanTKey.includes(cleanNormKey)) {
            targetVal = tVal;
            break;
          }
        }
      }

      const unit = this.detectUnit(key);

      let diff: number | null = null;
      let rate: number | null = null;
      let status: 'success' | 'warning' | 'danger' | 'neutral' = 'neutral';

      if (isNum && targetVal !== null && targetVal !== 0) {
        diff = numericVal - targetVal;
        rate = (numericVal / targetVal) * 100;

        if (rate >= 95) status = 'success';
        else if (rate >= 80) status = 'warning';
        else status = 'danger';
      }

      this.combinedKpiCards.push({
        key,
        label: this.cleanLabel(key),
        actual: isNum ? Number(numericVal.toFixed(1)) : rawVal,
        target: targetVal !== null ? Number(targetVal.toFixed(1)) : null,
        unit,
        difference: diff !== null ? Number(diff.toFixed(1)) : null,
        achievementRate: rate !== null ? Math.min(Math.round(rate), 200) : null,
        status
      });
    });
  }

  private cleanLabel(key: string): string {
    if (!key) return '';
    const words = key.replace(/_/g, ' ').trim().split(/\s+/);
    const uniqueWords = words.filter((word, index) => words.indexOf(word) === index);
    return uniqueWords.join(' ');
  }

  private normalizeKey(key: string): string {
    return key.toLowerCase().replace(/[^a-z0-9]/g, '');
  }

  private detectUnit(key: string): string {
    const lower = key.toLowerCase();
    if (lower.includes('rendement') || lower.includes('pct') || lower.includes('%')) return '%';
    if (lower.includes('kwh') || lower.includes('energie')) return 'kWh';
    if (lower.includes('tonnage') || lower.includes('tonnes') || lower.includes(' t_') || lower.endsWith(' h') || lower.endsWith(' sec')) return 'T';
    if (lower.includes('g_') || lower.includes('gramme')) return 'g';
    return '';
  }

  private mapToExactExcelHeaders(title: string): string {
    if (!title) return 'Autres';
    return title.replace(/_/g, ' ');
  }

  private isPercentUnit(name: string): boolean {
    if (!name) return false;
    const lower = name.toLowerCase().trim();
    return lower.includes('%') || lower.includes('pct') || lower.includes('rendement');
  }

  changeView(view: string): void {
    this.selectedView = view;
    if (view === "kpi") {
      this.cdr.detectChanges();
      return;
    }

    const rawCategoryCharts = (this.charts || []).filter((chart: any) => {
      if (!chart) return false;
      const chartGroup = chart.group || chart.category || this.mapToExactExcelHeaders(chart.title || '');
      return chartGroup === view;
    });

    let allSeries: any[] = [];
    let xAxisData: any[] = [];

    rawCategoryCharts.forEach((chart: any) => {
      if (chart && Array.isArray(chart.xAxis) && chart.xAxis.length > 0) {
        xAxisData = chart.xAxis;
      }
      if (chart && Array.isArray(chart.series) && chart.series.length > 0) {
        allSeries.push(...chart.series);
      }
    });

    const percentSeries = allSeries.filter(serie => serie && this.isPercentUnit(serie.name));
    const valueSeries = allSeries.filter(serie => serie && !this.isPercentUnit(serie.name));

    const finalSeparatedCharts: any[] = [];

    if (valueSeries.length > 0) {
      finalSeparatedCharts.push({
        title: `${view} - Quantités & Volumes`,
        xAxis: xAxisData,
        series: valueSeries,
        yAxisUnit: 'Valeurs'
      });
    }

    if (percentSeries.length > 0) {
      finalSeparatedCharts.push({
        title: `${view} - Ratios & Rendements (%)`,
        xAxis: xAxisData,
        series: percentSeries,
        yAxisUnit: '%'
      });
    }

    this.filteredCharts = finalSeparatedCharts;
    this.cdr.detectChanges();
  }

  formatKey(key: any): string {
    return this.cleanLabel(String(key));
  }

  getChartOption(chart: any): any {
    const isPercentChart = chart.yAxisUnit === '%';

    return {
      title: {
        text: chart.title,
        left: "center",
        textStyle: { color: '#eeeeee', fontSize: 15 }
      },
      tooltip: {
        trigger: "axis",
        backgroundColor: '#1e222b',
        borderColor: '#2e3846',
        textStyle: { color: '#eeeeee' }
      },
      legend: {
        bottom: "0%",
        left: "center",
        textStyle: { color: '#95a5a6' }
      },
      grid: {
        left: "5%",
        right: "5%",
        bottom: "18%",
        containLabel: true
      },
      xAxis: {
        type: "category",
        data: chart.xAxis || [],
        axisLine: { lineStyle: { color: '#2e3846' } },
        axisLabel: { color: '#95a5a6' }
      },
      yAxis: {
        type: "value",
        name: chart.yAxisUnit,
        nameTextStyle: { color: '#95a5a6' },
        min: isPercentChart ? 0 : null,
        max: isPercentChart ? 100 : null,
        splitLine: { lineStyle: { color: '#2e3846' } },
        axisLabel: { color: '#95a5a6' }
      },
      series: (chart.series || []).map((serie: any) => ({
        name: this.formatKey(serie.name),
        type: "line",
        smooth: true,
        data: serie.data || []
      }))
    };
  }

  hasKpis(): boolean {
    return this.combinedKpiCards.length > 0;
  }

  getSuccessCount(): number {
    return this.combinedKpiCards.filter(c => c.status === 'success').length;
  }

  getWarningCount(): number {
    return this.combinedKpiCards.filter(c => c.status === 'warning').length;
  }

  getDangerCount(): number {
    return this.combinedKpiCards.filter(c => c.status === 'danger').length;
  }
}