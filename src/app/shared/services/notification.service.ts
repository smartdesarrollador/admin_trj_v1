import { Injectable, signal } from '@angular/core';

export interface Notification {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message?: string;
  duration?: number;
  persistent?: boolean;
  actions?: NotificationAction[];
}

export interface NotificationAction {
  label: string;
  action: () => void;
  style?: 'primary' | 'secondary';
}

@Injectable({
  providedIn: 'root',
})
export class NotificationService {
  private notifications = signal<Notification[]>([]);
  
  // Getter para acceso reactivo desde componentes
  readonly notifications$ = this.notifications.asReadonly();

  /**
   * Muestra una notificación de éxito
   */
  success(title: string, message?: string, duration = 5000): string {
    return this.addNotification({
      type: 'success',
      title,
      message,
      duration,
    });
  }

  /**
   * Muestra una notificación de error
   */
  error(title: string, message?: string, duration = 8000, persistent = false): string {
    return this.addNotification({
      type: 'error',
      title,
      message,
      duration: persistent ? undefined : duration,
      persistent,
    });
  }

  /**
   * Muestra una notificación de advertencia
   */
  warning(title: string, message?: string, duration = 6000): string {
    return this.addNotification({
      type: 'warning',
      title,
      message,
      duration,
    });
  }

  /**
   * Muestra una notificación informativa
   */
  info(title: string, message?: string, duration = 4000): string {
    return this.addNotification({
      type: 'info',
      title,
      message,
      duration,
    });
  }

  /**
   * Muestra notificación con acciones personalizadas
   */
  withActions(
    type: Notification['type'],
    title: string,
    message: string,
    actions: NotificationAction[],
    duration?: number
  ): string {
    return this.addNotification({
      type,
      title,
      message,
      actions,
      duration,
      persistent: !duration,
    });
  }

  /**
   * Elimina una notificación específica
   */
  remove(id: string): void {
    this.notifications.update(notifications => 
      notifications.filter(n => n.id !== id)
    );
  }

  /**
   * Elimina todas las notificaciones
   */
  clear(): void {
    this.notifications.set([]);
  }

  /**
   * Métodos específicos para operaciones CRUD de tarjetas
   */
  cardCreated(cardName: string): string {
    return this.success(
      'Tarjeta creada exitosamente',
      `La tarjeta "${cardName}" se ha creado correctamente y está lista para usar.`
    );
  }

  cardUpdated(cardName: string): string {
    return this.success(
      'Tarjeta actualizada',
      `Los cambios en "${cardName}" se han guardado correctamente.`
    );
  }

  cardDeleted(cardName: string): string {
    return this.success(
      'Tarjeta eliminada',
      `La tarjeta "${cardName}" se ha eliminado permanentemente.`
    );
  }

  cardDeleteError(cardName: string): string {
    return this.error(
      'Error al eliminar tarjeta',
      `No se pudo eliminar "${cardName}". Inténtelo de nuevo o contacte al administrador.`,
      0,
      true
    );
  }

  imageUploaded(): string {
    return this.success(
      'Imagen actualizada',
      'La imagen de perfil se ha actualizado exitosamente.'
    );
  }

  imageUploadError(errorMessage?: string): string {
    return this.error(
      'Error al subir imagen',
      errorMessage || 'No se pudo subir la imagen. Verifique el formato y tamaño del archivo.',
      0,
      true
    );
  }

  validationError(): string {
    return this.warning(
      'Datos incompletos',
      'Por favor complete todos los campos requeridos antes de continuar.'
    );
  }

  networkError(): string {
    return this.error(
      'Error de conexión',
      'No se pudo conectar con el servidor. Verifique su conexión a internet.',
      0,
      true
    );
  }

  unauthorizedError(): string {
    return this.error(
      'Sesión expirada',
      'Su sesión ha expirado. Por favor inicie sesión nuevamente.',
      0,
      true
    );
  }

  /**
   * Agregar notificación al estado
   */
  private addNotification(notification: Omit<Notification, 'id'>): string {
    const id = this.generateId();
    const newNotification: Notification = {
      ...notification,
      id,
    };

    // Agregar al array de notificaciones
    this.notifications.update(notifications => [newNotification, ...notifications]);

    // Auto-remover si tiene duración definida
    if (newNotification.duration && !newNotification.persistent) {
      setTimeout(() => {
        this.remove(id);
      }, newNotification.duration);
    }

    return id;
  }

  /**
   * Genera ID único para la notificación
   */
  private generateId(): string {
    return `notification_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Métodos para gestionar diferentes tipos de errores de API
   */
  handleApiError(error: any, context: string = 'operación'): string {
    console.error(`Error en ${context}:`, error);

    if (error.status === 401) {
      return this.unauthorizedError();
    }

    if (error.status === 403) {
      return this.error(
        'Sin permisos',
        `No tiene permisos suficientes para realizar esta ${context}.`
      );
    }

    if (error.status === 404) {
      return this.error(
        'Recurso no encontrado',
        `El elemento solicitado no existe o ha sido eliminado.`
      );
    }

    if (error.status === 422) {
      return this.error(
        'Datos inválidos',
        `Los datos enviados no son válidos. Verifique la información e intente nuevamente.`
      );
    }

    if (error.status === 500) {
      return this.error(
        'Error del servidor',
        `Error interno del servidor. Por favor contacte al administrador.`
      );
    }

    if (!error.status || error.status === 0) {
      return this.networkError();
    }

    // Error genérico
    return this.error(
      `Error en ${context}`,
      error.error?.message || `Se produjo un error inesperado durante la ${context}.`
    );
  }

  /**
   * Métodos específicos para estados de loading
   */
  showLoadingWithProgress(title: string, message: string): string {
    return this.info(title, message, undefined);
  }

  /**
   * Confirmación con acciones
   */
  confirmDelete(itemName: string, onConfirm: () => void, onCancel?: () => void): string {
    return this.withActions(
      'warning',
      'Confirmar eliminación',
      `¿Está seguro que desea eliminar "${itemName}"? Esta acción no se puede deshacer.`,
      [
        {
          label: 'Cancelar',
          action: onCancel || (() => {}),
          style: 'secondary',
        },
        {
          label: 'Eliminar',
          action: onConfirm,
          style: 'primary',
        },
      ]
    );
  }
}