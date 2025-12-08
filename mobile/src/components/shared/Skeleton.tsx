import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated } from 'react-native';
import { useTheme } from '../../contexts/ThemeContext';

interface SkeletonProps {
  width?: number | string;
  height?: number;
  borderRadius?: number;
  style?: any;
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
    outputRange: [0.3, 0.7],
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
  variant?: 'default' | 'app';
}

export const SkeletonLoader: React.FC<SkeletonLoaderProps> = ({ variant = 'default' }) => {
  const { isDark } = useTheme();

  if (variant === 'app') {
    return (
      <View style={[styles.appContainer, { backgroundColor: isDark ? '#111827' : '#f9fafb' }]}>
        <View style={[styles.appHeader, { 
          backgroundColor: isDark ? '#1f2937' : '#ffffff',
          borderBottomColor: isDark ? '#374151' : '#e5e7eb',
        }]}>
          <View style={styles.appHeaderContent}>
            <Skeleton width={40} height={40} borderRadius={20} />
            <View style={styles.appHeaderRight}>
              <Skeleton width={36} height={36} borderRadius={18} />
              <Skeleton width={36} height={36} borderRadius={18} />
            </View>
          </View>
        </View>
        
        <View style={styles.appContent}>
          <View style={styles.appSearchContainer}>
            <Skeleton width="100%" height={40} borderRadius={12} />
          </View>
          
          <View style={styles.appCardsContainer}>
            <View style={[styles.appCard, { 
              backgroundColor: isDark ? '#1f2937' : '#ffffff',
              borderColor: isDark ? '#374151' : '#e5e7eb',
            }]}>
              <Skeleton width="60%" height={18} borderRadius={8} style={{ marginBottom: 8 }} />
              <Skeleton width="40%" height={14} borderRadius={6} style={{ marginBottom: 12 }} />
              <View style={styles.appCardRow}>
                <Skeleton width={80} height={32} borderRadius={10} />
                <Skeleton width={36} height={36} borderRadius={18} />
              </View>
            </View>
            
            <View style={[styles.appCard, { 
              backgroundColor: isDark ? '#1f2937' : '#ffffff',
              borderColor: isDark ? '#374151' : '#e5e7eb',
            }]}>
              <Skeleton width="70%" height={18} borderRadius={8} style={{ marginBottom: 8 }} />
              <Skeleton width="50%" height={14} borderRadius={6} style={{ marginBottom: 12 }} />
              <View style={styles.appCardRow}>
                <Skeleton width={80} height={32} borderRadius={10} />
                <Skeleton width={36} height={36} borderRadius={18} />
              </View>
            </View>
            
            <View style={[styles.appCard, { 
              backgroundColor: isDark ? '#1f2937' : '#ffffff',
              borderColor: isDark ? '#374151' : '#e5e7eb',
            }]}>
              <Skeleton width="65%" height={18} borderRadius={8} style={{ marginBottom: 8 }} />
              <Skeleton width="45%" height={14} borderRadius={6} style={{ marginBottom: 12 }} />
              <View style={styles.appCardRow}>
                <Skeleton width={80} height={32} borderRadius={10} />
                <Skeleton width={36} height={36} borderRadius={18} />
              </View>
            </View>
          </View>
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
    padding: 16,
  },
  appContainer: {
    flex: 1,
  },
  appHeader: {
    borderBottomWidth: 1,
    paddingTop: 8,
    paddingBottom: 12,
  },
  appHeaderContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  appHeaderRight: {
    flexDirection: 'row',
    gap: 8,
  },
  appContent: {
    flex: 1,
    padding: 20,
  },
  appSearchContainer: {
    marginBottom: 20,
  },
  appCardsContainer: {
    gap: 12,
  },
  appCard: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1,
  },
  appCardRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
});

