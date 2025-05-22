import { Modal, View, Text, Pressable, StyleSheet, StyleProp, ViewStyle } from 'react-native';
import { createContext, useContext } from 'react';

interface DialogContextType {
  open: boolean;
  onClose: () => void;
}

const DialogContext = createContext<DialogContextType | null>(null);

interface DialogProps {
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
}

export function Dialog({ open, onClose, children }: DialogProps) {
  return (
    <DialogContext.Provider value={{ open, onClose }}>
      <Modal
        visible={open}
        transparent
        animationType="fade"
        onRequestClose={onClose}
      >
        <Pressable style={styles.overlay} onPress={onClose}>
          <View style={styles.container}>
            <Pressable style={styles.content} onPress={e => e.stopPropagation()}>
              {children}
            </Pressable>
          </View>
        </Pressable>
      </Modal>
    </DialogContext.Provider>
  );
}

interface DialogContentProps {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
}

export function DialogContent({ children, style }: DialogContentProps) {
  return <View style={[styles.dialogContent, style]}>{children}</View>;
}

interface DialogHeaderProps {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
}

export function DialogHeader({ children, style }: DialogHeaderProps) {
  return <View style={[styles.header, style]}>{children}</View>;
}

interface DialogTitleProps {
  children: React.ReactNode;
}

export function DialogTitle({ children }: DialogTitleProps) {
  return <Text style={styles.title}>{children}</Text>;
}

interface DialogDescriptionProps {
  children: React.ReactNode;
}

export function DialogDescription({ children }: DialogDescriptionProps) {
  return <Text style={styles.description}>{children}</Text>;
}

interface DialogFooterProps {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
}

export function DialogFooter({ children, style }: DialogFooterProps) {
  return <View style={[styles.footer, style]}>{children}</View>;
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  container: {
    width: '90%',
    maxWidth: 500,
    padding: 16,
  },
  content: {
    backgroundColor: '#ffffff',
    borderRadius: 8,
    overflow: 'hidden',
  },
  dialogContent: {
    padding: 16,
  },
  header: {
    padding: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000000',
  },
  description: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 4,
  },
  footer: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 8,
  },
}); 