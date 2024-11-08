import styles from '@components/ProgressBar.module.scss';
import * as React from 'react';

interface ProgressBarProps {
  /** Progress percentage (0-100) for determinate mode */
  progress: number;
  
  /** Whether to show indeterminate progress animation */
  indeterminate?: boolean;
  
  /** Optional label to display */
  label?: string;
  
  /** Optional className for additional styling */
  className?: string;
}

export default function ProgressBar({ 
  progress, 
  indeterminate = false, 
  label,
  className 
}: ProgressBarProps) {
  const clampedProgress = Math.min(100, Math.max(0, progress));
  
  return (
    <div className={`${styles.container} ${className || ''}`}>
      {label && (
        <div className={styles.label} aria-live="polite">
          {label}
        </div>
      )}
      <div 
        className={styles.track}
        role="progressbar"
        aria-valuenow={indeterminate ? undefined : clampedProgress}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={label || 'Upload progress'}
      >
        <div 
          className={`${styles.fill} ${indeterminate ? styles.indeterminate : ''}`}
          style={indeterminate ? undefined : { width: `${clampedProgress}%` }}
        >
          {indeterminate && (
            <div className={styles.indeterminateAnimation} />
          )}
        </div>
      </div>
      {!indeterminate && (
        <div className={styles.percentage} aria-live="polite">
          {Math.round(clampedProgress)}%
        </div>
      )}
    </div>
  );
}
