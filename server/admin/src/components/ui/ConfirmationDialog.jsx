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
  title = 'Are you sure?',
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  variant = 'primary',
  isLoading = false,
  onConfirm,
  onCancel,
  size = 'sm',
  className = '',
  children,
}) => {
  const messageId = useId();

  const confirmButton =
    variant === 'danger' ? (
      <Button
        key="confirm"
        variant="danger"
        onClick={onConfirm}
        isLoading={isLoading}
        isDisabled={isLoading}
        autoFocus
      >
        {confirmLabel}
      </Button>
    ) : (
      <Button
        key="confirm"
        variant="primary"
        onClick={onConfirm}
        isLoading={isLoading}
        isDisabled={isLoading}
      >
        {confirmLabel}
      </Button>
    );

  const cancelButton = (
    <Button key="cancel" variant="outline" onClick={onCancel} isDisabled={isLoading}>
      {cancelLabel}
    </Button>
  );

  return (
    <Modal
      open={open}
      onClose={onCancel}
      title={title}
      size={size}
      className={className}
      role="alertdialog"
      ariaDescribedBy={messageId}
      footer={variant === 'danger' ? [confirmButton, cancelButton] : [cancelButton, confirmButton]}
    >
      <p id={messageId} className="text-sm text-text-muted leading-relaxed">
        {message}
      </p>
      {children}
    </Modal>
  );
};

export default ConfirmationDialog;
