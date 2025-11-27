'use client';

import { useState } from 'react';
import { Checkbox, ScrollArea, Table } from '@mantine/core';

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
}

const foodHistory: FoodEntry[] = [
  {
    id: 'banana',
    foodName: 'Banana',
    servingSize: 1,
    servingUnit: 'medium (118 g)',
    calories: 105,
    protein: 1.3,
    carbs: 27,
    sugar: 14,
    source: 'USDA FoodData Central',
  },
  {
    id: 'greek-yogurt',
    foodName: 'Greek Yogurt',
    servingSize: 1,
    servingUnit: 'cup (6 oz)',
    calories: 100,
    protein: 17,
    carbs: 6,
    sugar: 6,
    source: 'Brand nutrition label',
  },
  {
    id: 'oatmeal',
    foodName: 'Oatmeal',
    servingSize: 0.5,
    servingUnit: 'cup, dry',
    calories: 150,
    protein: 5.4,
    carbs: 27,
    sugar: 0.6,
    source: 'Homemade mix',
  },
  {
    id: 'almonds',
    foodName: 'Almonds',
    servingSize: 1,
    servingUnit: 'ounce (28 g)',
    calories: 164,
    protein: 6,
    carbs: 6.1,
    sugar: 1.2,
    source: 'USDA FoodData Central',
  },
];

export default function FoodLogTable() {
  const [selection, setSelection] = useState<string[]>([]);

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
        <Table.Td>{record.source}</Table.Td>
      </Table.Tr>
    );
  });

  return (
    <div className="rounded-[28px] border border-[var(--dark-green)] bg-[var(--light-green)] p-4">
      <ScrollArea
        className="rounded-[20px]"
        styles={{ viewport: { backgroundColor: 'var(--light-green)' } }}
      >
        <Table miw={900} verticalSpacing="sm" className="bg-transparent text-[var(--dark-green)]">
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
              <Table.Th>Source</Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>{rows}</Table.Tbody>
        </Table>
      </ScrollArea>
    </div>
  );
}