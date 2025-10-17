'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import maplibregl from 'maplibre-gl';
import { viennaAttractions, Attraction } from '@/data/attractions';
import { googleDirectionsService, RouteResult } from '@/services/GoogleDirectionsService';
import 'maplibre-gl/dist/maplibre-gl.css';

interface ViennaMapProps {
    selectedAttraction?: Attraction | null;
    routePointA?: Attraction | null;
    routePointB?: Attraction | null;
}

export default function ViennaMap({ selectedAttraction, routePointA, routePointB }: ViennaMapProps) {
    const mapContainer = useRef<HTMLDivElement>(null);
    const map = useRef<maplibregl.Map | null>(null);
    const markers = useRef<{ [key: number]: maplibregl.Marker }>({});
    const routeLayer = useRef<string | null>(null);
    const [routeInfo, setRouteInfo] = useState<RouteResult | null>(null);
    const [isLoadingRoute, setIsLoadingRoute] = useState(false);
    const [selectedRouteIndex, setSelectedRouteIndex] = useState(0); // 0 = główna trasa, 1+ = alternatywne
    const [allRoutes, setAllRoutes] = useState<RouteResult[]>([]); // Przechowuje wszystkie dostępne trasy

    // Funkcja do mapowania kolorów dla różnych typów transportu
    const getTransportColor = (vehicleType: string): string => {
        switch (vehicleType) {
            case 'BUS': return '#f59e0b'; // Amber - autobusy
            case 'TRAM': return '#10b981'; // Emerald - tramwaje
            case 'SUBWAY': return '#3b82f6'; // Blue - metro
            case 'RAIL': return '#8b5cf6'; // Purple - pociągi
            case 'FERRY': return '#06b6d4'; // Cyan - promy
            case 'CABLE_CAR': return '#f97316'; // Orange - kolejki linowe
            case 'GONDOLA_LIFT': return '#ef4444'; // Red - gondole
            case 'FUNICULAR': return '#84cc16'; // Lime - koleje górskie
            default: return '#6b7280'; // Gray - inne
        }
    };

    const getTransportIcon = (vehicleType: string): string => {
        switch (vehicleType) {
            case 'BUS': return '🚌';
            case 'TRAM': return '🚋';
            case 'SUBWAY': return '🚇';
            case 'RAIL': return '🚆';
            case 'FERRY': return '⛴️';
            case 'CABLE_CAR': return '🚠';
            case 'GONDOLA_LIFT': return '🚡';
            case 'FUNICULAR': return '🚞';
            default: return '🚌';
        }
    };

    useEffect(() => {
        if (map.current) return; // Initialize map only once

        if (!mapContainer.current) return;

        map.current = new maplibregl.Map({
            container: mapContainer.current,
            style: 'https://api.maptiler.com/maps/basic-v2-dark/style.json?key=1lhCtrTpdx2Qm9VTQEZh',
            center: [16.3738, 48.2082], // Vienna coordinates
            zoom: 10,
        });

        // Customize map fonts after style loads
        map.current.on('style.load', () => {
            if (!map.current) return;

            // Get current style
            const style = map.current.getStyle();

            // Update all layers that use text to use Geist Mono font
            style.layers.forEach((layer: { id: string; layout?: { [key: string]: unknown } }) => {
                if (layer.layout && layer.layout['text-font']) {
                    // Replace all fonts with Geist Mono
                    try {
                        map.current!.setLayoutProperty(layer.id, 'text-font', ['Geist Mono']);
                    } catch (error) {
                        // Fallback to a more common font if Geist Mono is not available
                        console.warn(`Could not set font for layer ${layer.id}:`, error);
                        try {
                            map.current!.setLayoutProperty(layer.id, 'text-font', ['Open Sans Regular']);
                        } catch (fallbackError) {
                            console.warn(`Fallback font also failed for layer ${layer.id}:`, fallbackError);
                        }
                    }
                }
            });

            // Add Geist Mono font to the map if not already present
            if (!style.glyphs) {
                style.glyphs = 'https://fonts.openmaptiles.org/{fontstack}/{range}.pbf';
            }
        });

        // Add markers for all attractions
        viennaAttractions.forEach((attraction) => {
            if (!map.current) return;

            const el = document.createElement('div');
            el.className = 'custom-marker';
            el.style.width = '25px';
            el.style.height = '41px';
            el.style.cursor = 'pointer';

            // Create marker based on custom color or default white
            if (attraction.customColor === 'yellow') {
                // Yellow marker for bus station
                el.innerHTML = `
                    <svg width="25" height="41" viewBox="0 0 25 41" xmlns="http://www.w3.org/2000/svg">
                        <path fill="#fbbf24" stroke="#f59e0b" stroke-width="1" d="M12.5 0C5.6 0 0 5.6 0 12.5c0 5.6 12.5 28.5 12.5 28.5s12.5-22.9 12.5-28.5C25 5.6 19.4 0 12.5 0z"/>
                        <circle fill="black" cx="12.5" cy="12.5" r="4"/>
                    </svg>
                `;
            } else {
                // White marker with transparent hole for other attractions
                el.innerHTML = `
                    <svg width="25" height="41" viewBox="0 0 25 41" xmlns="http://www.w3.org/2000/svg">
                        <defs>
                            <mask id="hole-${attraction.id}">
                                <rect width="25" height="41" fill="white"/>
                                <circle cx="12.5" cy="12.5" r="4" fill="black"/>
                            </mask>
                        </defs>
                        <path fill="white" stroke="#d1d5db" stroke-width="1" mask="url(#hole-${attraction.id})" d="M12.5 0C5.6 0 0 5.6 0 12.5c0 5.6 12.5 28.5 12.5 28.5s12.5-22.9 12.5-28.5C25 5.6 19.4 0 12.5 0z"/>
                    </svg>
                `;
            }

            const marker = new maplibregl.Marker({ element: el })
                .setLngLat([attraction.longitude, attraction.latitude])
                .setPopup(
                    new maplibregl.Popup({ offset: 25 })
                        .setHTML(`
                            <div class="p-3 min-w-[220px] font-mono bg-black text-white">
                                <h3 class="font-bold text-sm mb-2 text-white">
                                    ${attraction.name}
                                </h3>
                                <p class="text-xs text-neutral-300 mb-2">
                                    <span class="text-neutral-500">Adres:</span> ${attraction.address}
                                </p>
                                <p class="text-xs text-neutral-400">
                                    <span class="text-neutral-500">Współrzędne:</span><br/>
                                    Szer: ${attraction.latitude.toFixed(6)}<br/>
                                    Dł: ${attraction.longitude.toFixed(6)}
                                </p>
                            </div>
                        `)
                )
                .addTo(map.current);

            markers.current[attraction.id] = marker;
        });

        // Fit map to show all attractions
        const bounds = new maplibregl.LngLatBounds();
        viennaAttractions.forEach(attraction => {
            bounds.extend([attraction.longitude, attraction.latitude]);
        });
        map.current.fitBounds(bounds, { padding: 50 });

    }, []);

    const displayPublicTransportRoute = useCallback(async (pointA: Attraction, pointB: Attraction) => {
        if (!map.current) return;

        setIsLoadingRoute(true);

        try {
            const route = await googleDirectionsService.getPublicTransportRoute(
                { lat: pointA.latitude, lng: pointA.longitude },
                { lat: pointB.latitude, lng: pointB.longitude }
            );

            if (!route) {
                console.error('No route found');
                displayFallbackRoute(pointA, pointB);
                return;
            }

            // Przechowuj wszystkie trasy (główną + alternatywne)
            const allAvailableRoutes = [route, ...(route.alternatives || [])];
            setAllRoutes(allAvailableRoutes);
            setSelectedRouteIndex(0); // Wybierz pierwszą trasę domyślnie
            setRouteInfo(route);

            displayRouteOnMap(route);

        } catch (error) {
            console.error('Error fetching route:', error);
            displayFallbackRoute(pointA, pointB);
        } finally {
            setIsLoadingRoute(false);
        }
    }, []);

    // Nowa funkcja do wyświetlania trasy na mapie
    const displayRouteOnMap = useCallback((route: RouteResult) => {
        if (!map.current) return;

        const routeId = 'transit-route';

        // Remove existing route
        if (routeLayer.current) {
            try {
                map.current.removeLayer(routeLayer.current);
                map.current.removeSource(routeLayer.current);
            } catch (error) {
                console.warn('Error removing existing route:', error);
            }
        }

        // Decode Google's polyline format for MapLibre GL
        const coordinates = googleDirectionsService.decodePolyline(route.polyline);

        // Add route to map
        const routeData = {
            type: 'Feature' as const,
            properties: {
                duration: route.duration,
                distance: route.distance,
            },
            geometry: {
                type: 'LineString' as const,
                coordinates: coordinates
            }
        };

        map.current.addSource(routeId, {
            type: 'geojson',
            data: routeData
        });

        map.current.addLayer({
            id: routeId,
            type: 'line',
            source: routeId,
            layout: {
                'line-join': 'round',
                'line-cap': 'round'
            },
            paint: {
                'line-color': selectedRouteIndex === 0 ? '#3b82f6' : '#8b5cf6', // Niebieska dla głównej, fioletowa dla alternatywnych
                'line-width': 4,
                'line-opacity': 0.8
            }
        });

        routeLayer.current = routeId;

        // Fit map to show the route
        const bounds = new maplibregl.LngLatBounds();
        coordinates.forEach(coord => bounds.extend(coord as [number, number]));
        map.current.fitBounds(bounds, { padding: 50 });
    }, [selectedRouteIndex]);

    // Funkcja do wyboru alternatywnej trasy
    const selectAlternativeRoute = useCallback((routeIndex: number) => {
        if (routeIndex >= 0 && routeIndex < allRoutes.length) {
            setSelectedRouteIndex(routeIndex);
            const selectedRoute = allRoutes[routeIndex];
            setRouteInfo(selectedRoute);
            displayRouteOnMap(selectedRoute);
        }
    }, [allRoutes, displayRouteOnMap]);

    // Updated useEffect for route handling - always show route panel
    useEffect(() => {
        if (!map.current || !routePointA || !routePointB) {
            // Clear existing route if no points selected
            if (routeLayer.current && map.current) {
                try {
                    map.current.removeLayer(routeLayer.current);
                    map.current.removeSource(routeLayer.current);
                    routeLayer.current = null;
                } catch (error) {
                    console.warn('Error removing route layer:', error);
                }
            }
            setRouteInfo(null);
            return;
        }

        // Always show fallback route immediately
        displayFallbackRoute(routePointA, routePointB);

        // Try to get Google route in background (optional)
        displayPublicTransportRoute(routePointA, routePointB);
    }, [routePointA, routePointB, displayPublicTransportRoute]);

    const displayFallbackRoute = (pointA: Attraction, pointB: Attraction) => {
        if (!map.current) return;

        console.log('Displaying fallback route from', pointA.name, 'to', pointB.name);

        // Create fallback route info
        const now = new Date();
        const fallbackRouteInfo: RouteResult = {
            duration: 'Szacowany czas: 20-30 min',
            distance: 'Szacowany dystans: 5-10 km',
            departureTime: now,
            arrivalTime: new Date(now.getTime() + 25 * 60 * 1000), // +25 minut
            steps: [
                {
                    instructions: `Rozpocznij podróż z lokalizacji: ${pointA.name}`,
                    duration: '2 min',
                    distance: '200 m',
                    travelMode: 'WALKING'
                },
                {
                    instructions: 'Skorzystaj z komunikacji publicznej (autobus lub tramwaj)',
                    duration: '15-25 min',
                    distance: '4-9 km',
                    travelMode: 'TRANSIT',
                    transitDetails: {
                        line: 'Różne linie',
                        lineName: 'Autobus/Tramwaj',
                        vehicle: 'Autobus/Tramwaj',
                        vehicleType: 'BUS',
                        departure: now.toLocaleTimeString('pl-PL', { hour: '2-digit', minute: '2-digit' }),
                        arrival: new Date(now.getTime() + 20 * 60 * 1000).toLocaleTimeString('pl-PL', { hour: '2-digit', minute: '2-digit' }),
                        departureTime: now,
                        arrivalTime: new Date(now.getTime() + 20 * 60 * 1000),
                        stops: 8,
                        agencyName: 'Wiener Linien',
                        color: '#f59e0b'
                    }
                },
                {
                    instructions: `Dojdź do celu: ${pointB.name}`,
                    duration: '3 min',
                    distance: '300 m',
                    travelMode: 'WALKING'
                }
            ],
            polyline: ''
        };

        setRouteInfo(fallbackRouteInfo);

        const routeId = 'fallback-route';

        // Remove existing route
        if (routeLayer.current) {
            try {
                map.current.removeLayer(routeLayer.current);
                map.current.removeSource(routeLayer.current);
            } catch (error) {
                console.warn('Error removing existing route:', error);
            }
        }

        // Add simple line route as fallback
        const routeData = {
            type: 'Feature' as const,
            properties: {},
            geometry: {
                type: 'LineString' as const,
                coordinates: [
                    [pointA.longitude, pointA.latitude],
                    [pointB.longitude, pointB.latitude]
                ]
            }
        };

        map.current.addSource(routeId, {
            type: 'geojson',
            data: routeData
        });

        map.current.addLayer({
            id: routeId,
            type: 'line',
            source: routeId,
            layout: {
                'line-join': 'round',
                'line-cap': 'round'
            },
            paint: {
                'line-color': '#ef4444', // Red for fallback route
                'line-width': 3,
                'line-opacity': 0.6,
                'line-dasharray': [2, 2] // Dashed line to indicate fallback
            }
        });

        routeLayer.current = routeId;

        // Fit map to show both points
        const bounds = new maplibregl.LngLatBounds();
        bounds.extend([pointA.longitude, pointA.latitude]);
        bounds.extend([pointB.longitude, pointB.latitude]);
        map.current.fitBounds(bounds, { padding: 100 });
    };

    // Update marker styles when selection or route changes
    useEffect(() => {
        viennaAttractions.forEach((attraction) => {
            const marker = markers.current[attraction.id];
            if (marker) {
                const el = marker.getElement();
                const isSelected = selectedAttraction?.id === attraction.id;
                const isPointA = routePointA?.id === attraction.id;
                const isPointB = routePointB?.id === attraction.id;

                // Determine marker style based on state
                let markerColor = 'white';
                let markerSize = { width: '25px', height: '41px', viewBox: '0 0 25 41' };

                if (attraction.customColor === 'yellow') {
                    markerColor = 'yellow';
                } else if (isPointA) {
                    markerColor = 'green';
                } else if (isPointB) {
                    markerColor = 'red';
                } else if (isSelected) {
                    markerColor = 'red';
                    markerSize = { width: '30px', height: '49px', viewBox: '0 0 25 41' };
                }

                // Apply marker style
                el.style.width = markerSize.width;
                el.style.height = markerSize.height;

                if (markerColor === 'yellow') {
                    el.innerHTML = `
                        <svg width="${markerSize.width}" height="${markerSize.height}" viewBox="${markerSize.viewBox}" xmlns="http://www.w3.org/2000/svg">
                            <path fill="#fbbf24" stroke="#f59e0b" stroke-width="1" d="M12.5 0C5.6 0 0 5.6 0 12.5c0 5.6 12.5 28.5 12.5 28.5s12.5-22.9 12.5-28.5C25 5.6 19.4 0 12.5 0z"/>
                            <circle fill="black" cx="12.5" cy="12.5" r="4"/>
                        </svg>
                    `;
                } else if (markerColor === 'green') {
                    el.innerHTML = `
                        <svg width="${markerSize.width}" height="${markerSize.height}" viewBox="${markerSize.viewBox}" xmlns="http://www.w3.org/2000/svg">
                            <path fill="#10b981" stroke="#059669" stroke-width="1" d="M12.5 0C5.6 0 0 5.6 0 12.5c0 5.6 12.5 28.5 12.5 28.5s12.5-22.9 12.5-28.5C25 5.6 19.4 0 12.5 0z"/>
                            <circle fill="white" cx="12.5" cy="12.5" r="4"/>
                        </svg>
                    `;
                } else if (markerColor === 'red') {
                    el.innerHTML = `
                        <svg width="${markerSize.width}" height="${markerSize.height}" viewBox="${markerSize.viewBox}" xmlns="http://www.w3.org/2000/svg">
                            <path fill="#dc2626" stroke="#991b1b" stroke-width="1" d="M12.5 0C5.6 0 0 5.6 0 12.5c0 5.6 12.5 28.5 12.5 28.5s12.5-22.9 12.5-28.5C25 5.6 19.4 0 12.5 0z"/>
                            <circle fill="white" cx="12.5" cy="12.5" r="4"/>
                        </svg>
                    `;
                } else {
                    // White marker with transparent hole
                    el.innerHTML = `
                        <svg width="${markerSize.width}" height="${markerSize.height}" viewBox="${markerSize.viewBox}" xmlns="http://www.w3.org/2000/svg">
                            <defs>
                                <mask id="hole-${attraction.id}">
                                    <rect width="25" height="41" fill="white"/>
                                    <circle cx="12.5" cy="12.5" r="4" fill="black"/>
                                </mask>
                            </defs>
                            <path fill="white" stroke="#d1d5db" stroke-width="1" mask="url(#hole-${attraction.id})" d="M12.5 0C5.6 0 0 5.6 0 12.5c0 5.6 12.5 28.5 12.5 28.5s12.5-22.9 12.5-28.5C25 5.6 19.4 0 12.5 0z"/>
                        </svg>
                    `;
                }

                // Update popup content
                const popup = marker.getPopup();
                if (popup) {
                    let statusText = '';
                    if (isPointA) statusText = '<div class="mt-2 text-xs text-green-400 font-bold">→ Punkt A (start)</div>';
                    if (isPointB) statusText = '<div class="mt-2 text-xs text-red-400 font-bold">→ Punkt B (cel)</div>';
                    if (isSelected && !isPointA && !isPointB) statusText = '<div class="mt-2 text-xs text-red-400 font-bold">→ Wybrane</div>';

                    popup.setHTML(`
                        <div class="p-3 min-w-[220px] font-mono ${isSelected || isPointA || isPointB ? 'bg-neutral-900' : 'bg-black'} text-white">
                            <h3 class="font-bold text-sm mb-2 ${isPointA ? 'text-green-400' : isPointB ? 'text-red-400' : isSelected ? 'text-red-400' : 'text-white'}">
                                ${attraction.name}
                            </h3>
                            <p class="text-xs text-neutral-300 mb-2">
                                <span class="text-neutral-500">Adres:</span> ${attraction.address}
                            </p>
                            <p class="text-xs text-neutral-400">
                                <span class="text-neutral-500">Współrzędne:</span><br/>
                                Szer: ${attraction.latitude.toFixed(6)}<br/>
                                Dł: ${attraction.longitude.toFixed(6)}
                            </p>
                            ${statusText}
                        </div>
                    `);
                }
            }
        });
    }, [selectedAttraction, routePointA, routePointB]);

    return (
        <div className="h-full w-full border border-neutral-800 rounded-lg overflow-hidden relative">
            <div ref={mapContainer} className="h-full w-full" />

            {/* Route Loading Indicator */}
            {isLoadingRoute && (
                <div className="absolute top-4 right-4 bg-black bg-opacity-80 text-white px-3 py-2 rounded-lg text-sm font-mono">
                    Szukanie trasy...
                </div>
            )}

            {/* Enhanced Route Information Panel */}
            {routeInfo && routePointA && routePointB && !isLoadingRoute && (
                <div className="absolute top-4 right-4 bg-black bg-opacity-95 text-white p-4 rounded-lg text-xs font-mono max-w-sm shadow-2xl">
                    <div className="flex justify-between items-start mb-3">
                        <h3 className="font-bold text-sm text-blue-400">🚌 Komunikacja publiczna</h3>
                        <button
                            onClick={() => {
                                setRouteInfo(null);
                                if (routeLayer.current && map.current) {
                                    try {
                                        map.current.removeLayer(routeLayer.current);
                                        map.current.removeSource(routeLayer.current);
                                        routeLayer.current = null;
                                    } catch (error) {
                                        console.warn('Error removing route:', error);
                                    }
                                }
                            }}
                            className="text-neutral-400 hover:text-white ml-2 text-lg"
                        >
                            ×
                        </button>
                    </div>

                    {/* Current time and route summary */}
                    <div className="space-y-2 mb-3 p-2 bg-neutral-800 rounded">
                        <p className="text-xs text-neutral-300">
                            🕐 Odjazd: {new Date().toLocaleTimeString('pl-PL', { hour: '2-digit', minute: '2-digit' })}
                        </p>
                        <p><span className="text-green-400">🟢 Z:</span> {routePointA.name}</p>
                        <p><span className="text-red-400">🔴 Do:</span> {routePointB.name}</p>
                        <div className="flex justify-between">
                            <span><span className="text-blue-400">⏱️</span> {routeInfo.duration}</span>
                            <span><span className="text-yellow-400">📏</span> {routeInfo.distance}</span>
                        </div>
                    </div>

                    {/* Enhanced Route Steps */}
                    <div className="max-h-48 overflow-y-auto custom-scrollbar">
                        <p className="text-neutral-400 mb-2 font-bold">📋 Szczegóły trasy:</p>
                        {routeInfo.steps.map((step, index) => (
                            <div key={index} className="mb-3 p-2 bg-neutral-900 rounded border-l-2 border-neutral-600">
                                {/* Walking step */}
                                {step.travelMode === 'WALKING' && (
                                    <div className="border-l-2 border-green-500 pl-2">
                                        <div className="flex items-center gap-1 mb-1">
                                            <span className="text-green-400">🚶</span>
                                            <span className="text-green-400 font-bold text-xs">Idź pieszo</span>
                                        </div>
                                        <div className="text-xs text-neutral-300 mb-1" dangerouslySetInnerHTML={{ __html: step.instructions }} />
                                        <div className="text-xs text-neutral-500">
                                            ⏱️ {step.duration} • 📏 {step.distance}
                                        </div>
                                    </div>
                                )}

                                {/* Transit step */}
                                {step.travelMode === 'TRANSIT' && step.transitDetails && (
                                    <div
                                        className="border-l-2 pl-2"
                                        style={{ borderColor: step.transitDetails.color || getTransportColor(step.transitDetails.vehicleType) }}
                                    >
                                        <div className="flex items-center gap-1 mb-1">
                                            <span>{getTransportIcon(step.transitDetails.vehicleType)}</span>
                                            <span
                                                className="font-bold text-xs"
                                                style={{ color: step.transitDetails.color || getTransportColor(step.transitDetails.vehicleType) }}
                                            >
                                                {step.transitDetails.vehicle}
                                            </span>
                                            {step.transitDetails.line && (
                                                <span
                                                    className="px-1 py-0.5 rounded text-xs font-bold"
                                                    style={{
                                                        backgroundColor: step.transitDetails.color || getTransportColor(step.transitDetails.vehicleType),
                                                        color: step.transitDetails.textColor || '#000000'
                                                    }}
                                                >
                                                    {step.transitDetails.line}
                                                </span>
                                            )}
                                        </div>

                                        <div className="text-xs text-neutral-300 mb-2" dangerouslySetInnerHTML={{ __html: step.instructions }} />

                                        {/* Transit schedule */}
                                        <div className="grid grid-cols-2 gap-2 text-xs mb-2">
                                            <div className="bg-green-900 bg-opacity-50 p-1 rounded">
                                                <div className="text-green-300">🚏 Odjazd</div>
                                                <div className="text-white font-bold">{step.transitDetails.departure}</div>
                                            </div>
                                            <div className="bg-red-900 bg-opacity-50 p-1 rounded">
                                                <div className="text-red-300">🏁 Przyjazd</div>
                                                <div className="text-white font-bold">{step.transitDetails.arrival}</div>
                                            </div>
                                        </div>

                                        {/* Additional info */}
                                        <div className="text-xs text-neutral-400 space-y-1">
                                            <div>⏱️ {step.duration} • 📏 {step.distance}</div>
                                            {step.transitDetails.stops > 0 && (
                                                <div>🛑 {step.transitDetails.stops} przystanków</div>
                                            )}
                                            {step.transitDetails.agencyName && (
                                                <div>🏢 {step.transitDetails.agencyName}</div>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>

                    {/* Interactive Alternative Routes */}
                    {allRoutes.length > 1 && (
                        <div className="mt-3 pt-3 border-t border-neutral-700">
                            <p className="text-neutral-400 text-xs mb-2 font-bold">🔄 Wybierz trasę:</p>
                            <div className="space-y-1">
                                {allRoutes.map((route, index) => (
                                    <button
                                        key={index}
                                        onClick={() => selectAlternativeRoute(index)}
                                        className={`w-full text-left p-2 rounded-lg text-xs transition-all duration-200 ${
                                            selectedRouteIndex === index
                                                ? 'bg-blue-600 text-white border-2 border-blue-400'
                                                : 'bg-neutral-800 hover:bg-neutral-700 text-neutral-300 border border-neutral-600'
                                        }`}
                                    >
                                        <div className="flex justify-between items-center mb-1">
                                            <span className="font-bold">
                                                {index === 0 ? '🥇 Najszybsza' : `🚌 Opcja ${index + 1}`}
                                            </span>
                                            <div className="text-xs">
                                                {selectedRouteIndex === index && <span className="text-blue-200">✓ Wybrana</span>}
                                            </div>
                                        </div>
                                        
                                        <div className="flex justify-between items-center text-xs">
                                            <span>⏱️ {route.duration}</span>
                                            <span>📏 {route.distance}</span>
                                        </div>
                                        
                                        {/* Transport icons for this route */}
                                        <div className="flex items-center gap-1 mt-1">
                                            <span className="text-neutral-400">Środki:</span>
                                            {route.steps
                                                .filter(s => s.transitDetails)
                                                .slice(0, 4) // Max 4 ikony
                                                .map((s, i) => (
                                                    <span 
                                                        key={i} 
                                                        className="text-sm"
                                                        style={{ color: s.transitDetails?.color || getTransportColor(s.transitDetails?.vehicleType || 'OTHER') }}
                                                    >
                                                        {getTransportIcon(s.transitDetails?.vehicleType || 'OTHER')}
                                                        {s.transitDetails?.line && (
                                                            <span className="text-xs ml-0.5">{s.transitDetails.line}</span>
                                                        )}
                                                    </span>
                                                ))}
                                            {route.steps.filter(s => s.transitDetails).length > 4 && (
                                                <span className="text-xs text-neutral-500">...</span>
                                            )}
                                        </div>
                                        
                                        {/* Route complexity indicator */}
                                        <div className="text-xs text-neutral-400 mt-1">
                                            {route.steps.filter(s => s.transitDetails).length === 1 ? 
                                                '🟢 Bez przesiadek' : 
                                                `🟡 ${route.steps.filter(s => s.transitDetails).length - 1} przesiadek`
                                            }
                                        </div>
                                    </button>
                                ))}
                            </div>
                            
                            {/* Quick comparison */}
                            <div className="mt-2 p-2 bg-neutral-900 rounded text-xs">
                                <div className="text-neutral-400 mb-1">💡 Porównanie:</div>
                                <div className="grid grid-cols-3 gap-1 text-center">
                                    <div>
                                        <div className="text-green-400">Najszybsza</div>
                                        <div className="text-white">{allRoutes[0]?.duration}</div>
                                    </div>
                                    <div>
                                        <div className="text-blue-400">Najkrótsza</div>
                                        <div className="text-white">
                                            {allRoutes.sort((a, b) => 
                                                parseFloat(a.distance) - parseFloat(b.distance)
                                            )[0]?.distance}
                                        </div>
                                    </div>
                                    <div>
                                        <div className="text-yellow-400">Opcje</div>
                                        <div className="text-white">{allRoutes.length}</div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Live updates indicator */}
                    <div className="mt-3 pt-2 border-t border-neutral-700 text-xs text-neutral-500 text-center">
                        🔴 Na żywo • Aktualizacja co 30s
                    </div>
                </div>
            )}
        </div>
    );
}