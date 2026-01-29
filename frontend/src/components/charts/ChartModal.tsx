import { useState, ReactNode } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog';
import { Maximize2 } from 'lucide-react';

interface ChartModalProps {
  children: ReactNode;
  title: string;
  description?: string;
}

export function ChartModal({ children, title, description }: ChartModalProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      {/* Chart container with click to expand on mobile */}
      <div className="relative">
        {/* Expand button - only visible on mobile */}
        <button
          onClick={() => setIsOpen(true)}
          className="lg:hidden absolute top-2 right-2 z-10 p-2 bg-white/90 dark:bg-gray-800/90 rounded-full shadow-md hover:bg-white dark:hover:bg-gray-800 transition-colors"
          aria-label="Expandir gráfico"
        >
          <Maximize2 className="h-4 w-4 text-gray-600 dark:text-gray-300" />
        </button>

        {/* Clickable area on mobile */}
        <div
          className="lg:cursor-default cursor-pointer"
          onClick={() => {
            // Only open modal on mobile (lg breakpoint = 1024px)
            if (window.innerWidth < 1024) {
              setIsOpen(true);
            }
          }}
        >
          {children}
        </div>
      </div>

      {/* Fullscreen Modal for mobile */}
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="w-[98vw] max-w-[98vw] h-[95vh] max-h-[95vh] flex flex-col p-3 gap-2">
          <DialogHeader className="flex-shrink-0 pb-1">
            <DialogTitle className="text-base">{title}</DialogTitle>
            {description && (
              <p className="text-xs text-muted-foreground">{description}</p>
            )}
          </DialogHeader>

          {/* Chart with scroll - uses CSS to scale the chart */}
          <div className="flex-1 overflow-auto min-h-0">
            <div
              className="chart-modal-content"
              style={{
                minWidth: '600px',
                minHeight: 'calc(95vh - 100px)',
                width: '100%',
                height: '100%',
              }}
            >
              {/* Force ResponsiveContainer children to use full height */}
              <style>{`
                .chart-modal-content .recharts-responsive-container {
                  min-height: calc(95vh - 120px) !important;
                  height: calc(95vh - 120px) !important;
                }
              `}</style>
              {children}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
