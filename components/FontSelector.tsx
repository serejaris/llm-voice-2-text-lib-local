'use client';

import styles from '@components/FontSelector.module.scss';

import * as React from 'react';
import * as Constants from '@common/constants';

interface FontSelectorProps {
  disabled: boolean;
  selectedFont: string;
  onFontChange: (fontValue: string) => void;
}

export default function FontSelector({ disabled, selectedFont, onFontChange }: FontSelectorProps) {
  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    onFontChange(e.target.value);
  };

  // Find the display name for the selected font
  const selectedFontName = Constants.FONT_OPTIONS.find((font) => font.value === selectedFont)?.name || 'SF Mono';

  if (disabled) {
    return (
      <span className={styles.rootDisabled}>
        <select className={styles.selectDisabled} disabled>
          <option>{selectedFontName}</option>
        </select>
      </span>
    );
  }

  return (
    <span className={styles.root}>
      <select
        id="font-selector"
        className={styles.select}
        value={selectedFont}
        onChange={handleChange}
        aria-label="Font"
      >
        {Constants.FONT_OPTIONS.map((font) => (
          <option key={font.value} value={font.value}>
            {font.name}
          </option>
        ))}
      </select>
    </span>
  );
}
