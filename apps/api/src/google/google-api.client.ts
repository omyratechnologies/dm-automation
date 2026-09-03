import { HttpStatus, Injectable } from "@nestjs/common";
import axios, { type AxiosRequestConfig } from "axios";
import { ProblemException } from "../common/problem-details";
import { GoogleTokenService } from "./google-token.service";

export const GOOGLE_SCOPES = {
  CALENDAR_LIST: "https://www.googleapis.com/auth/calendar.calendarlist.readonly",
  CALENDAR_FREEBUSY: "https://www.googleapis.com/auth/calendar.events.freebusy",
  CALENDAR_OWNED: "https://www.googleapis.com/auth/calendar.events.owned",
  DRIVE_FILE: "https://www.googleapis.com/auth/drive.file",
} as const;

@Injectable()
export class GoogleApiClient {
  constructor(private readonly tokens: GoogleTokenService) {}

  async listCalendars(workspaceId: string, bindingId: string) {
    return this.request<{ items?: Array<{ id: string; summary: string; primary?: boolean; accessRole?: string; timeZone?: string }> }>(workspaceId, bindingId, GOOGLE_SCOPES.CALENDAR_LIST, {
      method: "GET", url: "https://www.googleapis.com/calendar/v3/users/me/calendarList",
      params: { minAccessRole: "freeBusyReader", maxResults: 250 },
    });
  }

  async freeBusy(workspaceId: string, bindingId: string, timeMin: string, timeMax: string, calendarIds: string[]) {
    return this.request<{ calendars: Record<string, { busy?: Array<{ start: string; end: string }>; errors?: unknown[] }> }>(workspaceId, bindingId, GOOGLE_SCOPES.CALENDAR_FREEBUSY, {
      method: "POST", url: "https://www.googleapis.com/calendar/v3/freeBusy",
      data: { timeMin, timeMax, items: calendarIds.map((id) => ({ id })) },
    });
  }

  async createEvent(workspaceId: string, bindingId: string, calendarId: string, event: Record<string, unknown>) {
    return this.request<{ id: string; etag?: string; htmlLink?: string; hangoutLink?: string }>(workspaceId, bindingId, GOOGLE_SCOPES.CALENDAR_OWNED, {
      method: "POST",
      url: `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events`,
      params: { conferenceDataVersion: 1, sendUpdates: "all" },
      data: event,
    });
  }

  async getCalendarEvent(workspaceId: string, bindingId: string, calendarId: string, eventId: string) {
    return this.request<{ id: string; etag?: string; htmlLink?: string; hangoutLink?: string }>(workspaceId, bindingId, GOOGLE_SCOPES.CALENDAR_OWNED, { method: "GET", url: `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events/${encodeURIComponent(eventId)}` });
  }

  async updateCalendarEvent(workspaceId: string, bindingId: string, calendarId: string, eventId: string, event: Record<string, unknown>, etag?: string) {
    return this.request<{ id: string; etag?: string; htmlLink?: string; hangoutLink?: string }>(workspaceId, bindingId, GOOGLE_SCOPES.CALENDAR_OWNED, {
      method: "PUT", url: `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events/${encodeURIComponent(eventId)}`,
      params: { conferenceDataVersion: 1, sendUpdates: "all" }, headers: etag ? { "if-match": etag } : undefined, data: event,
    });
  }

  async deleteCalendarEvent(workspaceId: string, bindingId: string, calendarId: string, eventId: string, etag?: string) {
    return this.request<Record<string, never>>(workspaceId, bindingId, GOOGLE_SCOPES.CALENDAR_OWNED, {
      method: "DELETE", url: `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events/${encodeURIComponent(eventId)}`,
      params: { sendUpdates: "all" }, headers: etag ? { "if-match": etag } : undefined,
    }, true);
  }

  async watchCalendar(workspaceId: string, bindingId: string, calendarId: string, channel: { id: string; token: string; address: string; expiration: number }) {
    return this.request<{ id: string; resourceId: string; resourceUri?: string; expiration?: string }>(workspaceId, bindingId, GOOGLE_SCOPES.CALENDAR_OWNED, {
      method: "POST", url: `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events/watch`,
      data: { id: channel.id, type: "web_hook", token: channel.token, address: channel.address, expiration: String(channel.expiration) },
    });
  }

  async listCalendarEvents(workspaceId: string, bindingId: string, calendarId: string, syncToken?: string, pageToken?: string) {
    return this.request<{ nextPageToken?: string; nextSyncToken?: string; items?: Array<{ id: string; status?: string; etag?: string; start?: { dateTime?: string }; end?: { dateTime?: string }; extendedProperties?: { private?: { gemaiMeetingId?: string } } }> }>(workspaceId, bindingId, GOOGLE_SCOPES.CALENDAR_OWNED, {
      method: "GET", url: `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events`,
      params: syncToken ? { syncToken, pageToken, showDeleted: true, maxResults: 2500 } : { pageToken, showDeleted: true, singleEvents: true, maxResults: 2500 },
    });
  }

  async getDriveFile(workspaceId: string, bindingId: string, spreadsheetId: string) {
    return this.request<{ id: string; name: string; mimeType: string; capabilities?: { canEdit?: boolean }; permissions?: Array<{ type?: string; role?: string; allowFileDiscovery?: boolean }> }>(workspaceId, bindingId, GOOGLE_SCOPES.DRIVE_FILE, {
      method: "GET", url: `https://www.googleapis.com/drive/v3/files/${encodeURIComponent(spreadsheetId)}`,
      params: { fields: "id,name,mimeType,capabilities(canEdit),permissions(type,role,allowFileDiscovery)" },
    });
  }

