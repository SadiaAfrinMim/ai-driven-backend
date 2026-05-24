export interface ISelection {
  id: string;
  quantity: number;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  userId: string;
  itemId: string;
  createdAt: Date;
  updatedAt: Date;
  user?: {
    id: string;
    name: string;
    email: string;
  };
  item?: {
    id: string;
    title: string;
    price: number;
    images: string[];
  };
}

export interface ICreateSelection {
  itemId: string;
  quantity: number;
}

export interface IUpdateSelectionStatus {
  status: 'APPROVED' | 'REJECTED';
}
