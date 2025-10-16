import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useState, useEffect } from "react";

interface EventData {
  title: string;
  location: string;
  event_date: string;
  start_time: string;
  end_time?: string;
  description: string;
  event_type: string;
}

interface EventConfirmationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  eventData: EventData | null;
  onConfirm: (eventData: EventData) => void;
  isLoading: boolean;
}

export function EventConfirmationDialog({ 
  open, 
  onOpenChange, 
  eventData, 
  onConfirm,
  isLoading 
}: EventConfirmationDialogProps) {
  const [editedData, setEditedData] = useState<EventData | null>(eventData);

  // Update edited data when eventData changes
  useEffect(() => {
    if (eventData) {
      setEditedData(eventData);
    }
  }, [eventData]);

  if (!editedData) return null;

  const handleConfirm = () => {
    onConfirm(editedData);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-auto">
        <DialogHeader>
          <DialogTitle>Confirm Event Details</DialogTitle>
          <DialogDescription>
            Review and edit the AI-extracted event details before submitting for approval.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="title">Event Title</Label>
            <Input
              id="title"
              value={editedData.title}
              onChange={(e) => setEditedData({ ...editedData, title: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="location">Location</Label>
            <Input
              id="location"
              value={editedData.location}
              onChange={(e) => setEditedData({ ...editedData, location: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="event_date">Date</Label>
              <Input
                id="event_date"
                type="date"
                value={editedData.event_date}
                onChange={(e) => setEditedData({ ...editedData, event_date: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="event_type">Event Type</Label>
              <Input
                id="event_type"
                value={editedData.event_type}
                onChange={(e) => setEditedData({ ...editedData, event_type: e.target.value })}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="start_time">Start Time</Label>
              <Input
                id="start_time"
                type="time"
                value={editedData.start_time}
                onChange={(e) => setEditedData({ ...editedData, start_time: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="end_time">End Time (Optional)</Label>
              <Input
                id="end_time"
                type="time"
                value={editedData.end_time || ''}
                onChange={(e) => setEditedData({ ...editedData, end_time: e.target.value })}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={editedData.description}
              onChange={(e) => setEditedData({ ...editedData, description: e.target.value })}
              rows={4}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isLoading}>
            Cancel
          </Button>
          <Button onClick={handleConfirm} disabled={isLoading}>
            {isLoading ? "Submitting..." : "Confirm & Submit for Approval"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
