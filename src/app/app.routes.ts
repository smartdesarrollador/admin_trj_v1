import { Routes } from '@angular/router';
import { DashboardComponent } from './paginas/admin/dashboard/dashboard.component';
import { AdminComponent } from './paginas/admin/admin.component';
import { PageNotFoundComponent } from './paginas/page-not-found/page-not-found.component';
import { authGuard } from './core/auth/guards/auth.guard';
import { roleGuard } from './core/auth/guards/role.guard';

export const routes: Routes = [
  {
    path: 'auth',
    children: [
      {
        path: 'login',
        loadComponent: () =>
          import('./paginas/auth/login/login.component').then(
            (m) => m.LoginComponent
          ),
        title: 'Iniciar sesión',
      },
      {
        path: 'forgot-password',
        loadComponent: () =>
          import(
            './paginas/auth/forgot-password/forgot-password.component'
          ).then((m) => m.ForgotPasswordComponent),
        title: 'Recuperar contraseña',
      },
      {
        path: 'reset-password',
        loadComponent: () =>
          import('./paginas/auth/reset-password/reset-password.component').then(
            (m) => m.ResetPasswordComponent
          ),
        title: 'Restablecer contraseña',
      },
      {
        path: '',
        redirectTo: 'login',
        pathMatch: 'full',
      },
    ],
  },
  {
    path: 'admin',
    component: AdminComponent,
    canActivate: [authGuard],
    children: [
      {
        path: 'dashboard',
        component: DashboardComponent,
      },
      {
        path: 'usuarios',
        loadComponent: () =>
          import('./paginas/admin/usuarios/usuarios.component').then(
            (m) => m.UsuariosComponent
          ),
        canActivate: [roleGuard(['administrador'])],
        title: 'Gestión de Usuarios',
      },
      {
        path: 'cuenta',
        loadComponent: () =>
          import('./paginas/admin/cuenta/cuenta.component').then(
            (m) => m.CuentaComponent
          ),
        title: 'Configuración de Cuenta',
      },
      {
        path: 'configuraciones',
        loadComponent: () =>
          import(
            './paginas/admin/configuraciones/configuraciones.component'
          ).then((m) => m.ConfiguracionesComponent),
        canActivate: [roleGuard(['administrador'])],
        title: 'Configuración del Sistema',
      },
      {
        path: 'banners',
        loadComponent: () =>
          import(
            './paginas/admin/banners/banner-list/banner-list.component'
          ).then((m) => m.BannerListComponent),
        canActivate: [roleGuard(['administrador'])],
        title: 'Gestión de Banners',
      },
      {
        path: 'banners/crear',
        loadComponent: () =>
          import(
            './paginas/admin/banners/banner-create/banner-create.component'
          ).then((m) => m.BannerCreateComponent),
        canActivate: [roleGuard(['administrador'])],
        title: 'Crear Banner',
      },
      {
        path: 'banners/editar/:id',
        loadComponent: () =>
          import(
            './paginas/admin/banners/banner-edit/banner-edit.component'
          ).then((m) => m.BannerEditComponent),
        canActivate: [roleGuard(['administrador'])],
        title: 'Editar Banner',
      },
      {
        path: 'tarjetas',
        loadComponent: () =>
          import(
            './paginas/admin/tarjetas/tarjeta-list/tarjeta-list.component'
          ).then((m) => m.TarjetaListComponent),
        canActivate: [roleGuard(['administrador', 'autor'])],
        title: 'Gestión de Tarjetas Digitales',
      },
      {
        path: 'tarjetas/crear',
        loadComponent: () =>
          import(
            './paginas/admin/tarjetas/tarjeta-create/tarjeta-create.component'
          ).then((m) => m.TarjetaCreateComponent),
        canActivate: [roleGuard(['administrador', 'autor'])],
        title: 'Crear Tarjeta Digital',
      },
      {
        path: 'tarjetas/editar/:id',
        loadComponent: () =>
          import(
            './paginas/admin/tarjetas/tarjeta-edit/tarjeta-edit.component'
          ).then((m) => m.TarjetaEditComponent),
        canActivate: [roleGuard(['administrador', 'autor'])],
        title: 'Editar Tarjeta Digital',
      },
      {
        path: 'tarjetas/detalle/:id',
        loadComponent: () =>
          import(
            './paginas/admin/tarjetas/tarjeta-detail/tarjeta-detail.component'
          ).then((m) => m.TarjetaDetailComponent),
        canActivate: [roleGuard(['administrador', 'autor'])],
        title: 'Detalle de Tarjeta Digital',
      },
      {
        path: 'register',
        loadComponent: () =>
          import('./paginas/auth/register/register.component').then(
            (m) => m.RegisterComponent
          ),
        canActivate: [roleGuard(['administrador'])],
        title: 'Registrar Usuario',
      },
      {
        path: '',
        redirectTo: 'dashboard',
        pathMatch: 'full',
      },
    ],
  },
  {
    path: '',
    redirectTo: '/auth/login',
    pathMatch: 'full',
  },
  {
    path: '**',
    component: PageNotFoundComponent,
  },
];
