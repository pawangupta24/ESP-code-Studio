/**
 * Cross-Platform OS Detection and Helper Utilities for ESP Studio
 * Supports Windows, macOS, and Linux
 */

export type OperatingSystem = 'windows' | 'macos' | 'linux';

export function detectOS(): OperatingSystem {
  if (typeof window === 'undefined' || !window.navigator) {
    return 'windows';
  }
  const ua = window.navigator.userAgent.toLowerCase();
  const platform = (window.navigator as any).userAgentData?.platform?.toLowerCase() || window.navigator.platform?.toLowerCase() || '';

  if (platform.includes('mac') || ua.includes('macintosh') || ua.includes('mac os')) {
    return 'macos';
  }
  if (platform.includes('linux') || ua.includes('linux') || ua.includes('x11')) {
    return 'linux';
  }
  return 'windows';
}

/**
 * Returns the primary modifier key name ('⌘' for Mac, 'Ctrl' for Windows/Linux)
 */
export function getModifierKey(): string {
  return detectOS() === 'macos' ? '⌘' : 'Ctrl';
}

/**
 * Formats a keyboard shortcut label for the current operating system
 * e.g. "Ctrl+B" becomes "⌘B" on Mac, and stays "Ctrl+B" on Windows/Linux
 */
export function formatShortcut(shortcut: string): string {
  const isMac = detectOS() === 'macos';
  if (isMac) {
    return shortcut
      .replace(/ctrl\+/gi, '⌘')
      .replace(/shift\+/gi, '⇧')
      .replace(/alt\+/gi, '⌥');
  }
  return shortcut;
}

/**
 * Returns the standard serial port device path convention for the current OS
 */
export function getDefaultSerialPort(): string {
  const os = detectOS();
  switch (os) {
    case 'macos':
      return '/dev/cu.usbserial-0001';
    case 'linux':
      return '/dev/ttyUSB0';
    case 'windows':
    default:
      return 'COM4';
  }
}
