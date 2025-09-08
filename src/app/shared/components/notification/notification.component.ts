import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { 
  NotificationService, 
  Notification,
  NotificationAction 
} from '../../services/notification.service';

@Component({
  selector: 'app-notification',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './notification.component.html',
  styleUrls: ['./notification.component.css'],
})
export class NotificationComponent {
  private notificationService = inject(NotificationService);
  
  notifications = this.notificationService.notifications$;

  remove(id: string): void {
    this.notificationService.remove(id);
  }

  executeAction(action: NotificationAction): void {
    action.action();
  }

  getNotificationIcon(type: Notification['type']): string {
    switch (type) {
      case 'success':
        return 'M5 13l4 4L19 7'; // Check icon
      case 'error':
        return 'M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z'; // Exclamation icon
      case 'warning':
        return 'M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.464 0L4.268 16.5c-.77.833.192 2.5 1.732 2.5z'; // Warning icon
      case 'info':
        return 'M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z'; // Info icon
      default:
        return 'M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z';
    }
  }

  getNotificationClasses(type: Notification['type']): string {
    const baseClasses = 'notification-item transform transition-all duration-300 ease-in-out';
    
    switch (type) {
      case 'success':
        return `${baseClasses} bg-green-50 border-green-200 text-green-800`;
      case 'error':
        return `${baseClasses} bg-red-50 border-red-200 text-red-800`;
      case 'warning':
        return `${baseClasses} bg-yellow-50 border-yellow-200 text-yellow-800`;
      case 'info':
        return `${baseClasses} bg-blue-50 border-blue-200 text-blue-800`;
      default:
        return `${baseClasses} bg-gray-50 border-gray-200 text-gray-800`;
    }
  }

  getIconClasses(type: Notification['type']): string {
    switch (type) {
      case 'success':
        return 'text-green-400';
      case 'error':
        return 'text-red-400';
      case 'warning':
        return 'text-yellow-400';
      case 'info':
        return 'text-blue-400';
      default:
        return 'text-gray-400';
    }
  }

  getButtonClasses(style: NotificationAction['style'] = 'primary'): string {
    const baseClasses = 'px-3 py-1 text-xs font-medium rounded-md transition-colors duration-200';
    
    if (style === 'secondary') {
      return `${baseClasses} bg-gray-200 text-gray-700 hover:bg-gray-300`;
    }
    
    return `${baseClasses} bg-blue-600 text-white hover:bg-blue-700`;
  }
}