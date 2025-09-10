import dynamic from 'next/dynamic';
import { ComponentType } from 'react';

// Lazy load heavy components
export const DynamicChart = dynamic(
  () => import('@/components/analytics/Chart'),
  { 
    ssr: false,
    loading: () => <div className="animate-pulse bg-gray-200 h-64 rounded" />
  }
);

export const DynamicMap = dynamic(
  () => import('@/components/map/JobMap'),
  { 
    ssr: false,
    loading: () => <div className="animate-pulse bg-gray-200 h-96 rounded" />
  }
);

export const DynamicEditor = dynamic(
  () => import('@/components/editor/RichTextEditor'),
  { 
    ssr: false,
    loading: () => <div className="animate-pulse bg-gray-200 h-48 rounded" />
  }
);

export const DynamicCalendar = dynamic(
  () => import('@/components/calendar/Calendar'),
  { 
    ssr: false,
    loading: () => <div className="animate-pulse bg-gray-200 h-64 rounded" />
  }
);

export const DynamicImageUpload = dynamic(
  () => import('@/components/upload/ImageUpload'),
  { 
    ssr: false,
    loading: () => <div className="animate-pulse bg-gray-200 h-32 rounded" />
  }
);

// Utility function to create dynamic imports with loading state
export function createDynamicComponent<P = {}>(
  importFn: () => Promise<{ default: ComponentType<P> }>,
  options?: {
    ssr?: boolean;
    loadingComponent?: ComponentType;
  }
) {
  return dynamic(importFn, {
    ssr: options?.ssr ?? false,
    loading: options?.loadingComponent || (() => (
      <div className="flex items-center justify-center p-4">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    ))
  });
}

// Preload components for better performance
export const preloadComponent = (
  importFn: () => Promise<any>
) => {
  if (typeof window !== 'undefined') {
    // Start loading the component but don't wait for it
    importFn().catch(err => {
      console.error('Failed to preload component:', err);
    });
  }
};

// Route-based code splitting helpers
export const routeModules = {
  jobs: () => import('@/modules/jobs'),
  profile: () => import('@/modules/profile'),
  admin: () => import('@/modules/admin'),
  payments: () => import('@/modules/payments'),
  chat: () => import('@/modules/chat'),
};

// Preload next route on hover
export const preloadRoute = (route: keyof typeof routeModules) => {
  if (routeModules[route]) {
    preloadComponent(routeModules[route]);
  }
};