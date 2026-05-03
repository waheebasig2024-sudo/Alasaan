module.exports = {
  requestCameraPermissionsAsync: jest.fn().mockResolvedValue({ status: "granted" }),
  launchCameraAsync: jest.fn().mockResolvedValue({ canceled: false, assets: [{ uri: "file://photo.jpg" }] }),
  MediaTypeOptions: { Images: "Images", Videos: "Videos", All: "All" },
};
