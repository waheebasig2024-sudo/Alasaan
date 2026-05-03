module.exports = {
  requestCalendarPermissionsAsync: jest.fn().mockResolvedValue({ status: "granted" }),
  createEventAsync: jest.fn().mockResolvedValue("event-id"),
  getDefaultCalendarAsync: jest.fn().mockResolvedValue({ id: "cal-id" }),
  EntityTypes: { EVENT: "event" },
};
