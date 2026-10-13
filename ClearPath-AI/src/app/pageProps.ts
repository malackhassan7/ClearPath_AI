import type {
  Clearance,
  CreateApplicationArgs,
  DocumentRecord,
  NotificationItem,
  Project,
  Role,
  UploadDocumentArgs,
} from "@/types";

/** Props every page container receives from PageRouter. Data comes from TanStack Query. */
export interface PageProps {
  role: Role;
  projects: Project[];
  clearances: Clearance[];
  documents: DocumentRecord[];
  notifications: NotificationItem[];
  onMarkNotifications: (ids: string[] | "all", read: boolean) => void;
  onCreate: (p: Project) => void;
  onUpdateClearance: (id: string, status: Clearance["status"]) => void;
  onUpdateDocument: (id: string, patch: Partial<DocumentRecord>) => void;
  /** Resolve on success, reject with an ApiError so the page can show the message inline. */
  onUploadDocument: (a: UploadDocumentArgs) => Promise<void>;
  onDeleteDocument: (id: string) => Promise<void>;
  onCreateApplication: (a: CreateApplicationArgs) => Promise<string>;
  onToast: (message: string) => void;
  onContrast: () => void;
  highContrast: boolean;
  onLogout: () => void;
  projectId?: string;
  editId?: string;
  section?: string;
}
