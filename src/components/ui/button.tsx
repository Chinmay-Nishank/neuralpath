import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-sm text-sm font-medium transition-colors duration-150 ease-neural focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-canvas disabled:pointer-events-none disabled:opacity-50 select-none',
  {
    variants: {
      variant: {
        primary: 'bg-accent text-accent-foreground hover:bg-accent-hover shadow-sm',
        secondary: 'bg-subtle text-primary hover:bg-hairline border border-hairline',
        outline: 'border border-strong bg-surface text-primary hover:bg-subtle',
        ghost: 'text-primary-secondary hover:bg-subtle hover:text-primary',
        danger: 'bg-danger text-white hover:opacity-90',
      },
      size: {
        sm: 'h-8 px-3 text-xs',
        md: 'h-10 px-4 py-2',
        lg: 'h-11 px-6 text-base',
        icon: 'h-10 w-10 p-0',
        'icon-sm': 'h-8 w-8 p-0',
      },
    },
    defaultVariants: {
      variant: 'primary',
      size: 'md',
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  loading?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, loading = false, disabled, children, type = 'button', ...props }, ref) => {
    return (
      <button
        ref={ref}
        type={type}
        disabled={disabled || loading}
        aria-busy={loading || undefined}
        className={cn(buttonVariants({ variant, size }), className)}
        {...props}
      >
        {loading && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
        {children}
      </button>
    );
  }
);
Button.displayName = 'Button';

export interface IconButtonProps extends Omit<ButtonProps, 'size'> {
  label: string;
  size?: 'icon' | 'icon-sm';
}

export const IconButton = React.forwardRef<HTMLButtonElement, IconButtonProps>(
  ({ label, size = 'icon', children, ...props }, ref) => {
    return (
      <Button ref={ref} size={size} aria-label={label} title={label} {...props}>
        {children}
      </Button>
    );
  }
);
IconButton.displayName = 'IconButton';

export { buttonVariants };

