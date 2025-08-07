import React from 'react';
import { Spinner } from '@/components/ui/spinner';

export function LoadingPage({ message = "Loading..." }) {
  return (
    <div className="w-full h-full flex items-center justify-center">
      <div className="text-center">
        <Spinner size="large" className="mb-4" />
        <p className="text-muted-foreground">{message}</p>
      </div>
    </div>
  );
}

export function LoadingCard({ className = "" }) {
  return (
    <div className={`animate-pulse ${className}`}>
      <div className="bg-muted rounded-lg p-6">
        <div className="h-4 bg-muted-foreground/20 rounded w-3/4 mb-3"></div>
        <div className="space-y-2">
          <div className="h-3 bg-muted-foreground/20 rounded"></div>
          <div className="h-3 bg-muted-foreground/20 rounded w-5/6"></div>
        </div>
      </div>
    </div>
  );
}

export function LoadingSkeleton({ lines = 3, className = "" }) {
  return (
    <div className={`animate-pulse space-y-3 ${className}`}>
      {Array.from({ length: lines }).map((_, i) => (
        <div
          key={i}
          className="h-4 bg-muted-foreground/20 rounded"
          style={{ width: `${Math.random() * 40 + 60}%` }}
        />
      ))}
    </div>
  );
}
