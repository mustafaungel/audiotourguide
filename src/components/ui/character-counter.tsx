import React from 'react';
import { cn } from '@/lib/utils';

interface CharacterCounterProps {
  current: number;
  max: number;
  className?: string;
  showProgress?: boolean;
}

export const CharacterCounter: React.FC<CharacterCounterProps> = ({
  current,
  max,
  className,
  showProgress = false
}) => {
  const percentage = (current / max) * 100;
  const isNearLimit = percentage >= 80;
  const isOverLimit = current > max;

  return (
    <div className={cn("flex items-center gap-2 text-xs", className)}>
      {showProgress && (
        <div className="flex-1 bg-muted rounded-full h-1.5">
          <div 
            className={cn(
              "h-full rounded-full transition-all duration-200",
              isOverLimit ? "bg-destructive" : 
              isNearLimit ? "bg-warning" : "bg-primary"
            )}
            style={{ width: `${Math.min(percentage, 100)}%` }}
          />
        </div>
      )}
      <span className={cn(
        "font-medium tabular-nums",
        isOverLimit ? "text-destructive" : 
        isNearLimit ? "text-warning" : "text-muted-foreground"
      )}>
        {current}/{max}
      </span>
    </div>
  );
};

interface TextareaWithCounterProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  maxLength: number;
  showProgress?: boolean;
  label?: string;
  helpText?: string;
}

export const TextareaWithCounter = React.forwardRef<HTMLTextAreaElement, TextareaWithCounterProps>(
  ({ maxLength, showProgress = true, label, helpText, className, ...props }, ref) => {
    const currentLength = (props.value as string)?.length || 0;
    const isOverLimit = currentLength > maxLength;

    return (
      <div className="space-y-2">
        {label && (
          <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
            {label}
          </label>
        )}
        <div className="relative">
          <textarea
            ref={ref}
            className={cn(
              "flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 resize-none",
              isOverLimit && "border-destructive focus-visible:ring-destructive",
              className
            )}
            {...props}
          />
        </div>
        <div className="flex items-center justify-between">
          <div className="text-xs text-muted-foreground">
            {helpText}
          </div>
          <CharacterCounter 
            current={currentLength} 
            max={maxLength} 
            showProgress={showProgress} 
          />
        </div>
        {isOverLimit && (
          <p className="text-xs text-destructive">
            Content exceeds maximum length by {currentLength - maxLength} characters
          </p>
        )}
      </div>
    );
  }
);

TextareaWithCounter.displayName = "TextareaWithCounter";

interface InputWithCounterProps extends React.InputHTMLAttributes<HTMLInputElement> {
  maxLength: number;
  showProgress?: boolean;
  label?: string;
  helpText?: string;
}

export const InputWithCounter = React.forwardRef<HTMLInputElement, InputWithCounterProps>(
  ({ maxLength, showProgress = false, label, helpText, className, ...props }, ref) => {
    const currentLength = (props.value as string)?.length || 0;
    const isOverLimit = currentLength > maxLength;

    return (
      <div className="space-y-2">
        {label && (
          <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
            {label}
          </label>
        )}
        <div className="relative">
          <input
            ref={ref}
            className={cn(
              "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
              isOverLimit && "border-destructive focus-visible:ring-destructive",
              className
            )}
            {...props}
          />
        </div>
        <div className="flex items-center justify-between">
          <div className="text-xs text-muted-foreground">
            {helpText}
          </div>
          <CharacterCounter 
            current={currentLength} 
            max={maxLength} 
            showProgress={showProgress} 
          />
        </div>
        {isOverLimit && (
          <p className="text-xs text-destructive">
            Input exceeds maximum length by {currentLength - maxLength} characters
          </p>
        )}
      </div>
    );
  }
);

InputWithCounter.displayName = "InputWithCounter";