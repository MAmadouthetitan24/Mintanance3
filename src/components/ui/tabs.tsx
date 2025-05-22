import { View, Text, Pressable, StyleSheet, StyleProp, ViewStyle } from 'react-native';
import { createContext, useContext, useState } from 'react';

interface TabsContextType {
  value: string;
  onValueChange: (value: string) => void;
}

const TabsContext = createContext<TabsContextType | null>(null);

interface TabsProps {
  value: string;
  onValueChange: (value: string) => void;
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
}

export function Tabs({ value, onValueChange, children, style }: TabsProps) {
  return (
    <TabsContext.Provider value={{ value, onValueChange }}>
      <View style={[styles.tabs, style]}>{children}</View>
    </TabsContext.Provider>
  );
}

interface TabsListProps {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
}

export function TabsList({ children, style }: TabsListProps) {
  return (
    <View style={[styles.list, style]}>
      {children}
    </View>
  );
}

interface TabsTriggerProps {
  value: string;
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
}

export function TabsTrigger({ value, children, style }: TabsTriggerProps) {
  const context = useContext(TabsContext);
  if (!context) throw new Error('TabsTrigger must be used within Tabs');

  const isSelected = context.value === value;

  return (
    <Pressable
      style={[
        styles.trigger,
        isSelected && styles.triggerSelected,
        style,
      ]}
      onPress={() => context.onValueChange(value)}
    >
      <Text style={[
        styles.triggerText,
        isSelected && styles.triggerTextSelected,
      ]}>
        {children}
      </Text>
    </Pressable>
  );
}

interface TabsContentProps {
  value: string;
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
}

export function TabsContent({ value, children, style }: TabsContentProps) {
  const context = useContext(TabsContext);
  if (!context) throw new Error('TabsContent must be used within Tabs');

  if (context.value !== value) return null;

  return (
    <View style={[styles.content, style]}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  tabs: {
    width: '100%',
  },
  list: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  trigger: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  triggerSelected: {
    borderBottomWidth: 2,
    borderBottomColor: '#0284c7',
  },
  triggerText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6b7280',
  },
  triggerTextSelected: {
    color: '#0284c7',
  },
  content: {
    padding: 16,
  },
}); 