import { http } from '@/lib/apiClient';

export const weekDays = [
  ['Saturday', 'السبت'], ['Sunday', 'الأحد'], ['Monday', 'الاثنين'],
  ['Tuesday', 'الثلاثاء'], ['Wednesday', 'الأربعاء'], ['Thursday', 'الخميس'], ['Friday', 'الجمعة'],
] as const;
export type WeekDay = typeof weekDays[number][0];
export interface ScheduleDay { day: WeekDay; isClosed: boolean; openTime?: string | null; closeTime?: string | null }
export interface BranchHours { branchId: string; odooBranchId: number; branchName: string; hasSchedule: boolean; isOpenNow: boolean | null; schedule: ScheduleDay[] | null }
export type SaveBranchHours = { schedule: ScheduleDay[] } & ({ allBranches: true } | { allBranches: false; branchIds: string[] });
export function listBranchHours(): Promise<BranchHours[]> { return http.get('/api/admin/branch-hours'); }
export function getBranchHours(id: string): Promise<BranchHours> { return http.get(`/api/admin/branch-hours/${encodeURIComponent(id)}`); }
export function saveBranchHours(body: SaveBranchHours): Promise<unknown> { return http.put('/api/admin/branch-hours', body); }
