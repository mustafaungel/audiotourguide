import { Check, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { getPasswordStrength } from '@/lib/auth-validation';

interface PasswordStrengthMeterProps {
  password: string;
  className?: string;
}

const segmentColors = [
  'bg-destructive',
  'bg-orange-500',
  'bg-yellow-500',
  'bg-lime-500',
  'bg-emerald-500',
];

export function PasswordStrengthMeter({ password, className }: PasswordStrengthMeterProps) {
  if (!password) return null;
  const { score, label, checks } = getPasswordStrength(password);

  const criteria: { key: keyof typeof checks; text: string }[] = [
    { key: 'length', text: 'At least 8 characters' },
    { key: 'uppercase', text: 'One uppercase letter' },
    { key: 'lowercase', text: 'One lowercase letter' },
    { key: 'number', text: 'One number' },
    { key: 'special', text: 'One special character' },
    { key: 'notCommon', text: 'Not a common password' },
  ];

  return (
    <div className={cn('space-y-2', className)}>
      <div className="flex gap-1">
        {[0, 1, 2, 3].map((i) => (
          <div
            key={i}
            className={cn(
              'h-1 flex-1 rounded-full transition-colors duration-300',
              i < score ? segmentColors[score] : 'bg-muted'
            )}
          />
        ))}
      </div>
      <div className="flex items-center justify-between">
        <span className="text-xs text-muted-foreground">Strength</span>
        <span
          className={cn(
            'text-xs font-medium',
            score === 0 && 'text-destructive',
            score === 1 && 'text-orange-500',
            score === 2 && 'text-yellow-600',
            score === 3 && 'text-lime-600',
            score === 4 && 'text-emerald-600'
          )}
        >
          {label}
        </span>
      </div>
      <ul className="space-y-1 pt-1">
        {criteria.map(({ key, text }) => {
          const passed = checks[key];
          return (
            <li
              key={key}
              className={cn(
                'flex items-center gap-1.5 text-xs transition-colors',
                passed ? 'text-emerald-600' : 'text-muted-foreground'
              )}
            >
              {passed ? <Check className="h-3 w-3" /> : <X className="h-3 w-3" />}
              {text}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
