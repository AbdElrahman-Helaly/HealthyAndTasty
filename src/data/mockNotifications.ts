import type { Notification } from '@/types';

export const mockNotifications: Notification[] = [
  {
    id: 'notif-001',
    title: 'System Maintenance',
    message: 'Scheduled maintenance on Sunday 2:00 AM - 4:00 AM UTC.',
    isRead: false,
    createdAt: '2026-06-08T08:00:00Z',
    targetType: 'all',
    targetLabel: 'All Branches',
  },
  {
    id: 'notif-002',
    title: 'New Product Catalog',
    message: 'Q2 product catalog has been updated for Egypt region.',
    isRead: false,
    createdAt: '2026-06-07T14:30:00Z',
    targetType: 'country',
    targetId: 'eg',
    targetLabel: 'Egypt',
  },
  {
    id: 'notif-003',
    title: 'Import Failed',
    message: 'Excel import failed for Cairo Downtown branch. Please review.',
    isRead: true,
    createdAt: '2026-06-06T10:15:00Z',
    targetType: 'branch',
    targetId: 'br-001',
    targetLabel: 'Cairo Downtown',
  },
  {
    id: 'notif-004',
    title: 'Welcome',
    message: 'Welcome to the Healthy & Tasty Super Admin Portal.',
    isRead: true,
    createdAt: '2026-06-01T09:00:00Z',
    targetType: 'all',
    targetLabel: 'All Branches',
  },
];
