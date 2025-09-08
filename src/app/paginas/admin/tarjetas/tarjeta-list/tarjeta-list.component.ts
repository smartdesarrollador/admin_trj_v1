import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { DigitalCardsService } from '../../../../core/services/digital-cards.service';
import { DigitalCard } from '../../../../core/models/digital-card.model';
import { NotificationService } from '../../../../shared/services/notification.service';
import { environment } from '../../../../../environments/environment';

@Component({
  selector: 'app-tarjeta-list',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './tarjeta-list.component.html',
  styleUrls: ['./tarjeta-list.component.css'],
})
export class TarjetaListComponent implements OnInit {
  private digitalCardsService = inject(DigitalCardsService);
  private notificationService = inject(NotificationService);

  digitalCards = signal<DigitalCard[]>([]);
  isLoading = signal<boolean>(true);
  error = signal<string | null>(null);
  searchTerm = signal<string>('');
  currentPage = signal<number>(1);
  perPage = signal<number>(10);
  totalCards = signal<number>(0);
  totalPages = signal<number>(0);

  // Hacer Math disponible en el template
  Math = Math;

  ngOnInit(): void {
    this.cargarTarjetas();
  }

  cargarTarjetas(): void {
    this.isLoading.set(true);
    this.error.set(null);

    const params = {
      page: this.currentPage(),
      per_page: this.perPage(),
      search: this.searchTerm() || undefined,
    };

    this.digitalCardsService.getDigitalCards(params).subscribe({
      next: (response) => {
        this.digitalCards.set(response.data);
        this.totalCards.set(response.meta.total);
        this.totalPages.set(response.meta.last_page);
        this.isLoading.set(false);
      },
      error: (err) => {
        console.error('Error al cargar tarjetas digitales', err);
        this.notificationService.handleApiError(err, 'cargar tarjetas');
        this.error.set(
          'No se pudieron cargar las tarjetas digitales. Por favor, inténtelo de nuevo.'
        );
        this.isLoading.set(false);
      },
    });
  }

  onSearch(): void {
    this.currentPage.set(1);
    this.cargarTarjetas();
  }

  cambiarPagina(page: number): void {
    this.currentPage.set(page);
    this.cargarTarjetas();
  }

  toggleStatusCard(card: DigitalCard, field: 'is_active' | 'is_public'): void {
    const newStatus = { [field]: !card[field] };
    const cardName = card.personal_info?.name || `Tarjeta #${card.id}`;
    const fieldName = field === 'is_active' ? 'estado activo' : 'visibilidad pública';
    const newValue = newStatus[field] ? 'activado' : 'desactivado';
    
    this.digitalCardsService.toggleStatus(card.id, newStatus).subscribe({
      next: (response) => {
        this.digitalCards.update((cards) =>
          cards.map((c) => (c.id === response.data.id ? response.data : c))
        );
        this.notificationService.success(
          'Estado actualizado',
          `El ${fieldName} de "${cardName}" ha sido ${newValue}.`
        );
      },
      error: (err) => {
        console.error(`Error al cambiar ${field} de la tarjeta`, err);
        this.notificationService.handleApiError(err, `cambiar ${fieldName}`);
      },
    });
  }

  eliminarTarjeta(id: number): void {
    const card = this.digitalCards().find(c => c.id === id);
    const cardName = card?.personal_info?.name || `Tarjeta #${id}`;

    // Usar el sistema de confirmación mejorado
    this.notificationService.confirmDelete(
      cardName,
      () => {
        // Acción de confirmar eliminación
        this.digitalCardsService.deleteDigitalCard(id).subscribe({
          next: () => {
            this.digitalCards.update((cards) =>
              cards.filter((card) => card.id !== id)
            );
            this.totalCards.update((total) => total - 1);
            this.notificationService.cardDeleted(cardName);
          },
          error: (err) => {
            console.error('Error al eliminar la tarjeta', err);
            this.notificationService.cardDeleteError(cardName);
          },
        });
      },
      () => {
        // Acción de cancelar (opcional)
        this.notificationService.info('Operación cancelada', 'La tarjeta no ha sido eliminada.');
      }
    );
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
      month: 'short',
      day: 'numeric',
    });
  }
}