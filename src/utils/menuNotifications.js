export const EVENT_MENU_NOTIFICATIONS_DIPERBARUI = 'pos-warung-menu-notifications-diperbarui';

export const beriTahuMenuNotificationsDiperbarui = () => {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event(EVENT_MENU_NOTIFICATIONS_DIPERBARUI));
  }
};
