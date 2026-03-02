# Integration Example: Farm Creation and Management

Complete example of creating and managing farms.

## Create a Farm

```typescript
import { CreateFarmRequest, Farm } from '@ai-rural-platform/types';

async function createFarm(data: CreateFarmRequest): Promise<Farm> {
  const token = localStorage.getItem('accessToken');
  
  const response = await fetch('/api/farms', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) throw new Error('Failed to create farm');
  return response.json();
}

// Usage
const farm = await createFarm({
  name: 'Green Valley Farm',
  location: {
    latitude: 28.6139,
    longitude: 77.2090,
    address: 'Village Rampur, District Meerut, UP',
  },
  cropTypes: ['wheat', 'rice', 'sugarcane'],
  acreage: 15.5,
  soilType: 'loamy',
});

console.log('Farm created:', farm.farmId);
```

## React Component Example

```tsx
import React, { useState, useEffect } from 'react';
import { Farm, CreateFarmRequest } from '@ai-rural-platform/types';

function FarmManagement() {
  const [farms, setFarms] = useState<Farm[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadFarms();
  }, []);

  async function loadFarms() {
    const token = localStorage.getItem('accessToken');
    const response = await fetch('/api/farms', {
      headers: { 'Authorization': `Bearer ${token}` },
    });
    const data = await response.json();
    setFarms(data.farms);
    setLoading(false);
  }

  async function handleCreateFarm(farmData: CreateFarmRequest) {
    const token = localStorage.getItem('accessToken');
    const response = await fetch('/api/farms', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(farmData),
    });
    
    if (response.ok) {
      await loadFarms(); // Reload list
    }
  }

  async function handleDeleteFarm(farmId: string) {
    const token = localStorage.getItem('accessToken');
    await fetch(`/api/farms/${farmId}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${token}` },
    });
    await loadFarms();
  }

  if (loading) return <div>Loading...</div>;

  return (
    <div>
      <h2>My Farms</h2>
      {farms.map((farm) => (
        <div key={farm.farmId}>
          <h3>{farm.name}</h3>
          <p>Acreage: {farm.acreage}</p>
          <p>Crops: {farm.cropTypes.join(', ')}</p>
          <button onClick={() => handleDeleteFarm(farm.farmId)}>Delete</button>
        </div>
      ))}
    </div>
  );
}
```

## Update Farm

```typescript
async function updateFarm(farmId: string, updates: Partial<CreateFarmRequest>): Promise<Farm> {
  const token = localStorage.getItem('accessToken');
  
  const response = await fetch(`/api/farms/${farmId}`, {
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(updates),
  });

  return response.json();
}

// Usage
await updateFarm('farm-id', {
  cropTypes: ['wheat', 'rice', 'corn'],
  acreage: 16.0,
});
```
