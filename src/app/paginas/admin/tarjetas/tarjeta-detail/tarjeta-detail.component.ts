import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute, RouterModule } from '@angular/router';
import { DigitalCardsService } from '../../../../core/services/digital-cards.service';
import { NotificationService } from '../../../../shared/services/notification.service';
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
  private notificationService = inject(NotificationService);

  tarjetaData = signal<DigitalCard | null>(null);
  isLoading = signal(true);
  errorMessage = signal<string | null>(null);
  tarjetaId!: number;

  ngOnInit(): void {
    this.route.params.subscribe(params => {
      this.tarjetaId = +params['id'];
      this.cargarTarjeta();
    });
  }

  cargarTarjeta(): void {
    this.isLoading.set(true);
    this.digitalCardsService.getDigitalCard(this.tarjetaId).subscribe({
      next: (response) => {
        this.tarjetaData.set(response.data);
        this.isLoading.set(false);
      },
      error: (error) => {
        console.error('Error al cargar tarjeta:', error);
        this.notificationService.error('Error al cargar datos', 'No se pudo cargar la información de la tarjeta. Redirigiendo...');
        setTimeout(() => {
          this.router.navigate(['/admin/tarjetas']);
        }, 3000);
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

  duplicar(): void {
    const tarjeta = this.tarjetaData();
    if (!tarjeta) return;

    const cardName = tarjeta.personal_info?.name || `Tarjeta #${tarjeta.id}`;
    
    this.notificationService.withActions(
      'info',
      `¿Duplicar "${cardName}"?`,
      'Se creará una copia exacta de esta tarjeta digital con todos sus datos. Podrás editarla después.',
      [
        {
          label: 'Cancelar',
          action: () => {},
          style: 'secondary'
        },
        {
          label: 'Duplicar tarjeta',
          action: () => {
            this.confirmarDuplicacion(tarjeta, cardName);
          },
          style: 'primary'
        }
      ]
    );
  }

  private confirmarDuplicacion(tarjeta: DigitalCard, cardName: string): void {
    const loadingId = this.notificationService.showLoadingWithProgress(
      'Duplicando tarjeta',
      `Creando copia de "${cardName}"...`
    );

    // Preparar datos para duplicación (sin ID y con nombre modificado)
    const duplicateData = {
      personalInfo: {
        ...tarjeta.personal_info,
        name: `${tarjeta.personal_info?.name || 'Tarjeta'} (Copia)`,
      },
      contact: tarjeta.contact_info,
      about: tarjeta.about_info,
      is_active: false, // Nueva tarjeta inactiva por defecto
      is_public: false, // Nueva tarjeta privada por defecto
    };

    this.digitalCardsService.createDigitalCard(duplicateData as any).subscribe({
      next: (response) => {
        this.notificationService.remove(loadingId);
        this.notificationService.success(
          'Tarjeta duplicada',
          `Se ha creado una copia de "${cardName}" exitosamente.`
        );
        
        // Redirigir a editar la nueva tarjeta
        setTimeout(() => {
          this.router.navigate(['/admin/tarjetas/editar', response.data.id]);
        }, 1500);
      },
      error: (error) => {
        this.notificationService.remove(loadingId);
        console.error('Error al duplicar tarjeta:', error);
        this.notificationService.handleApiError(error, 'duplicar la tarjeta');
      }
    });
  }

  eliminar(): void {
    const tarjeta = this.tarjetaData();
    if (!tarjeta) return;

    const cardName = tarjeta.personal_info?.name || `Tarjeta #${tarjeta.id}`;

    this.notificationService.withActions(
      'warning',
      `¿Eliminar "${cardName}"?`,
      `Esta acción eliminará permanentemente la tarjeta digital y no se puede deshacer. También se eliminarán todas las imágenes asociadas.`,
      [
        {
          label: 'Cancelar',
          action: () => {},
          style: 'secondary'
        },
        {
          label: 'Eliminar definitivamente',
          action: () => {
            this.confirmarEliminacion(tarjeta.id, cardName);
          },
          style: 'primary'
        }
      ]
    );
  }

  private confirmarEliminacion(id: number, cardName: string): void {
    const loadingId = this.notificationService.showLoadingWithProgress(
      'Eliminando tarjeta',
      'Eliminando tarjeta digital y archivos asociados...'
    );

    this.digitalCardsService.deleteDigitalCard(id).subscribe({
      next: () => {
        this.notificationService.remove(loadingId);
        this.notificationService.cardDeleted(cardName);
        
        // Redirigir a la lista
        setTimeout(() => {
          this.router.navigate(['/admin/tarjetas']);
        }, 1500);
      },
      error: (error) => {
        this.notificationService.remove(loadingId);
        console.error('Error al eliminar tarjeta:', error);
        this.notificationService.handleApiError(error, 'eliminar la tarjeta');
      }
    });
  }

  toggleStatus(field: 'is_active' | 'is_public'): void {
    const tarjeta = this.tarjetaData();
    if (!tarjeta) return;

    const newValue = !tarjeta[field];
    const fieldName = field === 'is_active' ? 'estado activo' : 'visibilidad pública';
    const actionText = newValue ? 'activando' : 'desactivando';
    const cardName = tarjeta.personal_info?.name || `Tarjeta #${tarjeta.id}`;

    const loadingId = this.notificationService.info(
      `${actionText.charAt(0).toUpperCase() + actionText.slice(1)}...`,
      `${actionText.charAt(0).toUpperCase() + actionText.slice(1)} ${fieldName} de "${cardName}"`
    );

    this.digitalCardsService.toggleStatus(tarjeta.id, { [field]: newValue }).subscribe({
      next: (response) => {
        this.notificationService.remove(loadingId);
        this.tarjetaData.set(response.data);
        
        const finalValue = response.data[field] ? 'activado' : 'desactivado';
        this.notificationService.success(
          'Estado actualizado',
          `El ${fieldName} de "${cardName}" ha sido ${finalValue}.`
        );
      },
      error: (error) => {
        this.notificationService.remove(loadingId);
        console.error(`Error al cambiar ${field} de la tarjeta`, error);
        this.notificationService.handleApiError(error, `cambiar ${fieldName}`);
      }
    });
  }

  obtenerUrlPublica(): string {
    const tarjeta = this.tarjetaData();
    if (!tarjeta) return '';
    
    // URL pública de la tarjeta (ajustar según tu configuración)
    return `${environment.urlDominioPublico}/card/${tarjeta.id}`;
  }

  copiarUrlPublica(): void {
    const url = this.obtenerUrlPublica();
    navigator.clipboard.writeText(url).then(() => {
      this.notificationService.success(
        'URL copiada',
        'El enlace público se ha copiado al portapapeles.'
      );
    }).catch(() => {
      this.notificationService.error(
        'Error al copiar',
        'No se pudo copiar el enlace al portapapeles.'
      );
    });
  }

  abrirVistaPrevia(): void {
    const url = this.obtenerUrlPublica();
    window.open(url, '_blank');
  }
}