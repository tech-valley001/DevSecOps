import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NgxEchartsModule } from 'ngx-echarts';

import { Api } from '../services/api';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    NgxEchartsModule
  ],
  templateUrl: './dashboard.html',
  styleUrls: ['./dashboard.css']
})
export class Dashboard {

  // ==========================================================================
  // Gestion du Fichier Excel
  // ==========================================================================
  selectedFile!: File;
  fileName: string = "";
  loading: boolean = false;

  // ==========================================================================
  // Navigation, Onglets & Catégories de Menu
  // ==========================================================================
  selectedView: string = "";    // Initialement vide pour ne rien afficher avant clic
  sheets: string[] = [];        // Liste des feuilles (ex: ['Grillage', 'Cobalt', 'Cil', 'Acide'])
  selectedSheet: string = "";   // Feuille active sélectionnée
  views: string[] = [];         // Catégories détectées pour le menu

  // ==========================================================================
  // Données de l'Application
  // ==========================================================================
  allSheetsData: any = {};      // Réponse brute complète du service API
  kpis: any = {};               // Cartes KPI de la feuille active
  charts: any[] = [];           // Graphiques bruts de la feuille active
  objectives: any[] = [];       // Suivi des objectifs F1
  filteredCharts: any[] = [];   // Graphiques structurés et séparés par unité pour affichage

  constructor(
    private api: Api
  ){}

  // ==========================================================================
  // Sélection & Analyse du Fichier
  // ==========================================================================
  onFileSelected(event: any){
    const file = event.target.files[0];
    if (file) {
      this.selectedFile = file;
      this.fileName = file.name;
    }
  }

  analyze(){
    if (!this.selectedFile) {
      alert("Veuillez choisir un fichier Excel.");
      return;
    }

    this.loading = true;

    this.api.analyzeCSV(this.selectedFile)
      .subscribe({
        next: (response) => {
          console.log("Données reçues du backend :", response);
          
          this.allSheetsData = response || {};
          this.sheets = Object.keys(this.allSheetsData);
          
          if (this.sheets.length > 0) {
            this.selectSheet(this.sheets[0]);
          }

          this.loading = false;
        },
        error: (error) => {
          console.error("Erreur lors de l'analyse :", error);
          this.loading = false;
        }
      });
  }

  // ==========================================================================
  // Sélection de la Feuille Active & Extraction des Catégories
  // ==========================================================================
  selectSheet(sheetName: string) {
    this.selectedSheet = sheetName;
    const sheetData = this.allSheetsData[sheetName] || {};

    this.kpis = sheetData.kpis || {};
    this.charts = sheetData.charts || [];
    this.objectives = sheetData.objectives || [];

    // Extraction dynamique des catégories uniques
    const dynamicGroups = this.charts
      .map((chart: any) => chart.group || chart.category || this.mapToExactExcelHeaders(chart.title))
      .filter((group: string, index: number, self: string[]) => group && self.indexOf(group) === index);

    this.views = dynamicGroups;

    // IMPORTANT : On vide selectedView pour forcer le clic sur le menu de gauche
    this.selectedView = ""; 
    this.filteredCharts = [];
  }

