/**
 * In-memory + localStorage store matching the draft's data shape.
 * Persists Schedule Arrangement data to PostgreSQL via backend API when available.
 */

const BACKEND_URL =
  (typeof process !== "undefined" && (process.env.NEXT_PUBLIC_BACKEND_URL as string | undefined)) ||
  "http://localhost:8000";
const API_BASE = `${BACKEND_URL}/api/schedule-arrangement`;

export type UserRole = "admin" | "team";
export type UserTier = "admin" | "new_born" | "tier_1" | "tier_2" | "tier_3";
export type ScheduleStatus = "available" | "picked" | "released";

export interface UserRecord {
  __backendId?: string;
  type: "user";
  username: string;
  password: string;
  role: UserRole;
  tier: UserTier;
  point: number;
  schedule_id: string;
  schedule_name: string;
  description: string;
  start_date: string;
  end_date: string;
  batch_id: string;
  batch_name: string;
  point_min: number;
  point_max: number;
  status: string;
  picked_by: string;
  released_at: string;
  created_by: string;
  created_at: string;
}

export interface ScheduleRecord {
  __backendId?: string;
  type: "schedule";
  schedule_id: string;
  schedule_name: string;
  description: string;
  start_date: string;
  end_date: string;
  // Optional pickup window (ISO datetime strings). If empty, pickup selalu boleh.
  pickup_start?: string;
  pickup_end?: string;
  status: ScheduleStatus;
  batch_id: string;
  batch_name: string;
  point_min: number;
  point_max: number;
  picked_by: string;
  released_at: string;
  created_by: string;
  created_at: string;
  username?: string;
  password?: string;
  role?: string;
  tier?: string;
  point?: number;
}

export interface BatchRecord {
  type: "batch";
  batch_id: string;
  batch_name: string;
  point_min: number;
  point_max: number;
}

export type DataRecord = UserRecord | ScheduleRecord | BatchRecord;

const STORAGE_KEY = "power_schedule_data";
let store: DataRecord[] = [];
let listeners: Array<(data: DataRecord[]) => void> = [];

function genId(): string {
  return "id_" + Date.now() + "_" + Math.random().toString(36).slice(2, 9);
}

function load(): DataRecord[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as DataRecord[];
      parsed.forEach((r, i) => {
        (r as DataRecord & { __backendId?: string }).__backendId = (r as DataRecord & { __backendId?: string }).__backendId || genId();
      });
      return parsed;
    }
  } catch (_) {}
  return [];
}

function save(data: DataRecord[]) {
  store = data;
  if (typeof window !== "undefined") {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch (_) {}
    listeners.forEach((fn) => fn(data));
  }
}

/** Replace entire store (e.g. after fetching from API) and notify listeners. */
export function replaceStore(records: DataRecord[]) {
  store = [...records];
  if (typeof window !== "undefined") {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
    } catch (_) {}
    listeners.forEach((fn) => fn(store));
  }
}

/** Tambah jadwal ke store dulu dengan temp id (optimistic), return daftar temp id. */
export function addSchedulesOptimistic(records: Omit<ScheduleRecord, "__backendId">[]): string[] {
  const tempIds: string[] = [];
  const newRecords: DataRecord[] = records.map((r) => {
    const tempId = "temp_" + genId();
    tempIds.push(tempId);
    return { ...r, __backendId: tempId } as ScheduleRecord & { __backendId: string };
  });
  store = [...store, ...newRecords];
  if (typeof window !== "undefined") {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
    } catch (_) {}
    listeners.forEach((fn) => fn(store));
  }
  return tempIds;
}

/** Ganti record dengan temp id menjadi data dari server (setelah POST sukses). */
export function replaceTempWithServer(tempId: string, serverRecord: ScheduleRecord & { __backendId: string }): void {
  store = store.map((r) =>
    (r as DataRecord & { __backendId?: string }).__backendId === tempId ? serverRecord : r
  );
  if (typeof window !== "undefined") {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
    } catch (_) {}
    listeners.forEach((fn) => fn(store));
  }
}

/** Hapus record berdasarkan __backendId (mis. temp yang gagal disimpan ke server). */
export function removeByBackendId(backendId: string): void {
  store = store.filter((r) => (r as DataRecord & { __backendId?: string }).__backendId !== backendId);
  if (typeof window !== "undefined") {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
    } catch (_) {}
    listeners.forEach((fn) => fn(store));
  }
}

