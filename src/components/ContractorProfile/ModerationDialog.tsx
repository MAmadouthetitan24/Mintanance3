import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  Button,
  Textarea,
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
  Label
} from '@/components/ui';
import { View } from 'react-native';

type ModerationDecision = 'approved' | 'rejected' | 'suspended';

interface ModerationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onModerate: (decision: ModerationDecision, notes: string) => void;
  contractorName: string;
}

export function ModerationDialog({
  open,
  onOpenChange,
  onModerate,
  contractorName
}: ModerationDialogProps) {
  const [decision, setDecision] = useState<ModerationDecision>('approved');
  const [notes, setNotes] = useState('');

  const handleSubmit = () => {
    onModerate(decision, notes);
    onOpenChange(false);
    setNotes('');
  };

  return (
    <Dialog open={open} onClose={() => onOpenChange(false)}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Moderate Contractor Profile</DialogTitle>
          <DialogDescription>
            Review and moderate {contractorName}'s contractor profile
          </DialogDescription>
        </DialogHeader>

        <View style={{ gap: 16 }}>
          <View>
            <Label>Decision</Label>
            <Select<ModerationDecision> value={decision} onValueChange={setDecision}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem<ModerationDecision> value="approved">Approve</SelectItem>
                <SelectItem<ModerationDecision> value="rejected">Reject</SelectItem>
                <SelectItem<ModerationDecision> value="suspended">Suspend</SelectItem>
              </SelectContent>
            </Select>
          </View>

          <View>
            <Label>Notes</Label>
            <Textarea
              value={notes}
              onChangeText={setNotes}
              placeholder="Add any notes about your decision..."
            />
          </View>
        </View>

        <DialogFooter>
          <Button variant="outline" onPress={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onPress={handleSubmit}>
            Submit Decision
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
} 