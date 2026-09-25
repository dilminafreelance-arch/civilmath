import React from 'react';
import { Link, type LinkProps } from 'react-router-dom';
import { buttonClassName, type ButtonSize, type ButtonVariant } from './buttonStyles';

interface ButtonLinkProps extends Omit<LinkProps, 'className'> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  icon?: React.ElementType;
  iconRight?: React.ElementType;
  mono?: boolean;
  className?: string;
  children?: React.ReactNode;
}

export function ButtonLink({
  variant = 'primary',
  size = 'md',
  icon: Icon,
  iconRight: IconRight,
  mono = false,
  className = '',
  children,
  ...props
}: ButtonLinkProps) {
  return (
    <Link className={buttonClassName({ variant, size, mono, className })} {...props}>
      {Icon ? <Icon className="w-4 h-4 shrink-0" strokeWidth={1.75} /> : null}
      {children}
      {IconRight ? <IconRight className="w-4 h-4 shrink-0" strokeWidth={1.75} /> : null}
    </Link>
  );
}
