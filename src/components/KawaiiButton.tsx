import React from 'react';
import { useSound } from '../hooks/useSound';

interface KawaiiButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  variant?: 'primary' | 'secondary' | 'danger' | 'success';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  className?: string;
  emoji?: string;
}

export const KawaiiButton: React.FC<KawaiiButtonProps> = ({
  children,
  onClick,
  variant = 'primary',
  size = 'md',
  disabled = false,
  className = '',
  emoji,
}) => {
  const { playHover, playClick } = useSound();

  const baseClasses = 'font-kawaii font-semibold rounded-full transition-all duration-300 transform hover:scale-105 active:scale-95 shadow-lg hover:shadow-xl border-2';

  const variantClasses = {
    primary: 'bg-gradient-to-r from-kawaii-pink-400 to-kawaii-purple-500 hover:from-kawaii-pink-500 hover:to-kawaii-purple-600 text-white border-kawaii-pink-300 hover:border-kawaii-pink-200',
    secondary: 'bg-gradient-to-r from-kawaii-blue-400 to-kawaii-purple-400 hover:from-kawaii-blue-500 hover:to-kawaii-purple-500 text-white border-kawaii-blue-300 hover:border-kawaii-blue-200',
    danger: 'bg-gradient-to-r from-red-400 to-pink-500 hover:from-red-500 hover:to-pink-600 text-white border-red-300 hover:border-red-200',
    success: 'bg-gradient-to-r from-green-400 to-teal-500 hover:from-green-500 hover:to-teal-600 text-white border-green-300 hover:border-green-200',
  };

  const sizeClasses = {
    sm: 'px-4 py-2 text-sm',
    md: 'px-6 py-3 text-base',
    lg: 'px-8 py-4 text-lg',
  };

  const disabledClasses = disabled
    ? 'opacity-50 cursor-not-allowed hover:scale-100 active:scale-100'
    : 'hover:animate-pulse-pink cursor-pointer';

  const handleClick = () => {
    if (!disabled) {
      playClick();
      onClick?.();
    }
  };

  const handleMouseEnter = () => {
    if (!disabled) {
      playHover();
    }
  };

  return (
    <button
      className={`${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${disabledClasses} ${className}`}
      onClick={handleClick}
      onMouseEnter={handleMouseEnter}
      disabled={disabled}
    >
      <span className="flex items-center justify-center gap-2">
        {emoji && <span className="text-lg">{emoji}</span>}
        {children}
      </span>
    </button>
  );
};