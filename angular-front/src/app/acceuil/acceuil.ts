import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { Api, RecentFile } from '../services/api';

@Component({
  selector: 'app-acceuil',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './acceuil.html',
  styleUrls: ['./acceuil.css']
})
export class Acceuil implements OnInit {
  selectedFile: File | null = null;
  recentFiles: RecentFile[] = [];
  loading: boolean = false;

  constructor(private api: Api, private router: Router) {}

  ngOnInit(): void {
    // Charge immédiatement la liste des fichiers enregistrés dans PostgreSQL dès l'ouverture de l'application
    this.loadRecentFiles();
  }

  loadRecentFiles(): void {
    this.api.getRecentFiles().subscribe({
      next: (files) => {
        this.recentFiles = files;
      },
      error: (err) => console.error("Erreur chargement récents :", err)
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
}