import React, { forwardRef } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const cardVariants = cva(
  // Premium Enterprise Card Design System
  "rounded-2xl transition-all duration-300 overflow-hidden transform-gpu",
  {
    variants: {
      variant: {
        // Premium Default with subtle animation
        default: "bg-white border border-gray-200 shadow-lg hover:shadow-2xl hover:-translate-y-1 hover:border-gray-300",
        
        // Interactive Premium Card
        interactive: "bg-white border border-gray-200 shadow-lg hover:shadow-2xl hover:shadow-orange-500/10 hover:border-orange-300 cursor-pointer hover:-translate-y-2 active:translate-y-0 active:shadow-lg group",
        
        // Elevated with floating effect
        elevated: "bg-white shadow-xl hover:shadow-2xl hover:-translate-y-2 border border-gray-100",
        
        // Success with glow
        success: "bg-gradient-to-br from-green-50 to-emerald-50 border border-green-200 shadow-lg hover:shadow-green-500/20 hover:shadow-xl",
        
        // Warning with pulse
        warning: "bg-gradient-to-br from-yellow-50 to-amber-50 border border-yellow-200 shadow-lg hover:shadow-yellow-500/20 hover:shadow-xl",
        
        // Error with attention
        error: "bg-gradient-to-br from-red-50 to-rose-50 border border-red-200 shadow-lg hover:shadow-red-500/20 hover:shadow-xl",
        
        // Info with depth
        info: "bg-gradient-to-br from-blue-50 to-sky-50 border border-blue-200 shadow-lg hover:shadow-blue-500/20 hover:shadow-xl",
        
        // Premium Gradient
        gradient: "bg-gradient-to-br from-orange-500 via-red-500 to-pink-500 text-white shadow-2xl hover:shadow-3xl hover:scale-[1.02] border-0",
        
        // Glass Morphism Premium
        glass: "bg-white/10 backdrop-blur-xl border border-white/20 shadow-glass hover:bg-white/20 hover:shadow-glass-lg",
        
        // Dark Luxury
        dark: "bg-gradient-to-br from-gray-900 to-gray-800 border border-gray-700 text-white shadow-xl hover:shadow-2xl hover:shadow-purple-500/10",
        
        // Premium with shimmer
        premium: "bg-gradient-to-br from-gray-50 via-white to-gray-50 border border-gray-200 shadow-xl hover:shadow-2xl relative before:absolute before:inset-0 before:bg-gradient-to-r before:from-transparent before:via-white/50 before:to-transparent before:-translate-x-full hover:before:translate-x-full before:transition-transform before:duration-1000"
      },
      padding: {
        none: "p-0",
        sm: "p-4",
        default: "p-6",
        lg: "p-8"
      },
      rounded: {
        none: "rounded-none",
        sm: "rounded-lg",
        default: "rounded-2xl",
        lg: "rounded-3xl",
        full: "rounded-full"
      }
    },
    defaultVariants: {
      variant: "default",
      padding: "default",
      rounded: "default"
    }
  }
);

export interface CardProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof cardVariants> {
  asChild?: boolean;
  loading?: boolean;
  disabled?: boolean;
}

const Card = forwardRef<HTMLDivElement, CardProps>(
  ({ className, variant, padding, rounded, loading, disabled, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          cardVariants({ variant, padding, rounded }),
          loading && "animate-pulse",
          disabled && "opacity-50 cursor-not-allowed",
          className
        )}
        {...props}
      >
        {loading ? (
          <div className="space-y-4">
            <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
            <div className="h-4 bg-gray-200 rounded animate-pulse w-3/4"></div>
            <div className="h-4 bg-gray-200 rounded animate-pulse w-1/2"></div>
          </div>
        ) : (
          children
        )}
      </div>
    );
  }
);

Card.displayName = "Card";

// Card 하위 컴포넌트들
const CardHeader = forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn("flex flex-col space-y-2 p-6 pb-0", className)}
      {...props}
    />
  )
);
CardHeader.displayName = "CardHeader";

const CardTitle = forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLHeadingElement>>(
  ({ className, ...props }, ref) => (
    <h3
      ref={ref}
      className={cn("text-xl font-bold leading-tight tracking-tight", className)}
      {...props}
    />
  )
);
CardTitle.displayName = "CardTitle";

