import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

interface FlyerImageDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  imageUrl: string | null;
}

export function FlyerImageDialog({ open, onOpenChange, imageUrl }: FlyerImageDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-auto">
        <DialogHeader>
          <DialogTitle>Event Flyer</DialogTitle>
        </DialogHeader>
        {imageUrl ? (
          <img 
            src={imageUrl} 
            alt="Event flyer full view"
            className="w-full h-auto rounded-lg"
          />
        ) : (
          <p className="text-center text-muted-foreground py-8">No image available</p>
        )}
      </DialogContent>
    </Dialog>
  );
}
