const FINGERPRINT_STORAGE_KEY = 'atacte_device_fingerprint';

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
    const storedFingerprint = localStorage.getItem(FINGERPRINT_STORAGE_KEY);
    if (storedFingerprint) {
      return storedFingerprint;
    }

    const fingerprintData = {
      platform: navigator.platform || 'Unknown',
      userAgent: navigator.userAgent || 'Unknown',
      language: navigator.language || 'Unknown',
      languages: navigator.languages?.join(',') || 'Unknown',
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'Unknown',
      hardwareConcurrency: navigator.hardwareConcurrency || 0,
    };

    const fingerprintString = JSON.stringify(fingerprintData);
    
    let fingerprint: string;
    if (typeof crypto !== 'undefined' && crypto.subtle && crypto.subtle.digest) {
      try {
        const encoder = new TextEncoder();
        const data = encoder.encode(fingerprintString);
        const hashBuffer = await crypto.subtle.digest('SHA-256', data);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        fingerprint = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
      } catch (cryptoError) {
        console.warn('crypto.subtle não disponível, usando hash simples:', cryptoError);
        fingerprint = await simpleHash(fingerprintString);
      }
    } else {
      fingerprint = await simpleHash(fingerprintString);
    }

    localStorage.setItem(FINGERPRINT_STORAGE_KEY, fingerprint);
    return fingerprint;
  } catch (error) {
    console.error('Erro ao gerar device fingerprint:', error);
    const fallback = `${navigator.platform}-${navigator.userAgent}-${Date.now()}`;
    const fingerprint = await simpleHash(fallback);
    try {
      localStorage.setItem(FINGERPRINT_STORAGE_KEY, fingerprint);
    } catch (storageError) {
    }
    return fingerprint;
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

