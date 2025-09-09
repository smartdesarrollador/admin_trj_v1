import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  ReactiveFormsModule,
  FormBuilder,
  FormGroup,
  FormArray,
  Validators,
} from '@angular/forms';
import { Router } from '@angular/router';
import { DigitalCardsService } from '../../../../core/services/digital-cards.service';
import { CreateDigitalCardRequest } from '../../../../core/models/digital-card.model';
import { NotificationService } from '../../../../shared/services/notification.service';

@Component({
  selector: 'app-tarjeta-create',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './tarjeta-create.component.html',
  styleUrls: ['./tarjeta-create.component.css'],
})
export class TarjetaCreateComponent implements OnInit {
  private fb = inject(FormBuilder);
  private router = inject(Router);
  private digitalCardsService = inject(DigitalCardsService);
  private notificationService = inject(NotificationService);

  tarjetaForm!: FormGroup;
  isLoading = signal(false);
  errorMessage = signal<string | null>(null);
  successMessage = signal<string | null>(null);

  // Variables para manejo de imagen
  imagenSeleccionada: File | null = null;
  previewImagen: string | null = null;

  // Variables para manejo de secciones
  currentStep = 1;
  totalSteps = 4;

  ngOnInit(): void {
    this.inicializarFormulario();
  }

  inicializarFormulario(): void {
    this.tarjetaForm = this.fb.group({
      // Información Personal (Requerida)
      personalInfo: this.fb.group({
        name: ['', [Validators.required, Validators.maxLength(255)]],
        title: ['', [Validators.maxLength(255)]],
        location: ['', [Validators.maxLength(255)]],
        photo: [''], // Manejado por componente de subida
      }),

      // Información de Contacto (Opcional)
      contact: this.fb.group({
        email: ['', [Validators.email, Validators.maxLength(255)]],
        phone: ['', [Validators.maxLength(20)]],
        website: ['', [this.urlValidator]],
        linkedin: ['', [this.urlValidator]],
        twitter: ['', [this.urlValidator]],
        instagram: ['', [this.urlValidator]],
        github: ['', [this.urlValidator]],
        youtube: ['', [this.urlValidator]],
        tiktok: ['', [this.urlValidator]],
        whatsapp: ['', [Validators.maxLength(20)]],
        facebook: ['', [this.urlValidator]],
      }),

      // Acerca de (Opcional)
      about: this.fb.group({
        description: ['', [Validators.maxLength(1000)]],
        skills: this.fb.array([]),
        experience: [0, [Validators.min(0), Validators.max(50)]],
      }),

      // Configuración
      settings: this.fb.group({
        is_active: [true],
        is_public: [true],
      }),
    });
  }

  // Validador personalizado para URLs
  urlValidator(control: any) {
    if (!control.value) return null;
    
    const urlPattern = /^(https?:\/\/)?([\da-z\.-]+)\.([a-z\.]{2,6})([\/\w \.-]*)*\/?$/;
    if (!urlPattern.test(control.value)) {
      return { invalidUrl: true };
    }
    return null;
  }

  // Getters para FormArrays
  get skillsArray(): FormArray {
    return this.tarjetaForm.get('about.skills') as FormArray;
  }

  // Métodos para manejar skills
  addSkill(): void {
    this.skillsArray.push(this.fb.control('', [Validators.required, Validators.maxLength(50)]));
  }

  removeSkill(index: number): void {
    this.skillsArray.removeAt(index);
  }

  // Manejo de imagen
  onFileChange(event: Event): void {
    const input = event.target as HTMLInputElement;

    if (input.files && input.files.length) {
      const file = input.files[0];
      
      // Validar tipo de archivo
      if (!file.type.startsWith('image/')) {
        this.notificationService.error('Archivo inválido', 'Por favor seleccione un archivo de imagen válido.');
        return;
      }

      // Validar tamaño (max 2MB)
      if (file.size > 2 * 1024 * 1024) {
        this.notificationService.error('Archivo muy grande', 'La imagen no debe superar los 2MB.');
        return;
      }

      this.imagenSeleccionada = file;
      this.errorMessage.set(null);

      // Crear vista previa
      const reader = new FileReader();
      reader.onload = () => {
        this.previewImagen = reader.result as string;
      };
      reader.readAsDataURL(file);
    }
  }

  // Navegación entre pasos
  nextStep(): void {
    if (this.currentStep < this.totalSteps) {
      // Validar paso actual antes de continuar
      if (this.validateCurrentStep()) {
        this.currentStep++;
      }
    }
  }

  previousStep(): void {
    if (this.currentStep > 1) {
      this.currentStep--;
    }
  }

  goToStep(step: number): void {
    this.currentStep = step;
  }

  validateCurrentStep(): boolean {
    switch (this.currentStep) {
      case 1: // Información Personal
        const personalGroup = this.tarjetaForm.get('personalInfo');
        if (personalGroup) {
          personalGroup.markAllAsTouched();
          return personalGroup.valid;
        }
        break;
      case 2: // Contacto - Opcional, siempre válido
        return true;
      case 3: // About - Opcional, siempre válido
        return true;
      case 4: // Configuración - Siempre válido
        return true;
    }
    return false;
  }

