'use client';

import { useState, useEffect } from 'react';
import { Checkbox, ScrollArea, Table } from '@mantine/core';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

interface FoodEntry {
  id: string;
  foodName: string;
  servingSize: number;
  servingUnit: string;
  calories: number;
  protein: number;
  carbs: number;
  sugar: number;
  source: string;
  consumedAt: string;
}

export interface FoodLogTableProps {
  selectedDate?: string; // Format: YYYY-MM-DD
}

export default function FoodLogTable({ selectedDate }: FoodLogTableProps) {
  const [selection, setSelection] = useState<string[]>([]);
  const [foodHistory, setFoodHistory] = useState<FoodEntry[]>([]);
  const [loading, setLoading] = useState(true);
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
              foodName: log.nutrition_facts?.food_name || 'Unknown',
              servingSize: log.nutrition_facts?.serving_size || 0,
              servingUnit: log.nutrition_facts?.serving_unit || '',
              calories: log.nutrition_facts?.calories || 0,
              protein: log.nutrition_facts?.protein || 0,
              carbs: log.nutrition_facts?.carbs || 0,
              sugar: log.nutrition_facts?.sugars || 0,
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

  const rows = foodHistory.map((record) => {
    const rowSelected = selection.includes(record.id);
    return (
      <Table.Tr key={record.id} className={rowSelected ? 'bg-white/25' : undefined}>
        <Table.Td>
          <Checkbox checked={rowSelected} onChange={() => toggleRow(record.id)} variant='outline' color='var(--dark-green)' iconColor='var(--dark-green)' />
        </Table.Td>
        <Table.Td>{record.foodName}</Table.Td>
        <Table.Td>{record.servingSize}</Table.Td>
        <Table.Td>{record.servingUnit}</Table.Td>
        <Table.Td>{record.calories}</Table.Td>
        <Table.Td>{record.protein.toFixed(1)}</Table.Td>
        <Table.Td>{record.carbs.toFixed(1)}</Table.Td>
        <Table.Td>{record.sugar.toFixed(1)}</Table.Td>
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

  return (
    <div className="rounded-[28px] border border-[var(--dark-green)] bg-[var(--light-green)] p-4">
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
    </div>
  );
}