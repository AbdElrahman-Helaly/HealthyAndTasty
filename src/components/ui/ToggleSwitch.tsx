import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/utils';

interface ToggleSwitchProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
  'aria-label': string;
}

export function ToggleSwitch({
  checked,
  onChange,
  disabled,
  'aria-label': ariaLabel,
}: ToggleSwitchProps) {
  const { i18n } = useTranslation();
  const isRtl = i18n.dir() === 'rtl';

  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={ariaLabel}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={cn(
        'relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-primary/30 disabled:cursor-not-allowed disabled:opacity-50',
        checked ? 'bg-primary' : 'bg-outline-variant',
      )}
    >
      <span
        className={cn(
          'pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-sm transition-transform duration-200',
          checked
            ? isRtl
              ? '-translate-x-4'
              : 'translate-x-4'
            : 'translate-x-0',
        )}
      />
    </button>
  );
}
