import { AlertCircle, RefreshCw } from "lucide-react";

export function ErrorState({
  title = "We could not load this page",
  message,
  onRetry,
}: {
  title?: string;
  message?: string;
  onRetry?: () => void;
}) {
  return (
    <div className="empty-state" role="alert">
      <AlertCircle size={28} aria-hidden />
      <h3>{title}</h3>
      <p>{message ?? "Please check your connection and try again."}</p>
      {onRetry && (
        <button className="btn primary" onClick={onRetry}>
          <RefreshCw size={15} aria-hidden /> Retry
        </button>
      )}
    </div>
  );
}
