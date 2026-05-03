module.exports = {
  documentDirectory: "file://docs/",
  cacheDirectory: "file://cache/",
  readAsStringAsync: jest.fn().mockResolvedValue(""),
  writeAsStringAsync: jest.fn().mockResolvedValue(undefined),
  deleteAsync: jest.fn().mockResolvedValue(undefined),
  getInfoAsync: jest.fn().mockResolvedValue({ exists: true, size: 100 }),
  makeDirectoryAsync: jest.fn().mockResolvedValue(undefined),
};
