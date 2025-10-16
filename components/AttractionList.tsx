'use client';

import { viennaAttractions, Attraction } from '@/data/attractions';

interface AttractionListProps {
    selectedAttraction?: Attraction | null;
    onAttractionSelect?: (attraction: Attraction) => void;
}

export default function AttractionList({ selectedAttraction, onAttractionSelect }: AttractionListProps) {
    return (
        <div className="bg-black border border-neutral-800 rounded-lg p-4 h-full overflow-y-auto font-mono custom-scrollbar">
            <h2 className="text-lg font-bold text-white mb-4">
                Atrakcje
            </h2>

            <div className="space-y-2">
                {viennaAttractions.map((attraction) => (
                    <div
                        key={attraction.id}
                        className={`p-3 rounded-lg border cursor-pointer transition-all duration-200 hover:border-neutral-600 ${selectedAttraction?.id === attraction.id
                            ? 'border-green-500 bg-neutral-900 shadow-lg'
                            : 'border-neutral-700 hover:bg-neutral-900'
                            }`}
                        onClick={() => onAttractionSelect?.(attraction)}
                    >
                        <h3 className={`font-bold text-xs mb-1 ${selectedAttraction?.id === attraction.id ? 'text-green-400' : 'text-white'
                            }`}>
                            {attraction.name}
                        </h3>
                        <p className="text-xs text-neutral-400 mb-1">
                            {attraction.address}
                        </p>
                        <p className="text-xs text-neutral-500 font-mono">
                            {attraction.latitude.toFixed(4)}, {attraction.longitude.toFixed(4)}
                        </p>
                    </div>
                ))}
            </div>

            <div className="mt-6 p-3 bg-neutral-900 border border-neutral-700 rounded-lg">
                <p className="text-xs text-neutral-400">
                    <span className="text-white font-bold">{viennaAttractions.length}</span> atrakcji
                </p>
                <p className="text-xs text-neutral-500 mt-1">
                    Kliknij aby podświetlić na mapie
                </p>
            </div>
        </div>
    );
}