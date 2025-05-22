import { View, Text, Modal, Pressable, StyleSheet, StyleProp, ViewStyle } from 'react-native';
import { createContext, useContext, useState } from 'react';

interface SelectContextType<T> {
  value: T;
  onValueChange: (value: T) => void;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const SelectContext = createContext<SelectContextType<any> | null>(null);

interface SelectProps<T> {
  value: T;
  onValueChange: (value: T) => void;
  children: React.ReactNode;
}

export function Select<T>({ value, onValueChange, children }: SelectProps<T>) {
  const [open, setOpen] = useState(false);

  return (
    <SelectContext.Provider
      value={{
        value,
        onValueChange,
        open,
        onOpenChange: setOpen,
      }}
    >
      {children}
    </SelectContext.Provider>
  );
}

interface SelectTriggerProps {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
}

export function SelectTrigger({ children, style }: SelectTriggerProps) {
  const context = useContext(SelectContext);
  if (!context) throw new Error('SelectTrigger must be used within Select');

  return (
    <Pressable
      style={[styles.trigger, style]}
      onPress={() => context.onOpenChange(true)}
    >
      {children}
    </Pressable>
  );
}

interface SelectValueProps {
  placeholder?: string;
}

export function SelectValue({ placeholder }: SelectValueProps) {
  const context = useContext(SelectContext);
  if (!context) throw new Error('SelectValue must be used within Select');

  return (
    <Text style={[styles.value, !context.value && styles.placeholder]}>
      {context.value || placeholder}
    </Text>
  );
}

interface SelectContentProps {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
}

export function SelectContent({ children, style }: SelectContentProps) {
  const context = useContext(SelectContext);
  if (!context) throw new Error('SelectContent must be used within Select');

  return (
    <Modal
      visible={context.open}
      transparent
      animationType="slide"
      onRequestClose={() => context.onOpenChange(false)}
    >
      <Pressable
        style={styles.overlay}
        onPress={() => context.onOpenChange(false)}
      >
        <View style={styles.container}>
          <Pressable style={[styles.content, style]} onPress={e => e.stopPropagation()}>
            {children}
          </Pressable>
        </View>
      </Pressable>
    </Modal>
  );
}

interface SelectItemProps<T> {
  value: T;
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
}

export function SelectItem<T>({ value, children, style }: SelectItemProps<T>) {
  const context = useContext(SelectContext);
  if (!context) throw new Error('SelectItem must be used within Select');

  const isSelected = context.value === value;

  return (
    <Pressable
      style={[styles.item, isSelected && styles.itemSelected, style]}
      onPress={() => {
        context.onValueChange(value);
        context.onOpenChange(false);
      }}
    >
      <Text style={[styles.itemText, isSelected && styles.itemTextSelected]}>
        {children}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  trigger: {
    padding: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 6,
    backgroundColor: '#ffffff',
  },
  value: {
    fontSize: 14,
    color: '#000000',
  },
  placeholder: {
    color: '#9ca3af',
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    justifyContent: 'flex-end',
  },
  container: {
    width: '100%',
    padding: 16,
  },
  content: {
    backgroundColor: '#ffffff',
    borderRadius: 8,
    overflow: 'hidden',
  },
  item: {
    padding: 12,
  },
  itemSelected: {
    backgroundColor: '#f3f4f6',
  },
  itemText: {
    fontSize: 14,
    color: '#000000',
  },
  itemTextSelected: {
    color: '#0284c7',
    fontWeight: '500',
  },
}); 