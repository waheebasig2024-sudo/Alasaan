module.exports = {
  Platform: { OS: "android", select: (obj) => obj.android ?? obj.default },
  Alert: { alert: jest.fn() },
  Linking: { openURL: jest.fn(), canOpenURL: jest.fn().mockResolvedValue(true) },
  Vibration: { vibrate: jest.fn() },
  NativeModules: {},
  StyleSheet: { create: (s) => s, flatten: (s) => s },
  View: "View", Text: "Text", TouchableOpacity: "TouchableOpacity",
};
