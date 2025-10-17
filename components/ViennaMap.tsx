'use client';

import { useEffect, useRef } from 'react';
import maplibregl from 'maplibre-gl';
import { viennaAttractions, Attraction } from '@/data/attractions';
import 'maplibre-gl/dist/maplibre-gl.css';

interface ViennaMapProps {
    selectedAttraction?: Attraction | null;
}

export default function ViennaMap({ selectedAttraction }: ViennaMapProps) {
    const mapContainer = useRef<HTMLDivElement>(null);
    const map = useRef<maplibregl.Map | null>(null);
    const markers = useRef<{ [key: number]: maplibregl.Marker }>({});

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

    // Update marker styles when selection changes
    useEffect(() => {
        viennaAttractions.forEach((attraction) => {
            const marker = markers.current[attraction.id];
            if (marker) {
                const el = marker.getElement();
                const isSelected = selectedAttraction?.id === attraction.id;

                if (isSelected) {
                    // Special handling for yellow markers - they stay yellow when selected
                    if (attraction.customColor === 'yellow') {
                        el.style.width = '30px';
                        el.style.height = '49px';
                        el.innerHTML = `
                            <svg width="30" height="49" viewBox="0 0 25 41" xmlns="http://www.w3.org/2000/svg">
                                <path fill="#fbbf24" stroke="#f59e0b" stroke-width="1" d="M12.5 0C5.6 0 0 5.6 0 12.5c0 5.6 12.5 28.5 12.5 28.5s12.5-22.9 12.5-28.5C25 5.6 19.4 0 12.5 0z"/>
                                <circle fill="black" cx="12.5" cy="12.5" r="4"/>
                            </svg>
                        `;
                    } else {
                        // Red marker for other selected attractions
                        el.style.width = '30px';
                        el.style.height = '49px';
                        el.innerHTML = `
                            <svg width="30" height="49" viewBox="0 0 25 41" xmlns="http://www.w3.org/2000/svg">
                                <path fill="#dc2626" stroke="#991b1b" stroke-width="1" d="M12.5 0C5.6 0 0 5.6 0 12.5c0 5.6 12.5 28.5 12.5 28.5s12.5-22.9 12.5-28.5C25 5.6 19.4 0 12.5 0z"/>
                                <circle fill="white" cx="12.5" cy="12.5" r="4"/>
                            </svg>
                        `;
                    }

                    // Update popup content for selected marker
                    const popup = marker.getPopup();
                    if (popup) {
                        popup.setHTML(`
                            <div class="p-3 min-w-[220px] font-mono bg-neutral-900 text-white">
                                <h3 class="font-bold text-sm mb-2 text-red-400">
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
                                <div class="mt-2 text-xs text-red-400 font-bold">
                                    → Wybrane
                                </div>
                            </div>
                        `);
                    }
                } else {
                    // Return to original colors when not selected
                    if (attraction.customColor === 'yellow') {
                        // Yellow marker for bus station
                        el.style.width = '25px';
                        el.style.height = '41px';
                        el.innerHTML = `
                            <svg width="25" height="41" viewBox="0 0 25 41" xmlns="http://www.w3.org/2000/svg">
                                <path fill="#fbbf24" stroke="#f59e0b" stroke-width="1" d="M12.5 0C5.6 0 0 5.6 0 12.5c0 5.6 12.5 28.5 12.5 28.5s12.5-22.9 12.5-28.5C25 5.6 19.4 0 12.5 0z"/>
                                <circle fill="black" cx="12.5" cy="12.5" r="4"/>
                            </svg>
                        `;
                    } else {
                        // White marker with transparent hole for other attractions
                        el.style.width = '25px';
                        el.style.height = '41px';
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

                    // Update popup content for unselected marker
                    const popup = marker.getPopup();
                    if (popup) {
                        popup.setHTML(`
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
                        `);
                    }
                }
            }
        });
    }, [selectedAttraction]);

    return (
        <div className="h-full w-full border border-neutral-800 rounded-lg overflow-hidden">
            <div ref={mapContainer} className="h-full w-full" />
        </div>
    );
}