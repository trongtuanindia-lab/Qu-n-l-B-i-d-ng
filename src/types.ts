export type ClassCategory = 'Bồi dưỡng';

export interface TrainingClass {
  id: string;
  category: ClassCategory;
  title: string;
  targetAudience: string;
  numClasses: number;
  numStudents: number;
  actualStudents?: number;
  startDate?: string;
  endDate?: string;
  mode: 'Tập trung' | 'Không tập trung' | 'Cả hai';
  timeframe: string;
  location: string;
  funding: string;
  status: 'Planned' | 'In Progress' | 'Completed';
  subTitle?: string;
}

export interface DashboardStats {
  totalClasses: number;
  totalStudents: number;
  fosteringClasses: number;
}
