import * as Device from 'expo-device';
import * as Crypto from 'expo-crypto';
import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';

const DEVICE_FINGERPRINT_KEY = 'atacte_device_fingerprint';

export async function getDeviceFingerprint(): Promise<string> {
  try {
    let storedFingerprint = await SecureStore.getItemAsync(DEVICE_FINGERPRINT_KEY);
    
    if (storedFingerprint) {
      return storedFingerprint;
    }

    const fingerprintData = {
      platform: Platform.OS,
      deviceName: Device.deviceName || Device.modelName || 'Unknown',
      brand: Device.brand || 'Unknown',
      modelName: Device.modelName || 'Unknown',
      osName: Device.osName || 'Unknown',
      osVersion: Device.osVersion || 'Unknown',
      deviceType: Device.deviceType?.toString() || 'Unknown',
    };

    const fingerprintString = JSON.stringify(fingerprintData);
    const fingerprint = await Crypto.digestStringAsync(
      Crypto.CryptoDigestAlgorithm.SHA256,
      fingerprintString
    );

    await SecureStore.setItemAsync(DEVICE_FINGERPRINT_KEY, fingerprint);
    
    return fingerprint;
  } catch (error) {
    console.error('Erro ao gerar device fingerprint:', error);
    const fallback = `${Platform.OS}-${Device.modelName || 'Unknown'}-${Date.now()}`;
    return await Crypto.digestStringAsync(
      Crypto.CryptoDigestAlgorithm.SHA256,
      fallback
    );
  }
}

export async function getDeviceName(): Promise<string> {
  const os = Platform.OS === 'ios' ? 'iOS' : 'Android';
  const deviceName = Device.deviceName || Device.modelName || 'Dispositivo';
  return `${os} - ${deviceName}`;
}

