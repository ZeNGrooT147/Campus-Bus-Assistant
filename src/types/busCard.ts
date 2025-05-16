export interface BusCard {
  id: string;
  name: string;
  number: string;
  route: string;
  driver: {
    name: string;
    phone: string;
    photo: string;
  };
  capacity?: number;
  departureTime: string;
  arrivalTime: string;
  stops: string[];
  busImage: string;
  currentOccupancy: number;
  status: string;
  created_at?: string;
  updated_at?: string;
}
