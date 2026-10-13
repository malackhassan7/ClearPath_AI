import type {
  AuditEvent,
  Clearance,
  DocumentRecord,
  NotificationItem,
  Project,
  RuleSource,
  User,
} from "@/types";
import {
  seedAudit,
  seedClearances,
  seedDocuments,
  seedNotifications,
  seedProjects,
  seedRules,
  seedUsers,
} from "./seed";

interface Db {
  projects: Project[];
  clearances: Clearance[];
  documents: DocumentRecord[];
  notifications: NotificationItem[];
  rules: RuleSource[];
  users: User[];
  audit: AuditEvent[];
}
const KEY = "cp-mock-db-v1";
const fresh = (): Db => ({
  projects: seedProjects(),
  clearances: seedClearances(),
  documents: seedDocuments(),
  notifications: seedNotifications(),
  rules: seedRules(),
  users: seedUsers(),
  audit: seedAudit(),
});

function load(): Db {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) return JSON.parse(raw) as Db;
  } catch {
    /* ignore corrupt storage */
  }
  return fresh();
}
let db: Db = load();
export const mockDb = {
  get: (): Db => db,
  save: (): void => {
    try {
      localStorage.setItem(KEY, JSON.stringify(db));
    } catch {
      /* storage unavailable */
    }
  },
  reset: (): void => {
    db = fresh();
    mockDb.save();
  },
};
