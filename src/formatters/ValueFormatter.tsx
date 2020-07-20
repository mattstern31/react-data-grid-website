import React from 'react';
import { FormatterProps } from '../types';

export function ValueFormatter<R, SR>(props: FormatterProps<R, SR>) {
  return <>{props.row[props.column.key as keyof R]}</>;
}
