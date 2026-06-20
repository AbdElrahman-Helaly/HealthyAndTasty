import type { AuditLog } from '@/types';

export const mockAuditLogs: AuditLog[] = [
  {
    id: 'audit-001',
    timestamp: '2026-06-08T11:30:00Z',
    actor: 'Super Admin',
    action: 'CREATE',
    entity: 'Category',
    entityId: 'cat-005',
    ipAddress: '192.168.1.100',
  },
  {
    id: 'audit-002',
    timestamp: '2026-06-08T10:15:00Z',
    actor: 'Super Admin',
    action: 'UPDATE',
    entity: 'Branch',
    entityId: 'br-004',
    ipAddress: '192.168.1.100',
  },
  {
    id: 'audit-003',
    timestamp: '2026-06-07T16:45:00Z',
    actor: 'Super Admin',
    action: 'SEND',
    entity: 'Notification',
    entityId: 'notif-002',
    ipAddress: '192.168.1.100',
  },
  {
    id: 'audit-004',
    timestamp: '2026-06-07T09:20:00Z',
    actor: 'Super Admin',
    action: 'DELETE',
    entity: 'Category',
    entityId: 'cat-old-01',
    ipAddress: '192.168.1.100',
  },
  {
    id: 'audit-005',
    timestamp: '2026-06-06T14:00:00Z',
    actor: 'Super Admin',
    action: 'LOGIN',
    entity: 'Session',
    entityId: 'sess-001',
    ipAddress: '192.168.1.100',
  },
];
