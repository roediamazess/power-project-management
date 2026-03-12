"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { Chart as ChartJS, ArcElement, Tooltip, Legend, DoughnutController } from "chart.js";

ChartJS.register(ArcElement, Tooltip, Legend, DoughnutController);
import {
  initStore,
  subscribe,
  create,
  update,
  remove,
  removeByBackendId,
  deleteScheduleOnBackend,
  fetchAndReplaceFromBackend,
  claimSchedule,
  reopenSchedule,
  releaseSchedule,
  addSchedulesOptimistic,
  syncScheduleToBackend,
  getTierPoints,
  getTierName,
  type UserRecord,
  type ScheduleRecord,
  type DataRecord,
} from "@/lib/schedule-store";
import {
  initPeriods,
  getPeriods,
  subscribePeriods,
  createPeriod,
  initHolidays,
  getHolidays,
  subscribeHolidays,
  addHoliday,
  removeHoliday,
  initAgendas,
  getAgendas,
  subscribeAgendas,
  addAgenda,
  removeAgenda,
  initPartners,
  getPartners,
  subscribePartners,
  savePartner,
  initProjects,
  getProjects,
  subscribeProjects,
  saveProject,
  initNotifications,
  getNotifications,
  subscribeNotifications,
  pushNotification,
  markNotificationsRead,
  initJobsheetOverrides,
  getJobsheetOverrides,
  subscribeJobsheetOverrides,
  bulkSetJobsheetOverrides,
  refreshJobsheetOverrides,
  isHoliday,
  type PeriodRecord,
  type HolidayRecord,
  type AgendaRecord,
  type PartnerRecord,
  type ProjectRecord,
  type NotificationRecord,
  type JobsheetOverrideRecord,
} from "@/lib/power-store";

const APP_VERSION = "v.1.2603.5";

type Screen = "login" | "register" | "dashboard";
type Tab = "board" | "grid" | "projects" | "partners" | "analytics";
type PendingAction = { action: "pickup" | "reopen" | "release" | "delete"; schedId: string } | null;

function formatDate(dateString: string) {
  if (!dateString) return "-";
  const date = new Date(dateString + "T00:00:00");
  return date.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "2-digit" }).replace(/ /g, " ");
}

function formatJobsheetValue(value: string): string {
  if (!value) return "";
  if (value === "clear") return "";
  if (value.startsWith("sched_")) {
    const t = value.replace("sched_", "");
    if (t === "Day") return "D";
    if (t === "Middle") return "MD";
    if (t === "Duty") return "DT";
    return t.slice(0, 2).toUpperCase();
  }
  if (value.startsWith("agd_")) return value.replace("agd_", "");
  return value;
}

const LAST_PICKUP_KEY = "power_schedule_last_pickup";
function getLastPickupWindow(): { start: string; end: string } {
  if (typeof window === "undefined") return { start: "", end: "" };
  try {
    const raw = localStorage.getItem(LAST_PICKUP_KEY);
    if (raw) {
      const p = JSON.parse(raw) as { start?: string; end?: string };
      return { start: p.start ?? "", end: p.end ?? "" };
    }
  } catch (_) {}
  return { start: "", end: "" };
}

