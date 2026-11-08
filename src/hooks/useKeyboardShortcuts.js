import { useEffect, useRef } from 'react';

const isEditableTarget = (target) => (
  target instanceof HTMLElement &&
  (
    target.matches('input, textarea, select') ||
    target.isContentEditable ||
    target.closest('[contenteditable="true"]')
  )
);

const isInteractiveTarget = (target) => (
  target instanceof HTMLElement &&
  Boolean(target.closest('button, a, [role="button"]'))
);

const isPaymentAmountTarget = (target) => (
  target instanceof HTMLInputElement && target.type === 'number'
);

export default function useKeyboardShortcuts(shortcuts) {
  const shortcutsRef = useRef(shortcuts);

  useEffect(() => {
    shortcutsRef.current = shortcuts;
  }, [shortcuts]);

  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.repeat || event.isComposing) return;

      const currentShortcuts = shortcutsRef.current;
      const sedangMengetik = isEditableTarget(event.target);
      const tombol = event.key.toLowerCase();

      if ((event.ctrlKey || event.metaKey) && tombol === 'f') {
        event.preventDefault();
        currentShortcuts.onFocusSearch?.();
        return;
      }

      if (event.key === 'F1') {
        event.preventDefault();
        currentShortcuts.onFocusSearch?.();
        return;
      }

      if (event.key === 'Escape') {
        if (currentShortcuts.onEscape?.()) event.preventDefault();
        return;
      }

      if (event.key === 'F2') {
        event.preventDefault();
        if (!sedangMengetik || currentShortcuts.isPaymentOpen?.()) {
          currentShortcuts.onCheckout?.();
        }
        return;
      }

      if (event.key === 'Enter') {
        const sedangKonfirmasiPembayaran =
          currentShortcuts.isPaymentOpen?.() &&
          (isPaymentAmountTarget(event.target) ||
            (!sedangMengetik && !isInteractiveTarget(event.target)));
        if (sedangKonfirmasiPembayaran && currentShortcuts.onConfirmPayment?.()) {
          event.preventDefault();
        }
        return;
      }

      if (event.key === 'F4') {
        event.preventDefault();
        if (!sedangMengetik) currentShortcuts.onClearCart?.();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);
}
