import React, { useState } from 'react';
import { cn } from '@/lib/utils';

interface FabMenuItem {
  id: string;
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
}

interface FloatingActionButtonProps {
  icon: React.ReactNode;
  items: FabMenuItem[];
  position?: 'bl' | 'br' | 'tl' | 'tr';
}

export const FloatingActionButton: React.FC<FloatingActionButtonProps> = ({
  icon,
  items,
  position = 'bl',
}) => {
  const [isOpen, setIsOpen] = useState(false);

  const positionClasses = {
    bl: 'bottom-4 left-4',
    br: 'bottom-4 right-4',
    tl: 'top-4 left-4',
    tr: 'top-4 right-4',
  };

  const handleButtonClick = () => {
    setIsOpen(!isOpen);
  };

  // Removed getMenuItemStyle - now using inline className matching AI agent modal design

  return (
    <div className={cn('fixed z-50', positionClasses[position])}>
      {/* Main FAB Button */}
      <button
        onClick={handleButtonClick}
        className={cn(
          'h-14 w-14 rounded-full flex items-center justify-center shadow-lg transition-all',
          'bg-warning text-warning-content hover:bg-warning/90',
          isOpen && 'scale-105'
        )}
        aria-label="Open menu"
      >
        {icon}
      </button>

      {/* Menu Items */}
      {isOpen && (
        <div className="absolute bottom-full mb-2 flex flex-col gap-2">
          {items.map((item) => (
            <button
              key={item.id}
              onClick={() => {
                item.onClick();
                setIsOpen(false);
              }}
              className={cn(
                'whitespace-nowrap shadow-md rounded-lg px-4 py-3 flex items-center gap-2 transition-all',
                'border-2 border-base-300 bg-base-100 text-base-content',
                'hover:border-warning/50 hover:shadow-lg'
              )}
              aria-label={item.label}
            >
              {item.icon}
              <span className="font-medium">{item.label}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
