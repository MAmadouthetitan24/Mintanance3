import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Image,
  StyleSheet,
  Dimensions,
  PanResponder,
  Animated,
  ViewStyle,
  ImageStyle,
} from 'react-native';
import { MediaItem } from '../../services/MediaService';

interface BeforeAfterComparisonProps {
  beforeImage: MediaItem;
  afterImage: MediaItem;
  height?: number;
  width?: number;
}

export const BeforeAfterComparison: React.FC<BeforeAfterComparisonProps> = ({
  beforeImage,
  afterImage,
  height = 300,
  width = Dimensions.get('window').width,
}) => {
  const [containerWidth, setContainerWidth] = useState(width);
  const sliderPosition = useRef(new Animated.Value(0.5)).current;
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderMove: (_, gestureState) => {
        const newPosition = Math.max(0, Math.min(1, 0.5 + gestureState.dx / containerWidth));
        sliderPosition.setValue(newPosition);
      },
    })
  ).current;

  useEffect(() => {
    setContainerWidth(width);
  }, [width]);

  const beforeImageStyle: ImageStyle = {
    width: containerWidth,
    height,
  };

  const afterImageStyle: ImageStyle = {
    width: containerWidth,
    height,
    position: 'absolute',
    left: 0,
    top: 0,
  };

  const sliderStyle: Animated.WithAnimatedObject<ViewStyle> = {
    position: 'absolute',
    left: sliderPosition.interpolate({
      inputRange: [0, 1],
      outputRange: [0, containerWidth],
    }),
    top: 0,
    bottom: 0,
    width: 2,
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  };

  const handleStyle: Animated.WithAnimatedObject<ViewStyle> = {
    position: 'absolute',
    left: sliderPosition.interpolate({
      inputRange: [0, 1],
      outputRange: [0, containerWidth],
    }),
    top: height / 2 - 20,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  };

  return (
    <View
      style={[styles.container, { width: containerWidth, height }]}
      onLayout={(event) => setContainerWidth(event.nativeEvent.layout.width)}
    >
      <Image
        source={{ uri: beforeImage.uri }}
        style={beforeImageStyle}
        resizeMode="cover"
      />
      <View style={[styles.afterContainer, { width: containerWidth, height }]}>
        <Image
          source={{ uri: afterImage.uri }}
          style={afterImageStyle}
          resizeMode="cover"
        />
        <Animated.View
          style={[
            styles.slider,
            sliderStyle,
          ]}
          {...panResponder.panHandlers}
        />
        <Animated.View
          style={[
            styles.handle,
            handleStyle,
          ]}
          {...panResponder.panHandlers}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    overflow: 'hidden',
    borderRadius: 8,
  },
  afterContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    overflow: 'hidden',
  },
  slider: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: 2,
    backgroundColor: '#fff',
  },
  handle: {
    position: 'absolute',
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
}); 