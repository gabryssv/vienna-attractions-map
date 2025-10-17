export interface TransitDetails {
    line: string;
    lineName: string;
    vehicle: string;
    vehicleType: 'BUS' | 'TRAM' | 'SUBWAY' | 'RAIL' | 'FERRY' | 'CABLE_CAR' | 'GONDOLA_LIFT' | 'FUNICULAR' | 'OTHER';
    departure: string;
    arrival: string;
    departureTime: Date;
    arrivalTime: Date;
    stops: number;
    agencyName: string;
    color?: string;
    textColor?: string;
    alternatives?: AlternativeTransit[];
}

export interface AlternativeTransit {
    line: string;
    lineName: string;
    vehicle: string;
    vehicleType: 'BUS' | 'TRAM' | 'SUBWAY' | 'RAIL' | 'FERRY' | 'CABLE_CAR' | 'GONDOLA_LIFT' | 'FUNICULAR' | 'OTHER';
    departure: string;
    color?: string;
    textColor?: string;
}

export interface RouteStep {
    instructions: string;
    duration: string;
    distance: string;
    travelMode: string;
    transitDetails?: TransitDetails;
}

export interface RouteResult {
    duration: string;
    distance: string;
    steps: RouteStep[];
    polyline: string;
    departureTime: Date;
    arrivalTime: Date;
    alternatives?: RouteResult[];
}

class GoogleDirectionsService {
    private directionsService: google.maps.DirectionsService | null = null;
    private isInitialized = false;

    constructor() {
        this.loadGoogleMaps();
    }

    private loadGoogleMaps(): void {
        if (typeof window !== 'undefined' && !window.google) {
            const script = document.createElement('script');
            script.src = `https://maps.googleapis.com/maps/api/js?key=AIzaSyC03OTlLvyO81ATwhbqob0oWoIKw3Nm_Xg&libraries=geometry&language=pl&region=AT`;
            script.async = true;
            script.defer = true;
            script.onload = () => {
                this.isInitialized = true;
                this.directionsService = new google.maps.DirectionsService();
            };
            document.head.appendChild(script);
        } else if (window.google) {
            this.isInitialized = true;
            this.directionsService = new google.maps.DirectionsService();
        }
    }

    private waitForInitialization(): Promise<void> {
        return new Promise((resolve) => {
            if (this.isInitialized && this.directionsService) {
                resolve();
                return;
            }

            const checkInterval = setInterval(() => {
                if (this.isInitialized && this.directionsService) {
                    clearInterval(checkInterval);
                    resolve();
                }
            }, 100);

            // Timeout after 10 seconds
            setTimeout(() => {
                clearInterval(checkInterval);
                resolve();
            }, 10000);
        });
    }

