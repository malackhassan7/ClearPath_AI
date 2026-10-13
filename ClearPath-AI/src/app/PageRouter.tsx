import { useNavigate } from "react-router-dom";
import {
  useClearances,
  useCreateApplication,
  useCreateProject,
  useDeleteDocument,
  useDocuments,
  useNotifications,
  useProjects,
  useSetNotificationsRead,
  useUpdateClearance,
  useUpdateDocument,
  useUploadDocument,
} from "@/api/hooks";
import { userMessage } from "@/api/client";
import { ErrorState } from "@/components/ui/ErrorState";
import { LoadingSkeleton } from "@/components/ui/LoadingSkeleton";
import type { PageProps } from "@/app/pageProps";
import type { Role } from "@/types";
import { Dashboard } from "@/features/dashboard/Dashboard";
import { ProjectsPage } from "@/features/projects/ProjectsPage";
import { ProjectWizard } from "@/features/projects/ProjectWizard";
import { ClearancesPage } from "@/features/clearances/ClearancesPage";
import { DocumentsPage } from "@/features/documents/DocumentsPage";
import { WorkflowPage } from "@/features/workflow/WorkflowPage";
import { BottlenecksPage } from "@/features/bottlenecks/BottlenecksPage";
import { ReportsPage } from "@/features/reports/ReportsPage";
import { ProjectDetail } from "@/features/projects/ProjectDetail";
import { NotificationsPage } from "@/features/notifications/NotificationsPage";
import { ClientsPage } from "@/features/clients/ClientsPage";
import { ReviewQueue } from "@/features/admin/ReviewQueue";
import { RulesPage } from "@/features/admin/RulesPage";
import { SourcesPage } from "@/features/admin/SourcesPage";
import { UsersPage } from "@/features/admin/UsersPage";
import { AuditPage } from "@/features/admin/AuditPage";
import { SettingsPage } from "@/features/settings/SettingsPage";
import { HelpPage } from "@/features/help/HelpPage";
import { ProjectActivityPage } from "@/features/projects/ProjectActivityPage";
import { ClearanceDetailPage, NotFoundPage } from "@/features/RouteDetailPages";
import { BrandComparison } from "@/features/brands/BrandComparison";
import { DistrictAnalyzer } from "@/features/districts/DistrictAnalyzer";
import { ChatbotPage } from "@/features/chatbot/ChatbotPage";
import { SchemesPage } from "@/features/schemes/SchemesPage";
import { GrievancePage } from "@/features/grievances/GrievancePage";
import { LandingPage } from "@/features/landing/LandingPage";

function renderRoute(props: PageProps & { path: string }): JSX.Element {
  const { path } = props;
  const route = path.split("/").filter(Boolean);
  if (path === "/dashboard" || path === "/") return <Dashboard {...props} />;
  if (path === "/projects") return <ProjectsPage {...props} />;
  if (path === "/projects/new") return <ProjectWizard {...props} />;
  if (route[0] === "projects" && route.length >= 2 && route[1] !== "new")
    return route[2] === "activity" ? (
      <ProjectActivityPage {...props} projectId={route[1]} />
    ) : route[2] === "summary" ? (
      <ProjectDetail {...props} projectId={route[1]} />
    ) : route[2] === "clearances" ? (
      <ClearancesPage {...props} projectId={route[1]} />
    ) : route[2] === "documents" ? (
      <DocumentsPage {...props} projectId={route[1]} />
    ) : route[2] === "workflow" ? (
      <WorkflowPage {...props} projectId={route[1]} />
    ) : route[2] === "bottlenecks" ? (
      <BottlenecksPage {...props} projectId={route[1]} />
    ) : route[2] === "reports" ? (
      <ReportsPage {...props} projectId={route[1]} />
    ) : route[2] === "edit" ? (
      <ProjectWizard {...props} editId={route[1]} />
    ) : (
      <ProjectDetail {...props} projectId={route[1]} />
    );
  if (path === "/brands") return <BrandComparison />;
  if (path === "/districts") return <DistrictAnalyzer />;
  if (path === "/chatbot") return <ChatbotPage />;
  if (path === "/schemes") return <SchemesPage />;
  if (path === "/grievances") return <GrievancePage />;
  if (path === "/landing") return <LandingPage />;
  if (path === "/clearances") return <ClearancesPage {...props} />;
  if (route[0] === "clearances" && route.length === 2)
    return <ClearanceDetailPage {...props} clearanceId={route[1]} />;
  if (path === "/documents") return <DocumentsPage {...props} />;
  if (route[0] === "documents" && route.length === 2)
    return <DocumentsPage {...props} documentId={route[1]} />;
  if (path === "/bottlenecks") return <BottlenecksPage {...props} />;
  if (path === "/workflow") return <WorkflowPage {...props} />;
  if (path === "/reports") return <ReportsPage {...props} />;
  if (path === "/notifications") return <NotificationsPage {...props} />;
  if (path === "/clients") return <ClientsPage {...props} />;
  if (route[0] === "clients" && route.length === 2)
    return <ClientsPage {...props} clientId={route[1]} />;
  if (path === "/admin/review-queue") return <ReviewQueue {...props} />;
  if (path === "/admin/rules" || (route[0] === "admin" && route[1] === "rules"))
    return <RulesPage {...props} />;
  if (path === "/admin/sources") return <SourcesPage />;
  if (path === "/admin/users") return <UsersPage {...props} />;
  if (path === "/admin/audit-logs") return <AuditPage {...props} />;
  if (route[0] === "settings")
    return <SettingsPage {...props} section={route[1] || "profile"} />;
  if (path === "/help") return <HelpPage />;
  return <NotFoundPage path={path} />;
}

