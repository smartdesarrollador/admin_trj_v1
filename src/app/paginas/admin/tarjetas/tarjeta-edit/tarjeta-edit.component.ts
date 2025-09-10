import { Component, OnInit, inject, signal, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  ReactiveFormsModule,
  FormBuilder,
  FormGroup,
  FormArray,
  Validators,
} from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { DigitalCardsService } from '../../../../core/services/digital-cards.service';
import { NotificationService } from '../../../../shared/services/notification.service';
import { environment } from '../../../../../environments/environment';
import { 
  DigitalCard, 
  UpdateDigitalCardRequest 
} from '../../../../core/models/digital-card.model';

@Component({
  selector: 'app-tarjeta-edit',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './tarjeta-edit.component.html',
  styleUrls: ['./tarjeta-edit.component.css'],
})
export class TarjetaEditComponent implements OnInit {
  private fb = inject(FormBuilder);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private digitalCardsService = inject(DigitalCardsService);
  private notificationService = inject(NotificationService);
  private cdr = inject(ChangeDetectorRef);

  tarjetaForm!: FormGroup;
  isLoading = signal(false);
  isLoadingData = signal(true);
  errorMessage = signal<string | null>(null);
  successMessage = signal<string | null>(null);
  tarjetaId!: number;
  tarjetaData = signal<DigitalCard | null>(null);

  // Variables para manejo de imagen
  imagenSeleccionada: File | null = null;
  previewImagen: string | null = null;
  imagenActual: string | null = null;

  // Flag para evitar que llenarFormulario sobreescriba cambios del usuario
  formularioInicializado = false;

  // Variables para manejo de secciones
  currentStep = 1;
  totalSteps = 4;

