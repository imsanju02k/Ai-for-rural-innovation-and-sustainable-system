# Integration Example: Image Upload and Disease Detection

Complete workflow for uploading crop images and detecting diseases.

## Complete Flow

```typescript
import { UploadUrlResponse, DiseaseDetectionResponse } from '@ai-rural-platform/types';

async function detectDiseaseFromImage(
  file: File,
  farmId: string,
  cropType: string
): Promise<DiseaseDetectionResponse> {
  const token = localStorage.getItem('accessToken');

  // Step 1: Get upload URL
  const uploadUrlResponse = await fetch('/api/images/upload-url', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      farmId,
      fileName: file.name,
      contentType: file.type,
    }),
  });

  const { uploadUrl, imageId }: UploadUrlResponse = await uploadUrlResponse.json();

  // Step 2: Upload image to S3
  await fetch(uploadUrl, {
    method: 'PUT',
    headers: { 'Content-Type': file.type },
    body: file,
  });

  // Step 3: Trigger disease detection
  const analysisResponse = await fetch('/api/disease-detection/analyze', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      imageId,
      farmId,
      cropType,
    }),
  });

  return analysisResponse.json();
}
```

## React Component with File Upload

```tsx
import React, { useState } from 'react';
import { DiseaseDetectionResponse } from '@ai-rural-platform/types';

function DiseaseDetection({ farmId }: { farmId: string }) {
  const [file, setFile] = useState<File | null>(null);
  const [cropType, setCropType] = useState('wheat');
  const [result, setResult] = useState<DiseaseDetectionResponse | null>(null);
  const [loading, setLoading] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) return;

    setLoading(true);
    try {
      const analysis = await detectDiseaseFromImage(file, farmId, cropType);
      setResult(analysis);
    } catch (error) {
      console.error('Disease detection failed:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h2>Disease Detection</h2>
      <form onSubmit={handleSubmit}>
        <input
          type="file"
          accept="image/jpeg,image/png,image/heic"
          onChange={handleFileChange}
          required
        />
        <select value={cropType} onChange={(e) => setCropType(e.target.value)}>
          <option value="wheat">Wheat</option>
          <option value="rice">Rice</option>
          <option value="corn">Corn</option>
        </select>
        <button type="submit" disabled={loading || !file}>
          {loading ? 'Analyzing...' : 'Analyze Image'}
        </button>
      </form>

      {result && (
        <div>
          <h3>Analysis Results</h3>
          {result.results.map((disease, index) => (
            <div key={index}>
              <h4>{disease.diseaseName}</h4>
              <p>Confidence: {(disease.confidence * 100).toFixed(1)}%</p>
              <p>Severity: {disease.severity}</p>
              <h5>Recommendations:</h5>
              <ul>
                {disease.recommendations.map((rec, i) => (
                  <li key={i}>{rec}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
```

## View Analysis History

```typescript
async function getAnalysisHistory(farmId: string, limit: number = 20) {
  const token = localStorage.getItem('accessToken');
  
  const response = await fetch(
    `/api/disease-detection/history?farmId=${farmId}&limit=${limit}`,
    {
      headers: { 'Authorization': `Bearer ${token}` },
    }
  );

  return response.json();
}
```
