import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { NgxEchartsModule } from 'ngx-echarts';
import { Api, RecentFile } from '../services/api';

export interface ColumnKPI {
  fullName: string;
  subName: string;
  value: number;
  average: number;
  sum: number;
  trend: number;
  targetF1: number | null;
  unit: string;
  type: 'volume' | 'moyenne';
  status: 'success' | 'warning' | 'danger' | 'neutral';
}

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink, NgxEchartsModule],
  templateUrl: './dashboard.html',
  styleUrls: ['./dashboard.css']
})
export class Dashboard implements OnInit {

  recentFiles: RecentFile[] = [];
  selectedFileId: number | null = null;
  loading: boolean = false;
  filename: string = '';

  sheets: string[] = [];
  selectedSheet: string = '';

  allSheetsData: any = {};
  
  // Raw Data de la feuille active
  kpisRaw: any = {};
  chartsRaw: any[] = [];
  objectivesRaw: any[] = [];

  // Menu : Uniquement les Colonnes Principales (Catégories)
  columnCategories: string[] = [];
  selectedCategory: string | null = null;

  // Données prêtes pour l'affichage de la colonne sélectionnée
  selectedColumnKPIs: ColumnKPI[] = [];
  categoryChartOptions: any[] = [];
  objectiveChartOptions: any[] = [];

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
      next: (files) => { this.recentFiles = files || []; this.cdr.detectChanges(); },
      error: (err) => console.error("Erreur chargement fichiers récents:", err)
    });
  }

  loadDashboardFromFile(fileId: number): void {
    this.selectedFileId = fileId;
    this.loading = true;
    this.cdr.detectChanges();

    this.api.getFileDashboard(fileId).subscribe({
      next: (response: any) => {
        this.processApiResponse(response);
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error("Erreur chargement dashboard:", err);
        this.loading = false;
        this.cdr.detectChanges();
      }
    });
  }

  private processApiResponse(response: any): void {
    if (!response) return;
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

    this.kpisRaw = sheetData.kpis || {};
    this.chartsRaw = Array.isArray(sheetData.charts) ? sheetData.charts : [];
    this.objectivesRaw = Array.isArray(sheetData.objectives) ? sheetData.objectives : [];

    // Extraction des catégories uniques (Colonnes Principales uniquement)
    this.extractColumnCategories();

    // Sélection de la première colonne par défaut
    if (this.columnCategories.length > 0) {
      this.onSelectColumnCategory(this.columnCategories[0]);
    }

    this.cdr.detectChanges();
  }

  /**
   * Construit la liste unique des Colonnes Principales pour le Menu
   */
  private extractColumnCategories(): void {
    const categorySet = new Set<string>();

    // Extraire depuis les graphiques
    this.chartsRaw.forEach((chart: any) => {
      if (chart.category) categorySet.add(chart.category);
    });

    // Compléter depuis les KPIs
    Object.keys(this.kpisRaw).forEach(col => {
      const parts = col.split('_');
      const cat = parts.length > 1 ? parts.slice(0, parts.length - 1).join(' ') : 'Général';
      categorySet.add(cat);
    });

    this.columnCategories = Array.from(categorySet);
  }

  /**
   * Clic sur une Colonne dans le Menu
   */
  onSelectColumnCategory(category: string): void {
    this.selectedCategory = category;

    // 1. Filtrer et construire les KPIs
    this.buildKPIsForCategory(category);

    // 2. Filtrer les graphiques par unité (% vs unités physiques)
    this.buildChartsForCategory(category);

    // 3. Filtrer les graphiques d'objectifs F1 (appairage strict i - 1)
    this.buildObjectiveChartsForCategory(category);

    this.cdr.detectChanges();
  }

  /**
   * 1. KPIs de la colonne sélectionnée
   */
  private buildKPIsForCategory(category: string): void {
    this.selectedColumnKPIs = [];

    Object.keys(this.kpisRaw).forEach(col => {
      const parts = col.split('_');
      const cat = parts.length > 1 ? parts.slice(0, parts.length - 1).join(' ') : 'Général';

      if (cat === category) {
        const rawKPI = this.kpisRaw[col];
        const subName = parts.length > 1 ? parts[parts.length - 1] : col;

        let status: 'success' | 'warning' | 'danger' | 'neutral' = 'neutral';
        if (rawKPI.target_f1 !== null && rawKPI.target_f1 !== 0) {
          const rate = (rawKPI.value / rawKPI.target_f1) * 100;
          if (rate >= 95) status = 'success';
          else if (rate >= 80) status = 'warning';
          else status = 'danger';
        }

        this.selectedColumnKPIs.push({
          fullName: col,
          subName: subName,
          value: rawKPI.value,
          average: rawKPI.average,
          sum: rawKPI.sum,
          trend: rawKPI.trend,
          targetF1: rawKPI.target_f1,
          unit: rawKPI.unit,
          type: rawKPI.type,
          status: status
        });
      }
    });
  }

  /**
   * 2. Graphiques Temporels (Séparés par Unité)
   */
  private buildChartsForCategory(category: string): void {
    this.categoryChartOptions = [];

    const categoryCharts = this.chartsRaw.filter((c: any) => c.category === category);

    categoryCharts.forEach((chartData: any) => {
      const isPercent = chartData.isPercent;

      const option = {
        title: {
          text: chartData.title,
          left: 'center',
          textStyle: { color: '#ffffff', fontSize: 15 }
        },
        tooltip: {
          trigger: 'axis',
          backgroundColor: '#1e222b',
          borderColor: '#2e3846',
          textStyle: { color: '#ffffff' }
        },
        legend: { bottom: '0%', textStyle: { color: '#aaaaaa' } },
        grid: { left: '4%', right: '4%', bottom: '15%', containLabel: true },
        xAxis: {
          type: 'category',
          data: chartData.xAxis,
          axisLine: { lineStyle: { color: '#2e3846' } },
          axisLabel: { color: '#aaaaaa' }
        },
        yAxis: {
          type: 'value',
          name: chartData.unit,
          min: isPercent ? 0 : null,
          max: isPercent ? 100 : null,
          axisLabel: { color: '#aaaaaa' },
          splitLine: { lineStyle: { color: '#2e3846' } }
        },
        series: chartData.series.map((s: any) => ({
          name: s.name,
          type: 'line',
          smooth: true,
          data: s.data
        }))
      };

      this.categoryChartOptions.push(option);
    });
  }

  /**
   * 3. Graphiques d'Objectifs (F1 vs Sous-colonne Réelle qui le précède)
   */
  private buildObjectiveChartsForCategory(category: string): void {
    this.objectiveChartOptions = [];

    const categoryObjectives = this.objectivesRaw.filter((o: any) => o.category === category);

    categoryObjectives.forEach((objData: any) => {
      const isPercent = objData.isPercent;

      const option = {
        title: {
          text: `Objectif F1 : ${objData.real_sub_name}`,
          subtext: `Comparaison Réel vs Objectif (${objData.unit})`,
          left: 'center',
          textStyle: { color: '#ffffff', fontSize: 14 },
          subtextStyle: { color: '#aaaaaa', fontSize: 11 }
        },
        tooltip: {
          trigger: 'axis',
          backgroundColor: '#1e222b',
          borderColor: '#2e3846',
          textStyle: { color: '#ffffff' }
        },
        legend: { bottom: '0%', textStyle: { color: '#aaaaaa' } },
        grid: { left: '4%', right: '4%', bottom: '15%', containLabel: true },
        xAxis: {
          type: 'category',
          data: objData.xAxis,
          axisLine: { lineStyle: { color: '#2e3846' } },
          axisLabel: { color: '#aaaaaa' }
        },
        yAxis: {
          type: 'value',
          name: objData.unit,
          min: isPercent ? 0 : null,
          max: isPercent ? 100 : null,
          axisLabel: { color: '#aaaaaa' },
          splitLine: { lineStyle: { color: '#2e3846' } }
        },
        series: [
          {
            name: objData.series[0].name,
            type: 'line',
            smooth: true,
            data: objData.series[0].data,
            itemStyle: { color: '#00d2d3' },
            lineStyle: { width: 3 }
          },
          {
            name: objData.series[1].name,
            type: 'line',
            smooth: true,
            data: objData.series[1].data,
            itemStyle: { color: '#ff6b6b' },
            lineStyle: { type: 'dashed', width: 2 }
          }
        ]
      };

      this.objectiveChartOptions.push(option);
    });
  }
}