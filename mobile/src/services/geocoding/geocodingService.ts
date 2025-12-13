class GeocodingService {
  private cache: Map<string, { address: string; timestamp: number }> = new Map();
  private readonly CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 horas

  async reverseGeocode(latitude: number, longitude: number): Promise<string | null> {
    const cacheKey = `${latitude.toFixed(4)},${longitude.toFixed(4)}`;
    const cached = this.cache.get(cacheKey);
    
    if (cached && Date.now() - cached.timestamp < this.CACHE_DURATION) {
      return cached.address;
    }

    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=18&addressdetails=1`,
        {
          headers: {
            'User-Agent': 'AtacteApp/1.0',
          },
        }
      );

      if (!response.ok) {
        return null;
      }

      const data = await response.json();
      
      if (data.address) {
        let address = '';
        
        if (data.address.road) {
          address = data.address.road;
          if (data.address.house_number) {
            address = `${data.address.road}, ${data.address.house_number}`;
          }
        } else if (data.address.neighbourhood) {
          address = data.address.neighbourhood;
        } else if (data.address.suburb) {
          address = data.address.suburb;
        } else if (data.address.city) {
          address = data.address.city;
        } else {
          address = data.display_name?.split(',')[0] || 'Localização desconhecida';
        }

        this.cache.set(cacheKey, { address, timestamp: Date.now() });
        return address;
      }

      return null;
    } catch (error) {
      console.error('Erro ao fazer reverse geocoding:', error);
      return null;
    }
  }
}

export const geocodingService = new GeocodingService();

