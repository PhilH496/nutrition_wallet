'use client';

import { TextInput } from '@mantine/core';
import { Dispatch, SetStateAction } from 'react';

export interface NutritionData {
  id?: string;
  food_name: string;
  serving_size: number;
  serving_unit: string;
  calories: number;
  protein: number;
  carbs: number;
  sugars: number;
  source?: string;
  consumedAt?: string;
}

interface NutritionFormProps {
  data: NutritionData;
  setData: Dispatch<SetStateAction<NutritionData>>;
  onSave: () => void;
  saving: boolean;
  title?: string;
  showReset?: boolean;
  onReset?: () => void;
}

export default function NutritionForm({
  data,
  setData,
  onSave,
  saving,
  title,
  showReset = true,
  onReset
}: NutritionFormProps) {

  const updateField = (field: keyof NutritionData, value: string) => {
    setData(prev => ({
      ...prev,
      [field]: field === 'food_name' || field === 'serving_unit'
        ? value
        : (value ? parseFloat(value) : '')
    }));
  };

  const sharedInputStyles = {
    input: { backgroundColor: 'var(--light-green)', color: 'text-white', borderColor: 'var(--dark-green)' },
    label: { color: 'var(--text-black)' }
  };

  return (
    <div className="bg-[var(--light-green)]-lg shadow-md p-6 space-y-4 border border-[var(--dark-green)]">
      {title && <h2 className="text-xl font-bold text-[var(--dark-green)]">{title}</h2>}

      <TextInput
        label="Food Name"
        placeholder="Enter food name"
        required
        radius="md"
        value={data.food_name}
        onChange={(e) => updateField('food_name', e.target.value)}
        styles={sharedInputStyles}
      />

      <div className="grid grid-cols-2 gap-4">
        <TextInput
          label="Serving Size"
          type="number"
          radius="md"
          value={data.serving_size}
          onChange={(e) => updateField('serving_size', e.target.value)}
          styles={sharedInputStyles}
        />
        <TextInput
          label="Serving Unit"
          type="text"
          placeholder="cup, g, slice"
          radius="md"
          value={data.serving_unit}
          onChange={(e) => updateField('serving_unit', e.target.value)}
          styles={sharedInputStyles}
        />
      </div>

      <div className="grid grid-cols-2 gap-4 pt-4 border-t border-[var(--dark-green)]">
        <TextInput
          label="Calories"
          type="number"
          radius="md"
          value={data.calories}
          onChange={(e) => updateField('calories', e.target.value)}
          styles={sharedInputStyles}
        />
        <TextInput
          label="Protein (g)"
          type="number"
          radius="md"
          value={data.protein}
          onChange={(e) => updateField('protein', e.target.value)}
          styles={sharedInputStyles}
        />
        <TextInput
          label="Carbs (g)"
          type="number"
          radius="md"
          value={data.carbs}
          onChange={(e) => updateField('carbs', e.target.value)}
          styles={sharedInputStyles}
        />
        <TextInput
          label="Sugars (g)"
          type="number"
          radius="md"
          value={data.sugars}
          onChange={(e) => updateField('sugars', e.target.value)}
          styles={sharedInputStyles}
        />
      </div>

      <div className="flex gap-4 pt-4">
        <button
          onClick={onSave}
          disabled={saving}
          className="flex-1 bg-[var(--forest-green)] border border-[var(--dark-green)] text-[var(--foreground)] px-6 py-3 rounded-lg hover:bg-white hover:text-[var(--dark-green)] disabled:opacity-50 disabled:cursor-not-allowed font-medium transition"
        >
          {saving ? 'Saving...' : 'Save'}
        </button>

        {showReset && onReset && (
          <button
            onClick={onReset}
            className="flex-1 bg-[var(--forest-green)] border border-[var(--dark-green)] text-[var(--foreground)] px-6 py-3 rounded-lg hover:bg-white hover:text-[var(--dark-green)] font-medium transition"
          >
            Cancel
          </button>
        )}
      </div>
    </div>
  );
}