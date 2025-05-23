// 在本地使用的驼峰命名格式
export interface TeamInfo {
  userId: string;
  teamName: string;
  createdAt: string;
  teamNotificationsEnabled?: boolean; // Controls whether automatic team notifications are enabled (default: false)
  hostNotificationsEnabled?: boolean; // Controls whether automatic host notifications are enabled (default: false)
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
  createdAt: string; // 必须字段，不带问号
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
  Random = 'random',
  ByAddOrder = 'byAddOrder'
}
