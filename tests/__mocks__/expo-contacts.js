module.exports = {
  requestPermissionsAsync: jest.fn().mockResolvedValue({ status: "granted" }),
  getContactsAsync: jest.fn().mockResolvedValue({ data: [] }),
  PermissionStatus: { GRANTED: "granted" },
};
