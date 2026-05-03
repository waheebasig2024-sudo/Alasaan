module.exports = {
  requestForegroundPermissionsAsync: jest.fn().mockResolvedValue({ status: "granted" }),
  getCurrentPositionAsync: jest.fn().mockResolvedValue({ coords: { latitude: 15.3694, longitude: 44.1910 } }),
  PermissionStatus: { GRANTED: "granted", DENIED: "denied" },
};
