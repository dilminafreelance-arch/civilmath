import React from 'react';
import { motion, HTMLMotionProps } from 'motion/react';
import { buttonClassName, type ButtonSize, type ButtonVariant } from './buttonStyles';

export type { ButtonSize, ButtonVariant };

interface ButtonProps extends Omit<HTMLMotionProps<'button'>, 'size'> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  icon?: React.ElementType;
  iconRight?: React.ElementType;
  loading?: boolean;
  mono?: boolean;
  children?: React.ReactNode;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  {
    variant = 'primary',
    size = 'md',
    icon: Icon,
    iconRight: IconRight,
    loading = false,
    mono = false,
    className = '',
    children,
    disabled,
    ...props
  }: ButtonProps,
  ref
) {
  return (
    <motion.button
      ref={ref}
      whileTap={{ scale: disabled || loading ? 1 : 0.98 }}
      transition={{ duration: 0.1 }}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      className={buttonClassName({ variant, size, mono, className })}
      {...props}
    >
      {loading ? (
        <span className="w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin shrink-0" />
      ) : Icon ? (
        <Icon className="w-4 h-4 shrink-0" strokeWidth={1.75} />
      ) : null}
      {children}
      {IconRight && !loading && <IconRight className="w-4 h-4 shrink-0" strokeWidth={1.75} />}
    </motion.button>
  );
});
