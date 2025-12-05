'use client';

import { useState, useEffect } from 'react';
import { Checkbox, ScrollArea, Table, TextInput } from '@mantine/core';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

export interface FoodEntry {
  id: string;
  nutrition_id: string;
  food_name: string;
  serving_size: number;
  serving_unit: string;
  calories: number;
  protein: number;
  carbs: number;
  sugars: number;
  source: string;
  consumedAt: string;
}

export interface FoodLogTableProps {
  selectedDate?: string; // Format: YYYY-MM-DD
  onSelectionChange?: (selectedIds: string[], selectedItems: FoodEntry[]) => void;
}

export default function FoodLogTable({ selectedDate, onSelectionChange, }: FoodLogTableProps) {
  const [selection, setSelection] = useState<string[]>([]);
  const [foodHistory, setFoodHistory] = useState<FoodEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [showEdit, setShowEdit] = useState(false);
  const [saving, setSaving] = useState(false);
  const [selectedFood, setSelectedFood] = useState<FoodEntry>({
    id: '',
    nutrition_id: '',
    food_name: '',
    serving_size: 0,
    serving_unit: '',
    calories: 0,
    protein: 0,
    carbs: 0,
    sugars: 0,
    source: '',
    consumedAt: ''
  });
  const supabase = createClientComponentClient();

  useEffect(() => {
    async function fetchNutritionLogs() {
      if (!selectedDate) {
        setFoodHistory([]);
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        
        const { data: { user } } = await supabase.auth.getUser();
        
        if (!user) {
          console.error('No user logged in');
          setFoodHistory([]);
          setLoading(false);
          return;
        }

        const { data, error } = await supabase
          .from('user_nutrition_log')
          .select(`
            log_id,
            consumed_at,
            nutrition_facts (
              nutrition_id,
              food_name,
              serving_size,
              serving_unit,
              calories,
              protein,
              carbs,
              sugars,
              source
            )
          `)
          .eq('user_id', user.id)
          .gte('consumed_at', `${selectedDate}T00:00:00.000Z`)
          .lt('consumed_at', `${selectedDate}T23:59:59.999Z`)
          .order('consumed_at', { ascending: false });

        if (error) {
          console.error('Error fetching nutrition logs:', error);
          setFoodHistory([]);
        } else {
          const transformedData: FoodEntry[] = (data || []).map((log: any) => {
            const consumedDate = new Date(log.consumed_at);
            const formattedTime = consumedDate.toLocaleString('en-US', {
              month: '2-digit',
              day: '2-digit',
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
              hour12: true
            });

            return {
              id: log.log_id,
              nutrition_id: log.nutrition_facts?.nutrition_id || '',
              food_name: log.nutrition_facts?.food_name || 'Unknown',
              serving_size: log.nutrition_facts?.serving_size || 0,
              serving_unit: log.nutrition_facts?.serving_unit || '',
              calories: log.nutrition_facts?.calories || 0,
              protein: log.nutrition_facts?.protein || 0,
              carbs: log.nutrition_facts?.carbs || 0,
              sugars: log.nutrition_facts?.sugars || 0,
              source: log.nutrition_facts?.source || 'Unknown',
              consumedAt: formattedTime
            };
          });
          
          setFoodHistory(transformedData);
        }
      } catch (err) {
        console.error('Unexpected error:', err);
        setFoodHistory([]);
      } finally {
        setLoading(false);
      }
    }

    fetchNutritionLogs();
  }, [selectedDate, supabase]);

  const toggleRow = (id: string) =>
    setSelection((current) =>
      current.includes(id) ? current.filter((item) => item !== id) : [...current, id]
    );

  const toggleAll = () =>
    setSelection((current) =>
      current.length === foodHistory.length ? [] : foodHistory.map((item) => item.id)
    );

  useEffect(() => {
  if (onSelectionChange) {
      const selectedItems = foodHistory.filter(item => selection.includes(item.id));
      onSelectionChange(selection, selectedItems);
    }
  }, [selection, foodHistory]);

  const rows = foodHistory.map((record) => {
    const rowSelected = selection.includes(record.id);
    return (
      <Table.Tr key={record.id} className={rowSelected ? 'bg-white/25' : undefined}>
        <Table.Td>
          <Checkbox checked={rowSelected} onChange={() => toggleRow(record.id)} variant='outline' color='var(--dark-green)' iconColor='var(--dark-green)' />
        </Table.Td>
        <Table.Td>{record.food_name}</Table.Td>
        <Table.Td>{record.serving_size}</Table.Td>
        <Table.Td>{record.serving_unit}</Table.Td>
        <Table.Td>{record.calories}</Table.Td>
        <Table.Td>{record.protein.toFixed(1)}</Table.Td>
        <Table.Td>{record.carbs.toFixed(1)}</Table.Td>
        <Table.Td>{record.sugars.toFixed(1)}</Table.Td>
        <Table.Td>{record.consumedAt}</Table.Td>
        <Table.Td>{record.source}</Table.Td>
      </Table.Tr>
    );
  });

  if (loading) {
    return (
      <div className="rounded-[28px] border border-[var(--dark-green)] bg-[var(--light-green)] p-4">
        <div className="text-center text-[var(--dark-green)] py-8">Loading...</div>
      </div>
    );
  }

  if (!selectedDate || foodHistory.length === 0) {
    return (
      <div className="rounded-[28px] border border-[var(--dark-green)] bg-[var(--light-green)] p-4">
        <div className="text-center text-[var(--dark-green)] py-8">
          {!selectedDate ? 'Select a date to view nutrition logs' : 'No nutrition logs found for this date'}
        </div>
      </div>
    );
  }

  const sharedInputStyles = {
    input: { backgroundColor: 'var(--light-green)', color: 'text-white', borderColor: 'var(--dark-green)' },
    label: { color: 'var(--text-black)' }
  };

  const deleteLogs = async () => {
    if (!selection) {
      alert("Please select an entry(s)")
      return;
    }

    try {
      console.log(JSON.stringify(selection))
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:8000/modify/delete-log', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(selection)
      });

      const data = await response.json();
      if (data.success) {
        alert('Log(s) deleted successfully!');
        setFoodHistory((prev) => prev.filter((item) => !selection.includes(item.id)));
        setSelection([]);
      } else {
        alert(data.detail);
      }
    } catch (error) {
      alert('Error deleting log(s)');
    }
  }

  const editFact = () => {
    if (!selection) return;
    if (selection.length === 0) {
      alert("Please select an entry");
      return;
    } 
    if (selection.length > 1) {
      alert("Please edit only one entry at a time");
      return;
    }

    const selected = foodHistory.find(item => item.id === selection[0])
    if (!selected) return;
    setSelectedFood(selected);
    setShowEdit(true);
  };

  const updateEditField = (field: keyof FoodEntry, value: string) => {
    setSelectedFood(prev => ({
      ...prev,
      [field]: field === 'id'  || field === 'nutrition_id'|| field === 'food_name' || field === 'serving_unit' || field === 'source' || field === 'consumedAt'
        ? value
        : (value ? parseFloat(value) : '')
    }));
  };

  const reset = () => {
    setShowEdit(false)
  };

  const handleEditSave = async () => {
    if (!selectedFood?.food_name) {
      alert('Enter a food name before saving.')
      return;
    }
    if (!selectedFood) return;
    setSaving(true);

    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:8000/modify/edit-food', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({...selectedFood, source: "manual"})
      });

      const data = await response.json();
      if (data.success) {
        alert('Food edited successfully!');
        reset();
        // CHANGED: Navigate to table page and force full page reload to refresh data
        window.location.href = `/dashboard/table?date=${selectedDate}`;
      } else {
        alert(data.detail);
      }
    } catch (error) {
      alert('Error editing food');
    } finally {
      setShowEdit(false);
      setSaving(false);
    }
  };

  return (
    <div className="rounded-[28px] border border-[var(--dark-green)] bg-[var(--lighter-green)] p-4">
      <button
        onClick={editFact}
        className="flex-1 bg-[var(--forest-green)] border border-[var(--dark-green)] text-[var(--foreground)] px-6 py-2 rounded-lg hover:bg-white hover:text-[var(--dark-green)] font-medium transition mb-[5px] ms-[550px]"
      >
        Edit
      </button>
      <button
        onClick={deleteLogs}
        className="flex-1 bg-[var(--forest-green)] border border-[var(--dark-green)] text-[var(--foreground)] px-6 py-2 rounded-lg hover:bg-white hover:text-[var(--dark-green)] font-medium transition ms-[10px]"
      >
        Delete
      </button>
      <ScrollArea
        className="rounded-[20px]"
        styles={{ viewport: { backgroundColor: 'var(--light-green)' } }}
      >
        <Table miw={1000} verticalSpacing="sm" className="bg-transparent text-[var(--dark-green)]">
          <Table.Thead className="bg-[var(--light-green)]">
            <Table.Tr>
              <Table.Th w={50}>
                <Checkbox
                  onChange={toggleAll}
                  checked={selection.length === foodHistory.length}
                  indeterminate={
                    selection.length > 0 && selection.length < foodHistory.length
                  }
                  variant='outline'
                  color='var(--dark-green)'
                  iconColor='var(--dark-green)'
                />
              </Table.Th>
              <Table.Th>Food Name</Table.Th>
              <Table.Th>Serving Size</Table.Th>
              <Table.Th>Serving Unit</Table.Th>
              <Table.Th>Calories</Table.Th>
              <Table.Th>Protein (g)</Table.Th>
              <Table.Th>Carbs (g)</Table.Th>
              <Table.Th>Sugar (g)</Table.Th>
              <Table.Th>Consumed At</Table.Th>
              <Table.Th>Source</Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>{rows}</Table.Tbody>
        </Table>
      </ScrollArea>

      {showEdit && (
        <div>
          <div className="flex items-center justify-between mt-10">
            <h1 className="text-3xl font-bold text-[var(--dark-green)]">Edit the Nutrition Label</h1>
          </div>

          <div className="bg-[var(--light-green)]-lg shadow-md p-6 space-y-4 border border-[var(--dark-green)]">
          <TextInput
            label="Food Name"
            placeholder="Enter food name"
            required
            radius="md"
            value= {selectedFood.food_name}
            onChange={(e) => updateEditField('food_name', e.target.value)}
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
                value= {selectedFood.serving_size}
                onChange={(e) => updateEditField('serving_size', e.target.value)}
                styles={sharedInputStyles}
              />
            </div>
            <div>
              <TextInput
                label="Serving Unit"
                type="text"
                placeholder="cup, g, slice"
                radius="md"
                value= {selectedFood.serving_unit}
                onChange={(e) => updateEditField('serving_unit', e.target.value)}
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
                value= {selectedFood.calories}
                onChange={(e) => updateEditField('calories', e.target.value)}
                styles={sharedInputStyles}
              />
            </div>
            <div>
              <TextInput
                label="Protein (g)"
                type="number"
                radius="md"
                value= {selectedFood.protein}
                onChange={(e) => updateEditField('protein', e.currentTarget.value)}
                styles={sharedInputStyles}
              />
            </div>
            <div>
              <TextInput
                label="Carbs (g)"
                type="number"
                radius="md"
                value= {selectedFood.carbs}
                onChange={(e) => updateEditField('carbs', e.target.value)}
                styles={sharedInputStyles}
              />
            </div>
            <div>
              <TextInput
                label="Sugars (g)"
                type="number"
                radius="md"
                value= {selectedFood.sugars}
                onChange={(e) => updateEditField('sugars', e.target.value)}
                styles={sharedInputStyles}
              />
            </div>
          </div>
          <div className="flex gap-4 pt-4">
            <button
              onClick={handleEditSave}
              disabled={saving}
              className="flex-1 bg-[var(--forest-green)] border border-[var(--dark-green)] text-[var(--foreground)] px-6 py-3 rounded-lg hover:bg-white hover:text-[var(--dark-green)] disabled:opacity-50 disabled:cursor-not-allowed font-medium transition"
            >
              {saving ? 'Saving...' : 'Save'}
            </button>
            <button
              onClick={reset}
              className="flex-1 bg-[var(--forest-green)] border border-[var(--dark-green)] text-[var(--foreground)] px-6 py-3 rounded-lg hover:bg-white hover:text-[var(--dark-green)] font-medium transition"
            >
              Cancel
            </button>
          </div>
        </div>

        </div>
      )}
    </div>
  );
}