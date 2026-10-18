import { useEffect, useRef, useState } from 'react';
import * as signalR from '@microsoft/signalr';
import { env } from '@/config/env';
import { getAccessToken } from '@/lib/apiClient';
import type { DashboardOrderListItem, OrderStatusChangedEvent } from '@/types';
import { useAuth } from '@/context/AuthContext';

const connections = new Map<number, { hub: signalR.HubConnection; users: number; start: Promise<void>; status: Set<(value: boolean) => void> }>();

export interface LiveOrdersSignalR {
  connected: boolean;
  /** Full refresh hint — call when a payload arrives */
  lastEvent: { type: 'created' | 'statusChanged'; order: DashboardOrderListItem } | null;
}

/**
 * Connects to the Live Orders SignalR hub (/hubs/live-orders).
 * Events: "OrderCreated" → DashboardOrderListItem, "OrderStatusChanged" → OrderStatusChangedEvent.
 */
export function useLiveOrders(onEvent?: (event: { type: 'created' | 'statusChanged'; order: DashboardOrderListItem }) => void) {
  const { user } = useAuth();
  const [connected, setConnected] = useState(false);
  const [lastEvent, setLastEvent] = useState<LiveOrdersSignalR['lastEvent']>(null);
  const onEventRef = useRef(onEvent);

  useEffect(() => {
    onEventRef.current = onEvent;
  }, [onEvent]);

  useEffect(() => {
    setConnected(false);
    setLastEvent(null);
    if (!user) return;
    let disposed = false;
    let shared = connections.get(user.id);
    if (!shared) {
      const hub = new signalR.HubConnectionBuilder()
      .withUrl(`${env.apiBaseUrl}/hubs/live-orders`, {
        accessTokenFactory: () => getAccessToken() ?? '',
      })
      .withAutomaticReconnect()
      .build();
      const status = new Set<(value: boolean) => void>();
      hub.onclose(() => status.forEach(listener => listener(false)));
      hub.onreconnecting(() => status.forEach(listener => listener(false)));
      hub.onreconnected(() => status.forEach(listener => listener(true)));
      shared = { hub, users: 0, start: hub.start(), status };
      connections.set(user.id, shared);
    }
    shared.users++;
    const connection = shared.hub;
    shared.status.add(setConnected);

    const created = (order: DashboardOrderListItem) => {
      if (disposed) return;
      const event = { type: 'created' as const, order };
      setLastEvent(event);
      onEventRef.current?.(event);
    };
    connection.on('OrderCreated', created);

    const changed = (payload: OrderStatusChangedEvent) => {
      if (disposed) return;
      const event = { type: 'statusChanged' as const, order: payload.order };
      setLastEvent(event);
      onEventRef.current?.(event);
    };
    connection.on('OrderStatusChanged', changed);

    shared.start
      .then(() => {
        if (!disposed) setConnected(true);
      })
      .catch(() => {
        // Hub unreachable — the page still works with polling (refetch)
        if (!disposed) setConnected(false);
      });

    return () => {
      disposed = true;
      connection.off('OrderCreated', created);
      connection.off('OrderStatusChanged', changed);
      shared.status.delete(setConnected);
      shared.users--;
      if (!shared.users) {
        void connection.stop();
        connections.delete(user.id);
      }
    };
  }, [user?.id]);

  return { connected, lastEvent };
}