const CardDescription = forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLParagraphElement>>(
  ({ className, ...props }, ref) => (
    <p
      ref={ref}
      className={cn("text-sm text-gray-600 leading-relaxed", className)}
      {...props}
    />
  )
);
CardDescription.displayName = "CardDescription";

const CardContent = forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn("p-6 pt-0", className)} {...props} />
  )
);
CardContent.displayName = "CardContent";

const CardFooter = forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn("flex items-center justify-between p-6 pt-0", className)}
      {...props}
    />
  )
);
CardFooter.displayName = "CardFooter";

// 특화된 카드 컴포넌트들
const JobCard = forwardRef<HTMLDivElement, {
  title: string;
  company: string;
  location: string;
  wage: string;
  urgent?: boolean;
  favorite?: boolean;
  onFavoriteToggle?: () => void;
  onClick?: () => void;
  className?: string;
}>(({ title, company, location, wage, urgent, favorite, onFavoriteToggle, onClick, className }, ref) => (
  <Card 
    ref={ref}
    variant="interactive"
    className={cn("group relative overflow-visible", className)}
    onClick={onClick}
  >
    <CardContent className="relative">
      {/* Premium 긴급 배지 with animation */}
      {urgent && (
        <div className="absolute -top-2 -right-2 bg-gradient-to-r from-red-500 to-pink-500 text-white px-3 py-1 rounded-full text-sm font-bold shadow-lg animate-pulse z-10">
          🔥 긴급
        </div>
      )}
      
      {/* 즐겨찾기 버튼 */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          onFavoriteToggle?.();
        }}
        className="absolute top-4 right-4 p-2 rounded-full hover:bg-gray-100 transition-colors"
      >
        <svg 
          className={cn(
            "h-5 w-5 transition-colors",
            favorite ? "text-red-500 fill-current" : "text-gray-400"
          )} 
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
        >
          <path 
            strokeLinecap="round" 
            strokeLinejoin="round" 
            strokeWidth={2} 
            d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" 
          />
        </svg>
      </button>
      
      <div className="pr-12">
        <h3 className="text-lg font-bold text-gray-900 mb-2 group-hover:text-transparent group-hover:bg-gradient-to-r group-hover:from-orange-600 group-hover:to-red-600 group-hover:bg-clip-text transition-all duration-300">
          {title}
        </h3>
        <p className="text-gray-600 mb-1 font-medium">{company}</p>
        <p className="text-sm text-gray-500 mb-3 flex items-center gap-1">
          <span className="text-orange-500">📍</span> {location}
        </p>
        
        <div className="flex items-center justify-between pt-3 border-t border-gray-100">
          <span className="text-2xl font-black bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent">{wage}</span>
          <span className="text-sm text-gray-500 font-medium">일당</span>
        </div>
      </div>
    </CardContent>
  </Card>
));
JobCard.displayName = "JobCard";

const StatsCard = forwardRef<HTMLDivElement, {
  title: string;
  value: string | number;
  change?: string;
  icon: React.ReactNode;
  trend?: 'up' | 'down' | 'neutral';
  className?: string;
  style?: React.CSSProperties;
}>(({ title, value, change, icon, trend, className, style }, ref) => (
  <Card ref={ref} variant="elevated" className={cn("group hover:scale-105 transition-all duration-300", className)} style={style}>
    <CardContent>
      <div className="flex items-center justify-between relative">
        <div className="z-10">
          <p className="text-sm font-medium text-gray-600 mb-1 group-hover:text-gray-700 transition-colors">{title}</p>
          <p className="text-3xl font-black bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">{value}</p>
          {change && (
            <p className={cn(
              "text-sm font-semibold mt-2 flex items-center gap-1",
              trend === 'up' && "text-green-600",
              trend === 'down' && "text-red-600",
              trend === 'neutral' && "text-gray-600"
            )}>
              {trend === 'up' && '↑'}
              {trend === 'down' && '↓'}
              {change}
            </p>
          )}
        </div>
        <div className="text-5xl opacity-20 group-hover:opacity-30 transition-all duration-500 group-hover:scale-110 absolute right-4">
          {icon}
        </div>
      </div>
    </CardContent>
  </Card>
));
StatsCard.displayName = "StatsCard";

export { 
  Card, 
  CardHeader, 
  CardFooter, 
  CardTitle, 
  CardDescription, 
  CardContent,
  JobCard,
  StatsCard,
  cardVariants 
};