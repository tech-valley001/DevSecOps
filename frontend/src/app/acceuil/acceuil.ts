import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Api, RecentFile } from '../services/api';

@Component({
  selector: 'app-acceuil',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './acceuil.html',
  styleUrls: ['./acceuil.css']
})
export class Acceuil implements OnInit {
  selectedFile: File | null = null;
  recentFiles: RecentFile[] = [];
  loading: boolean = false;

  // Gestion des sélections pour suppression
  selectedFileIds: number[] = [];
  selectAll: boolean = false;

  constructor(
    private api: Api, 
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.loadRecentFiles();
  }

  loadRecentFiles(): void {
    this.api.getRecentFiles().subscribe({
      next: (files) => {
        this.recentFiles = files || [];
        this.selectedFileIds = [];
        this.selectAll = false;
        this.cdr.detectChanges(); 
      },
      error: (err) => console.error("Erreur chargement des fichiers :", err)
    });
  }

  onFileSelected(event: any): void {
    const file = event.target.files[0];
    if (file) {
      this.selectedFile = file;
    }
  }

  analyze(): void {
    if (!this.selectedFile) return;

    this.loading = true;
    this.api.analyzeCSV(this.selectedFile).subscribe({
      next: (res) => {
        this.loading = false;
        this.loadRecentFiles(); 
        if (res.file_id) {
          this.router.navigate(['/dashboard', res.file_id]);
        }
      },
      error: (err) => {
        this.loading = false;
        console.error("Erreur lors de l'analyse :", err);
      }
    });
  }

  openDashboard(fileId: number): void {
    this.router.navigate(['/dashboard', fileId]);
  }

  // ==========================================
  // GESTION DES SÉLECTIONS ET SUPPRESSIONS
  // ==========================================

  toggleSelectAll(): void {
    if (this.selectAll) {
      this.selectedFileIds = this.recentFiles.map(f => f.id);
    } else {
      this.selectedFileIds = [];
    }
  }

  toggleFileSelection(fileId: number): void {
    const index = this.selectedFileIds.indexOf(fileId);
    if (index > -1) {
      this.selectedFileIds.splice(index, 1);
    } else {
      this.selectedFileIds.push(fileId);
    }
    this.selectAll = this.selectedFileIds.length === this.recentFiles.length;
  }

  isFileSelected(fileId: number): boolean {
    return this.selectedFileIds.includes(fileId);
  }

  deleteSingleFile(fileId: number, event: Event): void {
    event.stopPropagation(); 
    if (confirm("Voulez-vous vraiment supprimer ce fichier ?")) {
      this.api.deleteFile(fileId).subscribe({
        next: () => this.loadRecentFiles(),
        error: (err) => console.error("Erreur lors de la suppression :", err)
      });
    }
  }

  deleteSelectedFiles(): void {
    if (this.selectedFileIds.length === 0) return;

    if (confirm(`Voulez-vous supprimer les ${this.selectedFileIds.length} fichier(s) sélectionné(s) ?`)) {
      this.api.deleteMultipleFiles(this.selectedFileIds).subscribe({
        next: () => this.loadRecentFiles(),
        error: (err) => console.error("Erreur suppression sélection :", err)
      });
    }
  }

  deleteAllFiles(): void {
    if (this.recentFiles.length === 0) return;

    if (confirm("⚠️ VOULEZ-VOUS SUPPRIMER TOUS LES FICHIERS DE LA BASE DE DONNÉES ? Action irréversible.")) {
      this.api.deleteAllFiles().subscribe({
        next: () => this.loadRecentFiles(),
        error: (err) => console.error("Erreur suppression totale :", err)
      });
    }
  }
}