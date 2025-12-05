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
    const date = new Date(dateString);
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const year = date.getFullYear();
    return `${month}-${day}-${year}`;
  };

  return (
    <div className="min-h-screen bg-[var(--lighter-green)] py-8">
      <HeaderMegaMenu />
      <div className="max-w-6xl mx-auto mt-5 px-4">
        <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
          <SideBar 
            onDateSelect={handleDateSelect} 
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
                key={tableKey}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}