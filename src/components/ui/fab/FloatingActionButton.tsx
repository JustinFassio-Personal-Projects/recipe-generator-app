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

  // Get button style based on item ID using DaisyUI classes
  const getMenuItemStyle = (itemId: string) => {
    if (itemId === 'ai-create') {
      // AI Recipe Creator - primary theme color
      return 'btn-primary';
    } else if (itemId === 'agent-recipe') {
      // AI Agentic Chef - warning/orange theme color
      return 'btn-warning';
    } else if (itemId === 'update-profile') {
      // Update Profile - secondary theme color
      return 'btn-secondary';
    } else if (itemId === 'add-recipe') {
      // Add Recipe - success color with outline
      return 'btn-outline btn-success';
    }
    // Default style
    return 'btn-outline';
  };

  return (
    <div className={cn('fixed z-50', positionClasses[position])}>
      {/* Main FAB Button */}
      <button
        onClick={handleButtonClick}
        className={cn(
          'h-14 w-14 rounded-full flex items-center justify-center shadow-lg transition-all',
          'btn-primary',
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
                'btn-sm whitespace-nowrap shadow-lg rounded-md px-4 py-2 flex items-center gap-2 transition-all',
                getMenuItemStyle(item.id)
              )}
              aria-label={item.label}
            >
              {item.icon}
              <span>{item.label}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
