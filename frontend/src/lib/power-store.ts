/**
 * Power Management v.1.2603.9 - Extended data: periods, holidays, agendas, partners, projects, notifications.
 * Persisted in localStorage under separate keys; no conflict with schedule-store.
 */

export interface PeriodRecord {
  id: string;
  name: string;
  start: string;
  end: string;
}

export interface HolidayRecord {
  id: string;
  date: string;
  desc: string;
}

export interface AgendaRecord {
  id: string;
  username: string;
  type: string;
  start_date: string;
  end_date: string;
  desc: string;
}

export interface PartnerRecord {
  id: string;
  name: string;
  type: string;
  star: string;
  group?: string;
  room?: string;
  outlet?: string;
  status: string;
  system_live?: string;
  system_version?: string;
  implementation_type?: string;
  address?: string;
  area?: string;
  sub_area?: string;
  last_visit?: string;
  last_visit_type?: string;
  last_project?: string;
  last_project_type?: string;
  submission_salutation?: string;
  submission_name?: string;
  gm_email?: string;
  fc_email?: string;
  it_email?: string;
  hrd_email?: string;
  allowance_maintenance?: string;
  [key: string]: string | undefined;
}

export interface ProjectRecord {
  id: string;
  cnc_id?: string;
  hotel: string;
  name: string;
  info?: string;
  type: string;
  status: string;
  pic?: string;
  req_pic?: string;
  assignment?: string;
  start?: string;
  end?: string;
  total_days?: string;
  point_ach?: string;
  point_req?: string;
  pct_point?: string;
  kpi2?: string;
  kpi2_officer?: string;
  handover_report?: string;
  handover_days?: string;
  check_report?: string;
  check_days?: string;
  s1_est?: string;
  s1_over?: string;
  s1_email?: string;
  s2_email?: string;
  s3_email?: string;
  [key: string]: string | undefined;
}

export interface NotificationRecord {
  id: string;
  target: string;
  text: string;
  read: boolean;
  time: string;
}

export interface JobsheetOverrideRecord {
  id: string;
  period_id?: string;
  username: string;
  date: string; // YYYY-MM-DD
  value: string; // e.g. sched_Day, agd_C, clear
}

const KEYS = {
  periods: "power_periods",
  holidays: "power_holidays",
  agendas: "power_agendas",
  partners: "power_partners",
  projects: "power_projects",
  notifications: "power_notifications",
};

const BACKEND_URL =
  (typeof process !== "undefined" && (process.env.NEXT_PUBLIC_BACKEND_URL as string | undefined)) ||
  "http://localhost:8000";

function genId(prefix = "id"): string {
  return prefix + "_" + Date.now() + "_" + Math.random().toString(36).slice(2, 9);
}

function loadJson<T>(key: string, def: T): T {
  if (typeof window === "undefined") return def;
  try {
    const raw = localStorage.getItem(key);
    if (raw) return JSON.parse(raw) as T;
  } catch (_) {}
  return def;
}

function saveJson(key: string, value: unknown): void {
  if (typeof window !== "undefined") {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (_) {}
  }
}

// --- Periods ---
let periods: PeriodRecord[] = [];
let periodsListeners: Array<(p: PeriodRecord[]) => void> = [];

export function getPeriods(): PeriodRecord[] {
  return periods;
}

export function initPeriods(): PeriodRecord[] {
  periods = loadJson<PeriodRecord[]>(KEYS.periods, []);
  if (periods.length === 0) {
    periods = [{ id: "p1", name: "Februari 2026 - Maret 2026", start: "2026-02-21", end: "2026-03-20" }];
    saveJson(KEYS.periods, periods);
  }
  return periods;
}

export function subscribePeriods(fn: (p: PeriodRecord[]) => void): () => void {
  periodsListeners.push(fn);
  return () => { periodsListeners = periodsListeners.filter((l) => l !== fn); };
}

export function createPeriod(record: Omit<PeriodRecord, "id">): PeriodRecord {
  const id = genId("p");
  const newRec = { ...record, id };
  periods = [...periods, newRec];
  saveJson(KEYS.periods, periods);
  periodsListeners.forEach((f) => f(periods));
  return newRec;
}

