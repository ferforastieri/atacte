import React, { useEffect, useState } from 'react';
import { View, Text, Linking } from 'react-native';
import { Button } from '../shared';
import api from '../../lib/axios';
import { useAuth } from '../../contexts/AuthContext';
export default function UpdateNotice() {
  const { isAuthenticated } = useAuth();
  const [release, setRelease] = useState<{ latestVersion: string; releaseUrl: string } | null>(null);
  useEffect(() => {
    if (!isAuthenticated) return;
    let active = true;
    const check = async () => { try { const { data } = await api.get('/updates'); if (active && data.data.updateAvailable) setRelease(data.data); } catch { /* Optional release notice. */ } };
    void check(); const timer = setInterval(check, 1800000);
    return () => { active = false; clearInterval(timer); };
  }, [isAuthenticated]);
  if (!release) return null;
  return <View style={{ padding: 12, backgroundColor: '#1f2937' }}><Text style={{ color: 'white' }}>Servidor: nova versão {release.latestVersion}. Atualize manualmente no servidor.</Text>
    <Button title="Ver release" onPress={() => { if (release.releaseUrl.startsWith('https://github.com/ferforastieri/atacte/releases/tag/')) void Linking.openURL(release.releaseUrl); }} />
    <Button title="Agora não" variant="ghost" onPress={() => setRelease(null)} /></View>;
}