  ngOnInit(): void {
    this.route.params.subscribe(params => {
      this.tarjetaId = +params['id'];
      this.inicializarFormulario();
      this.cargarTarjeta();
    });
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


  cargarTarjeta(): void {
    this.isLoadingData.set(true);
    this.digitalCardsService.getDigitalCard(this.tarjetaId).subscribe({
      next: (response) => {
        this.tarjetaData.set(response.data);
        this.isLoadingData.set(false);
        
        setTimeout(() => {
          this.llenarFormulario();
        }, 200);
      },
      error: (error) => {
        this.notificationService.error('Error al cargar datos', 'No se pudo cargar la información de la tarjeta. Redirigiendo...');
        setTimeout(() => {
          this.router.navigate(['/admin/tarjetas']);
        }, 3000);
      }
    });
  }

  llenarFormulario(): void {
    const tarjeta = this.tarjetaData();
    
    if (!tarjeta) {
      return;
    }

    if (this.formularioInicializado) {
      return;
    }

    try {
      // Información personal
      this.tarjetaForm.get('personalInfo.name')?.setValue(tarjeta.personal_info?.name || '');
      this.tarjetaForm.get('personalInfo.title')?.setValue(tarjeta.personal_info?.title || '');
      this.tarjetaForm.get('personalInfo.location')?.setValue(tarjeta.personal_info?.location || '');
      
      // Información de contacto
      this.tarjetaForm.get('contact.email')?.setValue(tarjeta.contact_info?.email || '');
      this.tarjetaForm.get('contact.phone')?.setValue(tarjeta.contact_info?.phone || '');
      this.tarjetaForm.get('contact.website')?.setValue(tarjeta.contact_info?.website || '');
      this.tarjetaForm.get('contact.linkedin')?.setValue(tarjeta.contact_info?.linkedin || '');
      this.tarjetaForm.get('contact.twitter')?.setValue(tarjeta.contact_info?.twitter || '');
      this.tarjetaForm.get('contact.instagram')?.setValue(tarjeta.contact_info?.instagram || '');
      this.tarjetaForm.get('contact.github')?.setValue(tarjeta.contact_info?.github || '');
      this.tarjetaForm.get('contact.youtube')?.setValue(tarjeta.contact_info?.youtube || '');
      this.tarjetaForm.get('contact.tiktok')?.setValue(tarjeta.contact_info?.tiktok || '');
      this.tarjetaForm.get('contact.whatsapp')?.setValue(tarjeta.contact_info?.whatsapp || '');
      this.tarjetaForm.get('contact.facebook')?.setValue(tarjeta.contact_info?.facebook || '');
      
      // Información "about"
      this.tarjetaForm.get('about.description')?.setValue(tarjeta.about_info?.description || '');
      this.tarjetaForm.get('about.experience')?.setValue(tarjeta.about_info?.experience || 0);
      
      // Configuración
      this.tarjetaForm.get('settings.is_active')?.setValue(tarjeta.is_active);
      this.tarjetaForm.get('settings.is_public')?.setValue(tarjeta.is_public);
      
      this.formularioInicializado = true;
      this.cdr.detectChanges();
      this.cdr.markForCheck();
      
      setTimeout(() => {
        this.cdr.detectChanges();
      }, 50);
      
    } catch (error) {
      // Error handling silently
    }

    // Llenar skills
    if (tarjeta.about_info?.skills) {
      const skillsArray = this.skillsArray;
      skillsArray.clear();
      tarjeta.about_info.skills.forEach(skill => {
        skillsArray.push(this.fb.control(skill, [Validators.required, Validators.maxLength(50)]));
      });
    }

    // Establecer imagen actual
    if (tarjeta.personal_info?.photo) {
      this.imagenActual = tarjeta.personal_info.photo;
      this.previewImagen = this.obtenerUrlImagen(tarjeta.personal_info.photo);
    }
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

  validateCurrentStep(): boolean {
    switch (this.currentStep) {
      case 1: // Información Personal
        const personalGroup = this.tarjetaForm.get('personalInfo');
        if (personalGroup) {
          personalGroup.markAllAsTouched();
          return personalGroup.valid;
        }
        break;
      case 2:
      case 3:
      case 4:
        return true; // Pasos opcionales
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

    const formValue = this.tarjetaForm.value;

    // Preparar personalInfo sin incluir photo (se maneja por separado)
    const personalInfo = { ...formValue.personalInfo };
    delete personalInfo.photo; // Excluir photo para no sobrescribir imagen actual

    const requestData: UpdateDigitalCardRequest = {
      personalInfo: personalInfo,
      contact: this.hasContactData() ? formValue.contact : undefined,
      about: this.hasAboutData() ? {
        ...formValue.about,
        skills: this.skillsArray.value.filter((skill: string) => skill.trim() !== ''),
      } : undefined,
      is_active: formValue.settings.is_active,
      is_public: formValue.settings.is_public,
    };

    const cardName = formValue.personalInfo.name || 'Tarjeta';

    this.digitalCardsService.updateDigitalCard(this.tarjetaId, requestData).subscribe({
      next: (response) => {
        if (this.imagenSeleccionada) {
          this.uploadImage(cardName);
        } else {
          this.isLoading.set(false);
          this.notificationService.cardUpdated(cardName);
          setTimeout(() => {
            this.router.navigate(['/admin/tarjetas']);
          }, 2000);
        }
      },
      error: (error) => {
        this.isLoading.set(false);
        this.notificationService.handleApiError(error, 'actualizar la tarjeta');
      },
    });
  }

  private uploadImage(cardName: string): void {
    if (!this.imagenSeleccionada) return;

    this.digitalCardsService.uploadImage(this.tarjetaId, this.imagenSeleccionada).subscribe({
      next: () => {
        this.isLoading.set(false);
        this.notificationService.cardUpdated(cardName);
        this.notificationService.imageUploaded();
        setTimeout(() => {
          this.router.navigate(['/admin/tarjetas']);
        }, 2000);
      },
      error: (error) => {
        this.isLoading.set(false);
        this.notificationService.cardUpdated(cardName);
        this.notificationService.imageUploadError('Tarjeta actualizada correctamente, pero hubo un problema al subir la imagen.');
        setTimeout(() => {
          this.router.navigate(['/admin/tarjetas']);
        }, 3000);
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

  obtenerUrlImagen(rutaImagen?: string): string {
    if (!rutaImagen) {
      return '/assets/images/default-avatar.png';
    }
    if (rutaImagen.startsWith('http')) {
      return rutaImagen;
    }
    return `${environment.urlDominioApi}/${rutaImagen}`;
  }

  // Función para eliminar imagen existente
  eliminarImagenActual(): void {
    if (!this.imagenActual) return;

    this.notificationService.confirmDelete(
      'la imagen actual',
      () => {
        this.digitalCardsService.deleteImage(this.tarjetaId).subscribe({
          next: () => {
            this.imagenActual = null;
            this.previewImagen = null;
            this.imagenSeleccionada = null;
            this.notificationService.success('Imagen eliminada', 'La imagen se eliminó correctamente.');
          },
          error: (error) => {
            this.notificationService.error('Error al eliminar', 'No se pudo eliminar la imagen.');
          }
        });
      }
    );
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