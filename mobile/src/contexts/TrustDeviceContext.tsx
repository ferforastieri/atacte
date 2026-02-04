import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { DeviceEventEmitter } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import TrustDeviceModal from '../components/auth/TrustDeviceModal';
import { useAuth } from './AuthContext';

interface TrustDeviceContextType {
  showModal: boolean;
  sessionId: string;
  deviceName: string;
  ipAddress: string;
  showTrustModal: (sessionId: string, deviceName: string, ipAddress: string) => void;
  hideTrustModal: () => void;
}

const TrustDeviceContext = createContext<TrustDeviceContextType | undefined>(undefined);

export function TrustDeviceProvider({ children }: { children: ReactNode }) {
  const [showModal, setShowModal] = useState(false);
  const [sessionId, setSessionId] = useState('');
  const [deviceName, setDeviceName] = useState('');
  const [ipAddress, setIpAddress] = useState('');
  const { logout, refreshUser } = useAuth();

  useEffect(() => {
    const checkIfAlreadyTrusted = async () => {
      try {
        const deviceTrusted = await AsyncStorage.getItem('device_trusted');
        if (deviceTrusted === 'true') {
          return;
        }
      } catch (error) {
      }
    };

    checkIfAlreadyTrusted();

    const subscription = DeviceEventEmitter.addListener('device-trust-required', async (data: {
      sessionId: string;
      deviceName: string;
      ipAddress: string;
    }) => {
      try {
        const deviceTrusted = await AsyncStorage.getItem('device_trusted');
        if (deviceTrusted === 'true') {
          return;
        }
      } catch (error) {
      }
      
      setSessionId(data.sessionId);
      setDeviceName(data.deviceName);
      setIpAddress(data.ipAddress);
      setShowModal(true);
    });

    return () => {
      subscription.remove();
    };
  }, []);

  const showTrustModal = (sessionId: string, deviceName: string, ipAddress: string) => {
    setSessionId(sessionId);
    setDeviceName(deviceName);
    setIpAddress(ipAddress);
    setShowModal(true);
  };

  const hideTrustModal = () => {
    setShowModal(false);
    setSessionId('');
    setDeviceName('');
    setIpAddress('');
  };

  const handleClose = async () => {
    await logout();
    hideTrustModal();
  };

  const handleTrusted = async () => {
    hideTrustModal();
    await refreshUser();
  };

  return (
    <TrustDeviceContext.Provider
      value={{
        showModal,
        sessionId,
        deviceName,
        ipAddress,
        showTrustModal,
        hideTrustModal,
      }}
    >
      {children}
      <TrustDeviceModal
        visible={showModal}
        sessionId={sessionId}
        deviceName={deviceName}
        ipAddress={ipAddress}
        onClose={handleClose}
        onTrusted={handleTrusted}
      />
    </TrustDeviceContext.Provider>
  );
}

export function useTrustDevice() {
  const context = useContext(TrustDeviceContext);
  if (context === undefined) {
    throw new Error('useTrustDevice must be used within a TrustDeviceProvider');
  }
  return context;
}

