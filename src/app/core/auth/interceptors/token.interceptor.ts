import { HttpInterceptorFn, HttpRequest, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { AuthService } from '../services/auth.service';
import { catchError, switchMap } from 'rxjs/operators';
import { throwError, EMPTY } from 'rxjs';
import { Router } from '@angular/router';

export const tokenInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const router = inject(Router);
  const token = authService.getToken();

  // Función para añadir token a la request
  const addToken = (request: HttpRequest<any>, authToken: string) => {
    return request.clone({
      setHeaders: {
        Authorization: `Bearer ${authToken}`,
      },
    });
  };

  // Si hay un token, lo añadimos al header de autorización
  let authReq = req;
  if (token) {
    authReq = addToken(req, token);
  }

  return next(authReq).pipe(
    catchError((error: HttpErrorResponse) => {
      // Si es un error 401 y tenemos un token
      if (error.status === 401 && token) {
        console.log('Token expirado, intentando renovar...');
        
        // Intentar renovar el token
        return authService.refreshToken().pipe(
          switchMap((refreshSuccess) => {
            if (refreshSuccess) {
              console.log('Token renovado exitosamente');
              const newToken = authService.getToken();
              if (newToken) {
                // Reintentar la petición original con el nuevo token
                const retryReq = addToken(req, newToken);
                return next(retryReq);
              }
            }
            
            // Si la renovación falla, redirigir al login
            console.log('Renovación de token falló, redirigiendo al login');
            authService.logout();
            router.navigate(['/auth/login']);
            return EMPTY;
          }),
          catchError(() => {
            // Si hay error en la renovación, redirigir al login
            console.log('Error al renovar token, redirigiendo al login');
            authService.logout();
            router.navigate(['/auth/login']);
            return EMPTY;
          })
        );
      }

      // Para otros errores, simplemente los propagamos
      return throwError(() => error);
    })
  );
};
