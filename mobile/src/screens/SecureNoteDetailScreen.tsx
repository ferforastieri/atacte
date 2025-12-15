import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet, BackHandler } from 'react-native';
import { RouteProp, useRoute, useFocusEffect } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { useNavigation } from '@react-navigation/native';
import { Header, Card, SkeletonLoader } from '../components/shared';
import { secureNoteService } from '../services/secureNotes/secureNoteService';
import { useTheme } from '../contexts/ThemeContext';
import { useToast } from '../hooks/useToast';
import { RootStackParamList } from '../navigation/AppNavigator';
import { Ionicons } from '@expo/vector-icons';

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
  const { isDark, toggleTheme } = useTheme();
  const { showError } = useToast();

  const handleBack = () => {
    navigation.goBack();
  };

  useFocusEffect(
    React.useCallback(() => {
      const onBackPress = () => {
        handleBack();
        return true;
      };

      const subscription = BackHandler.addEventListener('hardwareBackPress', onBackPress);
      return () => subscription.remove();
    }, [navigation])
  );

  const [note, setNote] = useState<SecureNote | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadNote();
  }, [noteId]);

  const loadNote = async () => {
    try {
      setIsLoading(true);
      const response = await secureNoteService.getNote(noteId);
      
      if (response.success && response.data) {
        setNote(response.data);
      } else {
        showError('Nota não encontrada');
        navigation.goBack();
      }
    } catch (error) {
      showError('Erro ao carregar nota');
      navigation.goBack();
    } finally {
      setIsLoading(false);
    }
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: isDark ? '#111827' : '#f9fafb',
    },
    content: {
      flex: 1,
      padding: 20,
    },
    card: {
      marginBottom: 20,
    },
    title: {
      fontSize: 24,
      fontWeight: '600',
      color: isDark ? '#f9fafb' : '#111827',
      marginBottom: 16,
    },
    meta: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 16,
      marginBottom: 24,
      paddingBottom: 16,
      borderBottomWidth: 1,
      borderBottomColor: isDark ? '#374151' : '#e5e7eb',
    },
    metaItem: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
    },
    metaText: {
      fontSize: 14,
      color: isDark ? '#9ca3af' : '#6b7280',
    },
    contentText: {
      fontSize: 16,
      lineHeight: 24,
      color: isDark ? '#f9fafb' : '#111827',
    },
    loadingContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
    },
    loadingText: {
      fontSize: 16,
      color: isDark ? '#9ca3af' : '#6b7280',
      marginTop: 16,
    },
  });

  if (isLoading) {
    return (
      <View style={styles.container}>
        <Header 
          title="Visualizar Nota" 
          onThemeToggle={toggleTheme}
          showBackButton={true}
          onBack={handleBack}
        />
        <View style={styles.content}>
          <Card style={styles.card}>
            <SkeletonLoader />
          </Card>
        </View>
      </View>
    );
  }

  if (!note) {
    return null;
  }

  return (
    <View style={styles.container}>
      <Header 
        title="Visualizar Nota" 
        onThemeToggle={toggleTheme}
        showBackButton={true}
      />
      <ScrollView style={styles.content}>
        <Card style={styles.card}>
          <Text style={styles.title}>{note.title}</Text>
          
          <View style={styles.meta}>
            {note.folder && (
              <View style={styles.metaItem}>
                <Ionicons name="folder-outline" size={16} color={isDark ? '#9ca3af' : '#6b7280'} />
                <Text style={styles.metaText}>{note.folder}</Text>
              </View>
            )}
            {note.isFavorite && (
              <View style={styles.metaItem}>
                <Ionicons name="star" size={16} color="#fbbf24" />
                <Text style={styles.metaText}>Favorita</Text>
              </View>
            )}
            <View style={styles.metaItem}>
              <Ionicons name="calendar-outline" size={16} color={isDark ? '#9ca3af' : '#6b7280'} />
              <Text style={styles.metaText}>
                {new Date(note.updatedAt).toLocaleDateString('pt-BR')}
              </Text>
            </View>
          </View>

          <Text style={styles.contentText}>{note.content}</Text>
        </Card>
      </ScrollView>
    </View>
  );
}

