import { Component, Input, Output, EventEmitter, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NotificationService } from '../../services/notification.service';

export interface ImageUploadConfig {
  maxSize?: number; // en MB
  acceptedTypes?: string[];
  showPreview?: boolean;
  showCrop?: boolean;
  aspectRatio?: number; // width/height
  placeholder?: string;
  dragText?: string;
  selectText?: string;
}

@Component({
  selector: 'app-image-upload',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './image-upload.component.html',
  styleUrls: ['./image-upload.component.css'],
})
export class ImageUploadComponent {
  private notificationService = inject(NotificationService);

  @Input() config: ImageUploadConfig = {};
  @Input() currentImageUrl: string | null = null;
  @Input() disabled = false;
  
  @Output() fileSelected = new EventEmitter<File>();
  @Output() imageDeleted = new EventEmitter<void>();
  
  isDragOver = false;
  previewUrl: string | null = null;
  selectedFile: File | null = null;

  // Configuración por defecto
  private defaultConfig: Required<ImageUploadConfig> = {
    maxSize: 2,
    acceptedTypes: ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'],
    showPreview: true,
    showCrop: false,
    aspectRatio: 1,
    placeholder: '/assets/images/default-avatar.png',
    dragText: 'Arrastra una imagen aquí',
    selectText: 'o haz clic para seleccionar',
  };

  get finalConfig(): Required<ImageUploadConfig> {
    return { ...this.defaultConfig, ...this.config };
  }

  onDragOver(event: DragEvent): void {
    if (this.disabled) return;
    
    event.preventDefault();
    event.stopPropagation();
    this.isDragOver = true;
  }

  onDragLeave(event: DragEvent): void {
    if (this.disabled) return;
    
    event.preventDefault();
    event.stopPropagation();
    this.isDragOver = false;
  }

  onDrop(event: DragEvent): void {
    if (this.disabled) return;
    
    event.preventDefault();
    event.stopPropagation();
    this.isDragOver = false;

    const files = event.dataTransfer?.files;
    if (files && files.length > 0) {
      this.handleFileSelection(files[0]);
    }
  }

  onFileInputChange(event: Event): void {
    if (this.disabled) return;
    
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.handleFileSelection(input.files[0]);
    }
  }

  private handleFileSelection(file: File): void {
    // Validar tipo de archivo
    if (!this.finalConfig.acceptedTypes.includes(file.type)) {
      this.notificationService.error(
        'Formato no válido',
        `Solo se permiten archivos: ${this.finalConfig.acceptedTypes.map(t => t.split('/')[1]).join(', ')}`
      );
      return;
    }

    // Validar tamaño
    const maxSizeBytes = this.finalConfig.maxSize * 1024 * 1024;
    if (file.size > maxSizeBytes) {
      this.notificationService.error(
        'Archivo muy grande',
        `El archivo no debe superar ${this.finalConfig.maxSize}MB`
      );
      return;
    }

    this.selectedFile = file;
    this.createPreview(file);
    this.fileSelected.emit(file);
  }

  private createPreview(file: File): void {
    if (!this.finalConfig.showPreview) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      this.previewUrl = e.target?.result as string;
    };
    reader.readAsDataURL(file);
  }

  removeImage(): void {
    if (this.disabled) return;
    
    this.selectedFile = null;
    this.previewUrl = null;
    this.currentImageUrl = null;
    this.imageDeleted.emit();
    
    // Limpiar input file
    const fileInput = document.getElementById('file-input') as HTMLInputElement;
    if (fileInput) {
      fileInput.value = '';
    }
  }

  getDisplayImage(): string | null {
    return this.previewUrl || this.currentImageUrl || this.finalConfig.placeholder;
  }

  hasImage(): boolean {
    return !!(this.previewUrl || this.currentImageUrl);
  }

  getAcceptedTypesString(): string {
    return this.finalConfig.acceptedTypes.join(',');
  }

  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  getFileInfo(): string {
    if (!this.selectedFile) return '';
    
    return `${this.selectedFile.name} (${this.formatFileSize(this.selectedFile.size)})`;
  }
}