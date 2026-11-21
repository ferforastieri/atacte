import React, { useEffect, useState } from 'react';
import { BackHandler, ScrollView, Text, View } from 'react-native';
import { RouteProp, useFocusEffect, useNavigation, useRoute } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { Ionicons } from '@expo/vector-icons';
import { Card, Header, SkeletonDetail } from '../components/shared';
import { IconTile } from '../components/shared/IconTile';
import { Pill } from '../components/shared/Pill';
import { secureNoteService } from '../services/secureNotes/secureNoteService';
import { useTheme } from '../contexts/ThemeContext';
import { RootStackParamList } from '../navigation/AppNavigator';
import { radii, spacing, typography } from '../theme/tokens';

type SecureNoteDetailRouteProp = RouteProp<RootStackParamList, 'SecureNoteDetail'>;
type SecureNoteDetailNavigationProp = StackNavigationProp<RootStackParamList, 'SecureNoteDetail'>;

interface SecureNote {
  id: string;
  title: string;
  content: string;
  folder?: string;
  isFavorite: boolean;
  createdAt: string;
  updatedAt: string;
}

export default function SecureNoteDetailScreen() {
  const route = useRoute<SecureNoteDetailRouteProp>();
  const navigation = useNavigation<SecureNoteDetailNavigationProp>();
  const { noteId } = route.params;
  const { colors, toggleTheme } = useTheme();
  const [note, setNote] = useState<SecureNote | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const handleBack = () => navigation.goBack();

  useFocusEffect(
    React.useCallback(() => {
      const onBackPress = () => {
        handleBack();
        return true;
      };
      const subscription = BackHandler.addEventListener('hardwareBackPress', onBackPress);
      return () => subscription.remove();
    }, [navigation]),
  );

  useEffect(() => {
    void loadNote();
  }, [noteId]);

  const loadNote = async () => {
    setIsLoading(true);
    try {
      const response = await secureNoteService.getNote(noteId);
      if (response.success && response.data) {
        setNote(response.data);
      } else {
        navigation.goBack();
      }
    } catch {
      navigation.goBack();
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.canvas }}>
        <Header title="Visualizar Nota" showBackButton onBack={handleBack} onThemeToggle={toggleTheme} />
        <SkeletonDetail showSecret={false} />
      </View>
    );
  }

  if (!note) return null;

  return (
    <View style={{ flex: 1, backgroundColor: colors.canvas }}>
      <Header
        title="Visualizar Nota"
        subtitle={note.folder || 'Nota segura'}
        showBackButton
        onBack={handleBack}
        onThemeToggle={toggleTheme}
        icon={<Ionicons name="document-text-outline" size={22} color={colors.primarySoftText} />}
      />

      <ScrollView contentContainerStyle={{ padding: spacing.screen, paddingBottom: 48 }} showsVerticalScrollIndicator={false}>
        <Card>
          <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: spacing.md, marginBottom: spacing.lg }}>
            <IconTile size={48}>
              <Ionicons name="document-text-outline" size={22} color={colors.primarySoftText} />
            </IconTile>
            <View style={{ flex: 1, minWidth: 0 }}>
              <Text style={{ fontSize: typography.headline, fontWeight: typography.weights.semibold, color: colors.ink }}>{note.title}</Text>
              <View style={{ flexDirection: 'row', gap: spacing.sm, flexWrap: 'wrap', marginTop: spacing.sm }}>
                {note.folder ? <Pill label={note.folder} icon={<Ionicons name="folder-outline" size={12} color={colors.inkMuted} />} /> : null}
                {note.isFavorite ? <Pill label="Favorita" tone="warning" icon={<Ionicons name="star" size={12} color={colors.warningText} />} /> : null}
                <Pill label={new Date(note.updatedAt).toLocaleDateString('pt-BR')} icon={<Ionicons name="calendar-outline" size={12} color={colors.inkMuted} />} />
              </View>
            </View>
          </View>

          <View
            style={{
              borderRadius: radii.lg,
              borderWidth: 1,
              borderColor: colors.line,
              backgroundColor: colors.surfaceMuted,
              padding: spacing.xl,
            }}
          >
            <Text style={{ fontSize: typography.bodyLarge, lineHeight: 26, color: colors.ink }}>{note.content}</Text>
          </View>
        </Card>
      </ScrollView>
    </View>
  );
}
