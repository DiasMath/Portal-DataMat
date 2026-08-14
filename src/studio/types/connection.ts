export interface StudioConnection {
  id: string;
  name: string;
  host: string;
  port: number;
  user: string;
  password: string;
  database?: string;
  color?: string;
  status: 'connected' | 'disconnected' | 'error';
  createdAt?: string;
  updatedAt?: string;
}
