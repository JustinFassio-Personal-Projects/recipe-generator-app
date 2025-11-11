import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { TermsContent } from './TermsContent';
import { PrivacyContent } from './PrivacyContent';
import { VisuallyHidden } from '@radix-ui/react-visually-hidden';

interface TermsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialTab?: 'terms' | 'privacy';
  showAcceptButton?: boolean;
  onAccept?: () => void;
}

export function TermsDialog({
  open,
  onOpenChange,
  initialTab = 'terms',
  showAcceptButton = false,
  onAccept,
}: TermsDialogProps) {
  const [activeTab, setActiveTab] = useState<'terms' | 'privacy'>(initialTab);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-white">
            Legal Information
          </DialogTitle>
          <VisuallyHidden>
            <DialogDescription>
              Review our Terms and Conditions and Privacy Policy
            </DialogDescription>
          </VisuallyHidden>
        </DialogHeader>

        {/* Tabs */}
        <div className="flex gap-2 border-b border-base-300">
          <button
            type="button"
            onClick={() => setActiveTab('terms')}
            className={`px-4 py-2 font-medium transition-colors ${
              activeTab === 'terms'
                ? 'border-b-2 border-success text-success'
                : 'text-white/70 hover:text-white'
            }`}
          >
            Terms & Conditions
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('privacy')}
            className={`px-4 py-2 font-medium transition-colors ${
              activeTab === 'privacy'
                ? 'border-b-2 border-success text-success'
                : 'text-white/70 hover:text-white'
            }`}
          >
            Privacy Policy
          </button>
        </div>

        {/* Content Area - Scrollable */}
        <div className="flex-1 overflow-y-auto px-2 py-4">
          {activeTab === 'terms' && <TermsContent />}
          {activeTab === 'privacy' && <PrivacyContent />}
        </div>

        {/* Accept Button (optional - for forced acceptance flow) */}
        {showAcceptButton && (
          <div className="flex justify-end gap-2 border-t border-base-300 pt-4">
            <button
              type="button"
              onClick={() => onOpenChange(false)}
              className="btn btn-ghost"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={onAccept}
              className="btn btn-success"
            >
              I Accept
            </button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
