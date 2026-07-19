import type { ButtonHTMLAttributes, ReactNode } from 'react'

type ActionButtonVariant = 'ghost' | 'primary' | 'secondary' | 'text'

interface ActionButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode
  variant?: ActionButtonVariant
}

const variantClasses: Record<ActionButtonVariant, string> = {
  ghost: 'ghost-button',
  primary: 'primary-soft-button',
  secondary: 'secondary-soft-button',
  text: 'text-button',
}

export function ActionButton({ children, className = '', type = 'button', variant = 'primary', ...props }: ActionButtonProps) {
  return (
    <button
      {...props}
      className={`${variantClasses[variant]}${className ? ` ${className}` : ''}`}
      type={type}
    >
      {children}
    </button>
  )
}
