'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
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
                // Fall back to straight line if no public transport route available
                displayFallbackRoute(pointA, pointB);
                return;
            }

            setRouteInfo(route);

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
                    'line-color': '#3b82f6',
                    'line-width': 4,
                    'line-opacity': 0.8
                }
            });

            routeLayer.current = routeId;

            // Fit map to show the route
            const bounds = new maplibregl.LngLatBounds();
            coordinates.forEach(coord => bounds.extend(coord as [number, number]));
            map.current.fitBounds(bounds, { padding: 50 });

        } catch (error) {
            console.error('Error fetching route:', error);
            // Fall back to straight line on error
            displayFallbackRoute(pointA, pointB);
        } finally {
            setIsLoadingRoute(false);
        }
    }, []);

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
        const fallbackRouteInfo: RouteResult = {
            duration: 'Szacowany czas: 20-30 min',
            distance: 'Szacowany dystans: 5-10 km',
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
                        vehicle: 'Autobus/Tramwaj',
                        departure: 'Co 5-10 min',
                        arrival: 'Według rozkładu'
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
            
            {/* Route Information Panel */}
            {routeInfo && routePointA && routePointB && !isLoadingRoute && (
                <div className="absolute top-4 right-4 bg-black bg-opacity-90 text-white p-3 rounded-lg text-xs font-mono max-w-xs">
                    <div className="flex justify-between items-start mb-2">
                        <h3 className="font-bold text-sm">Trasa komunikacji publicznej</h3>
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
                            className="text-neutral-400 hover:text-white ml-2"
                        >
                            ×
                        </button>
                    </div>
                    <div className="space-y-1 mb-2">
                        <p><span className="text-green-400">Z:</span> {routePointA.name}</p>
                        <p><span className="text-red-400">Do:</span> {routePointB.name}</p>
                        <p><span className="text-blue-400">Czas:</span> {routeInfo.duration}</p>
                        <p><span className="text-yellow-400">Dystans:</span> {routeInfo.distance}</p>
                    </div>
                    
                    {/* Route Steps */}
                    <div className="max-h-32 overflow-y-auto custom-scrollbar">
                        <p className="text-neutral-400 mb-1">Instrukcje:</p>
                        {routeInfo.steps.map((step, index) => (
                            <div key={index} className="mb-1 pb-1 border-b border-neutral-700 last:border-b-0">
                                <div className="text-xs" dangerouslySetInnerHTML={{ __html: step.instructions }} />
                                {step.transitDetails && (
                                    <div className="text-xs text-blue-300 mt-1">
                                        {step.transitDetails.line} • {step.transitDetails.departure} → {step.transitDetails.arrival}
                                    </div>
                                )}
                                <div className="text-xs text-neutral-500">
                                    {step.duration} • {step.distance}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}