'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

interface Food {
  id: string;
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
  created_at: string;
}

export default function FoodsPage() {
  const [foods, setFoods] = useState<Food[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    fetchFoods();
  }, []);

  const fetchFoods = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:8000/foods/', {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      const data = await response.json();
      if (data.success) {
        setFoods(data.data);
      }
    } catch (error) {
      console.error('Error fetching foods:', error);
      alert('Error loading foods');
    } finally {
      setLoading(false);
    }
  };

  const deleteFood = async (id: string) => {
    if (!confirm('Delete this food item?')) return;

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:8000/foods/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      const data = await response.json();
      if (data.success) {
        setFoods(foods.filter(f => f.id !== id));
      }
    } catch (error) {
      alert('Error deleting food');
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-600">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">My Foods</h1>
            <p className="text-gray-600 mt-1">{foods.length} items scanned</p>
          </div>
          <button
            onClick={() => router.push('/dashboard')}
            className="text-gray-600 hover:text-gray-900"
          >
            ← Back to Dashboard
          </button>
        </div>

        {foods.length === 0 ? (
          <div className="bg-white rounded-lg shadow-md p-12 text-center">
            <svg className="mx-auto h-16 w-16 text-gray-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
            </svg>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No foods scanned yet</h3>
            <p className="text-gray-600 mb-6">Start by scanning your first nutrition label!</p>
            <button
              onClick={() => router.push('/dashboard/scan')}
              className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 font-medium"
            >
              Scan Nutrition Label
            </button>
          </div>
        ) : (
          <div className="grid gap-4">
            {foods.map((food) => (
              <div key={food.id} className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-xl font-bold text-gray-900">
                      {food.name || 'Unnamed Food'}
                    </h3>
                    <p className="text-sm text-gray-500 mt-1">
                      {food.serving_size || 'Serving size not specified'} • Added {formatDate(food.created_at)}
                    </p>
                  </div>
                  <button
                    onClick={() => deleteFood(food.id)}
                    className="text-red-600 hover:text-red-700 text-sm font-medium"
                  >
                    Delete
                  </button>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t">
                  <div>
                    <p className="text-sm text-gray-600">Calories</p>
                    <p className="text-lg font-semibold text-gray-900">
                      {food.calories !== null ? `${food.calories}` : '—'}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Protein</p>
                    <p className="text-lg font-semibold text-gray-900">
                      {food.protein !== null ? `${food.protein}g` : '—'}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Total Fat</p>
                    <p className="text-lg font-semibold text-gray-900">
                      {food.total_fat !== null ? `${food.total_fat}g` : '—'}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Total Carbs</p>
                    <p className="text-lg font-semibold text-gray-900">
                      {food.total_carbs !== null ? `${food.total_carbs}g` : '—'}
                    </p>
                  </div>
                </div>

                <details className="mt-4">
                  <summary className="text-sm text-blue-600 cursor-pointer hover:text-blue-700 font-medium">
                    View full nutrition details
                  </summary>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mt-4 pt-4 border-t text-sm">
                    <div>
                      <span className="text-gray-600">Saturated Fat:</span>
                      <span className="ml-2 font-medium">{food.saturated_fat !== null ? `${food.saturated_fat}g` : '—'}</span>
                    </div>
                    <div>
                      <span className="text-gray-600">Trans Fat:</span>
                      <span className="ml-2 font-medium">{food.trans_fat !== null ? `${food.trans_fat}g` : '—'}</span>
                    </div>
                    <div>
                      <span className="text-gray-600">Cholesterol:</span>
                      <span className="ml-2 font-medium">{food.cholesterol !== null ? `${food.cholesterol}mg` : '—'}</span>
                    </div>
                    <div>
                      <span className="text-gray-600">Sodium:</span>
                      <span className="ml-2 font-medium">{food.sodium !== null ? `${food.sodium}mg` : '—'}</span>
                    </div>
                    <div>
                      <span className="text-gray-600">Fiber:</span>
                      <span className="ml-2 font-medium">{food.fiber !== null ? `${food.fiber}g` : '—'}</span>
                    </div>
                    <div>
                      <span className="text-gray-600">Sugar:</span>
                      <span className="ml-2 font-medium">{food.sugar !== null ? `${food.sugar}g` : '—'}</span>
                    </div>
                  </div>
                </details>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}