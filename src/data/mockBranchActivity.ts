import type { ActivityItem } from '@/types';

export const mockBranchActivity: ActivityItem[] = [
  {
    id: 'ba-001',
    action: 'Product Import',
    description: '145 products imported successfully',
    actor: 'Ahmed Hassan',
    timestamp: '2026-06-08T09:30:00Z',
  },
  {
    id: 'ba-002',
    action: 'Employee Added',
    description: 'New inventory clerk assigned to branch',
    actor: 'Super Admin',
    timestamp: '2026-06-07T15:00:00Z',
  },
  {
    id: 'ba-003',
    action: 'Status Change',
    description: 'Branch marked as active',
    actor: 'Super Admin',
    timestamp: '2026-06-05T10:00:00Z',
  },
];

export const mockEmployeeActivity: ActivityItem[] = [
  {
    id: 'ea-001',
    action: 'Product Upload',
    description: 'Uploaded products_june_2026.xlsx',
    actor: 'Ahmed Hassan',
    timestamp: '2026-06-08T09:30:00Z',
  },
  {
    id: 'ea-002',
    action: 'Login',
    description: 'Logged in from Cairo Downtown branch',
    actor: 'Ahmed Hassan',
    timestamp: '2026-06-08T08:00:00Z',
  },
  {
    id: 'ea-003',
    action: 'Profile Update',
    description: 'Updated contact phone number',
    actor: 'Ahmed Hassan',
    timestamp: '2026-06-01T12:00:00Z',
  },
];