export function updatePeriod(id: string, updates: Partial<PeriodRecord>): void {
  const idx = periods.findIndex((p) => p.id === id);
  if (idx === -1) return;
  periods = [...periods];
  periods[idx] = { ...periods[idx], ...updates };
  saveJson(KEYS.periods, periods);
  periodsListeners.forEach((f) => f(periods));
}

export function removePeriod(id: string): void {
  periods = periods.filter((p) => p.id !== id);
  saveJson(KEYS.periods, periods);
  periodsListeners.forEach((f) => f(periods));
}

// --- Holidays ---
let holidays: HolidayRecord[] = [];
let holidaysListeners: Array<(h: HolidayRecord[]) => void> = [];

export function getHolidays(): HolidayRecord[] {
  return holidays;
}

export function initHolidays(): HolidayRecord[] {
  holidays = loadJson<HolidayRecord[]>(KEYS.holidays, []);
  if (holidays.length === 0) {
    holidays = [{ id: "h1", date: "2026-03-19", desc: "Contoh Hari Libur Nasional" }];
    saveJson(KEYS.holidays, holidays);
  }
  return holidays;
}

export function subscribeHolidays(fn: (h: HolidayRecord[]) => void): () => void {
  holidaysListeners.push(fn);
  return () => { holidaysListeners = holidaysListeners.filter((l) => l !== fn); };
}

export function addHoliday(record: Omit<HolidayRecord, "id">): HolidayRecord {
  const id = genId("hol");
  const newRec = { ...record, id };
  holidays = [...holidays, newRec];
  saveJson(KEYS.holidays, holidays);
  holidaysListeners.forEach((f) => f(holidays));
  return newRec;
}

export function removeHoliday(id: string): void {
  holidays = holidays.filter((h) => h.id !== id);
  saveJson(KEYS.holidays, holidays);
  holidaysListeners.forEach((f) => f(holidays));
}

// --- Agendas ---
let agendas: AgendaRecord[] = [];
let agendasListeners: Array<(a: AgendaRecord[]) => void> = [];

export function getAgendas(): AgendaRecord[] {
  return agendas;
}

export function initAgendas(): AgendaRecord[] {
  agendas = loadJson<AgendaRecord[]>(KEYS.agendas, []);
  if (agendas.length === 0) {
    agendas = [{ id: "a1", username: "Akbar", type: "C", start_date: "2026-03-10", end_date: "2026-03-12", desc: "Liburan Keluarga" }];
    saveJson(KEYS.agendas, agendas);
  }
  return agendas;
}

export function subscribeAgendas(fn: (a: AgendaRecord[]) => void): () => void {
  agendasListeners.push(fn);
  return () => { agendasListeners = agendasListeners.filter((l) => l !== fn); };
}

export function addAgenda(record: Omit<AgendaRecord, "id">): AgendaRecord {
  const id = genId("agd");
  const newRec = { ...record, id };
  agendas = [...agendas, newRec];
  saveJson(KEYS.agendas, agendas);
  agendasListeners.forEach((f) => f(agendas));
  return newRec;
}

export function removeAgenda(id: string): void {
  agendas = agendas.filter((a) => a.id !== id);
  saveJson(KEYS.agendas, agendas);
  agendasListeners.forEach((f) => f(agendas));
}

// --- Partners ---
let partners: PartnerRecord[] = [];
let partnersListeners: Array<(p: PartnerRecord[]) => void> = [];

const DEFAULT_PARTNERS: PartnerRecord[] = [
  { id: "P-001", name: "Grand Royal Resort", type: "Resort", star: "5", status: "Active", area: "Bali", system_version: "Cloud" },
  { id: "P-002", name: "City Center Hotel", type: "Hotel", star: "4", status: "Active", area: "Jakarta", system_version: "Desktop" },
  { id: "P-003", name: "Mountain View Villa", type: "Villa", star: "3", status: "Active", area: "Jawa Barat", system_version: "Lite" },
];

export function getPartners(): PartnerRecord[] {
  return partners;
}

