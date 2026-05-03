// Mock React Native modules that don't work in Node.js test environment
jest.mock("react-native", () => ({
  Platform: { OS: "android", select: (obj: Record<string, unknown>) => obj.android ?? obj.default },
  Alert: { alert: jest.fn() },
  Linking: { openURL: jest.fn() },
  Vibration: { vibrate: jest.fn() },
  NativeModules: {},
  NativeEventEmitter: jest.fn(() => ({ addListener: jest.fn(), removeAllListeners: jest.fn() })),
}));

jest.mock("@react-native-async-storage/async-storage", () => ({
  getItem: jest.fn().mockResolvedValue(null),
  setItem: jest.fn().mockResolvedValue(undefined),
  removeItem: jest.fn().mockResolvedValue(undefined),
  clear: jest.fn().mockResolvedValue(undefined),
}));

jest.mock("expo-notifications", () => ({
  scheduleNotificationAsync: jest.fn().mockResolvedValue("notif-id"),
  cancelScheduledNotificationAsync: jest.fn().mockResolvedValue(undefined),
  requestPermissionsAsync: jest.fn().mockResolvedValue({ status: "granted" }),
  getPermissionsAsync: jest.fn().mockResolvedValue({ status: "granted" }),
}));

jest.mock("expo-speech", () => ({
  speak: jest.fn(),
  stop: jest.fn(),
  isSpeakingAsync: jest.fn().mockResolvedValue(false),
}));

jest.mock("expo-location", () => ({
  requestForegroundPermissionsAsync: jest.fn().mockResolvedValue({ status: "granted" }),
  getCurrentPositionAsync: jest.fn().mockResolvedValue({ coords: { latitude: 15.3694, longitude: 44.1910 } }),
}));

jest.mock("expo-contacts", () => ({
  requestPermissionsAsync: jest.fn().mockResolvedValue({ status: "granted" }),
  getContactsAsync: jest.fn().mockResolvedValue({ data: [] }),
}));

jest.mock("expo-calendar", () => ({
  requestCalendarPermissionsAsync: jest.fn().mockResolvedValue({ status: "granted" }),
  createEventAsync: jest.fn().mockResolvedValue("event-id"),
  getDefaultCalendarAsync: jest.fn().mockResolvedValue({ id: "cal-id" }),
}));

jest.mock("expo-image-picker", () => ({
  requestCameraPermissionsAsync: jest.fn().mockResolvedValue({ status: "granted" }),
  launchCameraAsync: jest.fn().mockResolvedValue({ canceled: false, assets: [{ uri: "file://photo.jpg" }] }),
}));

jest.mock("expo-sharing", () => ({
  shareAsync: jest.fn().mockResolvedValue(undefined),
  isAvailableAsync: jest.fn().mockResolvedValue(true),
}));

jest.mock("expo-file-system", () => ({
  documentDirectory: "file://docs/",
  readAsStringAsync: jest.fn().mockResolvedValue(""),
  writeAsStringAsync: jest.fn().mockResolvedValue(undefined),
  deleteAsync: jest.fn().mockResolvedValue(undefined),
  getInfoAsync: jest.fn().mockResolvedValue({ exists: true }),
}));

// Silence console during tests
global.console = {
  ...console,
  log: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
};
