import type { Tool } from "../types/tool.types";
import { CallTool } from "./communication/call.tool";
import { ContactsTool } from "./communication/contacts.tool";
import { ShareTool } from "./communication/share.tool";
import { CameraTool } from "./media/camera.tool";
import { GalleryTool } from "./media/gallery.tool";
import { AudioRecordTool } from "./media/audio-record.tool";
import { SpeechOutputTool } from "./media/speech-output.tool";
import { LocationTool } from "./location/location.tool";
import { MapsTool } from "./location/maps.tool";
import { ReminderTool } from "./productivity/reminder.tool";
import { NotificationTool } from "./productivity/notification.tool";
import { CalendarTool } from "./productivity/calendar.tool";
import { NotesTool } from "./productivity/notes.tool";
import { FilesTool } from "./files/files.tool";
import { WebSearchTool } from "./web/web-search.tool";
import { BrowserTool } from "./web/browser.tool";
import { OpenAppTool } from "./apps/open-app.tool";
import { AppAliasesTool } from "./apps/app-aliases.tool";

export const ALL_TOOLS: Tool[] = [
  new CallTool(),
  new ContactsTool(),
  new ShareTool(),
  new CameraTool(),
  new GalleryTool(),
  new AudioRecordTool(),
  new SpeechOutputTool(),
  new LocationTool(),
  new MapsTool(),
  new ReminderTool(),
  new NotificationTool(),
  new CalendarTool(),
  new NotesTool(),
  new FilesTool(),
  new WebSearchTool(),
  new BrowserTool(),
  new OpenAppTool(),
  new AppAliasesTool(),
];

export {
  CallTool,
  ContactsTool,
  CameraTool,
  GalleryTool,
  LocationTool,
  MapsTool,
  ReminderTool,
  NotesTool,
  WebSearchTool,
  OpenAppTool,
};