  // ==========================================================================
  // Mappage pour faire correspondre les titres aux en-têtes Excel
  // ==========================================================================
  private mapToExactExcelHeaders(title: string): string {
    if (!title) return 'Autres paramètres';
    const lower = title.toLowerCase().trim();

    // --- FEUILLE : ACIDE ---
    if (this.selectedSheet === 'Acide') {
      if (lower.includes('réceptionnée') || lower.includes('receptionnee')) {
        return 'Pyrrhotine digue CMG réceptionnée humide';
      }
      if (lower.includes('traitée') || lower.includes('traitee')) {
        return 'Pyrrhotine digue CMG traitée humide';
      }
      if (lower.includes('h2so4')) {
        return 'Production H2SO4';
      }
      if (lower.includes('fe2o3')) {
        return 'Production Fe2O3 sec';
      }
      if (lower.includes('rendement')) {
        return 'Rendement';
      }
      if (lower.includes('energie') || lower.includes('turbine') || lower.includes('one') || lower.includes('cedee') || lower.includes('force motrice') || lower.includes('kwh')) {
        return 'Energie soutirée';
      }
      if (lower.includes('stock') || lower.includes('retour') || lower.includes('ecart')) {
        return 'Stock usine H2SO4';
      }
    }

    // --- FEUILLE : GRILLAGE ---
    if (this.selectedSheet === 'Grillage') {
      if (lower.includes('concentré') || lower.includes('concentre')) return 'Concentré Co BA';
      if (lower.includes('grillé') || lower.includes('grille')) return 'Grillé Produit';
      if (lower.includes('production')) return 'Production';
      if (lower.includes('rendement') || lower.includes('bilan')) return 'Rendement Bilan';
      if (lower.includes('teneur') || lower.includes('traité') || lower.includes('traite')) return 'Teneur traité et produit';
    }

    // --- FEUILLE : COBALT ---
    if (this.selectedSheet === 'Cobalt') {
      if (lower.includes('amsp ctt')) return 'TV Grillé AMSP CTT';
      if (lower.includes('amsp ggm')) return 'TV Grillé AMSP GGM';
      if (lower.includes('st grillé - ctt')) return 'St Grillé - CTT';
      if (lower.includes('st arseniate - ctt')) return 'St Arseniate - CTT';
      if (lower.includes('st grillé - ggm')) return 'St Grillé - GGM';
      if (lower.includes('st arseniate - ggm')) return 'St Arseniate - GGM';
      if (lower.includes('finalisation')) return 'Finalisation';
      if (lower.includes('production')) return 'Production';
      if (lower.includes('rendement') || lower.includes('bilan')) return 'Rendement Bilan';
    }

    // --- FEUILLE : CIL ---
    if (this.selectedSheet === 'Cil') {
      if (lower.includes('st grillé')) return 'St Grillé';
      if (lower.includes('haldes')) return 'Haldes BA';
      if (lower.includes('akka')) return 'St-Akka grillage';
      if (lower.includes('cis')) return 'St- CIS';
      if (lower.includes('charbon')) return 'Prod Charbon g';
      if (lower.includes('produit lingot')) return 'Produit Lingot';
      if (lower.includes('expédition')) return 'Expédition Lingot';
      if (lower.includes('rendement') || lower.includes('bilan')) return 'Rendement Bilan';
    }

    return 'Paramètres Procédé';
  }

  // ==========================================================================
  // Détection d'Unité (Pourcentages & Ratios)
  // ==========================================================================
  private isPercentUnit(name: string): boolean {
    if (!name) return false;
    const lower = name.toLowerCase().trim();
    
    return (
      lower.includes('%') || 
      lower.includes('pct') ||
      lower.includes('rendement') || 
      lower.includes('rdt') || 
      lower.includes('humidité') || 
      lower.includes('conversion') || 
      lower.includes('absorption') || 
      lower.includes('purification')
    );
  }

