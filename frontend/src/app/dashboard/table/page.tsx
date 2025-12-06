'use client';

import { useState, useCallback, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { HeaderMegaMenu } from '@/components/dashboard/Header';
import { SideBar } from '@/components/dashboard/SideBar';
import FoodLogTable, { FoodEntry } from '@/components/dashboard/Table';

export default function FoodTablePage() {
  const searchParams = useSearchParams();
  const dateFromUrl = searchParams.get('date');
  
  const [selectedDate, setSelectedDate] = useState<string | null>(dateFromUrl);
  const [nutritionGoals, setNutritionGoals] = useState({
    calories: 0,
    protein: 0,
    carbs: 0,
    sugars: 0
  });
  const [sidebarKey, setSidebarKey] = useState(0);
  const [tableKey, setTableKey] = useState(0);

  useEffect(() => {
    if (dateFromUrl) {
      setSelectedDate(dateFromUrl);
    }
  }, [dateFromUrl]);

  const handleDateSelect = useCallback((date: string) => {
    setSelectedDate(date);
  }, []);

  const handleRefresh = useCallback(() => {
    setSidebarKey((prev) => prev + 1);
    setTableKey((prev) => prev + 1);
  }, []);

  const formatDisplayDate = (dateString: string | null) => {
    if (!dateString) return null;
    const [year, month, day] = dateString.split('-').map(Number);
    const localDate = new Date(year, month - 1, day);

    // Format it in Arizona time
    const formatter = new Intl.DateTimeFormat("en-US", {
      timeZone: "America/Phoenix",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    });

    const parts = formatter.formatToParts(localDate);
    const mm = parts.find(p => p.type === "month")!.value;
    const dd = parts.find(p => p.type === "day")!.value;
    const yyyy = parts.find(p => p.type === "year")!.value;

    return `${mm}-${dd}-${yyyy}`;
  };

  return (
    <div className="min-h-screen bg-[var(--lighter-green)] py-8">
      <HeaderMegaMenu />
      <div className="max-w-6xl mx-auto mt-5 px-4">
        <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
          <SideBar 
            onDateSelect={handleDateSelect} 
            onGoalsChange={setNutritionGoals}
            key={sidebarKey} 
          />
          
          <div className="space-y-6 min-w-0">
            <div>
              <h1 className="text-3xl font-bold text-[var(--dark-green)]">Food Log</h1>
              <p className="text-[var(--dark-green)]">
                {selectedDate ? (
                  <>
                    Entries recorded on <strong>{formatDisplayDate(selectedDate)}</strong>.
                  </>
                ) : (
                  'Select a date from the sidebar to view entries.'
                )}
              </p>
            </div>
            <div className="border border-[var(--dark-green)] bg-white/60 p-4 overflow-x-auto">
              <FoodLogTable 
                selectedDate={selectedDate || undefined} 
                nutritionGoals = {nutritionGoals}
                key={tableKey}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}