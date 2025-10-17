export interface RouteStep {
  instructions: string;
  duration: string;
  distance: string;
  travelMode: string;
  transitDetails?: {
    line: string;
    vehicle: string;
    departure: string;
    arrival: string;
  };
}

export interface RouteResult {
  duration: string;
  distance: string;
  steps: RouteStep[];
  polyline: string;
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
            ],
            routingPreference: google.maps.TransitRoutePreference.FEWER_TRANSFERS,
          },
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

              // Add transit details if available
              if (step.transit) {
                stepData.transitDetails = {
                  line: step.transit.line?.short_name || step.transit.line?.name || '',
                  vehicle: step.transit.line?.vehicle?.name || '',
                  departure: step.transit.departure_time?.text || '',
                  arrival: step.transit.arrival_time?.text || '',
                };
              }

              return stepData;
            });

            resolve({
              duration: leg.duration?.text || '',
              distance: leg.distance?.text || '',
              steps,
              polyline: route.overview_polyline || '',
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