  // ==========================================================================
  // Changement de Vue & Séparation des Courbes (Volumes vs Ratios)
  // ==========================================================================
  changeView(view: string){
    this.selectedView = view;

    if (view === "kpi" || view === "f1") {
      return;
    }

    // 1. Filtrer les graphiques bruts de la catégorie sélectionnée
    const rawCategoryCharts = this.charts.filter((chart: any) => {
      const chartGroup = chart.group || chart.category || this.mapToExactExcelHeaders(chart.title);
      return chartGroup === view;
    });

    // 2. Consolider l'ensemble des séries et l'axe X
    let allSeries: any[] = [];
    let xAxisData: any[] = [];

    rawCategoryCharts.forEach((chart: any) => {
      if (chart.xAxis && chart.xAxis.length > 0) {
        xAxisData = chart.xAxis;
      }
      if (chart.series && chart.series.length > 0) {
        allSeries.push(...chart.series);
      }
    });

    // 3. Séparer dynamiquement les séries
    const percentSeries = allSeries.filter(serie => this.isPercentUnit(serie.name));
    const valueSeries = allSeries.filter(serie => !this.isPercentUnit(serie.name));

    const finalSeparatedCharts: any[] = [];

    // Premier graphique : Tonnages, Energies et grandeurs physiques
    if (valueSeries.length > 0) {
      finalSeparatedCharts.push({
        title: `${view} - Flux & Volumes (Tonnages / Quantités)`,
        xAxis: xAxisData,
        series: valueSeries,
        yAxisUnit: 'Unités Physiques'
      });
    }

    // Deuxième graphique : Concentrés, rendements, pourcentages et humidités
    if (percentSeries.length > 0) {
      finalSeparatedCharts.push({
        title: `${view} - Ratios & Concentrations (%)`,
        xAxis: xAxisData,
        series: percentSeries,
        yAxisUnit: '%'
      });
    }

    this.filteredCharts = finalSeparatedCharts;
  }

  // ==========================================================================
  // Formater les clés et supprimer les underscores d'affichage
  // ==========================================================================
  formatKey(key: any): string {
    if (key === null || key === undefined) return '';
    return String(key).replace(/_/g, ' ').trim();
  }

  // ==========================================================================
  // Générateur d'Options ECharts (Multi-Courbe Adapté)
  // ==========================================================================
  getChartOption(chart: any){
    const isPercentChart = chart.yAxisUnit === '%';

    return {
      title: {
        text: chart.title,
        left: "center",
        textStyle: {
          color: '#eeeeee',
          fontSize: 15
        }
      },
      tooltip: {
        trigger: "axis",
        backgroundColor: '#1e222b',
        borderColor: '#2e3846',
        textStyle: {
          color: '#eeeeee'
        }
      },
      legend: {
        bottom: "0%",
        left: "center",
        textStyle: {
          color: '#95a5a6'
        }
      },
      grid: {
        left: "5%",
        right: "5%",
        bottom: "18%",
        containLabel: true
      },
      xAxis: {
        type: "category",
        data: chart.xAxis,
        axisLine: {
          lineStyle: { color: '#2e3846' }
        },
        axisLabel: {
          color: '#95a5a6'
        }
      },
      yAxis: {
        type: "value",
        name: chart.yAxisUnit,
        nameTextStyle: {
          color: '#95a5a6'
        },
        min: isPercentChart ? 0 : null,
        max: isPercentChart ? 100 : null,
        splitLine: {
          lineStyle: { color: '#2e3846' }
        },
        axisLabel: {
          color: '#95a5a6',
          formatter: isPercentChart ? '{value} %' : '{value}'
        }
      },
      series: chart.series.map((serie: any) => {
        const nameLower = serie.name.toLowerCase();

        // Type 1 : Consommations énergétiques -> Rendu Courbe d'Aire (Volume d'énergie)
        if (nameLower.includes('énergie') || nameLower.includes('energie') || nameLower.includes('kwh')) {
          return {
            name: this.formatKey(serie.name),
            type: "line",
            smooth: true,
            areaStyle: { opacity: 0.2 },
            data: serie.data
          };
        }

        // Type 2 : Quantités physiques & Tonnages bruts -> Rendu Barres
        if (!isPercentChart && (nameLower.includes('production') || nameLower.includes('receptionnee') || nameLower.includes('traite'))) {
          return {
            name: this.formatKey(serie.name),
            type: "bar",
            barMaxWidth: 30,
            borderRadius: [4, 4, 0, 0],
            data: serie.data
          };
        }

        // Type 3 : Rendements & Chimies -> Rendu Ligne fine et fluide
        return {
          name: this.formatKey(serie.name),
          type: "line",
          smooth: true,
          symbol: 'circle',
          symbolSize: 6,
          data: serie.data
        };
      })
    };
  }
}