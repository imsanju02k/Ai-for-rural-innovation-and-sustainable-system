# Integration Example: Real-time Sensor Data Subscription

WebSocket integration for real-time IoT sensor data and alerts.

## WebSocket Connection

```typescript
class SensorDataClient {
  private ws: WebSocket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;

  constructor(
    private farmId: string,
    private onMessage: (data: any) => void,
    private onError: (error: Error) => void
  ) {}

  connect() {
    const wsUrl = 'wss://ws.farmplatform.example.com';
    this.ws = new WebSocket(wsUrl);

    this.ws.onopen = () => {
      console.log('WebSocket connected');
      this.reconnectAttempts = 0;
      this.subscribe();
    };

    this.ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      this.onMessage(data);
    };

    this.ws.onerror = (error) => {
      console.error('WebSocket error:', error);
      this.onError(new Error('WebSocket connection error'));
    };

    this.ws.onclose = () => {
      console.log('WebSocket closed');
      this.reconnect();
    };
  }

  private subscribe() {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({
        action: 'subscribe',
        farmId: this.farmId,
        topics: ['sensors', 'alerts', 'notifications'],
      }));
    }
  }

  private reconnect() {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts), 30000);
      console.log(`Reconnecting in ${delay}ms...`);
      setTimeout(() => this.connect(), delay);
    }
  }

  disconnect() {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }
}
```

## React Hook for Sensor Data

```tsx
import { useState, useEffect, useCallback } from 'react';
import { SensorData } from '@ai-rural-platform/types';

function useSensorData(farmId: string) {
  const [sensorData, setSensorData] = useState<SensorData[]>([]);
  const [alerts, setAlerts] = useState<any[]>([]);
  const [connected, setConnected] = useState(false);
  const [client, setClient] = useState<SensorDataClient | null>(null);

  useEffect(() => {
    const sensorClient = new SensorDataClient(
      farmId,
      handleMessage,
      handleError
    );

    sensorClient.connect();
    setClient(sensorClient);
    setConnected(true);

    return () => {
      sensorClient.disconnect();
      setConnected(false);
    };
  }, [farmId]);

  const handleMessage = useCallback((data: any) => {
    if (data.type === 'sensor_update') {
      setSensorData((prev) => [...prev.slice(-99), data.payload]);
    } else if (data.type === 'alert') {
      setAlerts((prev) => [data.payload, ...prev]);
    }
  }, []);

  const handleError = useCallback((error: Error) => {
    console.error('Sensor data error:', error);
    setConnected(false);
  }, []);

  return { sensorData, alerts, connected };
}

// Usage in component
function SensorDashboard({ farmId }: { farmId: string }) {
  const { sensorData, alerts, connected } = useSensorData(farmId);

  return (
    <div>
      <div>Status: {connected ? 'Connected' : 'Disconnected'}</div>
      
      <h3>Latest Sensor Readings</h3>
      {sensorData.slice(-10).map((reading, index) => (
        <div key={index}>
          {reading.sensorType}: {reading.value} {reading.unit}
        </div>
      ))}

      <h3>Recent Alerts</h3>
      {alerts.map((alert, index) => (
        <div key={index} className={`alert ${alert.severity}`}>
          {alert.message}
        </div>
      ))}
    </div>
  );
}
```

## Fetch Historical Sensor Data

```typescript
async function getSensorData(
  farmId: string,
  sensorType?: string,
  aggregation: 'raw' | 'hourly' | 'daily' = 'hourly'
) {
  const token = localStorage.getItem('accessToken');
  
  const params = new URLSearchParams({
    farmId,
    aggregation,
    ...(sensorType && { sensorType }),
  });

  const response = await fetch(`/api/sensors/data?${params}`, {
    headers: { 'Authorization': `Bearer ${token}` },
  });

  return response.json();
}

// Usage
const soilMoistureData = await getSensorData(farmId, 'soil_moisture', 'hourly');
```

## Real-time Chart Component

```tsx
import React, { useState, useEffect } from 'react';
import { Line } from 'react-chartjs-2';

function SensorChart({ farmId, sensorType }: { farmId: string; sensorType: string }) {
  const { sensorData } = useSensorData(farmId);
  
  const filteredData = sensorData.filter((d) => d.sensorType === sensorType);
  
  const chartData = {
    labels: filteredData.map((d) => new Date(d.timestamp).toLocaleTimeString()),
    datasets: [
      {
        label: sensorType,
        data: filteredData.map((d) => d.value),
        borderColor: 'rgb(75, 192, 192)',
        tension: 0.1,
      },
    ],
  };

  return <Line data={chartData} />;
}
```