  async getSheetValues(workspaceId: string, bindingId: string, spreadsheetId: string, range: string) {
    return this.request<{ range: string; values?: unknown[][] }>(workspaceId, bindingId, GOOGLE_SCOPES.DRIVE_FILE, {
      method: "GET", url: `https://sheets.googleapis.com/v4/spreadsheets/${encodeURIComponent(spreadsheetId)}/values/${encodeURIComponent(range)}`,
      params: { valueRenderOption: "UNFORMATTED_VALUE" },
    });
  }

  async appendSheetRow(workspaceId: string, bindingId: string, spreadsheetId: string, range: string, values: unknown[]) {
    return this.request<{ updates?: { updatedRange?: string } }>(workspaceId, bindingId, GOOGLE_SCOPES.DRIVE_FILE, {
      method: "POST", url: `https://sheets.googleapis.com/v4/spreadsheets/${encodeURIComponent(spreadsheetId)}/values/${encodeURIComponent(range)}:append`,
      params: { valueInputOption: "RAW", insertDataOption: "INSERT_ROWS" },
      data: { majorDimension: "ROWS", values: [values] },
    });
  }

  async updateSheetValues(workspaceId: string, bindingId: string, spreadsheetId: string, range: string, values: unknown[][]) {
    return this.request<{ updatedRange?: string }>(workspaceId, bindingId, GOOGLE_SCOPES.DRIVE_FILE, {
      method: "PUT", url: `https://sheets.googleapis.com/v4/spreadsheets/${encodeURIComponent(spreadsheetId)}/values/${encodeURIComponent(range)}`,
      params: { valueInputOption: "RAW" }, data: { majorDimension: "ROWS", values },
    });
  }

  async batchUpdateSpreadsheet(workspaceId: string, bindingId: string, spreadsheetId: string, requests: unknown[]) {
    return this.request<Record<string, unknown>>(workspaceId, bindingId, GOOGLE_SCOPES.DRIVE_FILE, {
      method: "POST", url: `https://sheets.googleapis.com/v4/spreadsheets/${encodeURIComponent(spreadsheetId)}:batchUpdate`, data: { requests },
    });
  }

  async getDriveStartPageToken(workspaceId: string, bindingId: string) {
    return this.request<{ startPageToken: string }>(workspaceId, bindingId, GOOGLE_SCOPES.DRIVE_FILE, { method: "GET", url: "https://www.googleapis.com/drive/v3/changes/startPageToken" });
  }

  async watchDriveChanges(workspaceId: string, bindingId: string, pageToken: string, channel: { id: string; token: string; address: string; expiration: number }) {
    return this.request<{ id: string; resourceId: string; resourceUri?: string; expiration?: string }>(workspaceId, bindingId, GOOGLE_SCOPES.DRIVE_FILE, {
      method: "POST", url: "https://www.googleapis.com/drive/v3/changes/watch", params: { pageToken },
      data: { id: channel.id, type: "web_hook", token: channel.token, address: channel.address, expiration: String(channel.expiration) },
    });
  }

  async listDriveChanges(workspaceId: string, bindingId: string, pageToken: string) {
    return this.request<{ nextPageToken?: string; newStartPageToken?: string; changes?: Array<{ fileId: string; removed?: boolean; time?: string }> }>(workspaceId, bindingId, GOOGLE_SCOPES.DRIVE_FILE, {
      method: "GET", url: "https://www.googleapis.com/drive/v3/changes", params: { pageToken, spaces: "drive", fields: "nextPageToken,newStartPageToken,changes(fileId,removed,time)", pageSize: 1000 },
    });
  }

  private async request<T>(workspaceId: string, bindingId: string, scope: string, config: AxiosRequestConfig, ignoreNotFound = false): Promise<T> {
    const accessToken = await this.tokens.forBinding(workspaceId, bindingId, scope);
    try {
      const response = await axios.request<T>({ ...config, timeout: 15_000, headers: { ...config.headers, authorization: `Bearer ${accessToken}` } });
      return response.data;
    } catch (error) {
      if (!axios.isAxiosError(error)) throw error;
      const status = error.response?.status;
      if (status === 404 && ignoreNotFound) return {} as T;
      if (status === 401) throw new ProblemException(HttpStatus.CONFLICT, "GOOGLE_REAUTH_REQUIRED", "Google reconnection required", "Google rejected the current credential");
      if (status === 403) throw new ProblemException(HttpStatus.FORBIDDEN, "GOOGLE_SCOPE_MISSING", "Google operation forbidden", "The account lacks access to this Google resource");
      if (status === 429) throw new ProblemException(HttpStatus.TOO_MANY_REQUESTS, "GOOGLE_RATE_LIMITED", "Google rate limit reached", "Retry after the provider backoff interval");
      if (status === 409) throw new ProblemException(HttpStatus.CONFLICT, "GOOGLE_RESOURCE_EXISTS", "Google resource already exists", "Reconcile the deterministic provider resource");
      if (status === 412) throw new ProblemException(HttpStatus.CONFLICT, "VERSION_CONFLICT", "Google resource changed", "The Google resource changed concurrently and requires reconciliation");
      if (status === 410) throw new ProblemException(HttpStatus.CONFLICT, "CALENDAR_SYNC_TOKEN_GONE", "Calendar sync token expired", "A full Calendar synchronization is required");
      throw new ProblemException(HttpStatus.SERVICE_UNAVAILABLE, "GOOGLE_UNAVAILABLE", "Google unavailable", "Google could not complete the operation");
    }
  }
}
