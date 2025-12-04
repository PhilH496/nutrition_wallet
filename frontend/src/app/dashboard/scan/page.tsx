'use client';

import { useState, useRef, ChangeEvent } from 'react';
import { useRouter } from 'next/navigation';
import { FaCamera } from 'react-icons/fa';
import { TextInput } from '@mantine/core';
import { HeaderMegaMenu } from '@/components/dashboard/Header';
import { SideBar } from '@/components/dashboard/SideBar';

// CHANGED: All fields default to empty string or 0 to avoid null issues
interface NutritionData {
  food_name: string;
  serving_size: number | string;
  serving_unit: string;
  calories: number | string;
  protein: number | string;
  carbs: number | string;
  sugars: number | string;
}

export default function ScanPage() {
  const [image, setImage] = useState<File | null>(null);
  const [preview, setPreview] = useState<string>('');
  const [scanning, setScanning] = useState(false);
  const [saving, setSaving] = useState(false);
  // CHANGED: Initialize with empty values instead of null
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

  const handleImageCapture = (e: ChangeEvent<HTMLInputElement>) => {
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
        // CHANGED: Convert null values to empty strings to avoid React warnings
        setNutritionData({
          food_name: data.nutrition_data.food_name ?? '',
          serving_size: data.nutrition_data.serving_size ?? '',
          serving_unit: data.nutrition_data.serving_unit ?? '',
          calories: data.nutrition_data.calories ?? '',
          protein: data.nutrition_data.protein ?? '',
          carbs: data.nutrition_data.carbs ?? '',
          sugars: data.nutrition_data.sugars ?? '',
        });
        setRawText(data.raw_text);
      } else {
        alert(data.detail);
      }
    } catch (error) {
      alert("Error scanning: " + error);
    } finally {
      setScanning(false);
    }
  };

  const handleSave = async () => {
    if (!nutritionData?.food_name) {
      alert('Enter a food name before saving.')
      return;
    }
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
        reset();
        // CHANGED: Navigate to table page and force full page reload to refresh data
        window.location.href = '/dashboard/table';
      } else {
        alert(data.detail);
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
      [field]: field === 'food_name' || field === 'serving_unit'
        ? value
        : (value ? parseFloat(value) : '')
    });
  };

  const sharedInputStyles = {
    input: { backgroundColor: 'var(--light-green)', color: 'text-white', borderColor: 'var(--dark-green)' },
    label: { color: 'var(--text-black)' }
  };

  const reset = () => {
    setNutritionData(null);
    setPreview('');
    setImage(null);
    setRawText('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    stopCamera();
  };

  return (
    <div className="min-h-screen bg-[var(--light-green)] py-8">
      <HeaderMegaMenu onLogoClick={reset} />
      <div className="max-w-6xl mx-auto mt-5 px-4">
        <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
          {/* CHANGED: Added navigateOnClick prop to navigate to table page on click */}
          <SideBar navigateOnClick={true} />
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h1 className="text-3xl font-bold text-[var(--dark-green)]">Scan Nutrition Label</h1>
            </div>
            <p className="text-[var(--dark-green)]">Take or upload a photo of a nutrition label</p>

            <div className="space-y-6">
              {/* Camera/Upload Section */}
              <div className="bg-[var(--light-green)]-lg shadow-md p-6 border border-[var(--dark-green)]">
                {cameraActive ? (
                  <div className="space-y-4">
                    <div className="relative bg-black rounded-lg overflow-hidden" style={{ minHeight: '400px' }}>
                      <video ref={videoRef} autoPlay playsInline muted className="w-full h-auto rounded-lg" />
                    </div>
                    <canvas ref={canvasRef} className="hidden" />
                    <div className="flex gap-3">
                      <button
                        onClick={capturePhoto}
                        className="flex-1 bg-[var(--light-green)] border border-[var(--dark-green)] text-[var(--dark-green)] px-6 py-3 rounded-lg hover:bg-white font-medium transition"
                      >
                        Capture Photo
                      </button>
                      <button
                        onClick={stopCamera}
                        className="px-6 py-3 bg-[var(--light-green)] border border-[var(--dark-green)] text-[var(--dark-green)] rounded-lg hover:bg-white font-medium transition"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : preview ? (
                  <div className="space-y-4">
                    <img src={preview} alt="Preview" className="max-w-full h-auto mx-auto rounded-lg shadow-sm" style={{ maxHeight: '400px' }} />
                    <div className="flex gap-3">
                      <button
                        onClick={startCamera}
                        className="flex-1 bg-[var(--light-green)] border border-[var(--dark-green)] text-[var(--dark-green)] font-medium py-2 rounded-lg hover:bg-white transition"
                      >
                        Retake
                      </button>
                      <button
                        onClick={() => fileInputRef.current?.click()}
                        className="flex-1 bg-[var(--light-green)] border border-[var(--dark-green)] text-[var(--dark-green)] font-medium py-2 rounded-lg hover:bg-white transition"
                      >
                        Upload Different
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="border-2 border-dashed border-[var(--dark-green)] rounded-lg p-8 space-y-6">

                    <FaCamera className="mx-auto h-12 w-12 text-[var(--dark-green)]" />

                    <div className="flex flex-col sm:flex-row gap-3 justify-center">
                      <button
                        onClick={startCamera}
                        className="bg-[var(--light-green)] border border-[var(--dark-green)] text-[var(--dark-green)] px-6 py-3 rounded-lg hover:bg-white"
                      >
                        Take Photo
                      </button>
                      <button
                        onClick={() => fileInputRef.current?.click()}
                        className="bg-[var(--light-green)] border border-[var(--dark-green)] text-[var(--dark-green)] px-6 py-3 rounded-lg hover:bg-white"
                      >
                        Upload Photo
                      </button>
                    </div>
                  </div>
                )}

                <input ref={fileInputRef} type="file" onChange={handleImageCapture} accept="image/*" className="hidden" />

                {preview && !nutritionData && (
                  <button
                    onClick={handleScan}
                    disabled={scanning}
                    className="w-full mt-6 bg-[var(--light-green)] border border-[var(--dark-green)] text-[var(--dark-green)] px-6 py-3 rounded-lg hover:bg-white disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {scanning ? 'Scanning...' : 'Scan Label'}
                  </button>
                )}
              </div>

              {/* Nutrition Data Form */}
              {nutritionData && (
                <div className="bg-[var(--light-green)]-lg shadow-md p-6 space-y-4 border border-[var(--dark-green)]">
                  <h2 className="text-xl font-bold text-[var(--dark-green)]">Extracted Nutrition Information</h2>
                  <p className="text-sm text-[var(--dark-green)]">Review and edit the information before saving</p>

                  <TextInput
                    label="Food Name"
                    placeholder="Enter food name"
                    required
                    radius="md"
                    value={nutritionData.food_name}
                    onChange={(e) => updateField('food_name', e.target.value)}
                    styles={{
                      input: { backgroundColor: 'var(--light-green)', color: 'text-white', borderColor: 'var(--dark-green)' },
                      label: { color: 'var(--text-black)' }
                    }}
                  />

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <TextInput
                        label="Serving Size"
                        type="number"
                        radius="md"
                        value={nutritionData.serving_size}
                        onChange={(e) => updateField('serving_size', e.target.value)}
                        styles={sharedInputStyles}
                      />
                    </div>
                    <div>
                      <TextInput
                        label="Serving Unit"
                        type="text"
                        placeholder="cup, g, slice"
                        radius="md"
                        value={nutritionData.serving_unit}
                        onChange={(e) => updateField('serving_unit', e.target.value)}
                        styles={sharedInputStyles}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 pt-4 border-t border-[var(--dark-green)]">
                    <div>
                      <TextInput
                        label="Calories"
                        type="number"
                        radius="md"
                        value={nutritionData.calories}
                        onChange={(e) => updateField('calories', e.target.value)}
                        styles={sharedInputStyles}
                      />
                    </div>
                    <div>
                      <TextInput
                        label="Protein (g)"
                        type="number"
                        radius="md"
                        value={nutritionData.protein}
                        onChange={(e) => updateField('protein', e.currentTarget.value)}
                        styles={sharedInputStyles}
                      />
                    </div>
                    <div>
                      <TextInput
                        label="Carbs (g)"
                        type="number"
                        radius="md"
                        value={nutritionData.carbs}
                        onChange={(e) => updateField('carbs', e.target.value)}
                        styles={sharedInputStyles}
                      />
                    </div>
                    <div>
                      <TextInput
                        label="Sugars (g)"
                        type="number"
                        radius="md"
                        value={nutritionData.sugars}
                        onChange={(e) => updateField('sugars', e.target.value)}
                        styles={sharedInputStyles}
                      />
                    </div>
                  </div>

                  <div className="flex gap-4 pt-4">
                    <button
                      onClick={handleSave}
                      disabled={saving}
                      className="flex-1 bg-[var(--light-green)] border border-[var(--dark-green)] text-[var(--dark-green)] px-6 py-3 rounded-lg hover:bg-white disabled:opacity-50 disabled:cursor-not-allowed font-medium transition"
                    >
                      {saving ? 'Saving...' : 'Save'}
                    </button>
                    <button
                      onClick={reset}
                      className="flex-1 bg-[var(--light-green)] border border-[var(--dark-green)] text-[var(--dark-green)] px-6 py-3 rounded-lg hover:bg-white font-medium transition"
                    >
                      Cancel
                    </button>
                  </div>

                  {/* Raw Text Debug (For Dev Info)*/}
                  {rawText && (
                    <details className="mt-6 border-t border-[var(--dark-green)] pt-4">
                      <summary className="text-sm text-[var(--dark-green)] cursor-pointer hover:text-[var(--dark-green)]">
                        View raw extracted text
                      </summary>
                      <pre className="mt-2 text-xs bg-white p-4 rounded border border-[var(--dark-green)] overflow-x-auto text-[var(--dark-green)]">
                        {rawText}
                      </pre>
                    </details>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}