  onSubmit(): void {
    if (this.tarjetaForm.invalid) {
      this.markAllGroupsAsTouched();
      this.notificationService.validationError();
      return;
    }

    this.isLoading.set(true);
    this.errorMessage.set(null);

    // Preparar datos para la API
    const formValue = this.tarjetaForm.value;
    const requestData: CreateDigitalCardRequest = {
      personalInfo: {
        name: formValue.personalInfo.name,
        title: formValue.personalInfo.title || undefined,
        location: formValue.personalInfo.location || undefined,
        // No enviamos photo aquí, se sube por separado
      },
      contact: this.hasContactData() ? formValue.contact : undefined,
      about: this.hasAboutData() ? {
        ...formValue.about,
        skills: this.skillsArray.value.filter((skill: string) => skill.trim() !== ''),
      } : undefined,
      is_active: formValue.settings.is_active,
      is_public: formValue.settings.is_public,
    };

    const cardName = formValue.personalInfo.name || 'Nueva tarjeta';

    this.digitalCardsService.createDigitalCard(requestData).subscribe({
      next: (response) => {
        this.isLoading.set(false);
        this.notificationService.cardCreated(cardName);

        // Si hay imagen, subirla
        if (this.imagenSeleccionada && response.data.id) {
          this.uploadImage(response.data.id);
        } else {
          // Redireccionar después de 2 segundos
          setTimeout(() => {
            this.router.navigate(['/admin/tarjetas']);
          }, 2000);
        }
      },
      error: (error) => {
        this.isLoading.set(false);
        this.notificationService.handleApiError(error, 'crear la tarjeta digital');
        console.error('Error al crear tarjeta:', error);
      },
    });
  }

  private uploadImage(cardId: number): void {
    if (!this.imagenSeleccionada) return;

    this.digitalCardsService.uploadImage(cardId, this.imagenSeleccionada).subscribe({
      next: () => {
        this.notificationService.imageUploaded();
        // Redireccionar después de subir la imagen
        setTimeout(() => {
          this.router.navigate(['/admin/tarjetas']);
        }, 2000);
      },
      error: (error) => {
        console.error('Error al subir imagen:', error);
        this.notificationService.imageUploadError('No se pudo subir la imagen, pero la tarjeta se creó exitosamente.');
        // Aún así redirigir, la tarjeta se creó exitosamente
        setTimeout(() => {
          this.router.navigate(['/admin/tarjetas']);
        }, 2000);
      },
    });
  }

  private hasContactData(): boolean {
    const contactValue = this.tarjetaForm.get('contact')?.value;
    return Object.values(contactValue).some(value => value && (value as string).trim() !== '');
  }

  private hasAboutData(): boolean {
    const aboutValue = this.tarjetaForm.get('about')?.value;
    return aboutValue.description?.trim() || 
           this.skillsArray.length > 0 || 
           aboutValue.experience > 0;
  }

  private markAllGroupsAsTouched(): void {
    this.tarjetaForm.get('personalInfo')?.markAllAsTouched();
    this.tarjetaForm.get('contact')?.markAllAsTouched();
    this.tarjetaForm.get('about')?.markAllAsTouched();
    this.tarjetaForm.get('settings')?.markAllAsTouched();
  }

  cancelar(): void {
    this.router.navigate(['/admin/tarjetas']);
  }

  // Funciones auxiliares para validaciones
  esInvalido(groupName: string, campo: string): boolean {
    const control = this.tarjetaForm.get(`${groupName}.${campo}`);
    return control ? control.invalid && (control.dirty || control.touched) : false;
  }

  obtenerErrores(groupName: string, campo: string): string[] {
    const control = this.tarjetaForm.get(`${groupName}.${campo}`);
    const errores: string[] = [];

    if (!control || !control.errors || !(control.dirty || control.touched)) {
      return errores;
    }

    if (control.errors['required']) {
      errores.push('Este campo es obligatorio.');
    }

    if (control.errors['maxlength']) {
      const maxLength = control.errors['maxlength'].requiredLength;
      errores.push(`Máximo ${maxLength} caracteres permitidos.`);
    }

    if (control.errors['email']) {
      errores.push('Ingrese un email válido.');
    }

    if (control.errors['invalidUrl']) {
      errores.push('Ingrese una URL válida.');
    }

    if (control.errors['min']) {
      errores.push(`El valor mínimo es ${control.errors['min'].min}.`);
    }

    if (control.errors['max']) {
      errores.push(`El valor máximo es ${control.errors['max'].max}.`);
    }

    return errores;
  }

  // Helpers para el template
  getStepTitle(step: number): string {
    switch (step) {
      case 1: return 'Información Personal';
      case 2: return 'Información de Contacto';
      case 3: return 'Acerca de';
      case 4: return 'Configuración';
      default: return '';
    }
  }

  isStepCompleted(step: number): boolean {
    switch (step) {
      case 1:
        const personalGroup = this.tarjetaForm.get('personalInfo');
        return personalGroup ? personalGroup.valid : false;
      case 2:
      case 3:
      case 4:
        return true; // Pasos opcionales
      default:
        return false;
    }
  }
}