export default function SubmissionSchedule() {
  const [screen, setScreen] = useState<Screen>("login");
  const [currentUser, setCurrentUser] = useState<UserRecord | null>(null);
  const [data, setData] = useState<DataRecord[]>([]);
  const [toast, setToast] = useState("");
  const [theme, setTheme] = useState<"light" | "dark">("light");
  const [modals, setModals] = useState({
    createSchedule: false,
    editSchedule: false,
    createBatch: false,
    manageTiers: false,
    manageHolidays: false,
    manageAgenda: false,
    action: false,
    versionHistory: false,
    createPeriod: false,
    project: false,
    partner: false,
  });
  const [pendingAction, setPendingAction] = useState<PendingAction>(null);
  const [actionTitle, setActionTitle] = useState("");
  const [actionMessage, setActionMessage] = useState("");
  const [currentTab, setCurrentTab] = useState<Tab>("board");
  const [periods, setPeriods] = useState<PeriodRecord[]>([]);
  const [holidays, setHolidays] = useState<HolidayRecord[]>([]);
  const [agendas, setAgendas] = useState<AgendaRecord[]>([]);
  const [partners, setPartners] = useState<PartnerRecord[]>([]);
  const [projects, setProjects] = useState<ProjectRecord[]>([]);
  const [notifications, setNotifications] = useState<NotificationRecord[]>([]);
  const [jobsheetOverrides, setJobsheetOverrides] = useState<JobsheetOverrideRecord[]>([]);
  const [notifOpen, setNotifOpen] = useState(false);
  const [searchGridUser, setSearchGridUser] = useState("");
  const [searchProject, setSearchProject] = useState("");
  const [searchPartner, setSearchPartner] = useState("");
  const [searchAnalyticsUser, setSearchAnalyticsUser] = useState("");
  const [selectedPeriodId, setSelectedPeriodId] = useState<string | null>(null);
  const [holidayForm, setHolidayForm] = useState({ date: "", desc: "" });
  const [agendaForm, setAgendaForm] = useState({ username: currentUser?.username ?? "", type: "", start_date: "", end_date: "", desc: "" });
  const [periodForm, setPeriodForm] = useState({ name: "", start: "", end: "" });
  const [editingProjectId, setEditingProjectId] = useState<string | null>(null);
  const [projectForm, setProjectForm] = useState<Partial<ProjectRecord>>({
    id: "",
    cnc_id: "",
    hotel: "",
    name: "",
    info: "",
    type: "Implementation",
    status: "Planned",
    pic: "",
    req_pic: "",
    assignment: "",
    start: "",
    end: "",
    total_days: "",
    point_ach: "",
    point_req: "",
    pct_point: "",
    kpi2: "",
    kpi2_officer: "",
    handover_report: "",
    handover_days: "",
    check_report: "",
    check_days: "",
    s1_est: "",
    s1_over: "",
    s1_email: "",
    s2_email: "",
    s3_email: "",
  });
  const [editingPartnerId, setEditingPartnerId] = useState<string | null>(null);
  const [partnerForm, setPartnerForm] = useState<Partial<PartnerRecord>>({
    id: "",
    name: "",
    type: "Hotel",
    star: "4",
    group: "",
    room: "",
    outlet: "",
    status: "Active",
    system_live: "",
    system_version: "Cloud",
    implementation_type: "Cloud",
    address: "",
    area: "",
    sub_area: "",
    last_visit: "",
    last_visit_type: "",
    last_project: "",
    last_project_type: "",
    submission_salutation: "",
    submission_name: "",
    gm_email: "",
    fc_email: "",
    it_email: "",
    hrd_email: "",
    allowance_maintenance: "",
  });
  const chartRef = useRef<HTMLCanvasElement>(null);
  const chartInstanceRef = useRef<{ destroy: () => void } | null>(null);
  const toastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastToastRef = useRef<{ msg: string; at: number } | null>(null);
  const [bulkEdit, setBulkEdit] = useState<{ open: boolean; username: string; dates: string[] }>({ open: false, username: "", dates: [] });
  const [bulkEditValue, setBulkEditValue] = useState<string>("");
  const [bulkSaving, setBulkSaving] = useState(false);
  const [dragState, setDragState] = useState<{ isDragging: boolean; username: string; dates: string[] }>({ isDragging: false, username: "", dates: [] });
  const [editingScheduleId, setEditingScheduleId] = useState<string | null>(null);
  const [scheduleForm, setScheduleForm] = useState<{
    name: string;
    desc: string;
    start: string;
    end: string;
    pickupStart: string;
    pickupEnd: string;
  }>({
    name: "",
    desc: "",
    start: "",
    end: "",
    pickupStart: "",
    pickupEnd: "",
  });

  const users = data.filter((d) => d.type === "user") as UserRecord[];
  const schedules = data.filter((d) => d.type === "schedule") as ScheduleRecord[];
  const batches = data.filter((d) => d.type === "batch");
  const teamUsers = users.filter((u) => u.role === "team").sort((a, b) => a.username.localeCompare(b.username));
  const myNotifs = notifications.filter(
    (n) => n.target === currentUser?.username || (currentUser?.role === "admin" && n.target === "all_admin")
  );
  const unreadCount = myNotifs.filter((n) => !n.read).length;
  const currentPeriod = periods.find((p) => p.id === selectedPeriodId);
  const isHolidayDate = useCallback(
    (dateStr: string) => isHoliday(dateStr, holidays),
    [holidays]
  );

  const getOverride = useCallback((username: string, date: string) => {
    const pid = selectedPeriodId ?? "";
    return jobsheetOverrides.find((r) => r.username === username && r.date === date && (r.period_id ?? "") === pid);
  }, [jobsheetOverrides, selectedPeriodId]);

  const isLockedByScheduleArrangement = useCallback((username: string, date: string) => {
    // Locked means this cell is coming from released schedules (Schedule Arrangement),
    // so it must be edited from Schedule Arrangement, not Jobsheet.
    return schedules.some(
      (s) => s.status === "released" && s.picked_by === username && date >= s.start_date && date <= s.end_date
    );
  }, [schedules]);

  useEffect(() => {
    const loaded = initStore();
    setData(loaded);
    const unsub = subscribe(setData);
    fetchAndReplaceFromBackend();
    setPeriods(initPeriods());
    setHolidays(initHolidays());
    setAgendas(initAgendas());
    setPartners(initPartners());
    setProjects(initProjects());
    setNotifications(initNotifications());
    setJobsheetOverrides(initJobsheetOverrides());
    const unsubP = subscribePeriods(setPeriods);
    const unsubH = subscribeHolidays(setHolidays);
    const unsubA = subscribeAgendas(setAgendas);
    const unsubPart = subscribePartners(setPartners);
    const unsubProj = subscribeProjects(setProjects);
    const unsubN = subscribeNotifications(setNotifications);
    const unsubJso = subscribeJobsheetOverrides(setJobsheetOverrides);
    const saved = typeof window !== "undefined" ? (localStorage.getItem("theme") as "dark" | "light") || "light" : "light";
    setTheme(saved);
    if (saved === "dark") {
      document.body.classList.add("dark-mode");
      document.documentElement.classList.add("dark");
    } else {
      document.body.classList.remove("dark-mode");
      document.documentElement.classList.remove("dark");
    }
    return () => {
      unsub();
      unsubP();
      unsubH();
      unsubA();
      unsubPart();
      unsubProj();
      unsubN();
      unsubJso();
    };
  }, []);

  useEffect(() => {
    if (!modals.createSchedule) return;
    const t = setTimeout(() => {
      const { start, end } = getLastPickupWindow();
      const elStart = document.getElementById("schedPickupStart") as HTMLInputElement | null;
      const elEnd = document.getElementById("schedPickupEnd") as HTMLInputElement | null;
      if (elStart && start) elStart.value = start;
      if (elEnd && end) elEnd.value = end;
    }, 0);
    return () => clearTimeout(t);
  }, [modals.createSchedule]);

  useEffect(() => {
    if (!dragState.isDragging) return;
    const onUp = () => {
      if (!dragState.isDragging) return;
      if (currentUser?.role !== "admin") {
        setDragState({ isDragging: false, username: "", dates: [] });
        return;
      }
      if (dragState.username && dragState.dates.length > 0) {
        const sorted = [...dragState.dates].sort((a, b) => a.localeCompare(b));
        setBulkEdit({ open: true, username: dragState.username, dates: sorted });
        setBulkEditValue("");
      }
      setDragState({ isDragging: false, username: "", dates: [] });
    };
    window.addEventListener("mouseup", onUp);
    return () => window.removeEventListener("mouseup", onUp);
  }, [dragState.isDragging, dragState.username, dragState.dates, currentUser?.role]);

  useEffect(() => {
    if (periods.length > 0 && !selectedPeriodId) setSelectedPeriodId(periods[0].id);
  }, [periods, selectedPeriodId]);

  useEffect(() => {
    if (!selectedPeriodId) return;
    // Load DB-backed jobsheet overrides for current period
    refreshJobsheetOverrides({ period_id: selectedPeriodId }).catch(() => {
      // silent; UI still works without overrides until backend is up
    });
  }, [selectedPeriodId]);

  const scheduleCount = schedules.filter((s) => s.status === "released").length;
  const implAgendas = agendas.filter((a) => /implement|impl|^i\./i.test(a.type));
  const maintAgendas = agendas.filter((a) => /maint|^m\./i.test(a.type));
  const otherAgendas = agendas.filter((a) => !/implement|impl|^i\.|maint|^m\./i.test(a.type));

  useEffect(() => {
    if (currentTab !== "analytics" || !chartRef.current) return;
    chartInstanceRef.current?.destroy();
    const data = { labels: ["Jadwal Shift", "Implementasi", "Maintenance", "Lainnya"], datasets: [{ data: [scheduleCount, implAgendas.length, maintAgendas.length, otherAgendas.length], backgroundColor: ["#3b82f6", "#10b981", "#f59e0b", "#6b7280"] }] };
    chartInstanceRef.current = new ChartJS(chartRef.current, { type: "doughnut", data, options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: "bottom" } } } });
    return () => {
      chartInstanceRef.current?.destroy();
      chartInstanceRef.current = null;
    };
  }, [currentTab, scheduleCount, implAgendas.length, maintAgendas.length, otherAgendas.length]);

  const showToast = useCallback((msg: string) => {
    const now = Date.now();
    const last = lastToastRef.current;
    // Avoid rapid re-setting the exact same message (prevents weird "stacking" UX).
    if (last && last.msg === msg && now - last.at < 1500) return;
    lastToastRef.current = { msg, at: now };

    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    setToast(msg);
    toastTimerRef.current = setTimeout(() => setToast(""), 4000);
  }, []);

  const toggleTheme = useCallback(() => {
    setTheme((t) => {
      const next = t === "light" ? "dark" : "light";
      document.body.classList.toggle("dark-mode", next === "dark");
      document.documentElement.classList.toggle("dark", next === "dark");
      if (typeof window !== "undefined") localStorage.setItem("theme", next);
      return next;
    });
  }, []);

  const handleLogin = useCallback(
    (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      const form = e.currentTarget;
      const username = (form.querySelector("#loginUsername") as HTMLInputElement)?.value?.trim();
      const password = (form.querySelector("#loginPassword") as HTMLInputElement)?.value;
      const user = users.find(
        (u) => u.username.toLowerCase() === username?.toLowerCase() && u.password === password
      );
      if (user) {
        setCurrentUser(user);
        setScreen("dashboard");
        showToast(`Selamat datang, ${user.username}!`);
      } else {
        showToast("Username atau password salah");
      }
    },
    [users, showToast]
  );

  const handleRegister = useCallback(
    async (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      const form = e.currentTarget;
      const username = (form.querySelector("#regUsername") as HTMLInputElement)?.value;
      const password = (form.querySelector("#regPassword") as HTMLInputElement)?.value;
      const role = (form.querySelector("#regRole") as HTMLSelectElement)?.value as "team" | "admin";
      if (users.some((u) => u.username === username)) {
        showToast("Username sudah terdaftar");
        return;
      }
      const result = await create({
        type: "user",
        username,
        password,
        role,
        tier: role === "admin" ? "admin" : "new_born",
        point: role === "admin" ? 0 : 1,
      } as Omit<UserRecord, "__backendId">);
      if (!result.isOk) {
        showToast("Gagal mendaftar. Cek koneksi backend.");
        return;
      }
      showToast("Registrasi berhasil! Silakan login");
      setScreen("login");
    },
    [users, showToast]
  );

  const handleCreateSchedule = useCallback(
    (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      const form = e.currentTarget;
      const name = (form.querySelector("#schedName") as HTMLSelectElement)?.value;
      const desc = (form.querySelector("#schedDesc") as HTMLTextAreaElement)?.value ?? "";
      const start = (form.querySelector("#schedStart") as HTMLInputElement)?.value;
      const end = (form.querySelector("#schedEnd") as HTMLInputElement)?.value;
      const pickupStart = (form.querySelector("#schedPickupStart") as HTMLInputElement)?.value;
      const pickupEnd = (form.querySelector("#schedPickupEnd") as HTMLInputElement)?.value;
      const supportNeeded = parseInt((form.querySelector("#schedSupport") as HTMLSelectElement)?.value || "1", 10);
      const records: Omit<ScheduleRecord, "__backendId">[] = [];
      for (let i = 0; i < supportNeeded; i++) {
        records.push({
          type: "schedule",
          schedule_id: "sched_" + Date.now() + "_" + i,
          schedule_name: name,
          description: desc,
          start_date: start,
          end_date: end,
          pickup_start: pickupStart || undefined,
          pickup_end: pickupEnd || undefined,
          status: "available",
          batch_id: "",
          batch_name: "",
          point_min: 0,
          point_max: 0,
          picked_by: "",
          released_at: "",
          created_by: currentUser?.username ?? "",
          created_at: new Date().toISOString(),
        } as Omit<ScheduleRecord, "__backendId">);
      }
      const tempIds = addSchedulesOptimistic(records);
      if (pickupStart || pickupEnd) {
        try {
          localStorage.setItem(LAST_PICKUP_KEY, JSON.stringify({ start: pickupStart || "", end: pickupEnd || "" }));
        } catch (_) {}
      }
      setModals((m) => ({ ...m, createSchedule: false }));
      showToast(`${supportNeeded} schedule(s) berhasil dibuat`);
      tempIds.forEach((tempId, i) => {
        syncScheduleToBackend(tempId, records[i]).then((ok) => {
          if (!ok) showToast("Sebagian jadwal gagal disimpan ke server. Cek koneksi.");
        });
      });
    },
    [currentUser, showToast]
  );

  const handleUpdateSchedule = useCallback(
    async (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      if (!editingScheduleId) return;
      const sched = schedules.find(
        (s) => (s as ScheduleRecord & { __backendId?: string }).__backendId === editingScheduleId
      ) as ScheduleRecord & { __backendId?: string } | undefined;
      if (!sched) return;
      const result = await update({
        ...sched,
        schedule_name: scheduleForm.name,
        description: scheduleForm.desc,
        start_date: scheduleForm.start,
        end_date: scheduleForm.end,
        pickup_start: scheduleForm.pickupStart || undefined,
        pickup_end: scheduleForm.pickupEnd || undefined,
      } as ScheduleRecord & { __backendId: string });
      setModals((m) => ({ ...m, editSchedule: false }));
      setEditingScheduleId(null);
      showToast(result.isOk ? "Schedule berhasil diupdate" : "Gagal update. Cek koneksi backend.");
    },
    [editingScheduleId, schedules, scheduleForm, update, showToast]
  );

  const handleCreateBatch = useCallback(
    async (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      const form = e.currentTarget;
      const batchName = (form.querySelector("#batchName") as HTMLInputElement)?.value;
      const pointMin = parseInt((form.querySelector("#batchPointMin") as HTMLInputElement)?.value || "1", 10);
      const pointMax = parseInt((form.querySelector("#batchPointMax") as HTMLInputElement)?.value || "1", 10);
      if (pointMin > pointMax) {
        showToast("Min point tidak boleh lebih besar dari max point");
        return;
      }
      const checkboxes = form.querySelectorAll(".sched-checkbox:checked");
      if (checkboxes.length === 0) {
        showToast("Pilih minimal 1 schedule");
        return;
      }
      const batchId = "batch_" + Date.now();
      let ok = 0;
      for (const cb of Array.from(checkboxes)) {
        const schedId = (cb as HTMLInputElement).value;
        const sched = schedules.find((s) => (s as ScheduleRecord & { __backendId?: string }).__backendId === schedId) as ScheduleRecord & { __backendId?: string };
        if (sched) {
          const result = await update({
            ...sched,
            batch_id: batchId,
            batch_name: batchName,
            point_min: pointMin,
            point_max: pointMax,
          } as ScheduleRecord & { __backendId: string });
          if (result.isOk) ok++;
        }
      }
      // Refresh penuh dari backend supaya daftar batch + jadwal individu langsung konsisten
      await fetchAndReplaceFromBackend();
      setModals((m) => ({ ...m, createBatch: false }));
      showToast(
        ok === checkboxes.length
          ? `Batch "${batchName}" (${pointMin}-${pointMax} pts) berhasil dibuat dengan ${checkboxes.length} schedule`
          : `Berhasil ${ok}/${checkboxes.length}. Cek koneksi backend.`
      );
    },
    [schedules, showToast]
  );

  const showActionModal = useCallback((title: string, message: string, action: "pickup" | "reopen" | "release" | "delete", schedId: string) => {
    setActionTitle(title);
    setActionMessage(message);
    setPendingAction({ action, schedId });
    setModals((m) => ({ ...m, action: true }));
  }, []);

  const isOverlapping = useCallback(
    (startA: string, endA: string, startB: string, endB: string) =>
      startA <= endB && startB <= endA,
    []
  );

  const handleConfirmAction = useCallback(async () => {
    if (!pendingAction || !currentUser) return;
    const sched = schedules.find((s) => (s as ScheduleRecord & { __backendId?: string }).__backendId === pendingAction.schedId) as ScheduleRecord & { __backendId?: string };
    if (!sched) return;
    if (pendingAction.action === "delete") {
      const bid = sched.__backendId!;
      removeByBackendId(bid);
      setModals((m) => ({ ...m, action: false }));
      setPendingAction(null);
      showToast("Schedule dihapus");
      deleteScheduleOnBackend(bid).then((ok) => {
        if (!ok) {
          showToast("Gagal hapus di server. Cek koneksi.");
          fetchAndReplaceFromBackend();
        }
      });
      return;
    }
    if (pendingAction.action === "pickup") {
      // Validasi window pickup jika di-set pada schedule
      if (sched.pickup_start || sched.pickup_end) {
        const now = new Date();
        const startOk = !sched.pickup_start || now >= new Date(sched.pickup_start);
        const endOk = !sched.pickup_end || now <= new Date(sched.pickup_end);
        if (!startOk || !endOk) {
          const fmt = (v?: string) =>
            v ? new Date(v).toLocaleString("id-ID", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }) : "—";
          showToast(
            `Pickup jadwal ini hanya boleh antara ${fmt(sched.pickup_start)} sampai ${fmt(sched.pickup_end)}`
          );
          setModals((m) => ({ ...m, action: false }));
          setPendingAction(null);
          return;
        }
      }
      const myAgendas = agendas.filter((a) => a.username === currentUser.username);
      if (myAgendas.some((a) => isOverlapping(sched.start_date, sched.end_date, a.start_date, a.end_date))) {
        showToast("Bentrok! Anda memiliki agenda/cuti lain.");
        setModals((m) => ({ ...m, action: false }));
        setPendingAction(null);
        return;
      }
      const myScheds = schedules.filter(
        (s) => s.picked_by === currentUser.username && (s.status === "picked" || s.status === "released")
      );
      if (myScheds.some((s) => isOverlapping(sched.start_date, sched.end_date, s.start_date, s.end_date))) {
        showToast("Bentrok! Anda sudah memiliki jadwal di rentang ini.");
        setModals((m) => ({ ...m, action: false }));
        setPendingAction(null);
        return;
      }
      const resPickup = await claimSchedule(sched.__backendId!, currentUser.username);
      if (resPickup.isOk) {
        showToast("Schedule berhasil di-pick up");
        pushNotification("all_admin", `${currentUser.username} mem-pickup jadwal ${sched.schedule_name}`);
        await fetchAndReplaceFromBackend();
      } else if (resPickup.conflict?.picked_by) {
        showToast(`Jadwal ini sudah diambil oleh ${resPickup.conflict.picked_by}. Silakan pilih jadwal lain.`);
        fetchAndReplaceFromBackend();
      } else showToast("Gagal pickup. Cek koneksi backend.");
    } else if (pendingAction.action === "reopen") {
      const resReopen = await reopenSchedule(
        sched.__backendId!,
        currentUser.username,
        currentUser.role === "admin"
      );
      if (resReopen.isOk) {
        showToast("Schedule kembali tersedia");
        await fetchAndReplaceFromBackend();
      } else {
        showToast("Gagal reopen. Hanya pemilik jadwal atau admin yang boleh, atau cek koneksi backend.");
        fetchAndReplaceFromBackend();
      }
    } else if (pendingAction.action === "release") {
      const resRelease = await releaseSchedule(
        sched.__backendId!,
        currentUser.username,
        currentUser.role === "admin"
      );
      if (resRelease.isOk) {
        showToast("Schedule berhasil di-publish ke Jobsheet");
        pushNotification(sched.picked_by, `Jadwal ${sched.schedule_name} baru saja di-publish ke Jobsheet Anda`);
        await fetchAndReplaceFromBackend();
      } else {
        showToast("Gagal release. Hanya pemilik jadwal atau admin yang boleh, atau cek koneksi backend.");
        fetchAndReplaceFromBackend();
      }
    }
    setModals((m) => ({ ...m, action: false }));
    setPendingAction(null);
  }, [pendingAction, currentUser, schedules, users, agendas, isOverlapping, showToast]);

  const handleDeleteSchedule = useCallback(
    (sched: ScheduleRecord & { __backendId?: string }) => {
      const bid = sched.__backendId!;
      removeByBackendId(bid);
      showToast("Schedule dihapus");
      deleteScheduleOnBackend(bid).then((ok) => {
        if (!ok) {
          showToast("Gagal hapus di server. Cek koneksi.");
          fetchAndReplaceFromBackend();
        }
      });
    },
    [showToast]
  );

  const handleChangeTier = useCallback(
    async (userId: string, newTier: string) => {
      const user = users.find((u) => (u as UserRecord & { __backendId?: string }).__backendId === userId) as UserRecord & { __backendId?: string };
      if (!user) return;
      const result = await update({
        ...user,
        tier: newTier as UserRecord["tier"],
        point: getTierPoints(newTier),
      } as UserRecord & { __backendId: string });
      showToast(result.isOk ? `${user.username} diubah ke ${getTierName(newTier)} (${getTierPoints(newTier)} pts)` : "Gagal ubah tier. Cek koneksi backend.");
    },
    [users, showToast]
  );

  const handleCreatePeriod = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      if (!periodForm.name || !periodForm.start || !periodForm.end) return;
      createPeriod({ name: periodForm.name, start: periodForm.start, end: periodForm.end });
      setPeriodForm({ name: "", start: "", end: "" });
      setModals((m) => ({ ...m, createPeriod: false }));
      showToast("Periode berhasil dibuat");
    },
    [periodForm, showToast]
  );

  const handleExportExcel = useCallback(() => {
    if (!currentPeriod) { showToast("Pilih periode dulu"); return; }
    const XLSX = require("xlsx");
    const start = new Date(currentPeriod.start + "T00:00:00");
    const end = new Date(currentPeriod.end + "T00:00:00");
    const dates: Date[] = [];
    const d = new Date(start);
    while (d <= end) { dates.push(new Date(d)); d.setDate(d.getDate() + 1); }
    const filteredTeam = searchGridUser.trim() ? teamUsers.filter((u) => u.username.toLowerCase().includes(searchGridUser.toLowerCase())) : teamUsers;
    const headerRow1 = ["PIC", ...dates.map((date) => date.toLocaleDateString("en-GB", { month: "short" }))];
    const headerRow2 = ["", ...dates.map((date) => String(date.getDate()).padStart(2, "0"))];
    const dataRows = filteredTeam.map((user) => {
      const row: (string | number)[] = [user.username];
      dates.forEach((date) => {
        const yyyy = date.getFullYear();
        const mm = String(date.getMonth() + 1).padStart(2, "0");
        const dd = String(date.getDate()).padStart(2, "0");
        const dateStr = `${yyyy}-${mm}-${dd}`;
        const userAgendas = agendas.filter((a) => a.username === user.username && dateStr >= a.start_date && dateStr <= a.end_date);
        const userScheds = schedules.filter((s) => s.status === "released" && s.picked_by === user.username && dateStr >= s.start_date && dateStr <= s.end_date);
        let content = "";
        if (userAgendas.length > 0) content = userAgendas[0].type;
        else userScheds.forEach((s) => {
          if (s.schedule_name === "Day") content += (content ? " / " : "") + "D";
          else if (s.schedule_name === "Middle") content += (content ? " / " : "") + "MD";
          else if (s.schedule_name === "Duty") content += (content ? " / " : "") + "DT";
          else content += (content ? " / " : "") + (s.schedule_name === "Public Holiday" ? "PH" : s.schedule_name.substring(0, 2));
        });
        row.push(content || "");
      });
      return row;
    });
    const ws = XLSX.utils.aoa_to_sheet([headerRow1, headerRow2, ...dataRows]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Jobsheet");
    XLSX.writeFile(wb, `Jobsheet_${currentPeriod.name.replace(/\s/g, "_")}.xlsx`);
    showToast("Excel berhasil diunduh");
  }, [currentPeriod, teamUsers, searchGridUser, schedules, agendas, showToast]);

  const handleExportPdf = useCallback(() => {
    if (!currentPeriod) { showToast("Pilih periode dulu"); return; }
    const el = document.getElementById("gridContainer");
    if (!el) { showToast("Grid tidak ditemukan"); return; }
    import("html2pdf.js").then(({ default: html2pdf }) => {
      html2pdf().set({ filename: `Jobsheet_${currentPeriod.name.replace(/\s/g, "_")}.pdf`, margin: 8 }).from(el).save();
      showToast("PDF berhasil diunduh");
    });
  }, [currentPeriod, showToast]);

  const handleSaveProject = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      const id = (projectForm.id ?? "").trim() || "proj_" + Date.now();
      const record: ProjectRecord = {
        id,
        cnc_id: projectForm.cnc_id ?? "",
        hotel: projectForm.hotel ?? "",
        name: projectForm.name ?? "",
        info: projectForm.info ?? "",
        type: projectForm.type ?? "Implementation",
        status: projectForm.status ?? "Planned",
        pic: projectForm.pic ?? "",
        req_pic: projectForm.req_pic ?? "",
        assignment: projectForm.assignment ?? "",
        start: projectForm.start ?? "",
        end: projectForm.end ?? "",
        total_days: projectForm.total_days ?? "",
        point_ach: projectForm.point_ach ?? "",
        point_req: projectForm.point_req ?? "",
        pct_point: projectForm.pct_point ?? "",
        kpi2: projectForm.kpi2 ?? "",
        kpi2_officer: projectForm.kpi2_officer ?? "",
        handover_report: projectForm.handover_report ?? "",
        handover_days: projectForm.handover_days ?? "",
        check_report: projectForm.check_report ?? "",
        check_days: projectForm.check_days ?? "",
        s1_est: projectForm.s1_est ?? "",
        s1_over: projectForm.s1_over ?? "",
        s1_email: projectForm.s1_email ?? "",
        s2_email: projectForm.s2_email ?? "",
        s3_email: projectForm.s3_email ?? "",
      };
      saveProject(record, !editingProjectId);
      setModals((m) => ({ ...m, project: false }));
      setEditingProjectId(null);
      setProjectForm({
        id: "",
        cnc_id: "",
        hotel: "",
        name: "",
        info: "",
        type: "Implementation",
        status: "Planned",
        pic: "",
        req_pic: "",
        assignment: "",
        start: "",
        end: "",
        total_days: "",
        point_ach: "",
        point_req: "",
        pct_point: "",
        kpi2: "",
        kpi2_officer: "",
        handover_report: "",
        handover_days: "",
        check_report: "",
        check_days: "",
        s1_est: "",
        s1_over: "",
        s1_email: "",
        s2_email: "",
        s3_email: "",
      });
      showToast(editingProjectId ? "Project diperbarui" : "Project ditambah");
    },
    [projectForm, editingProjectId, showToast]
  );

  const handleSavePartner = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      const id = (partnerForm.id ?? "").trim() || "P-" + String(partners.length + 1).padStart(3, "0");
      const record: PartnerRecord = {
        id,
        name: partnerForm.name ?? "",
        type: partnerForm.type ?? "Hotel",
        star: partnerForm.star ?? "4",
        group: partnerForm.group ?? "",
        room: partnerForm.room ?? "",
        outlet: partnerForm.outlet ?? "",
        status: partnerForm.status ?? "Active",
        system_live: partnerForm.system_live ?? "",
        system_version: partnerForm.system_version ?? "Cloud",
        implementation_type: partnerForm.implementation_type ?? "Cloud",
        address: partnerForm.address ?? "",
        area: partnerForm.area ?? "",
        sub_area: partnerForm.sub_area ?? "",
        last_visit: partnerForm.last_visit ?? "",
        last_visit_type: partnerForm.last_visit_type ?? "",
        last_project: partnerForm.last_project ?? "",
        last_project_type: partnerForm.last_project_type ?? "",
        submission_salutation: partnerForm.submission_salutation ?? "",
        submission_name: partnerForm.submission_name ?? "",
        gm_email: partnerForm.gm_email ?? "",
        fc_email: partnerForm.fc_email ?? "",
        it_email: partnerForm.it_email ?? "",
        hrd_email: partnerForm.hrd_email ?? "",
        allowance_maintenance: partnerForm.allowance_maintenance ?? "",
      };
      savePartner(record, !editingPartnerId);
      setModals((m) => ({ ...m, partner: false }));
      setEditingPartnerId(null);
      setPartnerForm({
        id: "",
        name: "",
        type: "Hotel",
        star: "4",
        group: "",
        room: "",
        outlet: "",
        status: "Active",
        system_live: "",
        system_version: "Cloud",
        implementation_type: "Cloud",
        address: "",
        area: "",
        sub_area: "",
        last_visit: "",
        last_visit_type: "",
        last_project: "",
        last_project_type: "",
        submission_salutation: "",
        submission_name: "",
        gm_email: "",
        fc_email: "",
        it_email: "",
        hrd_email: "",
        allowance_maintenance: "",
      });
      showToast(editingPartnerId ? "Partner diperbarui" : "Partner ditambah");
    },
    [partnerForm, editingPartnerId, partners.length, showToast]
  );

  const availableSchedules = schedules.filter((s) => s.status === "available");
  const pickedSchedules = schedules.filter((s) => s.status === "picked");
  const userPickedSchedules = pickedSchedules.filter((s) => s.picked_by === currentUser?.username);
  const releasedSchedules = schedules.filter((s) => s.status === "released");
  const scheduleOrder = ["Middle", "Day", "Duty", "Saturday", "Sunday", "Public Holiday"];

  const renderScheduleCard = (sched: ScheduleRecord, type: "admin" | "team" | "team-owned" | "team-released") => {
    const statusClass =
      sched.status === "available"
        ? "status-available"
        : sched.status === "picked"
          ? "status-picked"
          : "status-released";
    const bid = (sched as ScheduleRecord & { __backendId?: string }).__backendId;
    const handleOpenEdit = () => {
      const pickupStart = sched.pickup_start ?? "";
      const pickupEnd = sched.pickup_end ?? "";
      setEditingScheduleId(bid ?? null);
      setScheduleForm({
        name: sched.schedule_name,
        desc: sched.description,
        start: sched.start_date,
        end: sched.end_date,
        pickupStart,
        pickupEnd,
      });
      setModals((m) => ({ ...m, editSchedule: true }));
    };
    let buttons: React.ReactNode = null;
    if (type === "admin") {
      const editButton = (
        <button
          type="button"
          className="text-xs bg-sky-500 hover:bg-sky-600 text-white px-2.5 py-1 rounded font-semibold"
          onClick={handleOpenEdit}
        >
          Edit
        </button>
      );
      if (sched.status === "available")
        buttons = (
          <div className="flex flex-wrap gap-1.5">
            {editButton}
            <button
              type="button"
              className="text-xs bg-red-500 hover:bg-red-600 text-white px-2 py-1 rounded font-medium"
              onClick={() =>
                showActionModal(
                  "Delete Schedule",
                  `Hapus jadwal "${sched.schedule_name}" secara permanen?`,
                  "delete",
                  bid!
                )
              }
            >
              Hapus
            </button>
          </div>
        );
      if (sched.status === "picked")
        buttons = (
          <div className="flex flex-wrap gap-1.5">
            {editButton}
            <button
              type="button"
              className="text-xs bg-indigo-500 hover:bg-indigo-600 text-white px-2 py-1 rounded font-medium"
              onClick={() =>
                showActionModal(
                  "Publish ke Jobsheet",
                  `Approve dan tampilkan jadwal "${sched.schedule_name}" milik ${sched.picked_by} ke Jobsheet?`,
                  "release",
                  bid!
                )
              }
            >
              Release
            </button>
            <button
              type="button"
              className="text-xs bg-amber-500 hover:bg-amber-600 text-white px-2 py-1 rounded font-medium"
              onClick={() =>
                showActionModal(
                  "Reopen / Cancel",
                  `Kembalikan jadwal "${sched.schedule_name}" ke status Available?`,
                  "reopen",
                  bid!
                )
              }
            >
              Cancel
            </button>
          </div>
        );
      if (sched.status === "released")
        buttons = (
          <div className="flex flex-wrap gap-1.5">
            {editButton}
            <button
              type="button"
              className="text-xs bg-amber-500 hover:bg-amber-600 text-white px-2 py-1 rounded font-medium"
              onClick={() =>
                showActionModal(
                  "Reopen / Cancel",
                  `Kembalikan jadwal "${sched.schedule_name}" ke status Available?`,
                  "reopen",
                  bid!
                )
              }
            >
              Reopen
            </button>
          </div>
        );
    } else if (type === "team" && sched.status === "available") {
      buttons = (
        <button type="button" className="text-xs w-full btn-primary text-white px-3 py-1.5 rounded-md font-medium" onClick={() => showActionModal("Pick Up Schedule", `Ambil jadwal "${sched.schedule_name}" ini untuk dikerjakan?`, "pickup", bid!)}>Pick Up</button>
      );
    } else if (type === "team-owned" && sched.status === "picked") {
      buttons = (
        <button type="button" className="text-xs w-full bg-amber-500 hover:bg-amber-600 text-white px-3 py-1.5 rounded-md font-medium" onClick={() => showActionModal("Batalkan Pick Up", `Kembalikan jadwal "${sched.schedule_name}" ke status Available?`, "reopen", bid!)}>Batalkan</button>
      );
    } else if (type === "team-released") {
      if (sched.picked_by === currentUser?.username)
        buttons = <span className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">✓ Jadwal fix</span>;
      else
        buttons = <span className="text-xs text-gray-500 dark:text-slate-400">Oleh {sched.picked_by}</span>;
    }
    const statusText = sched.status === "available" ? "Available" : sched.status === "picked" ? "Menunggu" : "Published";
    return (
      <div key={bid} className={`bg-white dark:bg-slate-800 rounded-lg shadow border-l-4 card-hover border border-gray-200 dark:border-slate-600 overflow-hidden transition-shadow hover:shadow-md
        ${statusClass === "status-available" ? "border-l-emerald-500" : statusClass === "status-picked" ? "border-l-amber-500" : "border-l-blue-500"}`}>
        <div className="p-4">
          <div className="flex justify-between items-start gap-3 mb-2">
            <div className="min-w-0 flex-1">
              <h3 className="font-bold text-base text-gray-800 dark:text-slate-200 truncate">{sched.schedule_name}</h3>
            </div>
            <div className="flex items-start gap-2">
              <span className={`status-badge ${statusClass} text-xs px-2 py-0.5 shrink-0`}>{statusText}</span>
            </div>
          </div>

          <div className="flex items-start justify-between gap-3 mb-2">
            <p className="text-xs text-gray-500 dark:text-slate-400 line-clamp-2 min-h-[2rem] flex-1">{sched.description || "—"}</p>
            <div className="text-xs text-gray-600 dark:text-slate-300 shrink-0 text-right space-y-1">
              <div className="whitespace-nowrap">{formatDate(sched.start_date)} → {formatDate(sched.end_date)}</div>
              {sched.picked_by ? (
                <div className="whitespace-nowrap font-medium">👤 {sched.picked_by}</div>
              ) : (
                <div className="whitespace-nowrap text-gray-400 dark:text-slate-500">👤 —</div>
              )}
            </div>
          </div>

          {(sched.pickup_start || sched.pickup_end) && (
            <div className="text-[11px] text-gray-500 dark:text-slate-400 mb-2 space-y-0.5">
              {sched.pickup_start && (
                <div className="whitespace-nowrap">
                  Pick Up Start: {new Date(sched.pickup_start).toLocaleString("id-ID", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}
                </div>
              )}
              {sched.pickup_end && (
                <div className="whitespace-nowrap">
                  Pick Up End: {new Date(sched.pickup_end).toLocaleString("id-ID", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}
                </div>
              )}
            </div>
          )}

          <div className="flex gap-2 flex-wrap items-center">{buttons}</div>
        </div>
      </div>
    );
  };

  const renderSection = (
    title: string,
    list: ScheduleRecord[],
    type: "admin" | "team" | "team-owned" | "team-released"
  ) => {
    if (list.length === 0) return null;
    return (
      <div className="mb-8">
        {title ? <h2 className="text-xl font-bold text-gray-800 dark:text-slate-200 mb-4">{title}</h2> : null}
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {list.map((sched) => renderScheduleCard(sched, type))}
        </div>
      </div>
    );
  };

  const renderBatchSection = (batchName: string, pointMin: number, pointMax: number, list: ScheduleRecord[], viewerRole: "admin" | "team") => {
    if (list.length === 0) return null;
    const pickedOrReleased = list.filter((s) => s.status === "picked" || s.status === "released");
    const pickerNames = [...new Set(pickedOrReleased.map((s) => s.picked_by).filter(Boolean))];
    let totalPointPickup = 0;
    for (const s of pickedOrReleased) {
      const u = users.find((us) => us.username === s.picked_by);
      if (u) totalPointPickup += getTierPoints(u.tier);
    }
    const perluLagi = Math.max(0, pointMin - totalPointPickup);
    return (
      <div className="mb-8" key={batchName}>
        <div className="bg-indigo-50/70 border border-indigo-200 rounded-2xl overflow-hidden dark:bg-slate-800/60 dark:border-slate-700">
          <div className="p-4">
            <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-3">
              <div className="min-w-0">
                <h3 className="text-lg font-bold text-indigo-800 truncate dark:text-slate-100">{batchName}</h3>
                <p className="text-sm text-indigo-600 mt-0.5 dark:text-slate-300">Syarat batch: {pointMin}-{pointMax} points</p>
              </div>
              <div className="md:text-right text-sm text-indigo-700 space-y-1 dark:text-slate-300">
                <p className="truncate">
                  <span className="text-indigo-600 dark:text-slate-400">Pickup:</span>{" "}
                  <span className="font-medium">{pickerNames.length > 0 ? pickerNames.join(", ") : "—"}</span>
                </p>
                <p>
                  <span className="text-indigo-600 dark:text-slate-400">Total point:</span>{" "}
                  <span className="font-semibold text-indigo-800 dark:text-slate-100">
                    {totalPointPickup} point{totalPointPickup === 1 ? "" : "s"}
                  </span>
                </p>
                <p>
                  <span className="text-indigo-600 dark:text-slate-400">Perlu lagi:</span>{" "}
                  <span className="font-medium">
                    {perluLagi > 0 ? `${perluLagi} point` : "Sudah terpenuhi"}
                  </span>
                </p>
              </div>
            </div>
          </div>

          <div className="px-4 pb-4">
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {list.map((sched) => renderScheduleCard(sched, getBatchCardType(sched, viewerRole)))}
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderMixedSection = (title: string, list: ScheduleRecord[], viewerRole: "admin" | "team") => {
    if (list.length === 0) return null;
    return (
      <div className="mb-8">
        <h2 className="text-xl font-bold text-gray-800 dark:text-slate-200 mb-4">{title}</h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {list.map((sched) => renderScheduleCard(sched, getBatchCardType(sched, viewerRole)))}
        </div>
      </div>
    );
  };

  const pickedStandalone = pickedSchedules.filter((s) => !s.batch_id);

  const availableByType = scheduleOrder.map((name) => ({
    name,
    list: availableSchedules.filter((s) => s.schedule_name === name),
  })).filter((g) => g.list.length > 0);

  const schedulesInBatch = schedules.filter((s) => s.batch_id);
  const availableStandalone = availableSchedules.filter((s) => !s.batch_id);
  const batchGroups = (() => {
    const map = new Map<string, ScheduleRecord[]>();
    for (const s of schedulesInBatch) {
      const id = s.batch_id;
      if (!map.has(id)) map.set(id, []);
      map.get(id)!.push(s);
    }
    return Array.from(map.entries()).map(([bid, list]) => ({
      batch_id: bid,
      batch_name: list[0]?.batch_name ?? "Batch",
      point_min: list[0]?.point_min ?? 0,
      point_max: list[0]?.point_max ?? 0,
      list,
    }));
  })();

  const getBatchCardType = (sched: ScheduleRecord, viewerRole: "admin" | "team"): "admin" | "team" | "team-owned" | "team-released" => {
    if (viewerRole === "admin") return "admin";
    if (sched.status === "available") return "team";
    if (sched.status === "picked" && sched.picked_by === currentUser?.username) return "team-owned";
    return "team-released";
  };

  if (screen === "login") {
    return (
      <div className="min-h-screen w-full flex flex-col items-center justify-center p-4 bg-[#f8fafc] dark:bg-slate-900 relative">
        <div className="w-full max-w-md">
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl p-8 fade-in border border-gray-100 dark:border-slate-700">
            <h1 className="text-4xl font-bold text-center mb-2 text-gray-800 dark:text-white">
              Power Management
            </h1>
            <p className="text-center text-gray-600 dark:text-slate-400 mb-8 text-sm font-medium">
              Manage your team&apos;s schedule efficiently
            </p>
            <form id="loginForm" className="space-y-4" onSubmit={handleLogin}>
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-slate-300 mb-2">Username</label>
                <input type="text" id="loginUsername" placeholder="Enter username" required className="w-full input-style" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-slate-300 mb-2">Password</label>
                <input type="password" id="loginPassword" placeholder="Enter password" required className="w-full input-style" />
              </div>
              <button type="submit" className="w-full btn-primary text-white font-bold py-3 px-4 rounded-lg mt-6">
                Login
              </button>
            </form>
            <div className="border-t border-gray-200 dark:border-slate-700 my-6" />
            <div className="text-sm text-gray-600 dark:text-slate-400 mb-4 bg-gray-50 dark:bg-slate-800 p-4 rounded-lg border border-gray-200 dark:border-slate-700">
              <p className="font-semibold mb-2 text-gray-800 dark:text-slate-200">Demo Accounts:</p>
              <p><strong>Admin:</strong> admin / admin123 (atau Komeng / pass123)</p>
              <p><strong>Team:</strong> Akbar, Aldi, dll / pass123</p>
            </div>
            <button
              type="button"
              onClick={() => setScreen("register")}
              className="w-full text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-semibold text-sm"
            >
              Don&apos;t have an account? Register here
            </button>
          </div>
        </div>
        <div className="absolute bottom-6 text-xs font-medium text-gray-400 dark:text-gray-500">{APP_VERSION}</div>
        {toast && (
          <div className="fixed bottom-5 right-5 bg-white dark:bg-slate-800 px-4 py-3 rounded-lg shadow-lg border border-gray-200 dark:border-slate-600 z-[100] max-w-md toast">
            {toast}
          </div>
        )}
      </div>
    );
  }

  if (screen === "register") {
    return (
      <div className="min-h-screen w-full flex flex-col items-center justify-center p-4 bg-[#f8fafc] dark:bg-slate-900 relative">
        <div className="w-full max-w-md">
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl p-8 fade-in border border-gray-100 dark:border-slate-600">
            <h1 className="text-3xl font-bold text-center mb-8 text-gray-800 dark:text-white">
              Create New Account
            </h1>
            <form id="registerForm" className="space-y-4" onSubmit={handleRegister}>
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-slate-300 mb-2">Username</label>
                <input type="text" id="regUsername" placeholder="Choose username" required className="w-full input-style" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-slate-300 mb-2">Password</label>
                <input type="password" id="regPassword" placeholder="Create password" required className="w-full input-style" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-slate-300 mb-2">Role</label>
                <select id="regRole" required className="w-full input-style">
                  <option value="">-- Select Role --</option>
                  <option value="team">Team Member</option>
                </select>
              </div>
              <button type="submit" className="w-full btn-primary text-white font-bold py-3 px-4 rounded-lg mt-6">
                Register
              </button>
            </form>
            <button
              type="button"
              onClick={() => setScreen("login")}
              className="w-full text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-semibold text-sm mt-6"
            >
              Already have an account? Login here
            </button>
          </div>
        </div>
        <div className="absolute bottom-6 text-xs font-medium text-gray-400 dark:text-gray-500">{APP_VERSION}</div>
        {toast && (
          <div className="fixed bottom-5 right-5 bg-white dark:bg-slate-800 px-4 py-3 rounded-lg shadow-lg border border-gray-200 dark:border-slate-600 z-[100] max-w-md toast">
            {toast}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full flex flex-col bg-[#f8fafc] dark:bg-slate-900">
      <div className="sticky top-0 z-40 flex-shrink-0">
        <header className="gradient-header text-white shadow-lg">
          <div className="max-w-full mx-auto px-6 py-5 flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold tracking-tight">Power Management</h1>
              <p id="userGreeting" className="text-sm opacity-80 font-medium">
                {currentUser?.username} | {getTierName(currentUser?.tier ?? "")}
              </p>
            </div>
            <div className="flex gap-4 items-center">
              <button
                type="button"
                onClick={() => setModals((m) => ({ ...m, versionHistory: true }))}
                className="theme-toggle"
                title="Version History"
              >
                📜
              </button>
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setNotifOpen((o) => !o)}
                  className="theme-toggle relative"
                  title="Notifications"
                >
                  🔔
                  {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 bg-red-500 text-white font-bold rounded-full text-[10px] w-5 h-5 flex items-center justify-center border border-white dark:border-slate-800">
                      {unreadCount > 9 ? "9+" : unreadCount}
                    </span>
                  )}
                </button>
                {notifOpen && (
                  <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-slate-800 rounded-xl shadow-2xl border border-gray-100 dark:border-slate-700 z-50 overflow-hidden">
                    <div className="p-3 border-b border-gray-100 dark:border-slate-700 font-bold text-gray-800 dark:text-white bg-gray-50 dark:bg-slate-900/50 flex justify-between items-center">
                      <span>Notifikasi</span>
                      <button
                        type="button"
                        onClick={() => {
                          if (currentUser) markNotificationsRead(currentUser.username);
                          if (currentUser?.role === "admin") markNotificationsRead("all_admin");
                        }}
                        className="text-xs text-blue-600 hover:text-blue-800 dark:text-blue-400"
                      >
                        Tandai sudah dibaca
                      </button>
                    </div>
                    <div className="max-h-80 overflow-y-auto">
                      {myNotifs.length === 0 ? (
                        <p className="text-sm text-gray-500 p-4 text-center italic">Belum ada notifikasi.</p>
                      ) : (
                        myNotifs.map((n) => (
                          <div
                            key={n.id}
                            className={`p-3 border-b border-gray-50 dark:border-slate-700 hover:bg-gray-50 dark:hover:bg-slate-700 transition ${n.read ? "opacity-60" : "bg-blue-50/30 dark:bg-blue-900/10"}`}
                          >
                            <p className={`text-sm text-gray-800 dark:text-gray-200 ${n.read ? "" : "font-semibold"}`}>{n.text}</p>
                            <span className="text-[10px] text-gray-400 mt-1 block">
                              {new Date(n.time).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })} - {new Date(n.time).toLocaleDateString()}
                            </span>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>
              <button type="button" onClick={toggleTheme} className="theme-toggle" title="Toggle dark mode">
                {theme === "dark" ? "☀️" : "🌙"}
              </button>
              <button
                type="button"
                onClick={() => { setCurrentUser(null); setScreen("login"); setNotifOpen(false); }}
                className="bg-white/15 hover:bg-white/25 text-white font-semibold py-2 px-5 rounded-lg transition border border-white/20 hidden sm:block"
              >
                Logout
              </button>
            </div>
          </div>
        </header>

        <nav className="bg-white/95 dark:bg-slate-900/95 backdrop-blur border-b border-gray-200 dark:border-slate-700 px-6 shadow-sm overflow-x-auto">
          <div className="flex gap-6 min-w-max">
            <button
              type="button"
              onClick={() => setCurrentTab("board")}
              className={`py-4 px-2 border-b-2 font-bold transition-colors ${currentTab === "board" ? "border-blue-600 text-blue-600 dark:text-blue-400" : "border-transparent text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200"}`}
            >
              Schedule Arrangement
            </button>
            <button
              type="button"
              onClick={() => setCurrentTab("grid")}
              className={`py-4 px-2 border-b-2 font-bold transition-colors ${currentTab === "grid" ? "border-blue-600 text-blue-600 dark:text-blue-400" : "border-transparent text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200"}`}
            >
              Jobsheet
            </button>
            <button
              type="button"
              onClick={() => setCurrentTab("projects")}
              className={`py-4 px-2 border-b-2 font-bold transition-colors ${currentTab === "projects" ? "border-blue-600 text-blue-600 dark:text-blue-400" : "border-transparent text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200"}`}
            >
              Projects
            </button>
            <button
              type="button"
              onClick={() => setCurrentTab("partners")}
              className={`py-4 px-2 border-b-2 font-bold transition-colors ${currentTab === "partners" ? "border-blue-600 text-blue-600 dark:text-blue-400" : "border-transparent text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200"}`}
            >
              Partners
            </button>
            <button
              type="button"
              onClick={() => setCurrentTab("analytics")}
              className={`py-4 px-2 border-b-2 font-bold transition-colors ${currentTab === "analytics" ? "border-blue-600 text-blue-600 dark:text-blue-400" : "border-transparent text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200"}`}
            >
              Analytics
            </button>
          </div>
        </nav>
      </div>

      <main className="flex-grow p-6 relative">
        {currentTab === "board" && (
        <>
        {currentUser?.role === "team" && (
          <div className="mb-8 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-slate-800 dark:to-slate-800 border border-blue-100 dark:border-slate-700 rounded-2xl p-6 shadow-sm">
            <h2 className="text-lg font-bold text-gray-800 dark:text-white mb-4">Ringkasan Jadwal Anda</h2>
            <div className="flex flex-wrap gap-4">
              {(() => {
                const myScheds = schedules.filter((s) => s.picked_by === currentUser?.username && (s.status === "picked" || s.status === "released"));
                let dCount = 0, mdCount = 0, dtCount = 0, phCount = 0;
                myScheds.forEach((s) => {
                  if (s.schedule_name === "Day") dCount++;
                  if (s.schedule_name === "Middle") mdCount++;
                  if (s.schedule_name === "Duty") dtCount++;
                  if (s.schedule_name === "Public Holiday") phCount++;
                });
                return (
                  <>
                    <div className="bg-white dark:bg-slate-900 px-4 py-2 rounded-lg shadow-sm border border-gray-100 dark:border-slate-700">
                      <span className="text-xs text-gray-500 dark:text-slate-400 block uppercase font-bold">Total Poin</span>
                      <span className="text-xl font-black text-blue-600 dark:text-blue-400">{currentUser?.point ?? 0}</span>
                    </div>
                    <div className="bg-white dark:bg-slate-900 px-4 py-2 rounded-lg shadow-sm border border-gray-100 dark:border-slate-700">
                      <span className="text-xs text-gray-500 dark:text-slate-400 block uppercase font-bold">Tugas Diambil</span>
                      <span className="text-lg font-bold text-gray-800 dark:text-slate-200">{myScheds.length} Jadwal</span>
                    </div>
                    <div className="bg-white dark:bg-slate-900 px-4 py-2 rounded-lg shadow-sm border border-gray-100 dark:border-slate-700 text-sm font-medium text-gray-700 dark:text-slate-300 flex items-center gap-3">
                      <span>Day: <b className="text-orange-600 dark:text-orange-400">{dCount}</b></span>
                      <span>Mid: <b className="text-teal-500 dark:text-teal-400">{mdCount}</b></span>
                      <span>Duty: <b className="text-blue-600 dark:text-blue-400">{dtCount}</b></span>
                      <span>PH: <b className="text-red-500 dark:text-red-400">{phCount}</b></span>
                    </div>
                  </>
                );
              })()}
            </div>
          </div>
        )}
        {currentUser?.role === "admin" && (
          <div className="mb-8">
            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-md p-6 mb-6 border border-gray-100 dark:border-slate-700">
              <h2 className="text-2xl font-bold text-gray-800 dark:text-slate-200 mb-4">Admin Panel</h2>
              <div className="flex gap-3 flex-wrap">
                <button type="button" onClick={() => setModals((m) => ({ ...m, createSchedule: true }))} className="btn-primary text-white font-bold py-2 px-6 rounded-lg"> Create Schedule </button>
                <button type="button" onClick={() => setModals((m) => ({ ...m, createBatch: true }))} className="btn-primary text-white font-bold py-2 px-6 rounded-lg"> Create Batch </button>
                <button type="button" onClick={() => setModals((m) => ({ ...m, manageTiers: true }))} className="btn-primary text-white font-bold py-2 px-6 rounded-lg"> Manage Tiers </button>
                <button type="button" onClick={() => setModals((m) => ({ ...m, manageHolidays: true }))} className="bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 px-6 rounded-lg shadow-sm transition"> Public Holidays </button>
              </div>
            </div>
          </div>
        )}

        <div className="space-y-4 pb-8 max-w-7xl mx-auto">
          {currentUser?.role === "admin" ? (
            <>
              <h2 className="text-2xl font-bold text-gray-800 dark:text-slate-200 mb-4">Jadwal Dalam Batch</h2>
              {batchGroups.length === 0 && availableStandalone.length === 0 && pickedStandalone.length === 0 && <p className="text-gray-500 dark:text-slate-400 mb-4">Belum ada jadwal.</p>}
              {batchGroups.map((g) => renderBatchSection(g.batch_name, g.point_min, g.point_max, g.list, "admin"))}
              {batchGroups.length > 0 && <hr className="border-gray-200 dark:border-slate-600 my-8" />}
              {renderSection("Jadwal Individu (Tanpa Batch)", availableStandalone, "admin")}
              {pickedStandalone.length > 0 && renderSection("Schedules Taken by Team (Menunggu) — Tanpa Batch", pickedStandalone, "admin")}
            </>
          ) : (
            <>
              <h2 className="text-2xl font-bold text-gray-800 dark:text-slate-200 mb-4">Jadwal Dalam Batch</h2>
              {batchGroups.length === 0 && availableStandalone.length === 0 && pickedStandalone.length === 0 && <p className="text-gray-500 dark:text-slate-400 mb-4">Belum ada jadwal.</p>}
              {batchGroups.map((g) => renderBatchSection(g.batch_name, g.point_min, g.point_max, g.list, "team"))}
              {batchGroups.length > 0 && <hr className="border-gray-200 dark:border-slate-600 my-8" />}
              {renderMixedSection("Jadwal Individu (Tanpa Batch)", [...availableStandalone, ...pickedStandalone], "team")}
            </>
          )}
          {schedules.length === 0 && (
            <p className="text-gray-500 dark:text-slate-400 text-center py-8">No schedules available</p>
          )}
        </div>
        </>
        )}

        {currentTab === "grid" && (
          <div className="max-w-full">
            <div className="flex flex-col md:flex-row justify-between mb-6 gap-4 bg-white dark:bg-slate-800 p-4 rounded-xl border border-gray-200 dark:border-slate-700 shadow-sm">
              <div className="flex flex-wrap items-end gap-4 w-full">
                {/* Pilih Periode */}
                <div>
                  <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">Pilih Periode</label>
                  <select
                    value={selectedPeriodId ?? ""}
                    onChange={(e) => setSelectedPeriodId(e.target.value || null)}
                    className="w-full sm:w-auto shadow-sm min-w-[240px] input-style"
                  >
                    <option value="">-- Belum ada periode --</option>
                    {periods.map((p) => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </select>
                </div>

                {/* Buat Periode (label kosong untuk rata bawah) */}
                <div>
                  <label className="block text-xs font-bold text-transparent mb-1 select-none">Spacer</label>
                  <button
                    type="button"
                    onClick={() => setModals((m) => ({ ...m, createPeriod: true }))}
                    className="bg-teal-600 hover:bg-teal-700 text-white font-bold px-4 rounded-lg shadow-sm h-[2.75rem] flex items-center"
                  >
                    Generate Periode
                  </button>
                </div>

                {/* Cari Anggota */}
                <div className="flex-grow min-w-[180px]">
                  <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">Cari Anggota</label>
                  <input
                    type="text"
                    value={searchGridUser}
                    onChange={(e) => setSearchGridUser(e.target.value)}
                    placeholder="Ketik nama..."
                    className="w-full shadow-sm input-style"
                  />
                </div>

                {/* Export */}
                <div className="flex flex-col">
                  <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">Export</label>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={handleExportExcel}
                      className="bg-green-600 hover:bg-green-700 text-white font-bold px-4 rounded-lg shadow-sm h-[2.75rem] flex items-center"
                    >
                      Export to Excel
                    </button>
                    <button
                      type="button"
                      onClick={handleExportPdf}
                      className="bg-red-600 hover:bg-red-700 text-white font-bold px-4 rounded-lg shadow-sm h-[2.75rem] flex items-center"
                    >
                      Export to PDF
                    </button>
                  </div>
                </div>
              </div>
            </div>
            {currentUser?.role === "admin" && (
              <div className="mb-4 text-sm text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-slate-800 p-3 rounded-lg border border-blue-100 dark:border-slate-700 flex items-center gap-2">
                💡 <b>Tips Cepat (Admin):</b> Klik dan geser (drag) menyamping pada kotak jadwal untuk mengatur banyak tanggal sekaligus!
              </div>
            )}
            <div className="bg-white dark:bg-slate-800 rounded-xl shadow border border-gray-200 dark:border-slate-700 overflow-x-auto" style={{ minHeight: 400 }}>
              <div id="gridContainer" className="min-w-max p-4">
                {!currentPeriod ? (
                  <p className="text-gray-500 italic p-4">Pilih periode untuk melihat jadwal...</p>
                ) : (
                  (() => {
                    const start = new Date(currentPeriod.start + "T00:00:00");
                    const end = new Date(currentPeriod.end + "T00:00:00");
                    const dates: Date[] = [];
                    const d = new Date(start);
                    while (d <= end) { dates.push(new Date(d)); d.setDate(d.getDate() + 1); }
                    let filteredTeam = teamUsers;
                    if (searchGridUser.trim()) filteredTeam = teamUsers.filter((u) => u.username.toLowerCase().includes(searchGridUser.toLowerCase()));
                    return (
                      <table className="grid-table bg-white dark:bg-slate-800" id="jobsheetTable">
                        <thead>
                          <tr>
                            <th rowSpan={2} className="sticky-col border-r-2 border-gray-400 min-w-[150px] uppercase text-sm">PIC</th>
                            {dates.map((date) => {
                              const day = date.getDay();
                              const isHol = isHolidayDate(`${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`);
                              let c = "text-gray-800 dark:text-gray-200";
                              if (isHol) c = "bg-holiday"; else if (day === 6) c = "bg-saturday"; else if (day === 0) c = "bg-sunday";
                              return <th key={date.toISOString()} className={c}>{date.toLocaleDateString("en-GB", { month: "short" })}</th>;
                            })}
                          </tr>
                          <tr>
                            {dates.map((date) => {
                              const day = date.getDay();
                              const isHol = isHolidayDate(`${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`);
                              let c = "text-gray-800 dark:text-gray-200 font-bold";
                              if (isHol) c = "bg-holiday font-bold"; else if (day === 6) c = "bg-saturday font-bold"; else if (day === 0) c = "bg-sunday font-bold";
                              return <th key={date.toISOString()} className={c}>{String(date.getDate()).padStart(2, "0")}</th>;
                            })}
                          </tr>
                        </thead>
                        <tbody>
                          {filteredTeam.map((user) => (
                            <tr key={user.username}>
                              <td className="sticky-col border-r-2 border-gray-400 text-left font-medium text-gray-700 dark:text-gray-300">{user.username}</td>
                              {dates.map((date) => {
                                const yyyy = date.getFullYear();
                                const mm = String(date.getMonth() + 1).padStart(2, "0");
                                const dd = String(date.getDate()).padStart(2, "0");
                                const dateStr = `${yyyy}-${mm}-${dd}`;
                                const override = getOverride(user.username, dateStr);
                                const userAgendas = agendas.filter((a) => a.username === user.username && dateStr >= a.start_date && dateStr <= a.end_date);
                                const userScheds = schedules.filter((s) => s.status === "released" && s.picked_by === user.username && dateStr >= s.start_date && dateStr <= s.end_date);
                                let content = "";
                                // Priority: released schedule (locked) > manual override > agenda
                                if (userScheds.length > 0) userScheds.forEach((s) => {
                                  if (s.schedule_name === "Day") content += (content ? " / " : "") + "D";
                                  else if (s.schedule_name === "Middle") content += (content ? " / " : "") + "MD";
                                  else if (s.schedule_name === "Duty") content += (content ? " / " : "") + "DT";
                                  else content += (content ? " / " : "") + (s.schedule_name === "Public Holiday" ? "PH" : s.schedule_name.substring(0, 2));
                                });
                                else if (override?.value) content = formatJobsheetValue(override.value);
                                else if (userAgendas.length > 0) content = userAgendas[0].type;
                                const day = date.getDay();
                                const isHol = isHolidayDate(dateStr);
                                let tdClass = "bg-gray-50 dark:bg-slate-800/50 text-center font-bold align-middle border border-gray-200 dark:border-slate-600";
                                if (isHol) tdClass = "bg-holiday opacity-90 text-center align-middle border"; else if (day === 6) tdClass = "bg-saturday opacity-90 text-center align-middle border"; else if (day === 0) tdClass = "bg-sunday opacity-90 text-center align-middle border";
                                const locked = userScheds.length > 0;
                                const isSelected = dragState.username === user.username && dragState.dates.includes(dateStr);
                                const cellClass = `${tdClass} ${currentUser?.role === "admin" && !locked ? "cursor-cell" : ""} ${isSelected ? "drag-selected" : ""} ${locked ? "opacity-90" : ""}`;
                                return (
                                  <td
                                    key={dateStr}
                                    className={cellClass}
                                    onMouseDown={() => {
                                      if (currentUser?.role !== "admin") return;
                                      if (locked) {
                                        showToast("Cell ini berasal dari Schedule Arrangement (Released). Edit dari Schedule Arrangement.");
                                        return;
                                      }
                                      setDragState({ isDragging: true, username: user.username, dates: [dateStr] });
                                    }}
                                    onMouseEnter={() => {
                                      if (currentUser?.role !== "admin") return;
                                      if (!dragState.isDragging || dragState.username !== user.username) return;
                                      if (locked) return;
                                      if (dragState.dates.includes(dateStr)) return;
                                      setDragState((s) => ({ ...s, dates: [...s.dates, dateStr] }));
                                    }}
                                    onMouseUp={() => {
                                      if (currentUser?.role !== "admin") return;
                                      if (!dragState.isDragging || dragState.username !== user.username) return;
                                      const sorted = [...(dragState.dates.length ? dragState.dates : [dateStr])].sort((a, b) => a.localeCompare(b));
                                      const editable = sorted.filter((d) => !isLockedByScheduleArrangement(user.username, d));
                                      if (editable.length === 0) {
                                        showToast("Tidak ada cell yang bisa diedit. Jadwal berasal dari Schedule Arrangement.");
                                        setDragState({ isDragging: false, username: "", dates: [] });
                                        return;
                                      }
                                      setBulkEdit({ open: true, username: user.username, dates: editable });
                                      setBulkEditValue("");
                                      setDragState({ isDragging: false, username: "", dates: [] });
                                    }}
                                  >
                                    {content || ""}
                                  </td>
                                );
                              })}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    );
                  })()
                )}
              </div>
            </div>
          </div>
        )}

        {currentTab === "projects" && (
          <div className="max-w-7xl mx-auto">
            <div className="flex justify-between items-center mb-6 bg-white dark:bg-slate-800 p-4 rounded-xl border border-gray-200 dark:border-slate-700 shadow-sm">
              <input type="text" value={searchProject} onChange={(e) => setSearchProject(e.target.value)} placeholder="Ketik nama project, ID, atau hotel..." className="max-w-md w-full input-style" />
              <button type="button" onClick={() => { setEditingProjectId(null); setProjectForm({ hotel: "", name: "", type: "Implementation", status: "Ongoing", pic: "", start: "", end: "" }); setModals((m) => ({ ...m, project: true })); }} className="btn-primary text-white font-bold py-2 px-4 rounded-lg">Tambah Project</button>
            </div>
            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-200 dark:border-slate-700 overflow-hidden">
              <table className="min-w-full text-sm text-left">
                <thead className="text-xs text-gray-500 uppercase bg-gray-50 dark:bg-slate-800 dark:text-gray-400 border-b border-gray-200 dark:border-slate-700">
                  <tr>
                    <th className="px-4 py-3 font-semibold">ID</th>
                    <th className="px-4 py-3 font-semibold">Project Name & Hotel</th>
                    <th className="px-4 py-3 font-semibold">PIC</th>
                    <th className="px-4 py-3 font-semibold">Timeline</th>
                    <th className="px-4 py-3 font-semibold">Status & Type</th>
                    <th className="px-4 py-3 font-semibold">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-slate-700 text-gray-700 dark:text-gray-300">
                  {projects
                    .filter((p) => !searchProject.trim() || p.name.toLowerCase().includes(searchProject.toLowerCase()) || p.hotel.toLowerCase().includes(searchProject.toLowerCase()) || p.id.toLowerCase().includes(searchProject.toLowerCase()))
                    .map((p) => (
                      <tr key={p.id} className="hover:bg-gray-50 dark:hover:bg-slate-800/50">
                        <td className="px-4 py-3 font-semibold text-gray-600 dark:text-gray-400">{p.id}</td>
                        <td className="px-4 py-3"><div className="font-bold text-gray-800 dark:text-white">{p.name}</div><div className="text-xs text-blue-600 dark:text-blue-400"> {p.hotel}</div></td>
                        <td className="px-4 py-3">{p.pic ?? "-"}</td>
                        <td className="px-4 py-3 text-xs">{formatDate(p.start ?? "")} - {formatDate(p.end ?? "")}</td>
                        <td className="px-4 py-3"><span className="px-2 py-0.5 text-xs font-bold rounded bg-gray-100 dark:bg-slate-700">{p.status}</span> <div className="text-xs text-gray-500">{p.type}</div></td>
                        <td className="px-4 py-3">
                          <button
                            type="button"
                            className="text-sm text-blue-600 dark:text-blue-400 hover:underline font-medium"
                            onClick={() => {
                              setEditingProjectId(p.id);
                              setProjectForm({
                                id: p.id,
                                cnc_id: p.cnc_id ?? "",
                                hotel: p.hotel,
                                name: p.name,
                                info: p.info ?? "",
                                type: p.type,
                                status: p.status,
                                pic: p.pic ?? "",
                                req_pic: p.req_pic ?? "",
                                assignment: p.assignment ?? "",
                                start: p.start ?? "",
                                end: p.end ?? "",
                                total_days: p.total_days ?? "",
                                point_ach: p.point_ach ?? "",
                                point_req: p.point_req ?? "",
                                pct_point: p.pct_point ?? "",
                                kpi2: p.kpi2 ?? "",
                                kpi2_officer: p.kpi2_officer ?? "",
                                handover_report: p.handover_report ?? "",
                                handover_days: p.handover_days ?? "",
                                check_report: p.check_report ?? "",
                                check_days: p.check_days ?? "",
                                s1_est: p.s1_est ?? "",
                                s1_over: p.s1_over ?? "",
                                s1_email: p.s1_email ?? "",
                                s2_email: p.s2_email ?? "",
                                s3_email: p.s3_email ?? "",
                              });
                              setModals((m) => ({ ...m, project: true }));
                            }}
                          >
                            View/Edit
                          </button>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {currentTab === "partners" && (
          <div className="max-w-7xl mx-auto">
            <div className="flex justify-between items-center mb-6 bg-white dark:bg-slate-800 p-4 rounded-xl border border-gray-200 dark:border-slate-700 shadow-sm">
              <input type="text" value={searchPartner} onChange={(e) => setSearchPartner(e.target.value)} placeholder="Ketik nama partner atau area..." className="max-w-md w-full input-style" />
              <button type="button" onClick={() => { setEditingPartnerId(null); setPartnerForm({ name: "", type: "Hotel", star: "4", status: "Active", area: "" }); setModals((m) => ({ ...m, partner: true })); }} className="btn-primary text-white font-bold py-2 px-4 rounded-lg">Tambah Partner</button>
            </div>
            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-200 dark:border-slate-700 overflow-hidden">
              <table className="min-w-full text-sm text-left">
                <thead className="text-xs text-gray-500 uppercase bg-gray-50 dark:bg-slate-800 dark:text-gray-400 border-b border-gray-200 dark:border-slate-700">
                  <tr>
                    <th className="px-4 py-3 font-semibold">ID</th>
                    <th className="px-4 py-3 font-semibold">Name</th>
                    <th className="px-4 py-3 font-semibold">Type & Star</th>
                    <th className="px-4 py-3 font-semibold">Area</th>
                    <th className="px-4 py-3 font-semibold">Status</th>
                    <th className="px-4 py-3 font-semibold">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-slate-700 text-gray-700 dark:text-gray-300">
                  {partners
                    .filter((p) => !searchPartner.trim() || p.name.toLowerCase().includes(searchPartner.toLowerCase()) || (p.area ?? "").toLowerCase().includes(searchPartner.toLowerCase()))
                    .map((p) => (
                      <tr key={p.id} className="hover:bg-gray-50 dark:hover:bg-slate-800/50">
                        <td className="px-4 py-3 font-semibold text-gray-600 dark:text-gray-400">{p.id}</td>
                        <td className="px-4 py-3 font-bold text-gray-800 dark:text-white">{p.name}</td>
                        <td className="px-4 py-3"><span className="bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 px-2 py-0.5 rounded text-xs font-bold">{p.type}</span> {p.star}⭐</td>
                        <td className="px-4 py-3 text-gray-600 dark:text-gray-400">{p.area ?? "-"}</td>
                        <td className="px-4 py-3"><span className={`px-2 py-1 text-xs font-bold rounded ${p.status === "Active" ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200" : "bg-red-100 text-red-800"}`}>{p.status}</span></td>
                        <td className="px-4 py-3">
                          <button
                            type="button"
                            className="text-sm text-blue-600 dark:text-blue-400 hover:underline font-medium"
                            onClick={() => {
                              setEditingPartnerId(p.id);
                              setPartnerForm({
                                id: p.id,
                                name: p.name,
                                type: p.type,
                                star: p.star,
                                group: p.group ?? "",
                                room: p.room ?? "",
                                outlet: p.outlet ?? "",
                                status: p.status,
                                system_live: p.system_live ?? "",
                                system_version: p.system_version ?? "Cloud",
                                implementation_type: p.implementation_type ?? "Cloud",
                                address: p.address ?? "",
                                area: p.area ?? "",
                                sub_area: p.sub_area ?? "",
                                last_visit: p.last_visit ?? "",
                                last_visit_type: p.last_visit_type ?? "",
                                last_project: p.last_project ?? "",
                                last_project_type: p.last_project_type ?? "",
                                submission_salutation: p.submission_salutation ?? "",
                                submission_name: p.submission_name ?? "",
                                gm_email: p.gm_email ?? "",
                                fc_email: p.fc_email ?? "",
                                it_email: p.it_email ?? "",
                                hrd_email: p.hrd_email ?? "",
                                allowance_maintenance: p.allowance_maintenance ?? "",
                              });
                              setModals((m) => ({ ...m, partner: true }));
                            }}
                          >
                            View/Edit
                          </button>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {currentTab === "analytics" && (
          <div className="max-w-7xl mx-auto flex flex-col gap-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-slate-700">
                <h3 className="text-lg font-bold text-gray-800 dark:text-white mb-4 border-b border-gray-100 dark:border-slate-700 pb-2"> Top Performer Tim</h3>
                <div className="space-y-4 max-h-64 overflow-y-auto">
                  {[...teamUsers].sort((a, b) => (b.point ?? 0) - (a.point ?? 0)).slice(0, 5).map((u, i) => (
                    <div key={u.username} className="flex justify-between items-center bg-gray-50 dark:bg-slate-700 p-3 rounded-lg border border-gray-100 dark:border-slate-600">
                      <div className="flex items-center gap-3">
                        <span className={`font-black text-lg ${i === 0 ? "text-yellow-500" : i === 1 ? "text-gray-400" : i === 2 ? "text-amber-600" : "text-gray-500"}`}>#{i + 1}</span>
                        <span className="font-bold text-gray-800 dark:text-white">{u.username}</span>
                      </div>
                      <span className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 font-bold px-2 py-1 rounded text-sm">{u.point ?? 0} pts</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-slate-700 lg:col-span-2">
                <h3 className="text-lg font-bold text-gray-800 dark:text-white mb-4 border-b border-gray-100 dark:border-slate-700 pb-2"> Distribusi Beban Kerja</h3>
                <div className="relative h-[250px] w-full flex justify-center items-center">
                  <canvas ref={chartRef} className="max-h-[240px] max-w-full" />
                </div>
              </div>
            </div>
            <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-slate-700">
              <div className="flex justify-between items-center mb-4 border-b border-gray-100 dark:border-slate-700 pb-2">
                <h3 className="text-lg font-bold text-gray-800 dark:text-white"> Rekap Kehadiran & Tugas</h3>
                <input type="text" value={searchAnalyticsUser} onChange={(e) => setSearchAnalyticsUser(e.target.value)} placeholder="Cari Anggota..." className="text-sm py-1 px-3 w-48 input-style" />
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm text-left">
                  <thead className="text-xs text-gray-500 uppercase bg-gray-50 dark:bg-slate-800 dark:text-gray-400">
                    <tr>
                      <th className="px-4 py-3">Anggota</th>
                      <th className="px-4 py-3">Total Poin</th>
                      <th className="px-4 py-3">Jadwal Shift (D/MD/DT)</th>
                      <th className="px-4 py-3">Proyek/Implementasi</th>
                      <th className="px-4 py-3">Maintenance</th>
                      <th className="px-4 py-3 text-red-500">Cuti / Sakit</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 dark:divide-slate-700 text-gray-700 dark:text-gray-300">
                    {teamUsers
                      .filter((u) => !searchAnalyticsUser.trim() || u.username.toLowerCase().includes(searchAnalyticsUser.toLowerCase()))
                      .sort((a, b) => a.username.localeCompare(b.username))
                      .map((u) => {
                        const totalSched = schedules.filter((s) => (s.status === "picked" || s.status === "released") && s.picked_by === u.username).length;
                        const totalImpl = agendas.filter((a) => a.username === u.username && a.type.startsWith("I.")).length;
                        const totalMaint = agendas.filter((a) => a.username === u.username && a.type.startsWith("M.")).length;
                        const totalAbsence = agendas.filter((a) => a.username === u.username && ["C", "I", "S"].includes(a.type)).length;
                        return (
                          <tr key={u.username} className="hover:bg-gray-50 dark:hover:bg-slate-800/50">
                            <td className="px-4 py-3 font-bold">{u.username}</td>
                            <td className="px-4 py-3 font-semibold text-blue-600 dark:text-blue-400">{u.point ?? 0}</td>
                            <td className="px-4 py-3">{totalSched} Hari</td>
                            <td className="px-4 py-3">{totalImpl} Tugas</td>
                            <td className="px-4 py-3">{totalMaint} Tugas</td>
                            <td className="px-4 py-3 text-red-500 font-medium">{totalAbsence} Hari</td>
                          </tr>
                        );
                      })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </main>

      <footer className="bg-white dark:bg-slate-900 border-t border-gray-200 dark:border-slate-700 py-3 flex-shrink-0 z-10">
        <p className="text-center text-xs font-medium text-gray-500 dark:text-gray-400">{APP_VERSION}</p>
      </footer>

      {/* Create Schedule Modal */}
      {modals.createSchedule && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 modal-overlay">
          <div className="modal-content bg-white dark:bg-slate-800">
            <h2 className="text-2xl font-bold text-gray-800 dark:text-slate-200 mb-4">Create Schedule</h2>
            <form className="space-y-4" onSubmit={handleCreateSchedule}>
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-slate-300 mb-2">Schedule Name</label>
                <select id="schedName" required className="w-full input-style">
                  <option value="">-- Select Schedule Type --</option>
                  <option value="Day">Day</option>
                  <option value="Middle">Middle</option>
                  <option value="Duty">Duty</option>
                  <option value="Saturday">Saturday</option>
                  <option value="Sunday">Sunday</option>
                  <option value="Public Holiday">Public Holiday</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-slate-300 mb-2">Description</label>
                <textarea id="schedDesc" placeholder="Full description..." rows={3} className="w-full input-style" />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-slate-300 mb-2">Start Date</label>
                  <input type="date" id="schedStart" required className="w-full input-style" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-slate-300 mb-2">End Date</label>
                  <input type="date" id="schedEnd" required className="w-full input-style" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-slate-300 mb-1">
                  Pick Up Validation Window (Optional)
                </label>
                <p className="text-xs text-gray-500 dark:text-slate-400 mb-2">
                  Hanya pada rentang waktu ini tim bisa melakukan pickup jadwal ini. Nilai terakhir akan diingat untuk schedule berikutnya.
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-600 dark:text-slate-300 mb-1">Pick Up Start</label>
                    <input type="datetime-local" id="schedPickupStart" className="w-full input-style" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 dark:text-slate-300 mb-1">Pick Up End</label>
                    <input type="datetime-local" id="schedPickupEnd" className="w-full input-style" />
                  </div>
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-slate-300 mb-2">Support Needed</label>
                <select id="schedSupport" className="w-full input-style">
                  <option value="1">1</option>
                  <option value="2">2</option>
                  <option value="3">3</option>
                  <option value="4">4</option>
                </select>
              </div>
              <div className="flex gap-2 mt-6">
                <button type="submit" className="flex-1 btn-primary text-white font-bold py-2 px-4 rounded-lg">Create</button>
                <button
                  type="button"
                  onClick={() => setModals((m) => ({ ...m, createSchedule: false }))}
                  className="flex-1 bg-gray-300 dark:bg-slate-600 text-gray-800 dark:text-slate-200 font-bold py-2 px-4 rounded-lg hover:bg-gray-400 dark:hover:bg-slate-500"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Schedule Modal */}
      {modals.editSchedule && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 modal-overlay">
          <div className="modal-content bg-white dark:bg-slate-800">
            <h2 className="text-2xl font-bold text-gray-800 dark:text-slate-200 mb-4">Edit Schedule</h2>
            <form className="space-y-4" onSubmit={handleUpdateSchedule}>
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-slate-300 mb-2">Schedule Name</label>
                <input
                  type="text"
                  className="w-full input-style"
                  value={scheduleForm.name}
                  onChange={(e) => setScheduleForm((f) => ({ ...f, name: e.target.value }))}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-slate-300 mb-2">Description</label>
                <textarea
                  rows={3}
                  className="w-full input-style"
                  value={scheduleForm.desc}
                  onChange={(e) => setScheduleForm((f) => ({ ...f, desc: e.target.value }))}
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-slate-300 mb-2">Start Date</label>
                  <input
                    type="date"
                    className="w-full input-style"
                    value={scheduleForm.start}
                    onChange={(e) => setScheduleForm((f) => ({ ...f, start: e.target.value }))}
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-slate-300 mb-2">End Date</label>
                  <input
                    type="date"
                    className="w-full input-style"
                    value={scheduleForm.end}
                    onChange={(e) => setScheduleForm((f) => ({ ...f, end: e.target.value }))}
                    required
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-slate-300 mb-1">
                  Pickup Validation Window (Optional)
                </label>
                <p className="text-xs text-gray-500 dark:text-slate-400 mb-2">
                  Hanya pada rentang waktu ini tim bisa melakukan pickup jadwal ini.
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-600 dark:text-slate-300 mb-1">Pickup Start</label>
                    <input
                      type="datetime-local"
                      className="w-full input-style"
                      value={scheduleForm.pickupStart}
                      onChange={(e) => setScheduleForm((f) => ({ ...f, pickupStart: e.target.value }))}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 dark:text-slate-300 mb-1">Pickup End</label>
                    <input
                      type="datetime-local"
                      className="w-full input-style"
                      value={scheduleForm.pickupEnd}
                      onChange={(e) => setScheduleForm((f) => ({ ...f, pickupEnd: e.target.value }))}
                    />
                  </div>
                </div>
              </div>
              <div className="flex gap-2 mt-6">
                <button type="submit" className="flex-1 btn-primary text-white font-bold py-2 px-4 rounded-lg">
                  Simpan Perubahan
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setModals((m) => ({ ...m, editSchedule: false }));
                    setEditingScheduleId(null);
                  }}
                  className="flex-1 bg-gray-300 dark:bg-slate-600 text-gray-800 dark:text-slate-200 font-bold py-2 px-4 rounded-lg hover:bg-gray-400 dark:hover:bg-slate-500"
                >
                  Batal
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Create Batch Modal */}
      {modals.createBatch && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 modal-overlay">
          <div className="modal-content modal-large bg-white dark:bg-slate-800 max-w-[700px] max-h-[70vh] overflow-y-auto">
            <h2 className="text-2xl font-bold text-gray-800 dark:text-slate-200 mb-4">Create Batch</h2>
            <form className="space-y-4" onSubmit={handleCreateBatch}>
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-slate-300 mb-2">Batch Name</label>
                <input type="text" id="batchName" placeholder="e.g. Middle Batch A" required className="w-full input-style" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-slate-300 mb-2">Min Points Required</label>
                  <input type="number" id="batchPointMin" placeholder="3" required min={1} max={12} className="w-full input-style" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-slate-300 mb-2">Max Points Allowed</label>
                  <input type="number" id="batchPointMax" placeholder="6" required min={1} max={12} className="w-full input-style" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-slate-300 mb-2">Select Schedules (Manual)</label>
                <div className="border border-gray-200 dark:border-slate-600 rounded-lg p-4 max-h-48 overflow-y-auto space-y-3 bg-gray-50 dark:bg-slate-700/50">
                  {schedules.filter((s) => !s.batch_id).length === 0 ? (
                    <p className="text-gray-500 dark:text-slate-400 text-sm">Tidak ada schedule yang tersedia</p>
                  ) : (
                    schedules
                      .filter((s) => !s.batch_id)
                      .map((s) => (
                        <label key={(s as ScheduleRecord & { __backendId?: string }).__backendId} className="checkbox-item cursor-pointer hover:bg-white dark:hover:bg-slate-600 p-2 rounded transition flex items-center gap-2">
                          <input type="checkbox" className="sched-checkbox" value={(s as ScheduleRecord & { __backendId?: string }).__backendId} />
                          <div className="flex-1">
                            <span className="font-medium text-gray-800 dark:text-slate-200">{s.schedule_name}</span>
                            <span className="text-gray-600 dark:text-slate-400 text-xs ml-2">{formatDate(s.start_date)}</span>
                            <p className="text-xs text-gray-500 dark:text-slate-400 mt-1">{s.description}</p>
                          </div>
                        </label>
                      ))
                  )}
                </div>
              </div>
              <div className="flex gap-2 mt-6">
                <button type="submit" className="flex-1 btn-primary text-white font-bold py-2 px-4 rounded-lg">Create Batch</button>
                <button
                  type="button"
                  onClick={() => setModals((m) => ({ ...m, createBatch: false }))}
                  className="flex-1 bg-gray-300 dark:bg-slate-600 text-gray-800 dark:text-slate-200 font-bold py-2 px-4 rounded-lg hover:bg-gray-400 dark:hover:bg-slate-500"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Manage Tiers Modal */}
      {modals.manageTiers && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 modal-overlay">
          <div className="modal-content modal-large bg-white dark:bg-slate-800 max-w-[700px] max-h-[70vh] overflow-y-auto">
            <h2 className="text-2xl font-bold text-gray-800 dark:text-slate-200 mb-4">Manage User Tiers</h2>
            <div className="space-y-3">
              {users.filter((u) => u.role === "team").length === 0 ? (
                <p className="text-gray-500 dark:text-slate-400 text-sm">Tidak ada team member</p>
              ) : (
                users
                  .filter((u) => u.role === "team")
                  .map((u) => (
                    <div key={(u as UserRecord & { __backendId?: string }).__backendId} className="border border-gray-200 dark:border-slate-600 rounded-lg p-4 bg-gray-50 dark:bg-slate-700/50">
                      <div className="flex justify-between items-center mb-3">
                        <div>
                          <h3 className="font-semibold text-gray-800 dark:text-slate-200">{u.username}</h3>
                          <p className="text-sm text-gray-600 dark:text-slate-400">
                            {getTierName(u.tier)} - {getTierPoints(u.tier)} point(s)
                          </p>
                        </div>
                      </div>
                      <div className="flex gap-2 flex-wrap">
                        {(["new_born", "tier_1", "tier_2", "tier_3"] as const).map((tier) => (
                          <button
                            key={tier}
                            type="button"
                            className="tier-btn text-xs px-3 py-1 rounded border border-gray-300 dark:border-slate-500 hover:bg-blue-50 dark:hover:bg-slate-600 hover:border-blue-300 transition"
                            onClick={() => handleChangeTier((u as UserRecord & { __backendId?: string }).__backendId!, tier)}
                          >
                            {getTierName(tier)}
                          </button>
                        ))}
                      </div>
                    </div>
                  ))
              )}
            </div>
            <div className="flex gap-2 mt-6">
              <button
                type="button"
                onClick={() => setModals((m) => ({ ...m, manageTiers: false }))}
                className="flex-1 bg-gray-300 dark:bg-slate-600 text-gray-800 dark:text-slate-200 font-bold py-2 px-4 rounded-lg hover:bg-gray-400 dark:hover:bg-slate-500"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create Period Modal */}
      {modals.createPeriod && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 modal-overlay">
          <div className="modal-content bg-white dark:bg-slate-800">
            <h2 className="text-2xl font-bold text-gray-800 dark:text-slate-200 mb-4">Buat Periode</h2>
            <form className="space-y-4" onSubmit={handleCreatePeriod}>
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-slate-300 mb-2">Nama Periode</label>
                <input type="text" value={periodForm.name} onChange={(e) => setPeriodForm((f) => ({ ...f, name: e.target.value }))} placeholder="Contoh: Maret 2026" required className="w-full input-style" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-slate-300 mb-2">Tanggal Mulai</label>
                <input type="date" value={periodForm.start} onChange={(e) => setPeriodForm((f) => ({ ...f, start: e.target.value }))} required className="w-full input-style" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-slate-300 mb-2">Tanggal Selesai</label>
                <input type="date" value={periodForm.end} onChange={(e) => setPeriodForm((f) => ({ ...f, end: e.target.value }))} required className="w-full input-style" />
              </div>
              <div className="flex gap-2 mt-6">
                <button type="submit" className="flex-1 btn-primary text-white font-bold py-2 px-4 rounded-lg">Buat</button>
                <button type="button" onClick={() => setModals((m) => ({ ...m, createPeriod: false }))} className="flex-1 bg-gray-300 dark:bg-slate-600 text-gray-800 dark:text-slate-200 font-bold py-2 px-4 rounded-lg">Batal</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Action Modal */}
      {modals.action && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 modal-overlay">
          <div className="modal-content bg-white dark:bg-slate-800">
            <h2 className="text-2xl font-bold text-gray-800 dark:text-slate-200 mb-4">{actionTitle}</h2>
            <p className="text-gray-600 dark:text-slate-400 mb-6 text-sm leading-relaxed whitespace-pre-line">{actionMessage}</p>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={handleConfirmAction}
                className="flex-1 btn-primary text-white font-bold py-2 px-4 rounded-lg"
              >
                Confirm
              </button>
              <button
                type="button"
                onClick={() => {
                  setModals((m) => ({ ...m, action: false }));
                  setPendingAction(null);
                }}
                className="flex-1 bg-gray-300 dark:bg-slate-600 text-gray-800 dark:text-slate-200 font-bold py-2 px-4 rounded-lg hover:bg-gray-400 dark:hover:bg-slate-500"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Version History Modal */}
      {modals.versionHistory && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 modal-overlay" onClick={() => setModals((m) => ({ ...m, versionHistory: false }))}>
          <div className="modal-content modal-xl bg-white dark:bg-slate-800 max-h-[80vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-2xl font-bold text-gray-800 dark:text-slate-200 mb-4">Version History</h2>
            <div className="space-y-6 text-sm text-gray-700 dark:text-slate-300">
              <div className="border-l-4 border-emerald-500 pl-4 py-2">
                <p className="font-bold text-emerald-700 dark:text-emerald-300">v.1.2603.5 — 12 Maret 2026 (Terbaru)</p>
                <ul className="mt-2 list-disc list-inside space-y-1">
                  <li><strong>Schedule Arrangement ke PostgreSQL:</strong> Semua data user &amp; jadwal (Create/Edit/Delete, Batch, Pickup, Release, Reopen) tersimpan di database Postgres via API.</li>
                  <li><strong>Edit Jadwal:</strong> Admin dapat mengedit jadwal yang sudah dibuat (nama, deskripsi, tanggal, Pick Up Start/End) tanpa hapus atau buat ulang.</li>
                  <li><strong>Pick Up Window di Card:</strong> Keterangan Pick Up Start &amp; Pick Up End ditampilkan di card jadwal; nilai terakhir diingat saat Create Schedule berikutnya.</li>
                  <li><strong>Claim Atomik (Pickup):</strong> Endpoint <i>claim</i> aman untuk ~50 orang pickup bersamaan; hanya satu yang berhasil per jadwal, sisanya dapat pesan &quot;Sudah diambil oleh [nama]&quot;.</li>
                  <li><strong>Reopen &amp; Release Atomik:</strong> Hanya pemilik jadwal atau admin yang boleh Reopen/Release; endpoint terpisah dengan pengecekan di backend.</li>
                  <li><strong>Docker &amp; Migrasi:</strong> Backend otomatis menjalankan migrasi DB setiap start; saat deploy ke server baru cukup <code>docker compose up -d</code> tanpa setup manual.</li>
                </ul>
              </div>

              <div className="border-l-4 border-indigo-500 pl-4 py-2">
                <p className="font-bold text-indigo-700 dark:text-indigo-300">v.1.2603.4 — Maret 2026</p>
                <ul className="mt-2 list-disc list-inside space-y-1">
                  <li><strong>Jobsheet ke PostgreSQL:</strong> Semua edit Jobsheet (Bulk/Inline) kini tersimpan di database Postgres (bukan localStorage).</li>
                  <li><strong>Optimasi Performa:</strong> Sinkron Jobsheet menggunakan <i>generate_series</i> dan <i>upsert</i> Postgres, dengan penyimpanan asinkron (UI terasa instan).</li>
                  <li><strong>Aturan Sinkron Board ↔ Jobsheet:</strong> Cell yang berasal dari Schedule Arrangement (Released) dikunci dan hanya bisa diubah dari Board.</li>
                  <li><strong>UI & UX:</strong> Header sticky, batch card lebih informatif (pickup & total poin), kartu jadwal lebih ringkas, dan perbaikan Dark Theme.</li>
                </ul>
              </div>

              <div className="border-l-4 border-indigo-500 pl-4 py-2">
                <p className="font-bold text-indigo-700 dark:text-indigo-300">v.1.2603.3 — Maret 2026</p>
                <ul className="mt-2 list-disc list-inside space-y-1">
                  <li><strong>Rebranding:</strong> Sistem berganti nama menjadi <strong>Power Management System</strong>.</li>
                  <li><strong>Modul baru Projects:</strong> Manajemen Proyek komprehensif dengan ±27 field detail (KPI, SLA Email, Handover, dll.).</li>
                  <li><strong>Modul baru Partners:</strong> Manajemen Klien/Hotel dengan ±25 field informasi.</li>
                  <li><strong>Validasi Primary Key:</strong> Perlindungan anti-duplikat pada ID Project dan ID Partner.</li>
                  <li><strong>Peningkatan Jobsheet:</strong> Fitur Drag-and-Drop selection untuk <i>Bulk Edit</i> dan kategori menu <i>Inline Edit</i> yang lebih presisi.</li>
                </ul>
              </div>

              <div className="border-l-4 border-blue-400 dark:border-blue-500 pl-4 py-2">
                <p className="font-bold text-blue-700 dark:text-blue-300">v.1.2603.2 — Maret 2026</p>
                <ul className="mt-2 list-disc list-inside space-y-1">
                  <li><strong>Pencegahan Bentrok:</strong> Validasi cerdas Overlap jadwal &amp; Cuti saat mem-pickup.</li>
                  <li><strong>Cuti &amp; Agenda terintegrasi:</strong> Cuti, Sakit, dan Izin muncul di Jobsheet.</li>
                  <li><strong>Export:</strong> Export Jobsheet ke Excel (.xlsx) dan PDF (layout landscape otomatis).</li>
                  <li><strong>Tab Analytics:</strong> Top Performer (Leaderboard), Chart Donut (Chart.js), dan Rekap Total Poin bulanan.</li>
                  <li><strong>Notifikasi:</strong> Lonceng notifikasi real-time untuk penugasan jadwal.</li>
                </ul>
              </div>

              <div className="border-l-4 border-gray-300 dark:border-slate-600 pl-4 py-2">
                <p className="font-bold text-gray-800 dark:text-slate-100">v.1.2603.1 — Maret 2026</p>
                <ul className="mt-2 list-disc list-inside space-y-1">
                  <li><strong>Board &amp; Jobsheet:</strong> Rilis awal Board + Grid Kalender Jobsheet interaktif.</li>
                  <li><strong>Public Holiday:</strong> Hari libur nasional di-highlight abu-abu di kalender.</li>
                  <li><strong>Skip Sunday:</strong> Jadwal Duty (DT) otomatis melewatkan hari Minggu.</li>
                  <li><strong>Role &amp; Tier:</strong> Sistem poin otomatis berdasarkan New Born, Tier 1, Tier 2, dan Tier 3.</li>
                </ul>
              </div>
            </div>
            <div className="mt-6">
              <button type="button" onClick={() => setModals((m) => ({ ...m, versionHistory: false }))} className="btn-primary text-white font-bold py-2 px-4 rounded-lg">Tutup</button>
            </div>
          </div>
        </div>
      )}

      {/* Manage Holidays Modal */}
      {modals.manageHolidays && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 modal-overlay" onClick={() => setModals((m) => ({ ...m, manageHolidays: false }))}>
          <div className="modal-content modal-xl bg-white dark:bg-slate-800 max-h-[80vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-2xl font-bold text-gray-800 dark:text-slate-200 mb-4">Public Holidays</h2>
            <div className="flex flex-wrap gap-2 mb-4">
              <input type="date" className="input-style input-sm" value={holidayForm.date} onChange={(e) => setHolidayForm((f) => ({ ...f, date: e.target.value }))} />
              <input type="text" className="input-style input-sm flex-1 min-w-[120px]" placeholder="Nama libur (contoh: Tahun Baru)" value={holidayForm.desc} onChange={(e) => setHolidayForm((f) => ({ ...f, desc: e.target.value }))} />
              <button type="button" className="btn-primary text-white font-bold py-2 px-4 rounded-lg" onClick={() => { if (holidayForm.date && holidayForm.desc) { addHoliday({ date: holidayForm.date, desc: holidayForm.desc }); setHolidayForm({ date: "", desc: "" }); showToast("Hari libur ditambah"); } }}>Tambah</button>
            </div>
            <ul className="space-y-2 mb-4">
              {holidays.length === 0 && <li className="text-gray-500 dark:text-slate-400 text-sm">Belum ada data hari libur.</li>}
              {holidays.map((h) => (
                <li key={h.id} className="flex items-center justify-between gap-2 bg-gray-50 dark:bg-slate-700/50 rounded-lg px-3 py-2">
                  <span className="font-medium">{h.date} — {h.desc}</span>
                  <button type="button" className="text-sm bg-red-500 hover:bg-red-600 text-white px-2 py-1 rounded" onClick={() => { removeHoliday(h.id); showToast("Hari libur dihapus"); }}>Hapus</button>
                </li>
              ))}
            </ul>
            <button type="button" onClick={() => setModals((m) => ({ ...m, manageHolidays: false }))} className="bg-gray-300 dark:bg-slate-600 text-gray-800 dark:text-slate-200 font-bold py-2 px-4 rounded-lg">Tutup</button>
          </div>
        </div>
      )}

      {/* Project Modal (Create/Edit) */}
      {modals.project && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 modal-overlay">
          <div className="modal-content modal-xl bg-white dark:bg-slate-800 max-h-[90vh] overflow-y-auto">
            <h2 className="text-2xl font-bold text-gray-800 dark:text-slate-200 mb-4">{editingProjectId ? "Edit Project" : "Tambah Project"}</h2>
            <form className="space-y-6" onSubmit={handleSaveProject}>
              {/* General Information */}
              <div>
                <h3 className="font-bold text-sm text-indigo-600 dark:text-indigo-400 mb-3 uppercase tracking-wider">General Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-700 dark:text-slate-300 mb-1">ID (Primary Key)</label>
                    <input
                      type="text"
                      value={projectForm.id ?? ""}
                      onChange={(e) => setProjectForm((f) => ({ ...f, id: e.target.value }))}
                      required
                      className="w-full input-style"
                      placeholder="e.g. PRJ-001"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-700 dark:text-slate-300 mb-1">CNC Project ID</label>
                    <input
                      type="text"
                      value={projectForm.cnc_id ?? ""}
                      onChange={(e) => setProjectForm((f) => ({ ...f, cnc_id: e.target.value }))}
                      className="w-full input-style"
                      placeholder="e.g. CNC-2026-01"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-700 dark:text-slate-300 mb-1">Hotel Name</label>
                    <input
                      type="text"
                      value={projectForm.hotel ?? ""}
                      onChange={(e) => setProjectForm((f) => ({ ...f, hotel: e.target.value }))}
                      required
                      className="w-full input-style"
                      placeholder="Nama Partner/Hotel"
                    />
                  </div>
                  <div className="lg:col-span-2">
                    <label className="block text-xs font-bold text-gray-700 dark:text-slate-300 mb-1">Project Name</label>
                    <input
                      type="text"
                      value={projectForm.name ?? ""}
                      onChange={(e) => setProjectForm((f) => ({ ...f, name: e.target.value }))}
                      required
                      className="w-full input-style"
                      placeholder="Judul project"
                    />
                  </div>
                  <div className="lg:col-span-3">
                    <label className="block text-xs font-bold text-gray-700 dark:text-slate-300 mb-1">Project Information</label>
                    <textarea
                      value={projectForm.info ?? ""}
                      onChange={(e) => setProjectForm((f) => ({ ...f, info: e.target.value }))}
                      rows={2}
                      className="w-full input-style text-sm"
                      placeholder="Detail tambahan..."
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-700 dark:text-slate-300 mb-1">Type</label>
                    <select
                      value={projectForm.type ?? "Implementation"}
                      onChange={(e) => setProjectForm((f) => ({ ...f, type: e.target.value }))}
                      className="w-full input-style"
                    >
                      <option value="Implementation">Implementation</option>
                      <option value="Upgrade">Upgrade</option>
                      <option value="Maintenance">Maintenance</option>
                      <option value="Retraining">Retraining</option>
                      <option value="Remote Installation">Remote Installation</option>
                      <option value="On Line Training">On Line Training</option>
                      <option value="In House Training">In House Training</option>
                      <option value="Special Request">Special Request</option>
                      <option value="Others">Others</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-700 dark:text-slate-300 mb-1">Status</label>
                    <select
                      value={projectForm.status ?? "Planned"}
                      onChange={(e) => setProjectForm((f) => ({ ...f, status: e.target.value }))}
                      className="w-full input-style"
                    >
                      <option value="Planned">Planned</option>
                      <option value="In Progress">In Progress</option>
                      <option value="Pending">Pending</option>
                      <option value="Completed">Completed</option>
                      <option value="Canceled">Canceled</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Resource & Timeline */}
              <div>
                <h3 className="font-bold text-sm text-indigo-600 dark:text-indigo-400 mb-3 uppercase tracking-wider">Resource & Timeline</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-700 dark:text-slate-300 mb-1">PIC</label>
                    <input
                      type="text"
                      value={projectForm.pic ?? ""}
                      onChange={(e) => setProjectForm((f) => ({ ...f, pic: e.target.value }))}
                      className="w-full input-style"
                      placeholder="Person in Charge"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-700 dark:text-slate-300 mb-1">Req PIC</label>
                    <input
                      type="number"
                      value={projectForm.req_pic ?? ""}
                      onChange={(e) => setProjectForm((f) => ({ ...f, req_pic: e.target.value }))}
                      className="w-full input-style"
                      placeholder="Required PIC count"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-700 dark:text-slate-300 mb-1">Assignment</label>
                    <input
                      type="text"
                      value={projectForm.assignment ?? ""}
                      onChange={(e) => setProjectForm((f) => ({ ...f, assignment: e.target.value }))}
                      className="w-full input-style"
                      placeholder="Assignment details"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-700 dark:text-slate-300 mb-1">Start Date</label>
                    <input
                      type="date"
                      value={projectForm.start ?? ""}
                      onChange={(e) => setProjectForm((f) => ({ ...f, start: e.target.value }))}
                      className="w-full input-style"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-700 dark:text-slate-300 mb-1">End Date</label>
                    <input
                      type="date"
                      value={projectForm.end ?? ""}
                      onChange={(e) => setProjectForm((f) => ({ ...f, end: e.target.value }))}
                      className="w-full input-style"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-700 dark:text-slate-300 mb-1">Total Days</label>
                    <input
                      type="number"
                      value={projectForm.total_days ?? ""}
                      onChange={(e) => setProjectForm((f) => ({ ...f, total_days: e.target.value }))}
                      className="w-full input-style"
                      placeholder="Durasi (hari)"
                    />
                  </div>
                </div>
              </div>

              {/* KPI & Points */}
              <div>
                <h3 className="font-bold text-sm text-indigo-600 dark:text-indigo-400 mb-3 uppercase tracking-wider">KPI & Points</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-700 dark:text-slate-300 mb-1">Points Achieved</label>
                    <input
                      type="number"
                      value={projectForm.point_ach ?? ""}
                      onChange={(e) => setProjectForm((f) => ({ ...f, point_ach: e.target.value }))}
                      className="w-full input-style"
                      placeholder="Points Achieved"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-700 dark:text-slate-300 mb-1">Points Required</label>
                    <input
                      type="number"
                      value={projectForm.point_req ?? ""}
                      onChange={(e) => setProjectForm((f) => ({ ...f, point_req: e.target.value }))}
                      className="w-full input-style"
                      placeholder="Points Required"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-700 dark:text-slate-300 mb-1">% Point</label>
                    <input
                      type="text"
                      value={projectForm.pct_point ?? ""}
                      onChange={(e) => setProjectForm((f) => ({ ...f, pct_point: e.target.value }))}
                      className="w-full input-style"
                      placeholder="e.g. 80%"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-700 dark:text-slate-300 mb-1">KPI.2</label>
                    <input
                      type="text"
                      value={projectForm.kpi2 ?? ""}
                      onChange={(e) => setProjectForm((f) => ({ ...f, kpi2: e.target.value }))}
                      className="w-full input-style"
                      placeholder="KPI.2 metric"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-700 dark:text-slate-300 mb-1">KPI.2 Officer</label>
                    <input
                      type="text"
                      value={projectForm.kpi2_officer ?? ""}
                      onChange={(e) => setProjectForm((f) => ({ ...f, kpi2_officer: e.target.value }))}
                      className="w-full input-style"
                      placeholder="Assigned Officer"
                    />
                  </div>
                </div>
              </div>

              {/* Handover & Checking */}
              <div>
                <h3 className="font-bold text-sm text-indigo-600 dark:text-indigo-400 mb-3 uppercase tracking-wider">Handover & Checking</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-700 dark:text-slate-300 mb-1">Handover Report Date</label>
                    <input
                      type="date"
                      value={projectForm.handover_report ?? ""}
                      onChange={(e) => setProjectForm((f) => ({ ...f, handover_report: e.target.value }))}
                      className="w-full input-style"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-700 dark:text-slate-300 mb-1">Handover Days</label>
                    <input
                      type="number"
                      value={projectForm.handover_days ?? ""}
                      onChange={(e) => setProjectForm((f) => ({ ...f, handover_days: e.target.value }))}
                      className="w-full input-style"
                      placeholder="Days"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-700 dark:text-slate-300 mb-1">Check Report Date</label>
                    <input
                      type="date"
                      value={projectForm.check_report ?? ""}
                      onChange={(e) => setProjectForm((f) => ({ ...f, check_report: e.target.value }))}
                      className="w-full input-style"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-700 dark:text-slate-300 mb-1">Check Days</label>
                    <input
                      type="number"
                      value={projectForm.check_days ?? ""}
                      onChange={(e) => setProjectForm((f) => ({ ...f, check_days: e.target.value }))}
                      className="w-full input-style"
                      placeholder="Days"
                    />
                  </div>
                </div>
              </div>

              {/* SLA Email / Follow Up */}
              <div>
                <h3 className="font-bold text-sm text-indigo-600 dark:text-indigo-400 mb-3 uppercase tracking-wider">SLA Email / Follow Up</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-700 dark:text-slate-300 mb-1">S1 Email</label>
                    <input
                      type="number"
                      value={projectForm.s1_email ?? ""}
                      onChange={(e) => setProjectForm((f) => ({ ...f, s1_email: e.target.value }))}
                      className="w-full input-style"
                      placeholder="0"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-700 dark:text-slate-300 mb-1">S2 Email</label>
                    <input
                      type="text"
                      value={projectForm.s2_email ?? ""}
                      onChange={(e) => setProjectForm((f) => ({ ...f, s2_email: e.target.value }))}
                      className="w-full input-style"
                      placeholder="Sent details"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-700 dark:text-slate-300 mb-1">S3 Email</label>
                    <input
                      type="text"
                      value={projectForm.s3_email ?? ""}
                      onChange={(e) => setProjectForm((f) => ({ ...f, s3_email: e.target.value }))}
                      className="w-full input-style"
                      placeholder="Sent details"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-700 dark:text-slate-300 mb-1">S1 Estimation</label>
                    <input
                      type="text"
                      value={projectForm.s1_est ?? ""}
                      onChange={(e) => setProjectForm((f) => ({ ...f, s1_est: e.target.value }))}
                      className="w-full input-style"
                      placeholder="Estimation"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-700 dark:text-slate-300 mb-1">S1 Over (days)</label>
                    <input
                      type="number"
                      value={projectForm.s1_over ?? ""}
                      onChange={(e) => setProjectForm((f) => ({ ...f, s1_over: e.target.value }))}
                      className="w-full input-style"
                      placeholder="Over days"
                    />
                  </div>
                </div>
              </div>

              <div className="flex gap-2 mt-4 pt-2 border-t border-gray-200 dark:border-slate-700">
                <button type="submit" className="flex-1 btn-primary text-white font-bold py-2 px-4 rounded-lg">Simpan</button>
                <button type="button" onClick={() => setModals((m) => ({ ...m, project: false }))} className="flex-1 bg-gray-300 dark:bg-slate-600 text-gray-800 dark:text-slate-200 font-bold py-2 px-4 rounded-lg">Batal</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Partner Modal (Create/Edit) */}
      {modals.partner && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 modal-overlay">
          <div className="modal-content modal-xl bg-white dark:bg-slate-800 max-h-[90vh] overflow-y-auto">
            <h2 className="text-2xl font-bold text-gray-800 dark:text-slate-200 mb-4">{editingPartnerId ? "Edit Partner" : "Tambah Partner"}</h2>
            <form className="space-y-4" onSubmit={handleSavePartner}>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {/* Basic Info */}
                <div>
                  <label className="block text-xs font-bold text-gray-700 dark:text-slate-300 mb-1">ID (Primary Key)</label>
                  <input
                    type="text"
                    value={partnerForm.id ?? ""}
                    onChange={(e) => setPartnerForm((f) => ({ ...f, id: e.target.value }))}
                    required
                    className="w-full input-style"
                    placeholder="e.g. P-001"
                  />
                </div>
                <div className="lg:col-span-2">
                  <label className="block text-xs font-bold text-gray-700 dark:text-slate-300 mb-1">Name</label>
                  <input
                    type="text"
                    value={partnerForm.name ?? ""}
                    onChange={(e) => setPartnerForm((f) => ({ ...f, name: e.target.value }))}
                    required
                    className="w-full input-style"
                    placeholder="Partner Name"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 dark:text-slate-300 mb-1">Type</label>
                  <select
                    value={partnerForm.type ?? "Hotel"}
                    onChange={(e) => setPartnerForm((f) => ({ ...f, type: e.target.value }))}
                    className="w-full input-style"
                  >
                    <option value="Hotel">Hotel</option>
                    <option value="Villa">Villa</option>
                    <option value="Restaurant">Restaurant</option>
                    <option value="Convention">Convention</option>
                    <option value="Education">Education</option>
                    <option value="Head Quarter">Head Quarter</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 dark:text-slate-300 mb-1">Star</label>
                  <select
                    value={partnerForm.star ?? "4"}
                    onChange={(e) => setPartnerForm((f) => ({ ...f, star: e.target.value }))}
                    className="w-full input-style"
                  >
                    <option value="1">1 Star</option>
                    <option value="2">2 Star</option>
                    <option value="3">3 Star</option>
                    <option value="4">4 Star</option>
                    <option value="5">5 Star</option>
                    <option value="Unrated">Unrated</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 dark:text-slate-300 mb-1">Group</label>
                  <input
                    type="text"
                    value={partnerForm.group ?? ""}
                    onChange={(e) => setPartnerForm((f) => ({ ...f, group: e.target.value }))}
                    className="w-full input-style"
                    placeholder="Management Group"
                  />
                </div>

                {/* Capacities & System */}
                <div>
                  <label className="block text-xs font-bold text-gray-700 dark:text-slate-300 mb-1">Room</label>
                  <input
                    type="number"
                    value={partnerForm.room ?? ""}
                    onChange={(e) => setPartnerForm((f) => ({ ...f, room: e.target.value }))}
                    className="w-full input-style"
                    placeholder="Number of Rooms"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 dark:text-slate-300 mb-1">Outlet</label>
                  <input
                    type="number"
                    value={partnerForm.outlet ?? ""}
                    onChange={(e) => setPartnerForm((f) => ({ ...f, outlet: e.target.value }))}
                    className="w-full input-style"
                    placeholder="Number of Outlets"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 dark:text-slate-300 mb-1">Status</label>
                  <select
                    value={partnerForm.status ?? "Active"}
                    onChange={(e) => setPartnerForm((f) => ({ ...f, status: e.target.value }))}
                    className="w-full input-style"
                  >
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive</option>
                    <option value="Suspended">Suspended</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 dark:text-slate-300 mb-1">System Live</label>
                  <input
                    type="date"
                    value={partnerForm.system_live ?? ""}
                    onChange={(e) => setPartnerForm((f) => ({ ...f, system_live: e.target.value }))}
                    className="w-full input-style"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 dark:text-slate-300 mb-1">System Version</label>
                  <select
                    value={partnerForm.system_version ?? "Cloud"}
                    onChange={(e) => setPartnerForm((f) => ({ ...f, system_version: e.target.value }))}
                    className="w-full input-style"
                  >
                    <option value="Cloud">Cloud</option>
                    <option value="Desktop">Desktop</option>
                    <option value="Lite">Lite</option>
                    <option value="Express">Express</option>
                    <option value="ECOS">ECOS</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 dark:text-slate-300 mb-1">Implementation Type</label>
                  <select
                    value={partnerForm.implementation_type ?? "Cloud"}
                    onChange={(e) => setPartnerForm((f) => ({ ...f, implementation_type: e.target.value }))}
                    className="w-full input-style"
                  >
                    <option value="Cloud">Cloud</option>
                    <option value="On-Premise">On-Premise</option>
                    <option value="Hybrid">Hybrid</option>
                  </select>
                </div>

                {/* Location */}
                <div className="lg:col-span-3">
                  <label className="block text-xs font-bold text-gray-700 dark:text-slate-300 mb-1">Address</label>
                  <textarea
                    rows={2}
                    value={partnerForm.address ?? ""}
                    onChange={(e) => setPartnerForm((f) => ({ ...f, address: e.target.value }))}
                    className="w-full input-style text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 dark:text-slate-300 mb-1">Area</label>
                  <input
                    type="text"
                    value={partnerForm.area ?? ""}
                    onChange={(e) => setPartnerForm((f) => ({ ...f, area: e.target.value }))}
                    className="w-full input-style"
                    placeholder="City/Region"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 dark:text-slate-300 mb-1">Sub Area</label>
                  <input
                    type="text"
                    value={partnerForm.sub_area ?? ""}
                    onChange={(e) => setPartnerForm((f) => ({ ...f, sub_area: e.target.value }))}
                    className="w-full input-style"
                    placeholder="District"
                  />
                </div>

                {/* Activities */}
                <div>
                  <label className="block text-xs font-bold text-gray-700 dark:text-slate-300 mb-1">Last Visit</label>
                  <input
                    type="date"
                    value={partnerForm.last_visit ?? ""}
                    onChange={(e) => setPartnerForm((f) => ({ ...f, last_visit: e.target.value }))}
                    className="w-full input-style"
                  />
                </div>
                <div className="lg:col-span-2">
                  <label className="block text-xs font-bold text-gray-700 dark:text-slate-300 mb-1">Last Visit Type</label>
                  <select
                    value={partnerForm.last_visit_type ?? "Implementation"}
                    onChange={(e) => setPartnerForm((f) => ({ ...f, last_visit_type: e.target.value }))}
                    className="w-full input-style"
                  >
                    <option value="Implementation">Implementation</option>
                    <option value="Upgrade">Upgrade</option>
                    <option value="Maintenance">Maintenance</option>
                    <option value="Retraining">Retraining</option>
                    <option value="Others">Others</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 dark:text-slate-300 mb-1">Last Project</label>
                  <input
                    type="date"
                    value={partnerForm.last_project ?? ""}
                    onChange={(e) => setPartnerForm((f) => ({ ...f, last_project: e.target.value }))}
                    className="w-full input-style"
                  />
                </div>
                <div className="lg:col-span-2">
                  <label className="block text-xs font-bold text-gray-700 dark:text-slate-300 mb-1">Last Project Type</label>
                  <select
                    value={partnerForm.last_project_type ?? "Implementation"}
                    onChange={(e) => setPartnerForm((f) => ({ ...f, last_project_type: e.target.value }))}
                    className="w-full input-style"
                  >
                    <option value="Implementation">Implementation</option>
                    <option value="Upgrade">Upgrade</option>
                    <option value="Maintenance">Maintenance</option>
                    <option value="Retraining">Retraining</option>
                    <option value="Remote Installation">Remote Installation</option>
                    <option value="On Line Training">On Line Training</option>
                    <option value="In House Training">In House Training</option>
                    <option value="Special Request">Special Request</option>
                    <option value="Others">Others</option>
                  </select>
                </div>

                {/* Contacts */}
                <div>
                  <label className="block text-xs font-bold text-gray-700 dark:text-slate-300 mb-1">Subm. Salutation</label>
                  <select
                    value={partnerForm.submission_salutation ?? "Mr."}
                    onChange={(e) => setPartnerForm((f) => ({ ...f, submission_salutation: e.target.value }))}
                    className="w-full input-style"
                  >
                    <option value="Mr.">Mr.</option>
                    <option value="Mrs.">Mrs.</option>
                    <option value="Ms.">Ms.</option>
                    <option value="Bpk.">Bpk.</option>
                    <option value="Ibu">Ibu</option>
                  </select>
                </div>
                <div className="lg:col-span-2">
                  <label className="block text-xs font-bold text-gray-700 dark:text-slate-300 mb-1">Submission Name</label>
                  <input
                    type="text"
                    value={partnerForm.submission_name ?? ""}
                    onChange={(e) => setPartnerForm((f) => ({ ...f, submission_name: e.target.value }))}
                    className="w-full input-style"
                    placeholder="Contact Person Name"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 dark:text-slate-300 mb-1">GM Email</label>
                  <input
                    type="email"
                    value={partnerForm.gm_email ?? ""}
                    onChange={(e) => setPartnerForm((f) => ({ ...f, gm_email: e.target.value }))}
                    className="w-full input-style"
                    placeholder="gm@..."
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 dark:text-slate-300 mb-1">FC / CA Email</label>
                  <input
                    type="email"
                    value={partnerForm.fc_email ?? ""}
                    onChange={(e) => setPartnerForm((f) => ({ ...f, fc_email: e.target.value }))}
                    className="w-full input-style"
                    placeholder="fc@..."
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 dark:text-slate-300 mb-1">IT Email</label>
                  <input
                    type="email"
                    value={partnerForm.it_email ?? ""}
                    onChange={(e) => setPartnerForm((f) => ({ ...f, it_email: e.target.value }))}
                    className="w-full input-style"
                    placeholder="it@..."
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 dark:text-slate-300 mb-1">HRD Email</label>
                  <input
                    type="email"
                    value={partnerForm.hrd_email ?? ""}
                    onChange={(e) => setPartnerForm((f) => ({ ...f, hrd_email: e.target.value }))}
                    className="w-full input-style"
                    placeholder="hrd@..."
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 dark:text-slate-300 mb-1">Allowance Maint.</label>
                  <input
                    type="number"
                    value={partnerForm.allowance_maintenance ?? ""}
                    onChange={(e) => setPartnerForm((f) => ({ ...f, allowance_maintenance: e.target.value }))}
                    className="w-full input-style"
                    placeholder="0"
                  />
                </div>
              </div>

              <div className="flex gap-3 mt-6 pt-4 border-t border-gray-200 dark:border-slate-700">
                <button type="submit" className="flex-1 btn-primary text-white font-bold py-2 px-4 rounded-lg">Simpan</button>
                <button type="button" onClick={() => setModals((m) => ({ ...m, partner: false }))} className="flex-1 bg-gray-300 dark:bg-slate-600 text-gray-800 dark:text-slate-200 font-bold py-2 px-4 rounded-lg">Batal</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Bulk Edit Modal (Jobsheet) */}
      {bulkEdit.open && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[100] modal-overlay">
          <div className="modal-content bg-white dark:bg-slate-800">
            <h2 className="text-xl font-bold text-gray-800 dark:text-white mb-2">Edit Rentang Jadwal</h2>
            <p className="text-sm text-blue-600 dark:text-blue-400 font-medium mb-6 bg-blue-50 dark:bg-slate-800 p-2 rounded">
              {bulkEdit.username} — {bulkEdit.dates.length} tanggal dipilih
            </p>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Pilih Tugas / Agenda</label>
                <select value={bulkEditValue} onChange={(e) => setBulkEditValue(e.target.value)} className="w-full input-style">
                  <option value="">- Pilih Tipe -</option>
                  <option value="clear" className="text-red-600 font-bold">🗑️ Clear / Kosongkan Area Terpilih</option>
                  <optgroup label="Shift">
                    <option value="sched_Day">Day (D)</option>
                    <option value="sched_Middle">Middle (MD)</option>
                    <option value="sched_Duty">Duty (DT)</option>
                  </optgroup>
                  <optgroup label="Agenda at Partner">
                    <option value="agd_I.TLK">Impl. TLK (I.TLK)</option>
                    <option value="agd_I.TCK">Impl. TCK (I.TCK)</option>
                    <option value="agd_I.TLD">Impl. TLD (I.TLD)</option>
                    <option value="agd_I.TLN">Impl. TLN (I.TLN)</option>
                    <option value="agd_M.TLK">Maint. TLK (M.TLK)</option>
                    <option value="agd_M.TCK">Maint. TCK (M.TCK)</option>
                    <option value="agd_M.TLD">Maint. TLD (M.TLD)</option>
                    <option value="agd_M.TLN">Maint. TLN (M.TLN)</option>
                  </optgroup>
                  <optgroup label="Agenda at Office">
                    <option value="agd_MS">Maint. Seamless (MS)</option>
                    <option value="agd_OKR">Team OKR (OKR)</option>
                    <option value="agd_TM">Team Ticket Master (TM)</option>
                  </optgroup>
                  <optgroup label="Absensi">
                    <option value="agd_C">Cuti (C)</option>
                    <option value="agd_I">Izin (I)</option>
                    <option value="agd_S">Sakit (S)</option>
                  </optgroup>
                </select>
              </div>
              <div className="flex gap-2 mt-6">
                <button
                  type="button"
                  disabled={!bulkEditValue || bulkSaving}
                  className="flex-1 btn-primary text-white font-bold py-2 px-4 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
                  onClick={async () => {
                    if (!bulkEditValue) return;
                    setBulkSaving(true);
                    // Close immediately for snappy UX; grid updates optimistically in store.
                    const editableDates = bulkEdit.dates.filter((d) => !isLockedByScheduleArrangement(bulkEdit.username, d));
                    if (editableDates.length === 0) {
                      showToast("Tidak ada cell yang bisa diupdate. Jadwal berasal dari Schedule Arrangement.");
                      setBulkSaving(false);
                      return;
                    }
                    const snapshot = { ...bulkEdit, dates: editableDates, value: bulkEditValue };
                    setBulkEdit({ open: false, username: "", dates: [] });
                    setBulkEditValue("");
                    try {
                      showToast("Tersimpan di grid. Sinkron ke database...");
                      // Fire-and-forget sync (don't block UI)
                      void bulkSetJobsheetOverrides({ username: snapshot.username, dates: snapshot.dates, value: snapshot.value, period_id: selectedPeriodId ?? undefined })
                        .then(() => {
                          showToast("Sinkron database berhasil");
                        })
                        .catch(() => {
                          showToast("Gagal sinkron ke database. Coba lagi atau cek backend.");
                          if (selectedPeriodId) refreshJobsheetOverrides({ period_id: selectedPeriodId }).catch(() => {});
                        });
                    } catch (e) {
                      showToast("Gagal simpan ke database. Pastikan backend Laravel sedang berjalan.");
                      if (selectedPeriodId) refreshJobsheetOverrides({ period_id: selectedPeriodId }).catch(() => {});
                    } finally {
                      setBulkSaving(false);
                    }
                  }}
                >
                  {bulkSaving ? "Menyimpan..." : "Apply ke Semua"}
                </button>
                <button
                  type="button"
                  className="flex-1 bg-gray-300 dark:bg-slate-600 text-gray-800 dark:text-slate-200 font-bold py-2 px-4 rounded-lg hover:bg-gray-400 dark:hover:bg-slate-500"
                  disabled={bulkSaving}
                  onClick={() => {
                    setBulkEdit({ open: false, username: "", dates: [] });
                    setBulkEditValue("");
                  }}
                >
                  Batal
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {toast && (
        <div className="fixed bottom-5 right-5 bg-white dark:bg-slate-800 px-4 py-3 rounded-lg shadow-lg border border-gray-200 dark:border-slate-600 z-50 max-w-md toast whitespace-pre-line">
          {toast}
        </div>
      )}
    </div>
  );
}
