import { Button } from "@/components/ui/button";
import { AlertCircle, RefreshCw } from "lucide-react";
import React from "react";

export function ErrorBoundary({ children }) {
  const [hasError, setHasError] = React.useState(false);
  const [error, setError] = React.useState(null);

  React.useEffect(() => {
    const handleError = (error) => {
      setHasError(true);
      setError(error);
    };

    window.addEventListener("error", handleError);
    window.addEventListener("unhandledrejection", handleError);

    return () => {
      window.removeEventListener("error", handleError);
      window.removeEventListener("unhandledrejection", handleError);
    };
  }, []);

  const resetError = () => {
    setHasError(false);
    setError(null);
  };

  if (hasError) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center p-8 max-w-md">
          <AlertCircle className="w-16 h-16 text-destructive mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-foreground mb-2">
            Something went wrong
          </h2>
          <p className="text-muted-foreground mb-6">
            {error?.message || "An unexpected error occurred"}
          </p>
          <Button onClick={resetError} className="gap-2">
            <RefreshCw className="w-4 h-4" />
            Try again
          </Button>
        </div>
      </div>
    );
  }

  return children;
}

export function ErrorMessage({ error, onRetry, className = "" }) {
  if (!error) return null;

  return (
    <div
      className={`bg-destructive/10 border border-destructive/20 rounded-lg p-4 ${className}`}
    >
      <div className="flex items-start gap-3">
        <AlertCircle className="w-5 h-5 text-destructive flex-shrink-0 mt-0.5" />
        <div className="flex-1">
          <p className="text-sm text-destructive font-medium">
            {error.message || "An error occurred"}
          </p>
          {onRetry && (
            <Button
              variant="outline"
              size="sm"
              onClick={onRetry}
              className="mt-2 h-8"
            >
              Try again
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
