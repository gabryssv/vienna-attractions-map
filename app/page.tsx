'use client';

import { useState } from 'react';
import dynamic from 'next/dynamic';
import AttractionList from '@/components/AttractionList';
import { Attraction } from '@/data/attractions';

// Dynamic import for ViennaMap to avoid SSR issues with Leaflet
const ViennaMap = dynamic(() => import('@/components/ViennaMap'), {
  ssr: false,
  loading: () => (
    <div className="h-full w-full bg-black border border-zinc-800 rounded-lg flex items-center justify-center">
      <div className="text-zinc-400 font-mono text-sm">Ładowanie mapy...</div>
    </div>
  )
});

export default function Home() {
  const [selectedAttraction, setSelectedAttraction] = useState<Attraction | null>(null);

  return (
    <div className="h-screen bg-black text-white font-mono flex flex-col overflow-hidden">
      {/* Header */}
      <header className="border-b border-zinc-800 flex-shrink-0">
        <div className="px-6 py-4">
          <h1 className="text-xl lg:text-2xl font-mono font-bold text-white mb-1">
            Mapa Atrakcji Turystycznych Wiednia
          </h1>
          <p className="text-zinc-400 text-xs lg:text-sm">
            Interaktywna mapa prezentująca najważniejsze atrakcje historyczne i turystyczne Wiednia
          </p>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex flex-col lg:flex-row gap-4 p-4 min-h-0">
        {/* Attractions List - Sidebar */}
        <div className="w-full lg:w-80 flex-shrink-0 order-2 lg:order-1">
          <AttractionList
            selectedAttraction={selectedAttraction}
            onAttractionSelect={setSelectedAttraction}
          />
        </div>

        {/* Map */}
        <div className="flex-1 order-1 lg:order-2 min-h-[300px] lg:min-h-0">
          <ViennaMap selectedAttraction={selectedAttraction} />
        </div>
      </main>
    </div>
  );
}
