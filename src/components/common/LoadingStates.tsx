import { motion } from 'motion/react';
import { Loader2 } from 'lucide-react';

// Full page loading spinner
export function PageLoader() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-950">
      <div className="text-center">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
          className="mx-auto mb-4 h-12 w-12"
        >
          <Loader2 className="h-full w-full text-cyan-400" />
        </motion.div>
        <p className="text-white/60 text-sm">Loading...</p>
      </div>
    </div>
  );
}

// Inline spinner
export function Spinner({ size = 'md', className = '' }: { size?: 'sm' | 'md' | 'lg', className?: string }) {
  const sizes = {
    sm: 'h-4 w-4',
    md: 'h-6 w-6',
    lg: 'h-8 w-8',
  };

  return (
    <motion.div
      animate={{ rotate: 360 }}
      transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
      className={`${sizes[size]} ${className}`}
    >
      <Loader2 className="h-full w-full text-cyan-400" />
    </motion.div>
  );
}

// Button loading state
export function ButtonSpinner() {
  return (
    <motion.div
      animate={{ rotate: 360 }}
      transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
      className="h-4 w-4"
    >
      <Loader2 className="h-full w-full" />
    </motion.div>
  );
}

// Skeleton loader for text
export function SkeletonText({ className = '' }: { className?: string }) {
  return (
    <div className={`animate-pulse bg-slate-800 rounded ${className || 'h-4 w-32'}`} />
  );
}

// Skeleton loader for cards
export function SkeletonCard() {
  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4 animate-pulse">
      <div className="space-y-3">
        <div className="h-4 bg-slate-800 rounded w-3/4" />
        <div className="h-8 bg-slate-800 rounded w-1/2" />
        <div className="h-3 bg-slate-800 rounded w-full" />
      </div>
    </div>
  );
}

// Skeleton loader for dashboard KPI cards
export function SkeletonKPI() {
  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4 animate-pulse">
      <div className="space-y-3">
        <div className="h-3 bg-slate-800 rounded w-32" />
        <div className="flex items-end justify-between">
          <div className="h-8 bg-slate-800 rounded w-24" />
          <div className="h-4 bg-slate-800 rounded w-16" />
        </div>
        <div className="h-3 bg-slate-800 rounded w-full" />
      </div>
    </div>
  );
}

// Skeleton loader for table rows
export function SkeletonTable({ rows = 5 }: { rows?: number }) {
  return (
    <div className="space-y-2">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex gap-4 p-3 bg-slate-900/60 rounded-lg animate-pulse">
          <div className="h-4 bg-slate-800 rounded w-1/4" />
          <div className="h-4 bg-slate-800 rounded w-1/3" />
          <div className="h-4 bg-slate-800 rounded w-1/5" />
          <div className="h-4 bg-slate-800 rounded w-1/6" />
        </div>
      ))}
    </div>
  );
}

// Skeleton loader for asset list
export function SkeletonAssetList({ count = 3 }: { count?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="rounded-xl border border-slate-800 bg-slate-900/60 p-4 animate-pulse">
          <div className="flex items-start justify-between">
            <div className="flex-1 space-y-2">
              <div className="h-5 bg-slate-800 rounded w-3/4" />
              <div className="h-3 bg-slate-800 rounded w-full" />
              <div className="flex gap-2">
                <div className="h-3 bg-slate-800 rounded w-20" />
                <div className="h-3 bg-slate-800 rounded w-24" />
              </div>
            </div>
            <div className="h-6 bg-slate-800 rounded w-20" />
          </div>
        </div>
      ))}
    </div>
  );
}

// Skeleton loader for charts
export function SkeletonChart({ height = '200px' }: { height?: string }) {
  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
      <div className="space-y-3">
        <div className="h-4 bg-slate-800 rounded w-48 mb-4" />
        <div className="animate-pulse bg-slate-800/50 rounded-lg" style={{ height }} />
      </div>
    </div>
  );
}

// Loading overlay (for forms and sections)
export function LoadingOverlay({ message = 'Loading...' }: { message?: string }) {
  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center backdrop-blur-sm bg-slate-950/80 rounded-2xl">
      <div className="text-center">
        <Spinner size="lg" className="mx-auto mb-3" />
        <p className="text-white/60 text-sm">{message}</p>
      </div>
    </div>
  );
}

// Pulsing dot for live updates
export function LiveIndicator() {
  return (
    <span className="relative flex h-2 w-2">
      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75" />
      <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-500" />
    </span>
  );
}

// Progress bar
export function ProgressBar({ progress, className = '' }: { progress: number, className?: string }) {
  return (
    <div className={`h-2 bg-slate-800 rounded-full overflow-hidden ${className}`}>
      <motion.div
        initial={{ width: 0 }}
        animate={{ width: `${progress}%` }}
        transition={{ duration: 0.5 }}
        className="h-full bg-gradient-to-r from-cyan-500 to-purple-500"
      />
    </div>
  );
}

// Shimmer effect for skeleton loaders
export function ShimmerEffect() {
  return (
    <div className="absolute inset-0 -translate-x-full animate-[shimmer_2s_infinite]">
      <div className="h-full w-full bg-gradient-to-r from-transparent via-white/5 to-transparent" />
    </div>
  );
}

// Add shimmer animation to global styles if needed
export const shimmerStyles = `
  @keyframes shimmer {
    100% {
      transform: translateX(100%);
    }
  }
`;
