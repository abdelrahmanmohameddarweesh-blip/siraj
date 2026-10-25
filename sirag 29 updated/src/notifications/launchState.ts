/** Shared between the notification router and the splash so a tapped notification isn't overridden. */
export const launch = { fromNotification: false, handled: new Set<string>() };
