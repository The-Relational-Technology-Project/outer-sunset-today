import { Info } from "lucide-react";

const WorkInProgressBanner = () => {
  return (
    <div className="bg-primary/10 border-b border-primary/20 px-4 py-2">
      <div className="max-w-7xl mx-auto flex items-center justify-center gap-2 text-sm">
        <Info className="h-4 w-4 text-primary flex-shrink-0" />
        <p className="text-primary/90 text-center">
          <span className="font-medium">Work in Progress:</span> By neighbors, for neighbors — launching soon!
        </p>
      </div>
    </div>
  );
};

export default WorkInProgressBanner;