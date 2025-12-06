'use client';

import { useState, useEffect } from 'react';
import { ScrollArea, Text } from '@mantine/core';
import { LinksGroup } from './SidebarLinksGroup';
import { FaUtensils } from "react-icons/fa";
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

interface NutritionLog {
  log_id: string;
  consumed_at: string;
  nutrition_facts: {
    nutrition_id: string;
    food_name: string;
    calories: number;
  } | null;
}

interface SupabaseNutritionLog {
  log_id: string;
  consumed_at: string;
  nutrition_facts: {
    nutrition_id: string;
    food_name: string;
    calories: number;
  }[] | null;
}

export interface NutritionGoals {
  calories: number;
  protein: number;
  carbs: number;
  sugars: number;
}

interface SidebarDate {
  label: string;
  icon: typeof FaUtensils;
  links?: { label: string; link: string; date: string }[];
}

interface SideBarProps {
  onDateSelect?: (date: string) => void;
  onGoalsChange?: (goals: NutritionGoals) => void;
  navigateOnClick?: boolean;
}

export function SideBar({ onDateSelect, onGoalsChange, navigateOnClick = false }: SideBarProps) {
  const [sidebarData, setSidebarData] = useState<SidebarDate[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClientComponentClient();
  const [goals, setGoals] = useState<NutritionGoals>({
    calories: 0,
    protein: 0,
    carbs: 0,
    sugars: 0
  });

  useEffect(() => {
    if (onGoalsChange) onGoalsChange(goals);
  }, [goals, onGoalsChange]);

  const updateGoal = (field: keyof NutritionGoals, value: string) => {
    setGoals(prev => ({
      ...prev,
      [field]: value === '' ? '' : parseFloat(value)
    }));
  };

  useEffect(() => {
    async function fetchUserNutritionDates() {
      try {
        setLoading(true);
        
        const { data: { user } } = await supabase.auth.getUser();
        
        if (!user) {
          console.error('No user logged in');
          setSidebarData([]);
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
              calories
            )
          `)
          .eq('user_id', user.id)
          .order('consumed_at', { ascending: false });

        if (error) {
          console.error('Error fetching nutrition dates:', error);
          setSidebarData([]);
          setLoading(false);
          return;
        }

        const dateMap = new Map<string, Array<{ label: string; link: string; date: string }>>();

        (data || []).forEach((log: NutritionLog) => {
          const dateKey = log.consumed_at.split('T')[0];
          
          if (!dateMap.has(dateKey)) {
            dateMap.set(dateKey, []);
          }
          
          dateMap.get(dateKey)?.push({
            label: `${log.nutrition_facts?.food_name || 'Unknown'}: ${log.nutrition_facts?.calories || 0} cal`,
            link: `/dashboard/table?date=${dateKey}`,
            date: dateKey
          });
        });

        const formattedData: SidebarDate[] = Array.from(dateMap.entries()).map(([dateKey, foods]) => {
          const [year, month, day] = dateKey.split('-').map(Number);
          const displayDate = `${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}-${year}`;
          
          return {
            label: displayDate,
            icon: FaUtensils,
            links: foods.length > 0 ? foods : undefined
          };
        });

        setSidebarData(formattedData);
      } catch (err) {
        console.error('Unexpected error:', err);
        setSidebarData([]);
      } finally {
        setLoading(false);
      }
    }

    fetchUserNutritionDates();
  }, [supabase]);

  const links = sidebarData.map((item) => (
    <LinksGroup 
      {...item} 
      key={item.label} 
      onDateSelect={onDateSelect || undefined}
      navigateOnClick={navigateOnClick}
    />
  ));

  return (
    <nav>
      <div className='border-r border-[var(--dark-green)]'>
        <div className='mr-2 border-b border-[var(--dark-green)]'>
          <Text className="text-[var(--dark-green)] text-3xl font-bold">
            History
          </Text>
        </div>
        <ScrollArea h={500} type="never">
          {loading ? (
            <div className="text-center text-[var(--dark-green)] py-4">Loading...</div>
          ) : sidebarData.length === 0 ? (
            <div className="text-center text-[var(--dark-green)] py-4">No nutrition logs found</div>
          ) : (
            <div>{links}</div>
          )}
        </ScrollArea>

        <div className='mr-2 border-b border-[var(--dark-green)]'>
          <Text className="text-[var(--dark-green)] text-3xl font-bold">
            Daily Nutrition Goals
          </Text>
        </div>
        <div className=" mt-2 mr-2 p-4 rounded-lg border border-[var(--dark-green)] bg-[var(--lighter-green)] text-[var(--dark-green)]">
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-sm">Calories</label>
              <input
                type="number"
                value={goals.calories}
                onChange={(e) => updateGoal('calories', e.target.value)}
                className="w-full rounded border border-[var(--dark-green)] p-1"
              />
            </div>
            <div>
              <label className="block text-sm">Protein (g)</label>
              <input
                type="number"
                value={goals.protein}
                onChange={(e) => updateGoal('protein', e.target.value)}
                className="w-full rounded border border-[var(--dark-green)] p-1"
              />
            </div>
            <div>
              <label className="block text-sm">Carbs (g)</label>
              <input
                type="number"
                value={goals.carbs}
                onChange={(e) => updateGoal('carbs', e.target.value)}
                className="w-full rounded border border-[var(--dark-green)] p-1"
              />
            </div>
            <div>
              <label className="block text-sm">Sugars (g)</label>
              <input
                type="number"
                value={goals.sugars}
                onChange={(e) => updateGoal('sugars', e.target.value)}
                className="w-full rounded border border-[var(--dark-green)] p-1"
              />
            </div>
          </div>
        </div>
      </div>
    </nav>
    
  );
}