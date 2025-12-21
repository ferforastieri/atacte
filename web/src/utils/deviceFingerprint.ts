async function simpleHash(str: string): Promise<string> {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash).toString(16).padStart(16, '0');
}

export async function getDeviceFingerprint(): Promise<string> {
  try {
    const fingerprintData = {
      platform: navigator.platform || 'Unknown',
      userAgent: navigator.userAgent || 'Unknown',
      language: navigator.language || 'Unknown',
      languages: navigator.languages?.join(',') || 'Unknown',
      screenWidth: window.screen.width || 0,
      screenHeight: window.screen.height || 0,
      colorDepth: window.screen.colorDepth || 0,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'Unknown',
      hardwareConcurrency: navigator.hardwareConcurrency || 0,
    };

    const fingerprintString = JSON.stringify(fingerprintData);
    
    if (typeof crypto !== 'undefined' && crypto.subtle && crypto.subtle.digest) {
      try {
        const encoder = new TextEncoder();
        const data = encoder.encode(fingerprintString);
        const hashBuffer = await crypto.subtle.digest('SHA-256', data);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
        return hashHex;
      } catch (cryptoError) {
        console.warn('crypto.subtle não disponível, usando hash simples:', cryptoError);
        return await simpleHash(fingerprintString);
      }
    } else {
      return await simpleHash(fingerprintString);
    }
  } catch (error) {
    console.error('Erro ao gerar device fingerprint:', error);
    const fallback = `${navigator.platform}-${navigator.userAgent}-${Date.now()}`;
    return await simpleHash(fallback);
  }
}

export function getDeviceName(): string {
  const ua = navigator.userAgent.toLowerCase();
  let os = 'Dispositivo Web';
  
  if (ua.includes('win')) {
    os = 'Windows';
  } else if (ua.includes('mac')) {
    os = 'macOS';
  } else if (ua.includes('linux') && !ua.includes('android')) {
    os = 'Linux';
  } else if (ua.includes('android')) {
    os = 'Android';
  } else if (ua.includes('iphone') || ua.includes('ipad')) {
    os = 'iOS';
  }
  
  let browser = 'Browser';
  if (ua.includes('edg')) {
    browser = 'Edge';
  } else if (ua.includes('chrome') && !ua.includes('edg')) {
    browser = 'Chrome';
  } else if (ua.includes('firefox')) {
    browser = 'Firefox';
  } else if (ua.includes('safari') && !ua.includes('chrome')) {
    browser = 'Safari';
  }
  
  return `${os} - ${browser}`;
}