/** Hanya panggil DELETE ke backend (untuk dipakai setelah optimistic remove). */
export async function deleteScheduleOnBackend(scheduleId: string): Promise<boolean> {
  try {
    const res = await fetch(`${API_BASE}/schedules/${scheduleId}`, { method: "DELETE" });
    return res.ok;
  } catch (_) {
    return false;
  }
}

/** Sinkron satu jadwal ke backend (dipanggil di background setelah optimistic add). */
export async function syncScheduleToBackend(
  tempId: string,
  record: Omit<ScheduleRecord, "__backendId">
): Promise<boolean> {
  try {
    const res = await fetch(`${API_BASE}/schedules`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        schedule_id: record.schedule_id,
        schedule_name: record.schedule_name,
        description: record.description,
        start_date: record.start_date,
        end_date: record.end_date,
        pickup_start: record.pickup_start || null,
        pickup_end: record.pickup_end || null,
        status: record.status,
        batch_id: record.batch_id ?? "",
        batch_name: record.batch_name ?? "",
        point_min: record.point_min ?? 0,
        point_max: record.point_max ?? 0,
        picked_by: record.picked_by || null,
        released_at: record.released_at || null,
        created_by: record.created_by || null,
      }),
    });
    if (!res.ok) {
      removeByBackendId(tempId);
      return false;
    }
    const data = (await res.json()) as ScheduleRecord & { __backendId: string };
    replaceTempWithServer(tempId, data);
    return true;
  } catch (_) {
    removeByBackendId(tempId);
    return false;
  }
}

/** Fetch users + schedules from backend and replace local store. Call after initStore() for DB persistence. */
export async function fetchAndReplaceFromBackend(): Promise<{ ok: boolean }> {
  try {
    const res = await fetch(`${API_BASE}/data`);
    if (!res.ok) return { ok: false };
    const json = (await res.json()) as { users: DataRecord[]; schedules: DataRecord[] };
    const combined: DataRecord[] = [...(json.users || []), ...(json.schedules || [])];
    replaceStore(combined);
    return { ok: true };
  } catch (_) {
    return { ok: false };
  }
}

const SEED_USERNAMES = [
  "admin", "Komeng", "Akbar", "Aldi", "Andreas", "Apip", "Apri", "Arbi", "Aris", "Basir", "Bowo", "Danang", "Dhani", "Dhika",
  "Fachri", "Farhan", "Hanip", "Hasbi", "Ichsan", "Ichwan", "Ilham", "Imam", "Indra", "Iqhtiar", "Ivan", "Jaja", "Lifi", "Mamat",
  "Mulya", "Naufal", "Prad", "Rafly", "Rama", "Rey", "Ridho", "Ridwan", "Rizky", "Robi", "Sahrul", "Sodik", "Vincent", "Wahyudi", "Widi", "Yosa", "Yudi",
];

