import React from 'react';
import { View, Text, Image, ViewStyle, TextStyle } from 'react-native';

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
  textColor = '#111827',
  textSize = 20,
  style,
  textStyle,
}) => {
  return (
    <View style={[{ flexDirection: 'row', alignItems: 'center' }, style]}>
      {}
      <Image
        source={require('../../../assets/logo.png')}
        style={{
          width: size,
          height: size,
          resizeMode: 'contain',
        }}
      />
      
      {}
      {showText && (
        <Text
          style={[
            {
              fontWeight: 'bold',
              color: textColor,
              fontSize: textSize,
              marginLeft: 8,
            },
            textStyle,
          ]}
        >
          Sentro
        </Text>
      )}
    </View>
  );
};
