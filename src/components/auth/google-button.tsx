"use client";

import SmoothButton from "@/components/smoothui/smooth-button";

function GoogleMark() {
  return (
    <svg viewBox="0 0 24 24" className="size-4" aria-hidden>
      <path
        fill="#EA4335"
        d="M12 10.2v3.9h5.5c-.2 1.2-1.5 3.6-5.5 3.6-3.3 0-6-2.7-6-6s2.7-6 6-6c1.9 0 3.1.8 3.8 1.5l2.6-2.5C16.8 3 14.6 2 12 2 6.5 2 2 6.5 2 12s4.5 10 10 10c5.8 0 9.6-4.1 9.6-9.8 0-.7-.1-1.2-.2-1.7H12z"
      />
      <path fill="#FBBC05" d="M3.9 7.4l3.2 2.4C8 7.3 9.9 6.1 12 6.1c1.9 0 3.1.8 3.8 1.5l2.6-2.5C16.8 3 14.6 2 12 2 8.2 2 4.9 4.1 3.9 7.4z" />
      <path fill="#34A853" d="M12 22c2.5 0 4.7-.8 6.3-2.2l-2.9-2.3c-.8.6-1.9 1-3.4 1-4 0-5.3-2.4-5.5-3.6L3.8 16.6C4.8 19.8 8.1 22 12 22z" />
      <path fill="#4285F4" d="M21.6 12.2c0-.7-.1-1.2-.2-1.7H12v3.9h5.5c-.3 1.4-1.1 2.4-2.2 3.1l2.9 2.3c1.7-1.6 3.4-4.1 3.4-7.6z" />
    </svg>
  );
}

export function GoogleButton({
  onClick,
  loading,
  label = "Continue with Google",
}: {
  onClick: () => void;
  loading?: boolean;
  label?: string;
}) {
  return (
    <SmoothButton
      type="button"
      variant="outline"
      size="sm"
      className="w-full"
      disabled={loading}
      onClick={onClick}
    >
      <GoogleMark />
      {loading ? "Connecting to Google..." : label}
    </SmoothButton>
  );
}

export function AuthDivider({ label = "or use email" }: { label?: string }) {
  return (
    <div className="flex items-center gap-3 text-xs font-medium uppercase tracking-wide text-muted-foreground">
      <span className="h-px flex-1 bg-border" />
      {label}
      <span className="h-px flex-1 bg-border" />
    </div>
  );
}