interface RouterProps {
  path: string;
  role: Role;
  highContrast: boolean;
  onToast: (m: string) => void;
  onContrast: () => void;
  onLogout: () => void;
}
const NO_DATA = (path: string) =>
  path === "/help" ||
  path === "/admin/sources" ||
  path === "/brands" ||
  path === "/districts" ||
  path === "/chatbot" ||
  path === "/schemes" ||
  path === "/grievances" ||
  path === "/landing" ||
  path.startsWith("/settings");

/** Container: loads data with TanStack Query and renders loading / error states. */
export function PageRouter({
  path,
  role,
  highContrast,
  onToast,
  onContrast,
  onLogout,
}: RouterProps) {
  const navigate = useNavigate();
  const projects = useProjects();
  const clearances = useClearances();
  const documents = useDocuments();
  const notifications = useNotifications();
  const createProject = useCreateProject();
  const updateClearance = useUpdateClearance();
  const updateDocument = useUpdateDocument();
  const setRead = useSetNotificationsRead();
  const uploadDocument = useUploadDocument();
  const deleteDocument = useDeleteDocument();
  const createApplication = useCreateApplication();
  const queries = [projects, clearances, documents, notifications];
  // Only projects and clearances are essential; a failing documents/notifications feed degrades to empty.
  const failed = [projects, clearances].find((q) => q.isError);
  const pending = queries.some((q) => q.isPending);
  const base = {
    role,
    onToast,
    onContrast,
    highContrast,
    onLogout,
    projects: projects.data ?? [],
    clearances: clearances.data ?? [],
    documents: documents.data ?? [],
    notifications: notifications.data ?? [],
    onUploadDocument: async (
      a: Parameters<PageProps["onUploadDocument"]>[0],
    ) => {
      await uploadDocument.mutateAsync(a);
      onToast("Document uploaded");
    },
    onDeleteDocument: async (id: string) => {
      await deleteDocument.mutateAsync(id);
      onToast("Document removed");
    },
    onCreateApplication: async (
      a: Parameters<PageProps["onCreateApplication"]>[0],
    ) => (await createApplication.mutateAsync(a)).data.id,
    onMarkNotifications: (ids: string[] | "all", read: boolean) =>
      setRead.mutate({ ids, read }),
    onCreate: (p: Parameters<PageProps["onCreate"]>[0]) =>
      createProject.mutate(p, {
        onSuccess: () => {
          onToast("Demo project created");
          navigate("/projects");
        },
        onError: (e) => onToast(userMessage(e)),
      }),
    onUpdateClearance: (
      id: string,
      status: Parameters<PageProps["onUpdateClearance"]>[1],
    ) =>
      updateClearance.mutate(
        { id, status },
        {
          onSuccess: () => onToast("Clearance status updated"),
          onError: (e) => onToast(userMessage(e)),
        },
      ),
    onUpdateDocument: (
      id: string,
      patch: Parameters<PageProps["onUpdateDocument"]>[1],
    ) =>
      updateDocument.mutate(
        { id, patch },
        {
          onSuccess: () => onToast("Document record updated"),
          onError: (e) => onToast(userMessage(e)),
        },
      ),
    path,
  };
  if (!NO_DATA(path)) {
    if (failed)
      return (
        <ErrorState
          message={userMessage(failed.error)}
          onRetry={() => queries.forEach((q) => void q.refetch())}
        />
      );
    if (pending) return <LoadingSkeleton />;
  }
  return renderRoute(base);
}
