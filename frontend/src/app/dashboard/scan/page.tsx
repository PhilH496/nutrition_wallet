'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';

interface NutritionData {
  name: string | null;
  serving_size: string | null;
  calories: number | null;
  total_fat: number | null;
  saturated_fat: number | null;
  trans_fat: number | null;
  cholesterol: number | null;
  sodium: number | null;
  total_carbs: number | null;
  fiber: number | null;
  sugar: number | null;
  protein: number | null;
}

export default function ScanPage() {
  const [image, setImage] = useState<File | null>(null);
  const [preview, setPreview] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [nutritionData, setNutritionData] = useState<NutritionData | null>(null);
  const [rawText, setRawText] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  const handleImageCapture = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImage(file);
      setNutritionData(null); // Reset previous results
      setRawText('');
      
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
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
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      const data = await response.json();
      
      if (data.success) {
        setNutritionData(data.nutrition_data);
        setRawText(data.raw_text);
      } else {
        alert('Failed to scan label: ' + (data.detail || 'Unknown error'));
      }
    } catch (error) {
      console.error('Error scanning:', error);
      alert('Error scanning label. Make sure the backend is running.');
    } finally {
      setScanning(false);
    }
  };

  const handleSave = async () => {
    if (!nutritionData) return;

    setLoading(true);

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
      console.error('Error saving:', error);
      alert('Error saving food');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: keyof NutritionData, value: string) => {
    if (!nutritionData) return;
    
    setNutritionData({
      ...nutritionData,
      [field]: field === 'name' || field === 'serving_size' ? value : (value ? parseFloat(value) : null)
    });
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Scan Nutrition Label</h1>
        <p className="text-gray-600 mb-8">Take a photo of a nutrition label to extract information</p>

        <div className="space-y-6">
          {/* Camera/Upload Section */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
              {preview ? (
                <div className="space-y-4">
                  <img 
                    src={preview} 
                    alt="Preview" 
                    className="max-w-full h-auto mx-auto rounded-lg shadow-sm"
                    style={{ maxHeight: '400px' }}
                  />
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="text-blue-600 hover:text-blue-700 font-medium"
                  >
                    Change Photo
                  </button>
                </div>
              ) : (
                <div className="py-12">
                  <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  <p className="text-gray-500 mt-4 mb-6">Take or upload a photo of the nutrition label</p>
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 font-medium transition"
                  >
                    Choose Photo
                  </button>
                </div>
              )}
              
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleImageCapture}
                accept="image/*"
                capture="environment"
                className="hidden"
              />
            </div>

            {/* Scan Button */}
            {preview && !nutritionData && (
              <button
                onClick={handleScan}
                disabled={scanning}
                className="w-full mt-6 bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed font-medium transition"
              >
                {scanning ? (
                  <span className="flex items-center justify-center">
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Scanning...
                  </span>
                ) : (
                  'Scan Label'
                )}
              </button>
            )}
          </div>

          {/* Nutrition Data Display & Edit */}
          {nutritionData && (
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Extracted Nutrition Information</h2>
              <p className="text-sm text-gray-600 mb-6">Review and edit the information before saving</p>
              
              <div className="space-y-4">
                {/* Product Name */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Product Name</label>
                  <input
                    type="text"
                    value={nutritionData.name || ''}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    placeholder="Enter product name"
                    className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                {/* Serving Size */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Serving Size</label>
                  <input
                    type="text"
                    value={nutritionData.serving_size || ''}
                    onChange={(e) => handleInputChange('serving_size', e.target.value)}
                    placeholder="e.g., 1 cup (240ml)"
                    className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                {/* Nutrition Facts Grid */}
                <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                  {Object.entries(nutritionData).map(([key, value]) => {
                    if (key === 'name' || key === 'serving_size') return null;
                    
                    return (
                      <div key={key}>
                        <label className="block text-sm font-medium text-gray-700 mb-1 capitalize">
                          {key.replace('_', ' ')}
                        </label>
                        <input
                          type="number"
                          step="0.1"
                          value={value || ''}
                          onChange={(e) => handleInputChange(key as keyof NutritionData, e.target.value)}
                          placeholder="0"
                          className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-4 mt-6">
                <button
                  onClick={() => {
                    setNutritionData(null);
                    setPreview('');
                    setImage(null);
                    setRawText('');
                  }}
                  className="flex-1 bg-gray-200 text-gray-700 px-6 py-3 rounded-lg hover:bg-gray-300 font-medium transition"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  disabled={loading}
                  className="flex-1 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed font-medium transition"
                >
                  {loading ? 'Saving...' : 'Save to Database'}
                </button>
              </div>

              {/* Raw Text Debug (collapsible) */}
              {rawText && (
                <details className="mt-6 border-t pt-4">
                  <summary className="text-sm text-gray-600 cursor-pointer hover:text-gray-900">
                    View raw extracted text
                  </summary>
                  <pre className="mt-2 text-xs bg-gray-50 p-4 rounded border overflow-x-auto">
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