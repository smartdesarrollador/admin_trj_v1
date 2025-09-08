import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute, RouterModule } from '@angular/router';
import { DigitalCardsService } from '../../../../core/services/digital-cards.service';
import { DigitalCard } from '../../../../core/models/digital-card.model';
import { environment } from '../../../../../environments/environment';

@Component({
  selector: 'app-tarjeta-detail',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './tarjeta-detail.component.html',
  styleUrls: ['./tarjeta-detail.component.css'],
})
export class TarjetaDetailComponent implements OnInit {
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private digitalCardsService = inject(DigitalCardsService);

  tarjetaData: DigitalCard | null = null;
  isLoading = true;
  errorMessage: string | null = null;
  tarjetaId!: number;

  ngOnInit(): void {
    this.route.params.subscribe(params => {
      this.tarjetaId = +params['id'];
      this.cargarTarjeta();
    });
  }

  cargarTarjeta(): void {
    this.isLoading = true;
    this.digitalCardsService.getDigitalCard(this.tarjetaId).subscribe({
      next: (response) => {
        this.tarjetaData = response.data;
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error al cargar tarjeta:', error);
        this.errorMessage = 'Error al cargar la tarjeta. Redirigiendo...';
        setTimeout(() => {
          this.router.navigate(['/admin/tarjetas']);
        }, 2000);
      }
    });
  }

  obtenerUrlImagen(rutaImagen?: string): string {
    if (!rutaImagen) {
      return '/assets/images/default-avatar.png';
    }
    if (rutaImagen.startsWith('http')) {
      return rutaImagen;
    }
    return `${environment.urlDominioApi}/${rutaImagen}`;
  }

  formatearFecha(fecha: string): string {
    return new Date(fecha).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  volver(): void {
    this.router.navigate(['/admin/tarjetas']);
  }

  editar(): void {
    this.router.navigate(['/admin/tarjetas/editar', this.tarjetaId]);
  }
}