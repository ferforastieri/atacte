import * as Device from 'expo-device';
import { Platform } from 'react-native';

export async function getDeviceName(): Promise<string> {
  const os = Platform.OS === 'ios' ? 'iOS' : 'Android';
  const deviceName = Device.deviceName || Device.modelName || 'Dispositivo';
  return `${os} - ${deviceName}`;
}