    async getPublicTransportRoute(
        origin: { lat: number; lng: number },
        destination: { lat: number; lng: number }
    ): Promise<RouteResult | null> {
        await this.waitForInitialization();

        if (!this.directionsService) {
            throw new Error('Failed to initialize Google Directions Service');
        }

        // Ustaw aktualny czas jako punkt startowy
        const now = new Date();

        return new Promise((resolve) => {
            this.directionsService!.route(
                {
                    origin: new google.maps.LatLng(origin.lat, origin.lng),
                    destination: new google.maps.LatLng(destination.lat, destination.lng),
                    travelMode: google.maps.TravelMode.TRANSIT,
                    transitOptions: {
                        modes: [
                            google.maps.TransitMode.BUS,
                            google.maps.TransitMode.SUBWAY,
                            google.maps.TransitMode.TRAM,
                            google.maps.TransitMode.RAIL, // Dodaj pociągi regionalne
                        ],
                        departureTime: now, // Użyj aktualnego czasu
                        routingPreference: google.maps.TransitRoutePreference.FEWER_TRANSFERS,
                    },
                    provideRouteAlternatives: true, // Pobierz alternatywne trasy
                    region: 'AT', // Austria
                    language: 'pl', // Polish language for instructions
                },
                (result, status) => {
                    if (status === google.maps.DirectionsStatus.OK && result) {
                        const route = result.routes[0];
                        const leg = route.legs[0];

                        const steps: RouteStep[] = leg.steps.map((step) => {
                            const stepData: RouteStep = {
                                instructions: step.instructions,
                                duration: step.duration?.text || '',
                                distance: step.distance?.text || '',
                                travelMode: step.travel_mode,
                            };

                            // Dodaj szczegółowe informacje o transporcie publicznym
                            if (step.transit) {
                                const transit = step.transit;
                                const line = transit.line;
                                const vehicle = line?.vehicle;

                                // Mapuj typ pojazdu na polskie nazwy
                                const getVehicleTypeName = (type: string): string => {
                                    switch (type) {
                                        case 'BUS': return 'Autobus';
                                        case 'TRAM': return 'Tramwaj';
                                        case 'SUBWAY': return 'Metro';
                                        case 'RAIL': return 'Pociąg';
                                        case 'FERRY': return 'Prom';
                                        case 'CABLE_CAR': return 'Kolejka linowa';
                                        case 'GONDOLA_LIFT': return 'Gondola';
                                        case 'FUNICULAR': return 'Kolej górska';
                                        default: return 'Transport publiczny';
                                    }
                                };

                                stepData.transitDetails = {
                                    line: line?.short_name || line?.name || '',
                                    lineName: line?.name || '',
                                    vehicle: getVehicleTypeName(vehicle?.type || ''),
                                    vehicleType: (vehicle?.type as 'BUS' | 'TRAM' | 'SUBWAY' | 'RAIL' | 'FERRY' | 'CABLE_CAR' | 'GONDOLA_LIFT' | 'FUNICULAR') || 'OTHER',
                                    departure: transit.departure_time?.text || '',
                                    arrival: transit.arrival_time?.text || '',
                                    departureTime: transit.departure_time?.value || new Date(),
                                    arrivalTime: transit.arrival_time?.value || new Date(),
                                    stops: transit.num_stops || 0,
                                    agencyName: line?.agencies?.[0]?.name || '',
                                    color: line?.color ? `#${line.color}` : undefined,
                                    textColor: line?.text_color ? `#${line.text_color}` : undefined,
                                };
                            }

                            return stepData;
                        });

                        // Przetwórz alternatywne trasy
                        const alternatives: RouteResult[] = result.routes.slice(1).map((altRoute) => {
                            const altLeg = altRoute.legs[0];
                            const altSteps: RouteStep[] = altLeg.steps.map((altStep) => {
                                const altStepData: RouteStep = {
                                    instructions: altStep.instructions,
                                    duration: altStep.duration?.text || '',
                                    distance: altStep.distance?.text || '',
                                    travelMode: altStep.travel_mode,
                                };

                                if (altStep.transit) {
                                    const transit = altStep.transit;
                                    const line = transit.line;
                                    const vehicle = line?.vehicle;

                                    const getVehicleTypeName = (type: string): string => {
                                        switch (type) {
                                            case 'BUS': return 'Autobus';
                                            case 'TRAM': return 'Tramwaj';
                                            case 'SUBWAY': return 'Metro';
                                            case 'RAIL': return 'Pociąg';
                                            case 'FERRY': return 'Prom';
                                            case 'CABLE_CAR': return 'Kolejka linowa';
                                            case 'GONDOLA_LIFT': return 'Gondola';
                                            case 'FUNICULAR': return 'Kolej górska';
                                            default: return 'Transport publiczny';
                                        }
                                    };

                                    altStepData.transitDetails = {
                                        line: line?.short_name || line?.name || '',
                                        lineName: line?.name || '',
                                        vehicle: getVehicleTypeName(vehicle?.type || ''),
                                        vehicleType: (vehicle?.type as 'BUS' | 'TRAM' | 'SUBWAY' | 'RAIL' | 'FERRY' | 'CABLE_CAR' | 'GONDOLA_LIFT' | 'FUNICULAR') || 'OTHER',
                                        departure: transit.departure_time?.text || '',
                                        arrival: transit.arrival_time?.text || '',
                                        departureTime: transit.departure_time?.value || new Date(),
                                        arrivalTime: transit.arrival_time?.value || new Date(),
                                        stops: transit.num_stops || 0,
                                        agencyName: line?.agencies?.[0]?.name || '',
                                        color: line?.color ? `#${line.color}` : undefined,
                                        textColor: line?.text_color ? `#${line.text_color}` : undefined,
                                    };
                                }

                                return altStepData;
                            });

                            return {
                                duration: altLeg.duration?.text || '',
                                distance: altLeg.distance?.text || '',
                                steps: altSteps,
                                polyline: altRoute.overview_polyline || '',
                                departureTime: altLeg.departure_time?.value || new Date(),
                                arrivalTime: altLeg.arrival_time?.value || new Date(),
                            };
                        });

                        resolve({
                            duration: leg.duration?.text || '',
                            distance: leg.distance?.text || '',
                            steps,
                            polyline: route.overview_polyline || '',
                            departureTime: leg.departure_time?.value || new Date(),
                            arrivalTime: leg.arrival_time?.value || new Date(),
                            alternatives,
                        });
                    } else {
                        console.error('Directions request failed:', status);
                        resolve(null);
                    }
                }
            );
        });
    }

    // Decode polyline for MapLibre GL
    decodePolyline(polyline: string): [number, number][] {
        const coordinates: [number, number][] = [];
        let index = 0;
        let lat = 0;
        let lng = 0;

        while (index < polyline.length) {
            let shift = 0;
            let result = 0;
            let byte: number;

            do {
                byte = polyline.charCodeAt(index++) - 63;
                result |= (byte & 0x1f) << shift;
                shift += 5;
            } while (byte >= 0x20);

            const deltaLat = result & 1 ? ~(result >> 1) : result >> 1;
            lat += deltaLat;

            shift = 0;
            result = 0;

            do {
                byte = polyline.charCodeAt(index++) - 63;
                result |= (byte & 0x1f) << shift;
                shift += 5;
            } while (byte >= 0x20);

            const deltaLng = result & 1 ? ~(result >> 1) : result >> 1;
            lng += deltaLng;

            coordinates.push([lng / 1e5, lat / 1e5]);
        }

        return coordinates;
    }
}

export const googleDirectionsService = new GoogleDirectionsService();