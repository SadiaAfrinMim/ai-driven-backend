export interface INotificationFilters {
  userId?: string;
  isRead?: boolean;
  type?: 'INFO' | 'SUCCESS' | 'WARNING' | 'ERROR';
  limit?: number;
  skip?: number;
}

export interface INotification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: 'INFO' | 'SUCCESS' | 'WARNING' | 'ERROR';
  isRead: boolean;
  relatedId?: string;
  relatedType?: string;
  createdAt: Date;
  updatedAt: Date;
}