function seedUsersIfNeeded(): void {
  const users = store.filter((r) => r.type === "user") as UserRecord[];
  const existing = new Set(users.map((u) => u.username.toLowerCase()));
  const toAdd: UserRecord[] = [];
  const tierByUsername: Record<string, UserTier> = {
    admin: "admin", Komeng: "admin",
    Akbar: "tier_3", Apip: "tier_3", Apri: "tier_3", Basir: "tier_3", Bowo: "tier_3", Danang: "tier_3", Fachri: "tier_3",
    Hasbi: "tier_3", Ichsan: "tier_3", Ichwan: "tier_3", Ilham: "tier_3", Imam: "tier_3", Indra: "tier_3", Ivan: "tier_3",
    Jaja: "tier_3", Mamat: "tier_3", Mulya: "tier_3", Rama: "tier_3", Ridwan: "tier_3", Robi: "tier_3", Sahrul: "tier_3",
    Sodik: "tier_3", Vincent: "tier_3", Widi: "tier_3", Yosa: "tier_3", Yudi: "tier_3",
    Aldi: "tier_2", Aris: "tier_2", Naufal: "tier_2", Rizky: "tier_2",
    Andreas: "tier_1", Farhan: "tier_1", Iqhtiar: "tier_1", Lifi: "tier_1", Prad: "tier_1", Rafly: "tier_1", Ridho: "tier_1", Wahyudi: "tier_1",
    Arbi: "new_born", Dhani: "new_born", Dhika: "new_born", Hanip: "new_born", Rey: "new_born",
  };
  for (const username of SEED_USERNAMES) {
    if (existing.has(username.toLowerCase())) continue;
    const tier = tierByUsername[username] ?? "new_born";
    const role = tier === "admin" ? "admin" : "team";
    const password = username === "admin" ? "admin123" : "pass123";
    toAdd.push({
      type: "user",
      username,
      password,
      role,
      tier,
      point: getTierPoints(tier),
      schedule_id: "",
      schedule_name: "",
      description: "",
      start_date: "",
      end_date: "",
      batch_id: "",
      batch_name: "",
      point_min: 0,
      point_max: 0,
      status: "",
      picked_by: "",
      released_at: "",
      created_by: "",
      created_at: "",
    });
  }
  if (toAdd.length > 0) {
    const withIds = toAdd.map((u) => ({ ...u, __backendId: genId() } as UserRecord & { __backendId: string }));
    store = [...store, ...withIds];
    save(store);
  }
}

export function initStore(): DataRecord[] {
  store = load();
  seedUsersIfNeeded();
  return store;
}

export function getStore(): DataRecord[] {
  return store;
}

export function subscribe(fn: (data: DataRecord[]) => void): () => void {
  listeners.push(fn);
  return () => {
    listeners = listeners.filter((l) => l !== fn);
  };
}

export async function create(record: Omit<DataRecord, "__backendId">): Promise<{ isOk: boolean; data?: DataRecord }> {
  if (record.type === "user") {
    const u = record as UserRecord;
    try {
      const res = await fetch(`${API_BASE}/users`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: u.username,
          password: u.password,
          role: u.role,
          tier: u.tier,
          point: u.point,
        }),
      });
      if (!res.ok) return { isOk: false };
      const data = (await res.json()) as UserRecord & { __backendId: string };
      const newStore = [...store, data];
      save(newStore);
      return { isOk: true, data };
    } catch (_) {
      return { isOk: false };
    }
  }
  if (record.type === "schedule") {
    const s = record as ScheduleRecord;
    try {
      const res = await fetch(`${API_BASE}/schedules`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          schedule_id: s.schedule_id,
          schedule_name: s.schedule_name,
          description: s.description,
          start_date: s.start_date,
          end_date: s.end_date,
          pickup_start: s.pickup_start || null,
          pickup_end: s.pickup_end || null,
          status: s.status,
          batch_id: s.batch_id ?? "",
          batch_name: s.batch_name ?? "",
          point_min: s.point_min ?? 0,
          point_max: s.point_max ?? 0,
          picked_by: s.picked_by || null,
          released_at: s.released_at || null,
          created_by: s.created_by || null,
        }),
      });
      if (!res.ok) return { isOk: false };
      const data = (await res.json()) as ScheduleRecord & { __backendId: string };
      const newStore = [...store, data];
      save(newStore);
      return { isOk: true, data };
    } catch (_) {
      return { isOk: false };
    }
  }
  const id = genId();
  const withId = { ...record, __backendId: id } as DataRecord & { __backendId: string };
  save([...store, withId]);
  return { isOk: true, data: withId };
}

export async function update(record: DataRecord & { __backendId: string }): Promise<{ isOk: boolean }> {
  const idx = store.findIndex((r) => (r as DataRecord & { __backendId?: string }).__backendId === record.__backendId);
  if (idx === -1) return { isOk: false };
  const id = record.__backendId;
  if (record.type === "user") {
    const u = record as UserRecord & { __backendId: string };
    try {
      const res = await fetch(`${API_BASE}/users/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: u.username, password: u.password, role: u.role, tier: u.tier, point: u.point }),
      });
      if (!res.ok) return { isOk: false };
    } catch (_) {
      return { isOk: false };
    }
  }
  if (record.type === "schedule") {
    const s = record as ScheduleRecord & { __backendId: string };
    try {
      const res = await fetch(`${API_BASE}/schedules/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          schedule_name: s.schedule_name,
          description: s.description,
          start_date: s.start_date,
          end_date: s.end_date,
          pickup_start: s.pickup_start || null,
          pickup_end: s.pickup_end || null,
          status: s.status,
          batch_id: s.batch_id ?? "",
          batch_name: s.batch_name ?? "",
          point_min: s.point_min ?? 0,
          point_max: s.point_max ?? 0,
          picked_by: s.picked_by || null,
          released_at: s.released_at || null,
          created_by: s.created_by || null,
        }),
      });
      if (!res.ok) return { isOk: false };
    } catch (_) {
      return { isOk: false };
    }
  }
  const next = [...store];
  next[idx] = record;
  save(next);
  return { isOk: true };
}

