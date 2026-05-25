import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Notifications from "expo-notifications";
import { Platform } from "react-native";

export type ReminderType = "meal" | "workout";

export type ReminderTime = {
  id: string;
  hour: number;
  minute: number;
  notificationId?: string;
};

export type ReminderSet = {
  enabled: boolean;
  times: ReminderTime[];
};

const STORAGE_PREFIX = "fitlife:reminder:";

const DEFAULT_TIMES: Record<ReminderType, { hour: number; minute: number }> = {
  meal: { hour: 12, minute: 30 },
  workout: { hour: 18, minute: 0 },
};

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
  }),
});

function storageKey(type: ReminderType) {
  return `${STORAGE_PREFIX}${type}`;
}

export function formatReminderTime(hour: number, minute: number) {
  const hh = String(Math.max(0, Math.min(23, hour))).padStart(2, "0");
  const mm = String(Math.max(0, Math.min(59, minute))).padStart(2, "0");
  return `${hh}:${mm}`;
}

function makeId() {
  return `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

function normalizeTime(hour: number, minute: number) {
  const h = Math.max(0, Math.min(23, Number.isFinite(hour) ? hour : 0));
  const m = Math.max(0, Math.min(59, Number.isFinite(minute) ? minute : 0));
  return { hour: h, minute: m };
}

function fallbackSet(type: ReminderType): ReminderSet {
  const fallback = DEFAULT_TIMES[type];
  return {
    enabled: false,
    times: [
      {
        id: makeId(),
        hour: fallback.hour,
        minute: fallback.minute,
      },
    ],
  };
}

export async function getReminderSet(type: ReminderType): Promise<ReminderSet> {
  const key = storageKey(type);
  const raw = await AsyncStorage.getItem(key);

  if (!raw) return fallbackSet(type);

  try {
    const parsed = JSON.parse(raw) as any;

    if (Array.isArray(parsed?.times)) {
      const times: ReminderTime[] = parsed.times.map((t: any) => {
        const norm = normalizeTime(t?.hour, t?.minute);
        return {
          id: typeof t?.id === "string" ? t.id : makeId(),
          hour: norm.hour,
          minute: norm.minute,
          notificationId: t?.notificationId,
        };
      });

      return {
        enabled: Boolean(parsed?.enabled),
        times: times.length ? times : fallbackSet(type).times,
      };
    }

    const fallback = DEFAULT_TIMES[type];
    const legacy = normalizeTime(parsed?.hour, parsed?.minute);
    return {
      enabled: Boolean(parsed?.enabled),
      times: [
        {
          id: makeId(),
          hour: Number.isFinite(legacy.hour) ? legacy.hour : fallback.hour,
          minute: Number.isFinite(legacy.minute) ? legacy.minute : fallback.minute,
          notificationId: parsed?.notificationId,
        },
      ],
    };
  } catch {
    return fallbackSet(type);
  }
}

async function ensurePermissions() {
  const current = await Notifications.getPermissionsAsync();
  if (current.status === "granted") return true;

  const requested = await Notifications.requestPermissionsAsync();
  return requested.status === "granted";
}

async function ensureChannel() {
  if (Platform.OS !== "android") return;
  await Notifications.setNotificationChannelAsync("fitlife-reminders", {
    name: "FitLife Reminders",
    importance: Notifications.AndroidImportance.DEFAULT,
  });
}

async function scheduleReminder(type: ReminderType, hour: number, minute: number) {
  const title = type === "meal" ? "Log your meal" : "Log your workout";
  const body =
    type === "meal"
      ? "Remember to log what you ate today."
      : "Time to log your workout and keep your streak going.";

  await ensureChannel();

  return Notifications.scheduleNotificationAsync({
    content: { title, body },
    trigger: { hour, minute, repeats: true, channelId: "fitlife-reminders" },
  });
}

export async function applyReminderSet(
  type: ReminderType,
  next: ReminderSet,
): Promise<ReminderSet> {
  const current = await getReminderSet(type);
  const times = next.times.length ? next.times : current.times;

  const merged: ReminderSet = {
    enabled: Boolean(next.enabled),
    times: times.map((t) => {
      const norm = normalizeTime(t.hour, t.minute);
      return {
        id: t.id || makeId(),
        hour: norm.hour,
        minute: norm.minute,
        notificationId: t.notificationId,
      };
    }),
  };

  if (merged.enabled) {
    const allowed = await ensurePermissions();
    if (!allowed) {
      throw new Error("Notifications permission denied.");
    }
  }

  for (const t of merged.times) {
    if (t.notificationId) {
      await Notifications.cancelScheduledNotificationAsync(t.notificationId);
      t.notificationId = undefined;
    }
  }

  if (merged.enabled) {
    for (const t of merged.times) {
      const id = await scheduleReminder(type, t.hour, t.minute);
      t.notificationId = id;
    }
  }

  await AsyncStorage.setItem(storageKey(type), JSON.stringify(merged));
  return merged;
}
