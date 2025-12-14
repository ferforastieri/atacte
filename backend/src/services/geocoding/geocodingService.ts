interface NominatimAddress {
  road?: string;
  house_number?: string;
  neighbourhood?: string;
  suburb?: string;
  city?: string;
}

interface NominatimResponse {
  address?: NominatimAddress;
  display_name?: string;
}

export class GeocodingService {
  private cache: Map<string, { address: string; timestamp: number }> = new Map();
  private readonly CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 horas

  async reverseGeocode(latitude: number, longitude: number): Promise<string | null> {
    const cacheKey = `${latitude.toFixed(4)},${longitude.toFixed(4)}`;
    const cached = this.cache.get(cacheKey);
    
    if (cached && Date.now() - cached.timestamp < this.CACHE_DURATION) {
      return cached.address;
    }

    try {
      const url = new URL('https://nominatim.openstreetmap.org/reverse');
      url.searchParams.set('format', 'json');
      url.searchParams.set('lat', latitude.toString());
      url.searchParams.set('lon', longitude.toString());
      url.searchParams.set('zoom', '18');
      url.searchParams.set('addressdetails', '1');

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);

      const response = await fetch(url.toString(), {
        headers: {
          'User-Agent': 'AtacteApp/1.0',
        },
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        return null;
      }

      const data = await response.json() as NominatimResponse;

      if (!data || !data.address) {
        return null;
      }

      const addressData = data.address;
      let address = '';
      
      if (addressData.road) {
        address = addressData.road;
        if (addressData.house_number) {
          address = `${addressData.road}, ${addressData.house_number}`;
        }
      } else if (addressData.neighbourhood) {
        address = addressData.neighbourhood;
      } else if (addressData.suburb) {
        address = addressData.suburb;
      } else if (addressData.city) {
        address = addressData.city;
      } else if (data.display_name) {
        address = data.display_name.split(',')[0] || 'Localização desconhecida';
      } else {
        address = 'Localização desconhecida';
      }

      this.cache.set(cacheKey, { address, timestamp: Date.now() });
      return address;
    } catch (error) {
      console.error('Erro ao fazer reverse geocoding:', error);
      return null;
    }
  }
}

export const geocodingService = new GeocodingService();

