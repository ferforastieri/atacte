import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated } from 'react-native';
import { useTheme } from '../../contexts/ThemeContext';

interface SkeletonProps {
  width?: number | string;
  height?: number;
  borderRadius?: number;
  style?: Record<string, unknown> | Array<Record<string, unknown>>;
}

export const Skeleton: React.FC<SkeletonProps> = ({
  width = '100%',
  height = 20,
  borderRadius = 12,
  style,
}) => {
  const { isDark } = useTheme();
  const animatedValue = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(animatedValue, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(animatedValue, {
          toValue: 0,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, [animatedValue]);

  const opacity = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: [0.5, 0.9],
  });

  return (
    <Animated.View
      style={[
        {
          width,
          height,
          borderRadius,
          backgroundColor: isDark ? '#374151' : '#e5e7eb',
          opacity,
        },
        style,
      ]}
    />
  );
};

interface SkeletonLoaderProps {
  variant?: 'default' | 'dashboard' | 'profile' | 'family' | 'secureNotes' | 'familyDetail';
}

export const SkeletonLoader: React.FC<SkeletonLoaderProps> = ({ variant = 'default' }) => {
  const { isDark } = useTheme();

  if (variant === 'dashboard') {
    return (
      <View style={[styles.dashboardContainer, { backgroundColor: isDark ? '#111827' : '#f9fafb' }]}>
        <View style={styles.searchContainer}>
          <Skeleton width="100%" height={48} borderRadius={12} />
        </View>
        
        <View style={styles.quickActionsContainer}>
          <Skeleton width={100} height={100} borderRadius={12} />
          <Skeleton width={100} height={100} borderRadius={12} />
          <Skeleton width={100} height={100} borderRadius={12} />
        </View>

        <View style={styles.cardsContainer}>
          {[1, 2, 3, 4].map((i) => (
            <View key={i} style={[styles.passwordCard, { 
              backgroundColor: isDark ? '#1f2937' : '#ffffff',
              borderColor: isDark ? '#374151' : '#e5e7eb',
            }]}>
              <View style={styles.cardHeader}>
                <Skeleton width={40} height={40} borderRadius={20} />
                <View style={styles.cardHeaderText}>
                  <Skeleton width="60%" height={16} borderRadius={6} style={{ marginBottom: 6 }} />
                  <Skeleton width="40%" height={12} borderRadius={4} />
                </View>
                <Skeleton width={24} height={24} borderRadius={12} />
              </View>
              <View style={styles.cardContent}>
                <Skeleton width="80%" height={14} borderRadius={4} style={{ marginBottom: 4 }} />
                <Skeleton width="60%" height={14} borderRadius={4} />
              </View>
            </View>
          ))}
        </View>
      </View>
    );
  }

  if (variant === 'profile') {
    return (
      <View style={[styles.profileContainer, { backgroundColor: isDark ? '#111827' : '#f9fafb' }]}>
        <View style={[styles.profileCard, { backgroundColor: isDark ? '#1f2937' : '#ffffff' }]}>
          <View style={styles.profileHeader}>
            <Skeleton width={80} height={80} borderRadius={40} />
            <Skeleton width="50%" height={20} borderRadius={8} style={{ marginTop: 12 }} />
            <Skeleton width="40%" height={14} borderRadius={6} style={{ marginTop: 8 }} />
          </View>
          <View style={styles.profileInfo}>
            <View style={styles.infoRow}>
              <Skeleton width={60} height={14} borderRadius={4} />
              <Skeleton width={120} height={14} borderRadius={4} />
            </View>
            <View style={styles.infoRow}>
              <Skeleton width={60} height={14} borderRadius={4} />
              <Skeleton width={120} height={14} borderRadius={4} />
            </View>
          </View>
        </View>

        <View style={[styles.statsCard, { backgroundColor: isDark ? '#1f2937' : '#ffffff' }]}>
          <Skeleton width={100} height={18} borderRadius={6} style={{ marginBottom: 16 }} />
          <View style={styles.statsGrid}>
            <View style={styles.statItem}>
              <Skeleton width={40} height={24} borderRadius={4} style={{ marginBottom: 8 }} />
              <Skeleton width={80} height={12} borderRadius={4} />
            </View>
            <View style={styles.statItem}>
              <Skeleton width={40} height={24} borderRadius={4} style={{ marginBottom: 8 }} />
              <Skeleton width={60} height={12} borderRadius={4} />
            </View>
            <View style={styles.statItem}>
              <Skeleton width={40} height={24} borderRadius={4} style={{ marginBottom: 8 }} />
              <Skeleton width={70} height={12} borderRadius={4} />
            </View>
          </View>
        </View>

        <View style={[styles.actionsCard, { backgroundColor: isDark ? '#1f2937' : '#ffffff' }]}>
          <Skeleton width={100} height={18} borderRadius={6} style={{ marginBottom: 12 }} />
          <Skeleton width="100%" height={48} borderRadius={12} style={{ marginBottom: 12 }} />
          <Skeleton width="100%" height={48} borderRadius={12} />
        </View>
      </View>
    );
  }

  if (variant === 'family') {
    return (
      <View style={[styles.familyContainer, { backgroundColor: isDark ? '#111827' : '#f9fafb' }]}>
        <View style={styles.familyCardsContainer}>
          {[1, 2].map((i) => (
            <View key={i} style={[styles.familyCard, { 
              backgroundColor: isDark ? '#1f2937' : '#ffffff',
              borderColor: isDark ? '#374151' : '#e5e7eb',
            }]}>
              <Skeleton width="70%" height={18} borderRadius={6} style={{ marginBottom: 8 }} />
              <Skeleton width="40%" height={14} borderRadius={4} />
            </View>
          ))}
        </View>
      </View>
    );
  }

  if (variant === 'secureNotes') {
    return (
      <View style={[styles.secureNotesContainer, { backgroundColor: isDark ? '#111827' : '#f9fafb' }]}>
        <View style={styles.searchContainer}>
          <Skeleton width="100%" height={48} borderRadius={12} />
        </View>
        
        <View style={styles.folderSelector}>
          <Skeleton width={100} height={36} borderRadius={8} />
          <Skeleton width={100} height={36} borderRadius={8} />
          <Skeleton width={100} height={36} borderRadius={8} />
        </View>

        <View style={styles.notesContainer}>
          {[1, 2, 3].map((i) => (
            <View key={i} style={[styles.noteCard, { 
              backgroundColor: isDark ? '#1f2937' : '#ffffff',
              borderColor: isDark ? '#374151' : '#e5e7eb',
            }]}>
              <View style={styles.noteHeader}>
                <Skeleton width="60%" height={16} borderRadius={6} />
                <Skeleton width={20} height={20} borderRadius={10} />
              </View>
              <Skeleton width="100%" height={14} borderRadius={4} style={{ marginTop: 8, marginBottom: 4 }} />
              <Skeleton width="80%" height={14} borderRadius={4} />
              <View style={styles.noteFooter}>
                <Skeleton width={80} height={12} borderRadius={4} />
                <Skeleton width={60} height={12} borderRadius={4} />
              </View>
            </View>
          ))}
        </View>
      </View>
    );
  }

  if (variant === 'familyDetail') {
    return (
      <View style={[styles.familyDetailContainer, { backgroundColor: isDark ? '#111827' : '#f9fafb' }]}>
        <View style={styles.tabsContainer}>
          <Skeleton width="25%" height={44} borderRadius={12} />
          <Skeleton width="25%" height={44} borderRadius={12} />
          <Skeleton width="25%" height={44} borderRadius={12} />
          <Skeleton width="25%" height={44} borderRadius={12} />
        </View>
        <View style={styles.mapSkeleton}>
          <Skeleton width="100%" height={400} borderRadius={0} />
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Skeleton width="100%" height={20} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  dashboardContainer: {
    flex: 1,
    padding: 20,
  },
  profileContainer: {
    flex: 1,
    padding: 20,
  },
  familyContainer: {
    flex: 1,
    padding: 20,
  },
  secureNotesContainer: {
    flex: 1,
    padding: 20,
  },
  familyDetailContainer: {
    flex: 1,
    padding: 0,
  },
  searchContainer: {
    marginBottom: 20,
  },
  quickActionsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 24,
  },
  cardsContainer: {
    gap: 12,
  },
  passwordCard: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 12,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  cardHeaderText: {
    flex: 1,
    marginLeft: 12,
  },
  cardContent: {
    marginTop: 8,
  },
  profileCard: {
    padding: 20,
    borderRadius: 12,
    marginBottom: 20,
  },
  profileHeader: {
    alignItems: 'center',
    marginBottom: 20,
  },
  profileInfo: {
    gap: 12,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  statsCard: {
    padding: 20,
    borderRadius: 12,
    marginBottom: 20,
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  actionsCard: {
    padding: 20,
    borderRadius: 12,
  },
  familyCardsContainer: {
    gap: 12,
  },
  familyCard: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
  },
  folderSelector: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
    flexWrap: 'wrap',
  },
  notesContainer: {
    gap: 12,
  },
  noteCard: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
  },
  noteHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  noteFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  tabsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 8,
    gap: 8,
  },
  mapSkeleton: {
    flex: 1,
    marginTop: 8,
  },
});

