import React from 'react';
import clsx from 'clsx';

import { useFocusRef } from '../hooks';

type SharedInputProps = Pick<React.InputHTMLAttributes<HTMLInputElement>,
  | 'disabled'
  | 'tabIndex'
  | 'onClick'
  | 'aria-label'
  | 'aria-labelledby'
>;

export interface SelectCellFormatterProps extends SharedInputProps {
  isCellSelected?: boolean;
  value: boolean;
  onChange: (value: boolean, isShiftClick: boolean) => void;
}

export function SelectCellFormatter({
  value,
  tabIndex,
  isCellSelected,
  disabled,
  onClick,
  onChange,
  'aria-label': ariaLabel,
  'aria-labelledby': ariaLabelledBy
}: SelectCellFormatterProps) {
  const inputRef = useFocusRef<HTMLInputElement>(isCellSelected);

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    onChange(e.target.checked, (e.nativeEvent as MouseEvent).shiftKey);
  }

  return (
    <label className={clsx('rdg-checkbox-label', { 'rdg-checkbox-label-disabled': disabled })}>
      <input
        aria-label={ariaLabel}
        aria-labelledby={ariaLabelledBy}
        tabIndex={tabIndex}
        ref={inputRef}
        type="checkbox"
        className="rdg-checkbox-input"
        disabled={disabled}
        checked={value}
        onChange={handleChange}
        onClick={onClick}
      />
      <div className="rdg-checkbox" />
    </label>
  );
}
