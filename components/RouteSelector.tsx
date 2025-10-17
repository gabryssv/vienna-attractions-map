'use client';

import { useState } from 'react';
import { viennaAttractions, Attraction } from '@/data/attractions';

interface RouteSelectorProps {
    onRouteSelect: (pointA: Attraction | null, pointB: Attraction | null) => void;
    onAttractionSelect?: (attraction: Attraction) => void;
    pointA: Attraction | null;
    pointB: Attraction | null;
    selectedAttraction?: Attraction | null;
}

export default function RouteSelector({
    onRouteSelect,
    onAttractionSelect,
    pointA,
    pointB,
    selectedAttraction
}: RouteSelectorProps) {
    const [isRouteMode, setIsRouteMode] = useState(false);

    const handlePointSelect = (attraction: Attraction, type: 'A' | 'B') => {
        if (type === 'A') {
            onRouteSelect(attraction, pointB);
        } else {
            onRouteSelect(pointA, attraction);
        }
    };

    const clearRoute = () => {
        onRouteSelect(null, null);
    };

    const toggleRouteMode = () => {
        const newRouteMode = !isRouteMode;
        setIsRouteMode(newRouteMode);

        if (!newRouteMode) {
            // When exiting route mode, clear the route
            clearRoute();
        }
    };

    return (
        <div className="bg-black border border-neutral-800 rounded-lg p-4 h-full overflow-y-auto font-mono custom-scrollbar">
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-bold text-white">
                    {isRouteMode ? 'Planuj trasę' : 'Atrakcje'}
                </h2>
                <button
                    onClick={toggleRouteMode}
                    className={`px-3 py-1 text-xs rounded-md transition-colors ${isRouteMode
                            ? 'bg-red-600 hover:bg-red-700 text-white'
                            : 'bg-blue-600 hover:bg-blue-700 text-white'
                        }`}
                >
                    {isRouteMode ? 'Anuluj' : 'Trasa'}
                </button>
            </div>

            {isRouteMode ? (
                <div className="space-y-4">
                    {/* Point A Selector */}
                    <div>
                        <label className="block text-sm font-medium text-white mb-2">
                            Punkt A (start):
                        </label>
                        <select
                            value={pointA?.id || ''}
                            onChange={(e) => {
                                const attraction = viennaAttractions.find(a => a.id === parseInt(e.target.value));
                                if (attraction) handlePointSelect(attraction, 'A');
                            }}
                            className="w-full bg-neutral-900 border border-neutral-700 text-white text-xs rounded-md p-2 focus:border-blue-500 focus:outline-none"
                        >
                            <option value="">Wybierz punkt startowy</option>
                            {viennaAttractions.map((attraction) => (
                                <option key={attraction.id} value={attraction.id}>
                                    {attraction.name}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Point B Selector */}
                    <div>
                        <label className="block text-sm font-medium text-white mb-2">
                            Punkt B (cel):
                        </label>
                        <select
                            value={pointB?.id || ''}
                            onChange={(e) => {
                                const attraction = viennaAttractions.find(a => a.id === parseInt(e.target.value));
                                if (attraction) handlePointSelect(attraction, 'B');
                            }}
                            className="w-full bg-neutral-900 border border-neutral-700 text-white text-xs rounded-md p-2 focus:border-blue-500 focus:outline-none"
                        >
                            <option value="">Wybierz punkt docelowy</option>
                            {viennaAttractions.map((attraction) => (
                                <option key={attraction.id} value={attraction.id}>
                                    {attraction.name}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Route Info */}
                    {pointA && pointB && (
                        <div className="mt-4 p-3 bg-neutral-900 border border-neutral-700 rounded-lg">
                            <p className="text-xs text-neutral-400 mb-1">
                                <span className="text-green-400">A:</span> {pointA.name}
                            </p>
                            <p className="text-xs text-neutral-400 mb-2">
                                <span className="text-red-400">B:</span> {pointB.name}
                            </p>
                            <button
                                onClick={clearRoute}
                                className="text-xs text-neutral-500 hover:text-white transition-colors"
                            >
                                Wyczyść trasę
                            </button>
                        </div>
                    )}

                    <div className="text-xs text-neutral-500 mt-4">
                        Wybierz punkty A i B aby zobaczyć trasę komunikacji publicznej na mapie
                    </div>
                </div>
            ) : (
                // Normal attractions list when not in route mode
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

                    <div className="mt-6 p-3 bg-neutral-900 border border-neutral-700 rounded-lg">
                        <p className="text-xs text-neutral-400">
                            <span className="text-white font-bold">{viennaAttractions.length}</span> atrakcji
                        </p>
                        <p className="text-xs text-neutral-500 mt-1">
                            Kliknij &quot;Trasa&quot; aby zaplanować podróż komunikacją publiczną
                        </p>
                    </div>
                </div>
            )}
        </div>
    );
}