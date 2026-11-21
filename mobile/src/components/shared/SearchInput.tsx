import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, TextInput, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../contexts/ThemeContext';
import { radii, spacing, touch, typography } from '../../theme/tokens';

interface SearchInputProps {
  value?: string;
  placeholder?: string;
  debounceMs?: number;
  disabled?: boolean;
  autoFocus?: boolean;
  showClearButton?: boolean;
  minLength?: number;
  onChangeText?: (text: string) => void;
  onSearch?: (text: string) => void;
  onClear?: () => void;
  onFocus?: () => void;
  onBlur?: () => void;
  onEnter?: (text: string) => void;
}

export const SearchInput: React.FC<SearchInputProps> = ({
  value = '',
  placeholder = 'Pesquisar...',
  debounceMs = 500,
  disabled = false,
  autoFocus = false,
  showClearButton = true,
  minLength = 2,
  onChangeText,
  onSearch,
  onClear,
  onFocus,
  onBlur,
  onEnter,
}) => {
  const { colors } = useTheme();
  const [inputValue, setInputValue] = useState(value);
  const [isSearching, setIsSearching] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const inputRef = useRef<TextInput>(null);
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const searchTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  const debouncedSearch = useCallback(
    (text: string) => {
      if (debounceTimer.current) clearTimeout(debounceTimer.current);
      debounceTimer.current = setTimeout(() => {
        if (text.length >= minLength) {
          setIsSearching(true);
          onSearch?.(text);
          if (searchTimeout.current) clearTimeout(searchTimeout.current);
          searchTimeout.current = setTimeout(() => setIsSearching(false), 250);
        } else if (text.length === 0) {
          setIsSearching(false);
          onSearch?.('');
        }
      }, debounceMs);
    },
    [debounceMs, minLength, onSearch],
  );

  const handleChange = (text: string) => {
    setInputValue(text);
    onChangeText?.(text);
    debouncedSearch(text);
  };

  const handleClear = () => {
    setInputValue('');
    onChangeText?.('');
    onClear?.();
    onSearch?.('');
    setIsSearching(false);
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
      debounceTimer.current = null;
    }
    inputRef.current?.focus();
  };

  const handleSubmit = () => {
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
      debounceTimer.current = null;
    }
    onEnter?.(inputValue);
    onSearch?.(inputValue);
  };

  useEffect(() => {
    if (value !== inputValue) setInputValue(value);
  }, [value]);

  useEffect(() => {
    if (autoFocus) inputRef.current?.focus();
  }, [autoFocus]);

  useEffect(() => () => {
    if (debounceTimer.current) clearTimeout(debounceTimer.current);
    if (searchTimeout.current) clearTimeout(searchTimeout.current);
  }, []);

  return (
    <View style={{ width: '100%' }}>
      <View
        style={{
          minHeight: 48,
          flexDirection: 'row',
          alignItems: 'center',
          borderWidth: 1,
          borderColor: isFocused ? colors.primary : colors.line,
          borderRadius: radii.lg,
          backgroundColor: disabled ? colors.surfaceMuted : colors.surface,
        }}
      >
        <Ionicons name="search" size={19} color={colors.inkSubtle} style={{ marginLeft: spacing.md }} />
        <TextInput
          ref={inputRef}
          accessibilityLabel={placeholder}
          style={{
            flex: 1,
            minHeight: 46,
            paddingHorizontal: spacing.sm,
            paddingRight: showClearButton && inputValue ? touch.minimum : spacing.md,
            fontSize: typography.body,
            color: colors.ink,
          }}
          value={inputValue}
          onChangeText={handleChange}
          onSubmitEditing={handleSubmit}
          onFocus={() => {
            setIsFocused(true);
            onFocus?.();
          }}
          onBlur={() => {
            setIsFocused(false);
            onBlur?.();
          }}
          placeholder={placeholder}
          placeholderTextColor={colors.inkSubtle}
          editable={!disabled}
          returnKeyType="search"
          autoCapitalize="none"
          autoCorrect={false}
        />

        {isSearching ? (
          <ActivityIndicator size="small" color={colors.primary} style={{ marginRight: spacing.sm }} />
        ) : null}

        {showClearButton && inputValue.length > 0 ? (
          <TouchableOpacity
            accessibilityRole="button"
            accessibilityLabel="Limpar busca"
            style={{
              width: touch.minimum,
              height: touch.minimum,
              alignItems: 'center',
              justifyContent: 'center',
            }}
            onPress={handleClear}
            disabled={disabled}
          >
            <Ionicons name="close" size={18} color={colors.inkSubtle} />
          </TouchableOpacity>
        ) : null}
      </View>
    </View>
  );
};

export default SearchInput;
