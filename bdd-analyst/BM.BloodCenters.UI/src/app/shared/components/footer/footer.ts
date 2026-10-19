import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { VersionService } from '@shared/services/version.service';

@Component({
  selector: 'app-footer',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './footer.html',
  styleUrl: './footer.scss'
})
export class FooterComponent implements OnInit {
  private versionService = inject(VersionService);

  currentYear = new Date().getFullYear();
  releaseVersion = 'Loading...';

  ngOnInit(): void {
    this.versionService.getVersionInfo().subscribe({
      next: (info) => {
        this.releaseVersion = info.releaseVersion || info.uiVersion || 'Unknown';
      },
      error: () => {
        this.releaseVersion = 'Unknown';
      }
    });
  }
}