'use client';

import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import { Icon, LatLngBounds } from 'leaflet';
import { viennaAttractions, Attraction } from '@/data/attractions';
import 'leaflet/dist/leaflet.css';

// Fix for default markers in react-leaflet with custom dark theme
const createCustomIcon = (isSelected: boolean = false) => {
    return new Icon({
        iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
        iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
        shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
        iconSize: isSelected ? [30, 49] : [25, 41],
        iconAnchor: isSelected ? [15, 49] : [12, 41],
        popupAnchor: [1, -34],
        shadowSize: [41, 41]
    });
};

interface ViennaMapProps {
    selectedAttraction?: Attraction | null;
}

export default function ViennaMap({ selectedAttraction }: ViennaMapProps) {
    // Calculate bounds to fit all attractions
    const bounds = new LatLngBounds(
        viennaAttractions.map(attraction => [attraction.latitude, attraction.longitude])
    );

    return (
        <div className="h-full w-full border border-zinc-800 rounded-lg overflow-hidden">
            <MapContainer
                bounds={bounds}
                boundsOptions={{ padding: [20, 20] }}
                style={{ height: '100%', width: '100%' }}
                className="bg-black"
            >
                <TileLayer
                    attribution='&copy; <a href="https://www.maptiler.com/">MapTiler</a> &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    url="https://api.maptiler.com/maps/basic-v2-dark/{z}/{x}/{y}.png?key=1lhCtrTpdx2Qm9VTQEZh"
                />

                {viennaAttractions.map((attraction) => {
                    const isSelected = selectedAttraction?.id === attraction.id;
                    return (
                        <Marker
                            key={attraction.id}
                            position={[attraction.latitude, attraction.longitude]}
                            icon={createCustomIcon(isSelected)}
                        >
                            <Popup className="dark-popup">
                                <div className={`p-3 min-w-[220px] font-mono ${isSelected ? 'bg-zinc-900' : 'bg-black'}`}>
                                    <h3 className={`font-bold text-sm mb-2 ${isSelected ? 'text-green-400' : 'text-white'}`}>
                                        {attraction.name}
                                    </h3>
                                    <p className="text-xs text-zinc-300 mb-2">
                                        <span className="text-zinc-500">Adres:</span> {attraction.address}
                                    </p>
                                    <p className="text-xs text-zinc-400">
                                        <span className="text-zinc-500">Współrzędne:</span><br />
                                        Szer: {attraction.latitude.toFixed(6)}<br />
                                        Dł: {attraction.longitude.toFixed(6)}
                                    </p>
                                    {isSelected && (
                                        <div className="mt-2 text-xs text-green-400 font-bold">
                                            → Wybrane
                                        </div>
                                    )}
                                </div>
                            </Popup>
                        </Marker>
                    );
                })}
            </MapContainer>
        </div>
    );
}