export function initPartners(): PartnerRecord[] {
  partners = loadJson<PartnerRecord[]>(KEYS.partners, []);
  if (partners.length === 0) {
    partners = [...DEFAULT_PARTNERS];
    saveJson(KEYS.partners, partners);
  }
  return partners;
}

export function subscribePartners(fn: (p: PartnerRecord[]) => void): () => void {
  partnersListeners.push(fn);
  return () => { partnersListeners = partnersListeners.filter((l) => l !== fn); };
}

export function savePartner(record: PartnerRecord, isNew: boolean): void {
  if (isNew) {
    if (partners.some((p) => p.id === record.id)) return;
    partners = [...partners, record];
  } else {
    const idx = partners.findIndex((p) => p.id === record.id);
    if (idx === -1) return;
    const existing = partners.find((p) => p.id === record.id);
    if (record.id !== (existing?.id) && partners.some((p) => p.id === record.id)) return;
    partners = [...partners];
    partners[idx] = record;
  }
  saveJson(KEYS.partners, partners);
  partnersListeners.forEach((f) => f(partners));
}

export function removePartner(id: string): void {
  partners = partners.filter((p) => p.id !== id);
  saveJson(KEYS.partners, partners);
  partnersListeners.forEach((f) => f(partners));
}

// --- Projects ---
let projects: ProjectRecord[] = [];
let projectsListeners: Array<(p: ProjectRecord[]) => void> = [];

const DEFAULT_PROJECTS: ProjectRecord[] = [
  { id: "PRJ-2026-001", cnc_id: "CNC-2601", hotel: "Grand Royal Resort", name: "Cloud Migration Phase 1", pic: "Akbar", type: "Implementation", status: "Planned", start: "2026-04-01", end: "2026-04-10" },
  { id: "PRJ-2026-002", cnc_id: "CNC-2602", hotel: "City Center Hotel", name: "Server Upgrades", pic: "Aldi", type: "Upgrade", status: "In Progress", start: "2026-03-05", end: "2026-03-08" },
];

export function getProjects(): ProjectRecord[] {
  return projects;
}

export function initProjects(): ProjectRecord[] {
  projects = loadJson<ProjectRecord[]>(KEYS.projects, []);
  if (projects.length === 0) {
    projects = [...DEFAULT_PROJECTS];
    saveJson(KEYS.projects, projects);
  }
  return projects;
}

export function subscribeProjects(fn: (p: ProjectRecord[]) => void): () => void {
  projectsListeners.push(fn);
  return () => { projectsListeners = projectsListeners.filter((l) => l !== fn); };
}

export function saveProject(record: ProjectRecord, isNew: boolean): void {
  if (isNew) {
    if (projects.some((p) => p.id === record.id)) return;
    projects = [...projects, record];
  } else {
    const idx = projects.findIndex((p) => p.id === record.id);
    if (idx === -1) return;
    const existing = projects.find((p) => p.id === record.id);
    if (record.id !== (existing?.id) && projects.some((p) => p.id === record.id)) return;
    projects = [...projects];
    projects[idx] = record;
  }
  saveJson(KEYS.projects, projects);
  projectsListeners.forEach((f) => f(projects));
}

export function removeProject(id: string): void {
  projects = projects.filter((p) => p.id !== id);
  saveJson(KEYS.projects, projects);
  projectsListeners.forEach((f) => f(projects));
}

// --- Notifications ---
let notifications: NotificationRecord[] = [];
let notificationsListeners: Array<(n: NotificationRecord[]) => void> = [];

export function getNotifications(): NotificationRecord[] {
  return notifications;
}

export function initNotifications(): NotificationRecord[] {
  notifications = loadJson<NotificationRecord[]>(KEYS.notifications, []);
  return notifications;
}

export function subscribeNotifications(fn: (n: NotificationRecord[]) => void): () => void {
  notificationsListeners.push(fn);
  return () => { notificationsListeners = notificationsListeners.filter((l) => l !== fn); };
}

