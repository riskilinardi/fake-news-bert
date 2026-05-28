interface Props {
  message: string;
  onDismiss?: () => void;
}

export function ErrorAlert({ message, onDismiss }: Props) {
  return (
    <div
      role="alert"
      className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800 flex items-start justify-between gap-3"
    >
      <p>{message}</p>
      {onDismiss && (
        <button
          type="button"
          onClick={onDismiss}
          className="text-red-600 hover:text-red-800 font-medium"
          aria-label="Dismiss error"
        >
          ×
        </button>
      )}
    </div>
  );
}
