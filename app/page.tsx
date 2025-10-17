'use client';

import { useState } from 'react';
import dynamic from 'next/dynamic';
import RouteSelector from '@/components/RouteSelector';
import { Attraction } from '@/data/attractions';

// Dynamic import for ViennaMap to avoid SSR issues with Leaflet
const ViennaMap = dynamic(() => import('@/components/ViennaMap'), {
  ssr: false,
  loading: () => (
    <div className="h-full w-full bg-black border border-neutral-800 rounded-lg flex items-center justify-center">
      <div className="text-neutral-400 font-mono text-sm">Ładowanie mapy...</div>
    </div>
  )
});

export default function Home() {
  const [selectedAttraction, setSelectedAttraction] = useState<Attraction | null>(null);
  const [routePointA, setRoutePointA] = useState<Attraction | null>(null);
  const [routePointB, setRoutePointB] = useState<Attraction | null>(null);

  const handleRouteSelect = (pointA: Attraction | null, pointB: Attraction | null) => {
    setRoutePointA(pointA);
    setRoutePointB(pointB);
    // Clear normal selection when in route mode
    if (pointA || pointB) {
      setSelectedAttraction(null);
    }
  };

  return (
    <div className="bg-black text-white font-mono">
      {/* Main viewport content - exactly screen height */}
      <div className="h-screen flex flex-col overflow-hidden">
        {/* Header */}
        <header className="border-b border-neutral-800 flex-shrink-0">
          <div className="px-6 py-4">
            <h1 className="text-xl lg:text-2xl font-mono font-bold text-white mb-1">
              Mapa Atrakcji Turystycznych Wiednia
            </h1>
            <p className="text-neutral-400 text-xs lg:text-sm">
              Interaktywna mapa prezentująca najważniejsze atrakcje historyczne i turystyczne Wiednia
            </p>
          </div>
        </header>

        {/* Main Content - takes remaining screen space */}
        <main className="flex-1 flex flex-col lg:flex-row gap-4 p-4 min-h-0">
          {/* Route Selector / Attractions List - Sidebar */}
          <div className="w-full lg:w-80 flex-shrink-0 order-2 lg:order-1">
            <RouteSelector
              onRouteSelect={handleRouteSelect}
              onAttractionSelect={setSelectedAttraction}
              pointA={routePointA}
              pointB={routePointB}
              selectedAttraction={selectedAttraction}
            />
          </div>

          {/* Map */}
          <div className="flex-1 order-1 lg:order-2 min-h-[300px] lg:min-h-0">
            <ViennaMap
              selectedAttraction={selectedAttraction}
              routePointA={routePointA}
              routePointB={routePointB}
            />
          </div>
        </main>
      </div>

      {/* Footer - below screen height, visible only when scrolling down */}
      <footer className="border-t border-neutral-800">
        <div className="px-6 py-8 text-center">
          <p className="text-neutral-500 text-sm font-mono">
            by kossakowski and AI
          </p>
        </div>
      </footer>
    </div>
  );
}
