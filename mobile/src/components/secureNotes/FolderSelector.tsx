import React, { useState } from 'react';
import { ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../contexts/ThemeContext';
import { radii, shadows, spacing, touch, typography } from '../../theme/tokens';

interface FolderSelectorProps {
  folders: string[];
  selectedFolder: string | null;
  onSelectFolder: (folder: string | null) => void;
}

export const FolderSelector: React.FC<FolderSelectorProps> = ({
  folders,
  selectedFolder,
  onSelectFolder,
}) => {
  const { colors } = useTheme();
  const [showDropdown, setShowDropdown] = useState(false);

  return (
    <View style={{ flex: 1, position: 'relative' }}>
      <TouchableOpacity
        accessibilityRole="button"
        accessibilityLabel="Filtrar por pasta"
        accessibilityState={{ expanded: showDropdown }}
        style={{
          minHeight: 48,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: spacing.sm,
          backgroundColor: colors.surface,
          borderColor: showDropdown ? colors.primary : colors.line,
          borderWidth: 1,
          borderRadius: radii.lg,
          paddingHorizontal: spacing.md,
        }}
        onPress={() => setShowDropdown((current) => !current)}
        activeOpacity={0.78}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1, gap: spacing.sm }}>
          <Ionicons name="folder-outline" size={18} color={colors.inkSubtle} />
          <Text numberOfLines={1} style={{ flex: 1, fontSize: typography.body, color: selectedFolder ? colors.ink : colors.inkSubtle }}>
            {selectedFolder || 'Todas as pastas'}
          </Text>
        </View>
        <Ionicons name={showDropdown ? 'chevron-up' : 'chevron-down'} size={18} color={colors.inkSubtle} />
      </TouchableOpacity>

      {showDropdown ? (
        <View
          style={{
            position: 'absolute',
            top: '100%',
            left: 0,
            right: 0,
            marginTop: spacing.xs,
            backgroundColor: colors.surfaceRaised,
            borderColor: colors.line,
            borderWidth: 1,
            borderRadius: radii.lg,
            maxHeight: 240,
            overflow: 'hidden',
            zIndex: 100,
            ...shadows.pop,
          }}
        >
          <ScrollView nestedScrollEnabled keyboardShouldPersistTaps="handled">
            {[{ label: 'Todas as pastas', value: null as string | null }, ...folders.map((folder) => ({ label: folder, value: folder }))].map((item) => {
              const active = selectedFolder === item.value;
              return (
                <TouchableOpacity
                  key={item.label}
                  accessibilityRole="button"
                  accessibilityState={{ selected: active }}
                  style={{
                    minHeight: touch.minimum,
                    justifyContent: 'center',
                    paddingHorizontal: spacing.lg,
                    borderBottomWidth: 1,
                    borderBottomColor: colors.line,
                    backgroundColor: active ? colors.primarySoft : colors.surfaceRaised,
                  }}
                  onPress={() => {
                    onSelectFolder(item.value);
                    setShowDropdown(false);
                  }}
                >
                  <Text style={{ fontSize: typography.body, color: active ? colors.primarySoftText : colors.ink }}>
                    {item.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>
      ) : null}
    </View>
  );
};
