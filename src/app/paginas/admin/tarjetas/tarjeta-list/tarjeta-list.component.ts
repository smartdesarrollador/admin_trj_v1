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
  
  // Filtros avanzados
  statusFilter = signal<'all' | 'active' | 'inactive'>('all');
  visibilityFilter = signal<'all' | 'public' | 'private'>('all');
  sortBy = signal<'name' | 'created_at' | 'updated_at'>('created_at');
  sortOrder = signal<'asc' | 'desc'>('desc');
  showAdvancedFilters = signal(false);

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
      status: this.statusFilter() !== 'all' ? this.statusFilter() : undefined,
      visibility: this.visibilityFilter() !== 'all' ? this.visibilityFilter() : undefined,
      sort_by: this.sortBy(),
      sort_order: this.sortOrder(),
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
    const newValue = !card[field];
    const newStatus = { [field]: newValue };
    const cardName = card.personal_info?.name || `Tarjeta #${card.id}`;
    const fieldName = field === 'is_active' ? 'estado activo' : 'visibilidad pública';
    const actionText = newValue ? 'activando' : 'desactivando';

    // Optimistic update - actualizar UI inmediatamente
    this.digitalCards.update((cards) =>
      cards.map((c) => (c.id === card.id ? { ...c, [field]: newValue } : c))
    );

    // Mostrar feedback visual inmediato
    const loadingId = this.notificationService.info(
      `${actionText.charAt(0).toUpperCase() + actionText.slice(1)}...`,
      `${actionText.charAt(0).toUpperCase() + actionText.slice(1)} ${fieldName} de "${cardName}"`
    );
    
    this.digitalCardsService.toggleStatus(card.id, newStatus).subscribe({
      next: (response) => {
        this.notificationService.remove(loadingId);
        
        // Actualizar con datos del servidor
        this.digitalCards.update((cards) =>
          cards.map((c) => (c.id === response.data.id ? response.data : c))
        );
        
        const finalValue = response.data[field] ? 'activado' : 'desactivado';
        this.notificationService.success(
          'Estado actualizado',
          `El ${fieldName} de "${cardName}" ha sido ${finalValue}.`
        );
      },
      error: (err) => {
        this.notificationService.remove(loadingId);
        
        // Revertir optimistic update en caso de error
        this.digitalCards.update((cards) =>
          cards.map((c) => (c.id === card.id ? { ...c, [field]: !newValue } : c))
        );
        
        console.error(`Error al cambiar ${field} de la tarjeta`, err);
        this.notificationService.handleApiError(err, `cambiar ${fieldName}`);
      },
    });
  }

  eliminarTarjeta(id: number): void {
    const card = this.digitalCards().find(c => c.id === id);
    const cardName = card?.personal_info?.name || `Tarjeta #${id}`;

    // Confirmación avanzada con más información
    this.notificationService.withActions(
      'warning',
      `¿Eliminar "${cardName}"?`,
      `Esta acción eliminará permanentemente la tarjeta digital y no se puede deshacer. También se eliminarán todas las imágenes asociadas.`,
      [
        {
          label: 'Cancelar',
          action: () => {
            this.notificationService.info('Operación cancelada', 'La tarjeta no ha sido eliminada.');
          },
          style: 'secondary'
        },
        {
          label: 'Eliminar definitivamente',
          action: () => {
            this.confirmarEliminacionFinal(id, cardName);
          },
          style: 'primary'
        }
      ]
    );
  }

  private confirmarEliminacionFinal(id: number, cardName: string): void {
    const loadingId = this.notificationService.showLoadingWithProgress(
      'Eliminando tarjeta',
      'Eliminando tarjeta digital y archivos asociados...'
    );

    this.digitalCardsService.deleteDigitalCard(id).subscribe({
      next: () => {
        this.notificationService.remove(loadingId);
        this.digitalCards.update((cards) =>
          cards.filter((card) => card.id !== id)
        );
        this.totalCards.update((total) => total - 1);
        this.notificationService.cardDeleted(cardName);
      },
      error: (err) => {
        this.notificationService.remove(loadingId);
        console.error('Error al eliminar la tarjeta', err);
        this.notificationService.handleApiError(err, 'eliminar la tarjeta');
      },
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
      month: 'short',
      day: 'numeric',
    });
  }

  // Métodos para filtros avanzados
  toggleAdvancedFilters(): void {
    this.showAdvancedFilters.set(!this.showAdvancedFilters());
  }

  applyFilters(): void {
    this.currentPage.set(1);
    this.cargarTarjetas();
  }

  clearFilters(): void {
    this.statusFilter.set('all');
    this.visibilityFilter.set('all');
    this.sortBy.set('created_at');
    this.sortOrder.set('desc');
    this.searchTerm.set('');
    this.currentPage.set(1);
    this.cargarTarjetas();
  }

  setSortBy(field: 'name' | 'created_at' | 'updated_at'): void {
    if (this.sortBy() === field) {
      // Si es el mismo campo, cambiar el orden
      this.sortOrder.set(this.sortOrder() === 'asc' ? 'desc' : 'asc');
    } else {
      // Si es un campo diferente, establecer orden descendente por defecto
      this.sortBy.set(field);
      this.sortOrder.set('desc');
    }
    this.currentPage.set(1);
    this.cargarTarjetas();
  }

  getSortIcon(field: 'name' | 'created_at' | 'updated_at'): string {
    if (this.sortBy() !== field) return 'sort';
    return this.sortOrder() === 'asc' ? 'sort-asc' : 'sort-desc';
  }

  duplicarTarjeta(id: number): void {
    const card = this.digitalCards().find(c => c.id === id);
    if (!card) return;

    const cardName = card.personal_info?.name || `Tarjeta #${id}`;
    
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
            this.confirmarDuplicacion(card, cardName);
          },
          style: 'primary'
        }
      ]
    );
  }

  private confirmarDuplicacion(card: DigitalCard, cardName: string): void {
    const loadingId = this.notificationService.showLoadingWithProgress(
      'Duplicando tarjeta',
      `Creando copia de "${cardName}"...`
    );

    // Preparar datos para duplicación
    const duplicateData = {
      personalInfo: {
        ...card.personal_info,
        name: `${card.personal_info?.name || 'Tarjeta'} (Copia)`,
      },
      contact: card.contact_info,
      about: card.about_info,
      is_active: false,
      is_public: false,
    };

    this.digitalCardsService.createDigitalCard(duplicateData as any).subscribe({
      next: (response) => {
        this.notificationService.remove(loadingId);
        this.notificationService.success(
          'Tarjeta duplicada',
          `Se ha creado una copia de "${cardName}" exitosamente.`
        );
        this.cargarTarjetas(); // Recargar lista
      },
      error: (error) => {
        this.notificationService.remove(loadingId);
        console.error('Error al duplicar tarjeta:', error);
        this.notificationService.handleApiError(error, 'duplicar la tarjeta');
      }
    });
  }
}