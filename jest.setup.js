// Mock react-native
jest.mock('react-native', () => ({
  View: 'View',
  Text: 'Text',
  StyleSheet: {
    create: (styles) => styles,
    flatten: (style) => style,
  },
})); 