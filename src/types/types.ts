// 在本地使用的驼峰命名格式
export interface TeamInfo {
  userId: string;
  teamName: string;
  createdAt: string;
}

export interface Personnel {
  id: string;
  userId: string;
  name: string;
  email: string;
  phone?: string;
  hostingCount: number;
  lastHosted: string;
  hostOffset: number;
}

export interface HostSchedule {
  id: string;
  userId: string;
  personnelId: string;
  date: string;
  hostNotified: boolean;
  teamNotified: boolean;
  completed: boolean;
}

export enum SortType {
  ByName = 'byName',
  Random = 'random'
}
