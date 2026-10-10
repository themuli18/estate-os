import { randomUUID } from 'node:crypto';
import { google, type Auth, type calendar_v3 } from 'googleapis';
import { compact } from '../util.js';
import { truncate } from './mime.js';

const cal = (auth: Auth.OAuth2Client) => google.calendar({ version: 'v3', auth });

export function summarizeEvent(e: calendar_v3.Schema$Event, calendarId: string, maxDescription = 500) {
  const attendees = e.attendees ?? [];
  return compact({
    id: e.id,
    calendarId,
    summary: e.summary,
    start: e.start?.dateTime ?? e.start?.date,
    end: e.end?.dateTime ?? e.end?.date,
    allDay: !!e.start?.date && !e.start?.dateTime,
    location: e.location,
    status: e.status === 'confirmed' ? undefined : e.status,
    organizer: e.organizer?.self ? 'me' : e.organizer?.email,
    myResponse: attendees.find((a) => a.self)?.responseStatus,
    attendees: attendees.slice(0, 25).map((a) => `${a.email}${a.responseStatus ? ` (${a.responseStatus})` : ''}`),
    attendeeCount: attendees.length > 25 ? attendees.length : undefined,
    meetLink: e.hangoutLink ?? e.conferenceData?.entryPoints?.find((p) => p.entryPointType === 'video')?.uri,
    description: e.description ? truncate(e.description, maxDescription).text : undefined,
    recurringEventId: e.recurringEventId,
    htmlLink: e.htmlLink,
  });
}

export async function listCalendars(auth: Auth.OAuth2Client) {
  const res = await cal(auth).calendarList.list({ maxResults: 250 });
  return (res.data.items ?? []).map((c) =>
    compact({ id: c.id, summary: c.summaryOverride ?? c.summary, primary: c.primary ?? undefined, accessRole: c.accessRole, timeZone: c.timeZone }),
  );
}

export interface ListEventsInput {
  calendarId: string;
  timeMin: string;
  timeMax: string;
  query?: string;
  maxResults: number;
  pageToken?: string;
}

export async function listEvents(auth: Auth.OAuth2Client, input: ListEventsInput) {
  const res = await cal(auth).events.list({
    calendarId: input.calendarId,
    timeMin: input.timeMin,
    timeMax: input.timeMax,
    q: input.query,
    maxResults: input.maxResults,
    pageToken: input.pageToken,
    singleEvents: true,
    orderBy: 'startTime',
  });
  return {
    timeZone: res.data.timeZone,
    events: (res.data.items ?? []).map((e) => summarizeEvent(e, input.calendarId)),
    nextPageToken: res.data.nextPageToken ?? undefined,
  };
}

export async function getEvent(auth: Auth.OAuth2Client, calendarId: string, eventId: string) {
  const res = await cal(auth).events.get({ calendarId, eventId });
  return summarizeEvent(res.data, calendarId, 20000);
}

export interface EventInput {
  summary?: string;
  start?: string;
  end?: string;
  timeZone?: string;
  description?: string;
  location?: string;
  attendees?: string[];
  addMeet?: boolean;
}

// "2026-10-01" → all-day date; anything else → dateTime.
function toEventTime(value: string, timeZone?: string): calendar_v3.Schema$EventDateTime {
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return { date: value };
  return compact({ dateTime: value, timeZone }) as calendar_v3.Schema$EventDateTime;
}

function toRequestBody(input: EventInput): calendar_v3.Schema$Event {
  const body: calendar_v3.Schema$Event = {};
  if (input.summary !== undefined) body.summary = input.summary;
  if (input.description !== undefined) body.description = input.description;
  if (input.location !== undefined) body.location = input.location;
  if (input.start) body.start = toEventTime(input.start, input.timeZone);
  if (input.end) body.end = toEventTime(input.end, input.timeZone);
  if (input.attendees) body.attendees = input.attendees.map((email) => ({ email }));
  if (input.addMeet) {
    body.conferenceData = { createRequest: { requestId: randomUUID(), conferenceSolutionKey: { type: 'hangoutsMeet' } } };
  }
  return body;
}

export async function createEvent(
  auth: Auth.OAuth2Client,
  calendarId: string,
  input: EventInput,
  sendUpdates: 'all' | 'externalOnly' | 'none',
) {
  if (!input.summary || !input.start || !input.end) throw new Error('summary, start and end are required');
  const res = await cal(auth).events.insert({
    calendarId,
    sendUpdates,
    conferenceDataVersion: input.addMeet ? 1 : undefined,
    requestBody: toRequestBody(input),
  });
  return summarizeEvent(res.data, calendarId);
}

export async function updateEvent(
  auth: Auth.OAuth2Client,
  calendarId: string,
  eventId: string,
  input: EventInput,
  sendUpdates: 'all' | 'externalOnly' | 'none',
) {
  const res = await cal(auth).events.patch({
    calendarId,
    eventId,
    sendUpdates,
    conferenceDataVersion: input.addMeet ? 1 : undefined,
    requestBody: toRequestBody(input),
  });
  return summarizeEvent(res.data, calendarId);
}

export async function freeBusy(auth: Auth.OAuth2Client, timeMin: string, timeMax: string, calendarIds: string[]) {
  const res = await cal(auth).freebusy.query({
    requestBody: { timeMin, timeMax, items: calendarIds.map((id) => ({ id })) },
  });
  const out: { start: string; end: string }[] = [];
  for (const c of Object.values(res.data.calendars ?? {})) {
    for (const b of c.busy ?? []) if (b.start && b.end) out.push({ start: b.start, end: b.end });
  }
  return out;
}

// Merge overlapping busy intervals (ISO strings) into a sorted, disjoint list.
export function mergeIntervals(intervals: { start: string; end: string }[]): { start: string; end: string }[] {
  const sorted = intervals
    .map((i) => ({ s: Date.parse(i.start), e: Date.parse(i.end) }))
    .filter((i) => !Number.isNaN(i.s) && !Number.isNaN(i.e))
    .sort((a, b) => a.s - b.s);
  const merged: { s: number; e: number }[] = [];
  for (const i of sorted) {
    const last = merged[merged.length - 1];
    if (last && i.s <= last.e) last.e = Math.max(last.e, i.e);
    else merged.push({ ...i });
  }
  return merged.map((i) => ({ start: new Date(i.s).toISOString(), end: new Date(i.e).toISOString() }));
}
