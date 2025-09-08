import { Component, OnInit, inject } from '@angular/core';
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

  tarjetaForm!: FormGroup;
  isLoading = false;
  isLoadingData = true;
  errorMessage: string | null = null;
  successMessage: string | null = null;
  tarjetaId!: number;
  tarjetaData: DigitalCard | null = null;

  // Variables para manejo de imagen
  imagenSeleccionada: File | null = null;
  previewImagen: string | null = null;
  imagenActual: string | null = null;

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
    this.isLoadingData = true;
    this.digitalCardsService.getDigitalCard(this.tarjetaId).subscribe({
      next: (response) => {
        this.tarjetaData = response.data;
        this.llenarFormulario();
        this.isLoadingData = false;
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

  llenarFormulario(): void {
    if (!this.tarjetaData) return;

    // Llenar información personal
    this.tarjetaForm.patchValue({
      personalInfo: {
        name: this.tarjetaData.personal_info?.name || '',
        title: this.tarjetaData.personal_info?.title || '',
        location: this.tarjetaData.personal_info?.location || '',
        photo: this.tarjetaData.personal_info?.photo || '',
      },
      contact: {
        email: this.tarjetaData.contact_info?.email || '',
        phone: this.tarjetaData.contact_info?.phone || '',
        website: this.tarjetaData.contact_info?.website || '',
        linkedin: this.tarjetaData.contact_info?.linkedin || '',
        twitter: this.tarjetaData.contact_info?.twitter || '',
        instagram: this.tarjetaData.contact_info?.instagram || '',
        github: this.tarjetaData.contact_info?.github || '',
        youtube: this.tarjetaData.contact_info?.youtube || '',
        tiktok: this.tarjetaData.contact_info?.tiktok || '',
        whatsapp: this.tarjetaData.contact_info?.whatsapp || '',
        facebook: this.tarjetaData.contact_info?.facebook || '',
      },
      about: {
        description: this.tarjetaData.about_info?.description || '',
        experience: this.tarjetaData.about_info?.experience || 0,
      },
      settings: {
        is_active: this.tarjetaData.is_active,
        is_public: this.tarjetaData.is_public,
      }
    });

    // Llenar skills
    if (this.tarjetaData.about_info?.skills) {
      const skillsArray = this.skillsArray;
      skillsArray.clear();
      this.tarjetaData.about_info.skills.forEach(skill => {
        skillsArray.push(this.fb.control(skill, [Validators.required, Validators.maxLength(50)]));
      });
    }

    // Establecer imagen actual
    if (this.tarjetaData.personal_info?.photo) {
      this.imagenActual = this.tarjetaData.personal_info.photo;
      this.previewImagen = this.obtenerUrlImagen(this.tarjetaData.personal_info.photo);
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
        this.errorMessage = 'Por favor seleccione un archivo de imagen válido.';
        return;
      }

      // Validar tamaño (max 2MB)
      if (file.size > 2 * 1024 * 1024) {
        this.errorMessage = 'La imagen no debe superar los 2MB.';
        return;
      }

      this.imagenSeleccionada = file;
      this.errorMessage = null;

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
      this.errorMessage = 'Por favor complete todos los campos requeridos correctamente.';
      return;
    }

    this.isLoading = true;
    this.errorMessage = null;

    // Preparar datos para la API
    const formValue = this.tarjetaForm.value;
    const requestData: UpdateDigitalCardRequest = {
      personalInfo: formValue.personalInfo,
      contact: this.hasContactData() ? formValue.contact : undefined,
      about: this.hasAboutData() ? {
        ...formValue.about,
        skills: this.skillsArray.value.filter((skill: string) => skill.trim() !== ''),
      } : undefined,
      is_active: formValue.settings.is_active,
      is_public: formValue.settings.is_public,
    };

    this.digitalCardsService.updateDigitalCard(this.tarjetaId, requestData).subscribe({
      next: (response) => {
        // Si hay imagen nueva, subirla
        if (this.imagenSeleccionada) {
          this.uploadImage();
        } else {
          this.isLoading = false;
          this.successMessage = 'Tarjeta digital actualizada exitosamente.';
          setTimeout(() => {
            this.router.navigate(['/admin/tarjetas']);
          }, 1500);
        }
      },
      error: (error) => {
        this.isLoading = false;
        this.errorMessage = 'Error al actualizar la tarjeta digital. Verifique los datos e intente nuevamente.';
        console.error('Error al actualizar tarjeta:', error);
      },
    });
  }

  private uploadImage(): void {
    if (!this.imagenSeleccionada) return;

    this.digitalCardsService.uploadImage(this.tarjetaId, this.imagenSeleccionada).subscribe({
      next: () => {
        this.isLoading = false;
        this.successMessage = 'Tarjeta digital actualizada exitosamente.';
        setTimeout(() => {
          this.router.navigate(['/admin/tarjetas']);
        }, 1500);
      },
      error: (error) => {
        this.isLoading = false;
        this.successMessage = 'Tarjeta actualizada. Hubo un problema al subir la imagen.';
        console.error('Error al subir imagen:', error);
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

  obtenerUrlImagen(rutaImagen?: string): string {
    if (!rutaImagen) {
      return '/assets/images/default-avatar.png';
    }
    if (rutaImagen.startsWith('http')) {
      return rutaImagen;
    }
    return `http://localhost:8000/storage/${rutaImagen}`;
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