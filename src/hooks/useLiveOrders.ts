import { useEffect, useRef, useState } from 'react';
import * as signalR from '@microsoft/signalr';
import { env } from '@/config/env';
import { getAccessToken } from '@/lib/apiClient';
import type { DashboardOrderListItem, OrderStatusChangedEvent } from '@/types';

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
  const [connected, setConnected] = useState(false);
  const [lastEvent, setLastEvent] = useState<LiveOrdersSignalR['lastEvent']>(null);
  const onEventRef = useRef(onEvent);

  useEffect(() => {
    onEventRef.current = onEvent;
  }, [onEvent]);

  useEffect(() => {
    let disposed = false;
    const connection = new signalR.HubConnectionBuilder()
      .withUrl(`${env.apiBaseUrl}/hubs/live-orders`, {
        accessTokenFactory: () => getAccessToken() ?? '',
      })
      .withAutomaticReconnect()
      .build();

    connection.on('OrderCreated', (order: DashboardOrderListItem) => {
      if (disposed) return;
      const event = { type: 'created' as const, order };
      setLastEvent(event);
      onEventRef.current?.(event);
    });

    connection.on('OrderStatusChanged', (payload: OrderStatusChangedEvent) => {
      if (disposed) return;
      const event = { type: 'statusChanged' as const, order: payload.order };
      setLastEvent(event);
      onEventRef.current?.(event);
    });

    connection
      .start()
      .then(() => {
        if (!disposed) setConnected(true);
      })
      .catch(() => {
        // Hub unreachable — the page still works with polling (refetch)
        if (!disposed) setConnected(false);
      });

    connection.onclose(() => {
      if (!disposed) setConnected(false);
    });

    return () => {
      disposed = true;
      void connection.stop();
    };
  }, []);

  return { connected, lastEvent };
}