export async function remove(record: DataRecord): Promise<{ isOk: boolean }> {
  const bid = (record as DataRecord & { __backendId?: string }).__backendId;
  if (!bid) return { isOk: false };
  if (record.type === "schedule") {
    try {
      const res = await fetch(`${API_BASE}/schedules/${bid}`, { method: "DELETE" });
      if (!res.ok) return { isOk: false };
    } catch (_) {
      return { isOk: false };
    }
  }
  const next = store.filter((r) => (r as DataRecord & { __backendId?: string }).__backendId !== bid);
  save(next);
  return { isOk: true };
}

/**
 * Atomic claim (pickup) for one schedule. Safe when many users pick at once.
 * Returns conflict.picked_by if someone else already took it (409).
 */
export async function claimSchedule(
  scheduleId: string,
  username: string
): Promise<{ isOk: boolean; conflict?: { picked_by: string } }> {
  try {
    const res = await fetch(`${API_BASE}/schedules/${scheduleId}/claim`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username }),
    });
    if (res.status === 409) {
      const json = (await res.json()) as { picked_by?: string };
      return { isOk: false, conflict: { picked_by: json.picked_by ?? "someone" } };
    }
    if (!res.ok) return { isOk: false };
    const data = (await res.json()) as ScheduleRecord & { __backendId: string };
    const next = store.map((r) =>
      (r as DataRecord & { __backendId?: string }).__backendId === scheduleId ? data : r
    );
    save(next);
    return { isOk: true };
  } catch (_) {
    return { isOk: false };
  }
}

/**
 * Atomic reopen: only assignee or admin. Safe for concurrent use.
 */
export async function reopenSchedule(
  scheduleId: string,
  username: string,
  isAdmin: boolean
): Promise<{ isOk: boolean }> {
  try {
    const res = await fetch(`${API_BASE}/schedules/${scheduleId}/reopen`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, is_admin: isAdmin }),
    });
    if (!res.ok) return { isOk: false };
    const data = (await res.json()) as ScheduleRecord & { __backendId: string };
    const next = store.map((r) =>
      (r as DataRecord & { __backendId?: string }).__backendId === scheduleId ? data : r
    );
    save(next);
    return { isOk: true };
  } catch (_) {
    return { isOk: false };
  }
}

/**
 * Atomic release: only assignee or admin. Safe for concurrent use.
 */
export async function releaseSchedule(
  scheduleId: string,
  username: string,
  isAdmin: boolean
): Promise<{ isOk: boolean }> {
  try {
    const res = await fetch(`${API_BASE}/schedules/${scheduleId}/release`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, is_admin: isAdmin }),
    });
    if (!res.ok) return { isOk: false };
    const data = (await res.json()) as ScheduleRecord & { __backendId: string };
    const next = store.map((r) =>
      (r as DataRecord & { __backendId?: string }).__backendId === scheduleId ? data : r
    );
    save(next);
    return { isOk: true };
  } catch (_) {
    return { isOk: false };
  }
}

export const TIER_POINTS: Record<UserTier, number> = {
  admin: 0,
  new_born: 1,
  tier_1: 1,
  tier_2: 2,
  tier_3: 3,
};

export function getTierPoints(tier: string): number {
  return TIER_POINTS[tier as UserTier] ?? 0;
}

export function getTierName(tier: string): string {
  const names: Record<string, string> = {
    new_born: "New Born",
    tier_1: "Tier 1",
    tier_2: "Tier 2",
    tier_3: "Tier 3",
    admin: "Admin",
  };
  return names[tier] ?? tier;
}
