import React, { forwardRef } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const buttonVariants = cva(
  // Premium Base styles - Enterprise Level
  "inline-flex items-center justify-center font-semibold transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 active:scale-[0.97] touch-target relative overflow-hidden transform-gpu",
  {
    variants: {
      variant: {
        // Premium Default - Gradient with shimmer effect
        default: "bg-gradient-to-r from-orange-500 via-orange-600 to-red-500 text-white shadow-lg hover:shadow-2xl hover:scale-[1.02] focus-visible:ring-orange-500 rounded-xl before:absolute before:inset-0 before:bg-gradient-to-r before:from-transparent before:via-white/20 before:to-transparent before:-translate-x-full hover:before:translate-x-full before:transition-transform before:duration-700",
        
        // Glass Morphism
        glass: "bg-white/10 backdrop-blur-md border border-white/20 text-white hover:bg-white/20 focus-visible:ring-white/50 rounded-xl shadow-glass",
        
        // Secondary Premium
        secondary: "border-2 border-orange-500 text-orange-600 bg-white hover:bg-gradient-to-r hover:from-orange-50 hover:to-red-50 hover:border-orange-600 hover:shadow-lg focus-visible:ring-orange-500 rounded-xl backdrop-blur-sm transition-all",
        
        // Success Gradient
        success: "bg-gradient-to-r from-green-500 via-emerald-500 to-teal-500 text-white shadow-lg hover:shadow-2xl hover:scale-[1.02] focus-visible:ring-green-500 rounded-xl",
        
        // Danger with Pulse
        destructive: "bg-gradient-to-r from-red-500 via-rose-500 to-pink-500 text-white shadow-lg hover:shadow-2xl hover:scale-[1.02] focus-visible:ring-red-500 rounded-xl hover:animate-pulse-slow",
        
        // Warning Glow
        warning: "bg-gradient-to-r from-yellow-400 via-amber-400 to-orange-400 text-white shadow-lg hover:shadow-amber-500/50 hover:shadow-2xl focus-visible:ring-yellow-500 rounded-xl",
        
        // Ghost Premium
        ghost: "text-orange-600 hover:bg-gradient-to-r hover:from-orange-50 hover:to-transparent hover:text-orange-700 focus-visible:ring-orange-500 rounded-xl",
        
        // Link with Animation
        link: "text-orange-600 underline-offset-4 hover:underline hover:text-orange-700 focus-visible:ring-orange-500 relative after:absolute after:bottom-0 after:left-0 after:h-[2px] after:w-0 after:bg-orange-600 hover:after:w-full after:transition-all",
        
        // Dark Luxury
        dark: "bg-gradient-to-r from-gray-800 via-gray-900 to-black text-white shadow-lg hover:shadow-2xl hover:from-gray-900 hover:via-black hover:to-gray-900 focus-visible:ring-gray-700 rounded-xl",
        
        // Premium Gradient
        premium: "bg-gradient-to-r from-purple-600 via-pink-500 to-orange-500 text-white shadow-xl hover:shadow-2xl hover:scale-[1.02] rounded-xl animate-gradient-x focus-visible:ring-purple-500"
      },
      size: {
        // 작은 크기
        sm: "h-9 px-3 text-xs",
        
        // 기본 크기
        default: "h-12 px-6 text-sm",
        
        // 큰 크기 - 터치 최적화
        lg: "h-14 px-8 text-base font-bold",
        
        // 매우 큰 크기 - 현장용
        xl: "h-16 px-10 text-lg font-bold",
        
        // 아이콘만
        icon: "h-12 w-12 p-0"
      },
      fullWidth: {
        true: "w-full"
      },
      loading: {
        true: "cursor-not-allowed"
      }
    },
    defaultVariants: {
      variant: "default",
      size: "default"
    }
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
  loading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  fullWidth?: boolean;
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ 
    className, 
    variant, 
    size, 
    fullWidth,
    loading,
    leftIcon,
    rightIcon,
    children,
    disabled,
    ...props 
  }, ref) => {
    return (
      <button
        className={cn(buttonVariants({ variant, size, fullWidth, loading, className }))}
        ref={ref}
        disabled={disabled || loading}
        {...props}
      >
        {/* 로딩 스피너 */}
        {loading && (
          <div className="absolute inset-0 flex items-center justify-center">
            <svg 
              className="animate-spin -ml-1 mr-3 h-5 w-5 text-current" 
              xmlns="http://www.w3.org/2000/svg" 
              fill="none" 
              viewBox="0 0 24 24"
            >
              <circle 
                className="opacity-25" 
                cx="12" 
                cy="12" 
                r="10" 
                stroke="currentColor" 
                strokeWidth="4"
              />
              <path 
                className="opacity-75" 
                fill="currentColor" 
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
          </div>
        )}
        
        {/* 컨텐츠 */}
        <span className={`flex items-center gap-2 ${loading ? 'opacity-0' : 'opacity-100'}`}>
          {leftIcon && <span className="flex-shrink-0">{leftIcon}</span>}
          {children}
          {rightIcon && <span className="flex-shrink-0">{rightIcon}</span>}
        </span>
      </button>
    );
  }
);

Button.displayName = "Button";

export { Button, buttonVariants };