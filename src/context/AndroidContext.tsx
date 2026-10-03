import React, { createContext, useContext, useState, useEffect } from 'react';

interface AndroidContextType {
  isAndroidDevice: boolean;
  deviceFrameEnabled: boolean;
  setDeviceFrameEnabled: (val: boolean) => void;
  isInstallModalOpen: boolean;
  openInstallModal: () => void;
  closeInstallModal: () => void;
  biometricLockEnabled: boolean;
  toggleBiometricLock: () => void;
  isBiometricLocked: boolean;
  unlockBiometric: () => void;
}

const AndroidContext = createContext<AndroidContextType | undefined>(undefined);

export const AndroidProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isAndroidDevice, setIsAndroidDevice] = useState(false);
  const [deviceFrameEnabled, setDeviceFrameEnabledState] = useState(() => {
    // Default to true on desktop if window width >= 1024, or based on localStorage
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('pocketsmart_android_frame');
      if (saved !== null) return saved === 'true';
      return false; // Start in normal desktop view with top toggle
    }
    return false;
  });

  const [isInstallModalOpen, setIsInstallModalOpen] = useState(false);
  const [biometricLockEnabled, setBiometricLockEnabled] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('pocketsmart_android_biometric') === 'true';
    }
    return false;
  });
  const [isBiometricLocked, setIsBiometricLocked] = useState(false);

  useEffect(() => {
    const userAgent = window.navigator.userAgent.toLowerCase();
    setIsAndroidDevice(/android/.test(userAgent));
  }, []);

  const setDeviceFrameEnabled = (val: boolean) => {
    setDeviceFrameEnabledState(val);
    localStorage.setItem('pocketsmart_android_frame', String(val));
  };

  const toggleBiometricLock = () => {
    const newVal = !biometricLockEnabled;
    setBiometricLockEnabled(newVal);
    localStorage.setItem('pocketsmart_android_biometric', String(newVal));
  };

  const unlockBiometric = () => {
    setIsBiometricLocked(false);
  };

  return (
    <AndroidContext.Provider
      value={{
        isAndroidDevice,
        deviceFrameEnabled,
        setDeviceFrameEnabled,
        isInstallModalOpen,
        openInstallModal: () => setIsInstallModalOpen(true),
        closeInstallModal: () => setIsInstallModalOpen(false),
        biometricLockEnabled,
        toggleBiometricLock,
        isBiometricLocked,
        unlockBiometric,
      }}
    >
      {children}
    </AndroidContext.Provider>
  );
};

export const useAndroid = () => {
  const context = useContext(AndroidContext);
  if (!context) {
    throw new Error('useAndroid must be used within an AndroidProvider');
  }
  return context;
};
