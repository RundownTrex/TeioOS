import React, { useId } from 'react';
import { Modal } from './Modal';
import { Button } from './Button';

/**
 * Confirmation dialog (role="alertdialog").
 * Props: open, title, message, confirmLabel, cancelLabel, variant ('primary'|'danger'),
 *        isLoading, onConfirm, onCancel, size, className, children (extra content
 *        rendered below the message, e.g. an inline error Alert).
 * Button order follows the risk hierarchy: destructive [Confirm] [Cancel],
 * non-destructive [Cancel] [Confirm].
 */
export const ConfirmationDialog = ({
  open,
  isOpen,
  title = 'Are you sure?',
  message,
  confirmLabel,
  confirmText,
  cancelLabel = 'Cancel',
  variant,
  isDanger = false,
  isLoading = false,
  onConfirm,
  onCancel,
  onClose,
  size = 'sm',
  className = '',
  children,
}) => {
  const messageId = useId();
  const isDialogOpen = open !== undefined ? open : Boolean(isOpen);
  const handleCancel = onCancel || onClose;
  const finalConfirmLabel = confirmLabel || confirmText || 'Confirm';
  const finalVariant = isDanger ? 'danger' : (variant || 'primary');

  const confirmButton =
    finalVariant === 'danger' ? (
      <Button
        key="confirm"
        variant="danger"
        onClick={onConfirm}
        isLoading={isLoading}
        isDisabled={isLoading}
        autoFocus
      >
        {finalConfirmLabel}
      </Button>
    ) : (
      <Button
        key="confirm"
        variant="primary"
        onClick={onConfirm}
        isLoading={isLoading}
        isDisabled={isLoading}
      >
        {finalConfirmLabel}
      </Button>
    );

  const cancelButton = (
    <Button key="cancel" variant="outline" onClick={handleCancel} isDisabled={isLoading}>
      {cancelLabel}
    </Button>
  );

  return (
    <Modal
      open={isDialogOpen}
      onClose={handleCancel}
      title={title}
      size={size}
      className={className}
      role="alertdialog"
      ariaDescribedBy={messageId}
      footer={finalVariant === 'danger' ? [confirmButton, cancelButton] : [cancelButton, confirmButton]}
    >
      <p id={messageId} className="text-sm text-text-muted leading-relaxed">
        {message}
      </p>
      {children}
    </Modal>
  );
};

export default ConfirmationDialog;
