module.exports = {
  requestPermissionsAsync: jest.fn().mockResolvedValue({ status: "granted" }),
  saveToLibraryAsync: jest.fn().mockResolvedValue(undefined),
};
