import React, { forwardRef, useState, useId } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const inputVariants = cva(
  // Base styles - 현장 환경 고려한 고대비, 큰 터치 영역
  "flex w-full rounded-xl border-2 bg-white px-4 py-3 text-base transition-all duration-200 placeholder:text-gray-400 focus:outline-none focus:ring-4 focus:ring-offset-0 disabled:cursor-not-allowed disabled:opacity-50 touch-target",
  {
    variants: {
      variant: {
        // 기본 스타일
        default: "border-gray-200 focus:border-orange-500 focus:ring-orange-500/20",
        
        // 성공 상태
        success: "border-green-500 focus:border-green-600 focus:ring-green-500/20 text-green-900",
        
        // 오류 상태
        error: "border-red-500 focus:border-red-600 focus:ring-red-500/20 text-red-900",
        
        // 경고 상태
        warning: "border-yellow-500 focus:border-yellow-600 focus:ring-yellow-500/20 text-yellow-900"
      },
      size: {
        sm: "px-3 py-2 text-sm h-10",
        default: "px-4 py-3 text-base h-12",
        lg: "px-5 py-4 text-lg h-14"
      }
    },
    defaultVariants: {
      variant: "default",
      size: "default"
    }
  }
);

export interface InputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size'>,
    VariantProps<typeof inputVariants> {
  label?: string;
  error?: string;
  helper?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  showPasswordToggle?: boolean;
  loading?: boolean;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ 
    className, 
    variant, 
    size,
    label,
    error,
    helper,
    leftIcon,
    rightIcon,
    showPasswordToggle,
    loading,
    type,
    id,
    ...props 
  }, ref) => {
    const [showPassword, setShowPassword] = useState(false);
    const [isFocused, setIsFocused] = useState(false);
    const generatedId = useId();
    
    const inputId = id || generatedId;
    const inputType = showPasswordToggle ? (showPassword ? 'text' : 'password') : type;
    
    // 오류가 있으면 variant를 error로 설정
    const currentVariant = error ? 'error' : variant;

    return (
      <div className="w-full">
        {/* 라벨 */}
        {label && (
          <label 
            htmlFor={inputId}
            className={cn(
              "block text-sm font-semibold mb-2 transition-colors",
              error ? "text-red-700" : "text-gray-900"
            )}
          >
            {label}
            {props.required && <span className="text-red-500 ml-1">*</span>}
          </label>
        )}
        
        {/* 입력 필드 컨테이너 */}
        <div className="relative">
          {/* 왼쪽 아이콘 */}
          {leftIcon && (
            <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 pointer-events-none">
              {leftIcon}
            </div>
          )}
          
          {/* 입력 필드 */}
          <input
            ref={ref}
            id={inputId}
            type={inputType}
            className={cn(
              inputVariants({ variant: currentVariant, size, className }),
              leftIcon && "pl-12",
              (rightIcon || showPasswordToggle || loading) && "pr-12"
            )}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            {...props}
          />
          
          {/* 오른쪽 아이콘들 */}
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2 flex items-center gap-2">
            {/* 로딩 스피너 */}
            {loading && (
              <div className="animate-spin">
                <svg 
                  className="h-5 w-5 text-gray-400" 
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
            
            {/* 비밀번호 토글 */}
            {showPasswordToggle && !loading && (
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="text-gray-500 hover:text-gray-700 transition-colors p-1"
                tabIndex={-1}
              >
                {showPassword ? (
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21" />
                  </svg>
                ) : (
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                )}
              </button>
            )}
            
            {/* 오른쪽 아이콘 */}
            {rightIcon && !loading && (
              <div className="text-gray-500">
                {rightIcon}
              </div>
            )}
          </div>
          
          {/* 포커스 인디케이터 - 접근성 향상 */}
          {isFocused && (
            <div className={cn(
              "absolute inset-0 rounded-xl pointer-events-none transition-all duration-200",
              "ring-4 ring-offset-0",
              error ? "ring-red-500/20" : "ring-orange-500/20"
            )} />
          )}
        </div>
        
        {/* 헬퍼 텍스트 또는 오류 메시지 */}
        {(helper || error) && (
          <div className="mt-2 flex items-start gap-2">
            {error && (
              <svg 
                className="h-4 w-4 text-red-500 flex-shrink-0 mt-0.5" 
                fill="currentColor" 
                viewBox="0 0 20 20"
              >
                <path 
                  fillRule="evenodd" 
                  d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" 
                  clipRule="evenodd" 
                />
              </svg>
            )}
            <p className={cn(
              "text-sm",
              error ? "text-red-600 font-medium" : "text-gray-600"
            )}>
              {error || helper}
            </p>
          </div>
        )}
      </div>
    );
  }
);

Input.displayName = "Input";

export { Input, inputVariants };