export function pushNotification(target: string, text: string): void {
  const newRec: NotificationRecord = {
    id: genId("notif"),
    target,
    text,
    read: false,
    time: new Date().toISOString(),
  };
  notifications = [newRec, ...notifications];
  saveJson(KEYS.notifications, notifications);
  notificationsListeners.forEach((f) => f(notifications));
}

export function markNotificationsRead(username: string): void {
  notifications = notifications.map((n) =>
    n.target === username || n.target === "all_admin" ? { ...n, read: true } : n
  );
  saveJson(KEYS.notifications, notifications);
  notificationsListeners.forEach((f) => f(notifications));
}

// --- Jobsheet Overrides (Inline/Bulk Edit) ---
let jobsheetOverrides: JobsheetOverrideRecord[] = [];
let jobsheetOverridesListeners: Array<(r: JobsheetOverrideRecord[]) => void> = [];

export function getJobsheetOverrides(): JobsheetOverrideRecord[] {
  return jobsheetOverrides;
}

export function initJobsheetOverrides(): JobsheetOverrideRecord[] {
  // DB-backed: start empty; call refreshJobsheetOverrides() to fetch.
  jobsheetOverrides = [];
  return jobsheetOverrides;
}

export function subscribeJobsheetOverrides(fn: (r: JobsheetOverrideRecord[]) => void): () => void {
  jobsheetOverridesListeners.push(fn);
  return () => { jobsheetOverridesListeners = jobsheetOverridesListeners.filter((l) => l !== fn); };
}

export async function refreshJobsheetOverrides(args: {
  period_id?: string;
  username?: string;
  start?: string;
  end?: string;
}): Promise<JobsheetOverrideRecord[]> {
  const params = new URLSearchParams();
  if (args.period_id) params.set("period_id", args.period_id);
  if (args.username) params.set("username", args.username);
  if (args.start) params.set("start", args.start);
  if (args.end) params.set("end", args.end);

  const res = await fetch(`${BACKEND_URL}/api/jobsheet-overrides?${params.toString()}`);
  if (!res.ok) throw new Error(`Failed to load jobsheet overrides (${res.status})`);
  const data = (await res.json()) as JobsheetOverrideRecord[];
  jobsheetOverrides = data;
  jobsheetOverridesListeners.forEach((f) => f(jobsheetOverrides));
  return jobsheetOverrides;
}

export async function bulkSetJobsheetOverrides(args: {
  username: string;
  dates: string[];
  value: string;
  period_id?: string;
}): Promise<void> {
  const body = new URLSearchParams();
  if (args.period_id) body.set("period_id", args.period_id);
  body.set("username", args.username);
  body.set("value", args.value);
  // Prefer range (much faster server-side)
  const sorted = [...args.dates].sort((a, b) => a.localeCompare(b));
  if (sorted.length > 0) {
    body.set("start", sorted[0]);
    body.set("end", sorted[sorted.length - 1]);
  } else {
    body.set("dates", args.dates.join(","));
  }
  const res = await fetch(`${BACKEND_URL}/api/jobsheet-overrides/bulk`, {
    method: "POST",
    body,
  });
  if (!res.ok) throw new Error(`Failed to save jobsheet overrides (${res.status})`);

  // Optimistic local update (avoid extra round-trip GET)
  const pid = args.period_id ?? "";
  const dateSet = new Set(args.dates);
  if (args.value === "clear") {
    jobsheetOverrides = jobsheetOverrides.filter(
      (r) => !(r.username === args.username && dateSet.has(r.date) && (r.period_id ?? "") === pid)
    );
  } else {
    const next = [...jobsheetOverrides];
    for (const d of args.dates) {
      const idx = next.findIndex((r) => r.username === args.username && r.date === d && (r.period_id ?? "") === pid);
      if (idx >= 0) next[idx] = { ...next[idx], value: args.value };
      else next.push({ id: genId("jso"), username: args.username, date: d, value: args.value, period_id: args.period_id });
    }
    jobsheetOverrides = next;
  }
  jobsheetOverridesListeners.forEach((f) => f(jobsheetOverrides));
}

export function isHoliday(dateStr: string, holidaysList: HolidayRecord[]): boolean {
  return holidaysList.some((h) => h.date === dateStr);
}
