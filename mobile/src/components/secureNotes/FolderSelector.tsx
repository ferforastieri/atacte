import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../contexts/ThemeContext';

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
  const { isDark } = useTheme();
  const [showDropdown, setShowDropdown] = useState(false);

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      position: 'relative',
    },
    button: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      backgroundColor: isDark ? '#1f2937' : '#ffffff',
      borderColor: isDark ? '#374151' : '#e5e7eb',
      borderWidth: 1,
      borderRadius: 12,
      paddingHorizontal: 12,
      paddingVertical: 10,
    },
    buttonText: {
      fontSize: 16,
      color: isDark ? '#f9fafb' : '#111827',
      flex: 1,
    },
    dropdown: {
      position: 'absolute',
      top: '100%',
      left: 0,
      right: 0,
      marginTop: 4,
      backgroundColor: isDark ? '#1f2937' : '#ffffff',
      borderColor: isDark ? '#374151' : '#e5e7eb',
      borderWidth: 1,
      borderRadius: 12,
      maxHeight: 200,
      zIndex: 1000,
      elevation: 1,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.1,
      shadowRadius: 2,
    },
    dropdownItem: {
      paddingHorizontal: 16,
      paddingVertical: 12,
      borderBottomWidth: 1,
      borderBottomColor: isDark ? '#374151' : '#e5e7eb',
    },
    dropdownItemText: {
      fontSize: 16,
      color: isDark ? '#f9fafb' : '#111827',
    },
    dropdownItemActive: {
      backgroundColor: isDark ? '#374151' : '#f3f4f6',
    },
  });

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={styles.button}
        onPress={() => setShowDropdown(!showDropdown)}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
          <Ionicons 
            name="folder-outline" 
            size={20} 
            color={isDark ? '#9ca3af' : '#6b7280'} 
            style={{ marginRight: 8 }}
          />
          <Text style={styles.buttonText}>
            {selectedFolder || 'Todas as pastas'}
          </Text>
        </View>
        <Ionicons
          name={showDropdown ? 'chevron-up' : 'chevron-down'}
          size={20}
          color={isDark ? '#9ca3af' : '#6b7280'}
        />
      </TouchableOpacity>
      {showDropdown && (
        <View style={styles.dropdown}>
          <ScrollView nestedScrollEnabled>
            <TouchableOpacity
              style={[
                styles.dropdownItem,
                !selectedFolder && styles.dropdownItemActive,
              ]}
              onPress={() => {
                onSelectFolder(null);
                setShowDropdown(false);
              }}
            >
              <Text style={styles.dropdownItemText}>Todas as pastas</Text>
            </TouchableOpacity>
            {folders.map((folder) => (
              <TouchableOpacity
                key={folder}
                style={[
                  styles.dropdownItem,
                  selectedFolder === folder && styles.dropdownItemActive,
                ]}
                onPress={() => {
                  onSelectFolder(folder);
                  setShowDropdown(false);
                }}
              >
                <Text style={styles.dropdownItemText}>{folder}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}
    </View>
  );
};

