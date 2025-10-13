'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';

interface NutritionData {
  food_name: string | null;
  serving_size: number | null;
  serving_unit: string | null;
  calories: number | null;
  protein: number | null;
  carbs: number | null;
  sugars: number | null;
}

export default function ScanPage() {
  const [image, setImage] = useState<File | null>(null);
  const [preview, setPreview] = useState<string>('');
  const [scanning, setScanning] = useState(false);
  const [saving, setSaving] = useState(false);
  const [nutritionData, setNutritionData] = useState<NutritionData | null>(null);
  const [rawText, setRawText] = useState<string>('');
  const [cameraActive, setCameraActive] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const router = useRouter();

  const startCamera = async () => {
    setCameraActive(true);
    
    setTimeout(async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ 
          video: { 
            facingMode: 'environment',
            width: { ideal: 1920 },
            height: { ideal: 1080 }
          } 
        });
        
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          streamRef.current = stream;
          videoRef.current.onloadedmetadata = () => videoRef.current?.play();
        }
      } catch (error) {
        alert('Could not access camera. Please use upload instead.');
        setCameraActive(false);
      }
    }, 100);
  };

  const stopCamera = () => {
    streamRef.current?.getTracks().forEach(track => track.stop());
    streamRef.current = null;
    setCameraActive(false);
  };

  const capturePhoto = () => {
    if (!videoRef.current || !canvasRef.current) return;
    
    const canvas = canvasRef.current;
    canvas.width = videoRef.current.videoWidth;
    canvas.height = videoRef.current.videoHeight;
    
    const ctx = canvas.getContext('2d');
    ctx?.drawImage(videoRef.current, 0, 0);
    
    canvas.toBlob((blob) => {
      if (blob) {
        const file = new File([blob], 'nutrition-label.jpg', { type: 'image/jpeg' });
        setImage(file);
        setPreview(canvas.toDataURL('image/jpeg'));
        setNutritionData(null);
        stopCamera();
      }
    }, 'image/jpeg', 0.95);
  };

  const handleImageCapture = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    setImage(file);
    setNutritionData(null);
    
    const reader = new FileReader();
    reader.onloadend = () => setPreview(reader.result as string);
    reader.readAsDataURL(file);
  };

  const handleScan = async () => {
    if (!image) return;

    setScanning(true);
    const formData = new FormData();
    formData.append('file', image);

    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:8000/ocr/scan-label', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData
      });

      const data = await response.json();
      if (data.success) {
        setNutritionData(data.nutrition_data);
        setRawText(data.raw_text || '');
      } else {
        alert('Failed to scan: ' + (data.detail || 'Unknown error'));
      }
    } catch (error) {
      alert('Error scanning label. Make sure backend is running.');
    } finally {
      setScanning(false);
    }
  };

  const handleSave = async () => {
    if (!nutritionData) return;
    setSaving(true);

    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:8000/ocr/save-food', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(nutritionData)
      });

      const data = await response.json();
      if (data.success) {
        alert('Food saved successfully!');
        router.push('/dashboard');
      } else {
        alert('Failed to save: ' + (data.detail || 'Unknown error'));
      }
    } catch (error) {
      alert('Error saving food');
    } finally {
      setSaving(false);
    }
  };

  const updateField = (field: keyof NutritionData, value: string) => {
    if (!nutritionData) return;
    setNutritionData({
      ...nutritionData,
      [field]: field === 'food_name' || field === 'serving_unit' ? value : (value ? parseFloat(value) : null)
    });
  };

  const reset = () => {
    setNutritionData(null);
    setPreview('');
    setImage(null);
    setRawText('');
    stopCamera();
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center justify-between mb-2">
          <h1 className="text-3xl font-bold text-gray-900">Scan Nutrition Label</h1>
          <button onClick={() => router.push('/dashboard')} className="text-gray-600 hover:text-gray-900">
            ← Back
          </button>
        </div>
        <p className="text-gray-600 mb-8">Take or upload a photo of a nutrition label</p>

        <div className="space-y-6">
          {/* Camera/Upload Section */}
          <div className="bg-white rounded-lg shadow-md p-6">
            {cameraActive ? (
              <div className="space-y-4">
                <div className="relative bg-black rounded-lg overflow-hidden" style={{ minHeight: '400px' }}>
                  <video ref={videoRef} autoPlay playsInline muted className="w-full h-auto rounded-lg" />
                </div>
                <canvas ref={canvasRef} className="hidden" />
                <div className="flex gap-3">
                  <button onClick={capturePhoto} className="flex-1 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 font-medium">
                    Capture Photo
                  </button>
                  <button onClick={stopCamera} className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 font-medium">
                    Cancel
                  </button>
                </div>
              </div>
            ) : preview ? (
              <div className="space-y-4">
                <img src={preview} alt="Preview" className="max-w-full h-auto mx-auto rounded-lg shadow-sm" style={{ maxHeight: '400px' }} />
                <div className="flex gap-3">
                  <button onClick={startCamera} className="flex-1 text-blue-600 hover:text-blue-700 font-medium py-2">
                    Retake
                  </button>
                  <button onClick={() => fileInputRef.current?.click()} className="flex-1 text-blue-600 hover:text-blue-700 font-medium py-2">
                    Upload Different
                  </button>
                </div>
              </div>
            ) : (
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center space-y-6">
                <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                  <button onClick={startCamera} className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 font-medium">
                    Take Photo
                  </button>
                  <button onClick={() => fileInputRef.current?.click()} className="bg-gray-200 text-gray-700 px-6 py-3 rounded-lg hover:bg-gray-300 font-medium">
                    Upload Photo
                  </button>
                </div>
              </div>
            )}
            
            <input ref={fileInputRef} type="file" onChange={handleImageCapture} accept="image/*" className="hidden" />

            {preview && !nutritionData && (
              <button onClick={handleScan} disabled={scanning} className="w-full mt-6 bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 disabled:bg-gray-400 font-medium">
                {scanning ? 'Scanning...' : 'Scan Label'}
              </button>
            )}
          </div>

          {/* Nutrition Data Form */}
          {nutritionData && (
            <div className="bg-white rounded-lg shadow-md p-6 space-y-4">
              <h2 className="text-xl font-bold">Extracted Nutrition Information</h2>
              <p className="text-sm text-gray-600">Review and edit the information before saving</p>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Product Name
                </label>
                <input
                  type="text"
                  value={nutritionData.food_name || ''}
                  onChange={(e) => updateField('food_name', e.target.value)}
                  placeholder="Enter product name"
                  className="w-full border border-gray-300 rounded-lg px-4 py-2 text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Serving Size
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={nutritionData.serving_size || ''}
                    onChange={(e) => updateField('serving_size', e.target.value)}
                    placeholder="0"
                    className="w-full border border-gray-300 rounded-lg px-4 py-2 text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Serving Unit
                  </label>
                  <input
                    type="text"
                    value={nutritionData.serving_unit || ''}
                    onChange={(e) => updateField('serving_unit', e.target.value)}
                    placeholder="cup, g, slice"
                    className="w-full border border-gray-300 rounded-lg px-4 py-2 text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Calories
                  </label>
                  <input
                    type="number"
                    step="1"
                    value={nutritionData.calories || ''}
                    onChange={(e) => updateField('calories', e.target.value)}
                    placeholder="0"
                    className="w-full border border-gray-300 rounded-lg px-4 py-2 text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Protein (g)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={nutritionData.protein || ''}
                    onChange={(e) => updateField('protein', e.target.value)}
                    placeholder="0"
                    className="w-full border border-gray-300 rounded-lg px-4 py-2 text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Carbs (g)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={nutritionData.carbs || ''}
                    onChange={(e) => updateField('carbs', e.target.value)}
                    placeholder="0"
                    className="w-full border border-gray-300 rounded-lg px-4 py-2 text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Sugars (g)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={nutritionData.sugars || ''}
                    onChange={(e) => updateField('sugars', e.target.value)}
                    placeholder="0"
                    className="w-full border border-gray-300 rounded-lg px-4 py-2 text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>

              <div className="flex gap-4 pt-4">
                <button 
                  onClick={reset} 
                  className="flex-1 bg-gray-200 text-gray-700 px-6 py-3 rounded-lg hover:bg-gray-300 font-medium transition"
                >
                  Cancel
                </button>
                <button 
                  onClick={handleSave} 
                  disabled={saving}
                  className="flex-1 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed font-medium transition"
                >
                  {saving ? 'Saving...' : 'Save to Database'}
                </button>
              </div>

              {/* Raw Text Debug (For Dev Info)*/}
              {rawText && (
                <details className="mt-6 border-t pt-4">
                  <summary className="text-sm text-gray-600 cursor-pointer hover:text-gray-900">
                    View raw extracted text
                  </summary>
                  <pre className="mt-2 text-xs bg-gray-50 p-4 rounded border overflow-x-auto text-gray-900">
                    {rawText}
                  </pre>
                </details>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}