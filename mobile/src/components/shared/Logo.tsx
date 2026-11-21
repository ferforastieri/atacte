import React from 'react';
import { View, Text, Image, ViewStyle, TextStyle } from 'react-native';
import { useTheme } from '../../contexts/ThemeContext';
import { typography } from '../../theme/tokens';

interface LogoProps {
  size?: number;
  showText?: boolean;
  textColor?: string;
  textSize?: number;
  style?: ViewStyle;
  textStyle?: TextStyle;
}

export const Logo: React.FC<LogoProps> = ({
  size = 48,
  showText = true,
  textColor,
  textSize = typography.headline,
  style,
  textStyle,
}) => {
  const { colors } = useTheme();

  return (
    <View style={[{ flexDirection: 'row', alignItems: 'center' }, style]}>
      <Image
        source={require('../../../assets/logo.png')}
        style={{ width: size, height: size, resizeMode: 'contain' }}
      />
      {showText ? (
        <Text
          style={[
            {
              fontWeight: typography.weights.bold,
              color: textColor || colors.ink,
              fontSize: textSize,
              marginLeft: 8,
            },
            textStyle,
          ]}
        >
          Atacte
        </Text>
      ) : null}
    </View>
  );
};
