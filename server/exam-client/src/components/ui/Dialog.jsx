import React from 'react';
import { Modal } from './Modal';
import { Button } from './Button';
import { AlertTriangle, Info } from 'lucide-react';

export const Dialog = ({
  isOpen = false,
  onClose,
  onConfirm,
  title,
  description,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  variant = 'primary',
  isLoading = false,
}) => {
  const icons = {
    danger: <AlertTriangle className="w-6 h-6 text-red-600 shrink-0" aria-hidden="true" />,
    warning: <AlertTriangle className="w-6 h-6 text-amber-600 shrink-0" aria-hidden="true" />,
    primary: <Info className="w-6 h-6 text-navy-primary shrink-0" aria-hidden="true" />,
  };

  const footer = (
    <>
      <Button variant="outline" onClick={onClose} isDisabled={isLoading}>
        {cancelText}
      </Button>
      <Button
        variant={variant === 'danger' ? 'danger' : 'primary'}
        onClick={onConfirm}
        isLoading={isLoading}
      >
        {confirmText}
      </Button>
    </>
  );

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} footer={footer} size="sm">
      <div className="flex items-start gap-4">
        {icons[variant] || icons.primary}
        <div className="text-sm text-text-main leading-relaxed">
          <p>{description}</p>
        </div>
      </div>
    </Modal>
  );
};

export default Dialog;
