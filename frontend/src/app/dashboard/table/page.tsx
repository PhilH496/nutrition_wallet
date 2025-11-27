'use client';

import { HeaderMegaMenu } from '@/components/dashboard/Header';
import { SideBar } from '@/components/dashboard/SideBar';
import FoodLogTable from '@/components/dashboard/Table';

export default function FoodTablePage() {
  return (
    <div className="min-h-screen bg-[var(--light-green)] py-8">
      <HeaderMegaMenu />
      <div className="max-w-6xl mx-auto mt-5 px-4">
        <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
          <SideBar />
          <div className="space-y-6">
            <div>
              <h1 className="text-3xl font-bold text-[var(--dark-green)]">Food Log</h1>
              <p className="text-[var(--dark-green)]">
                Entries recorded on <strong>01-02-2024</strong>.
              </p>
            </div>
            <div className="border border-[var(--dark-green)] bg-white/60 p-4">
              <FoodLogTable />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}