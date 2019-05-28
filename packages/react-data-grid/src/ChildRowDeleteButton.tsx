import React from 'react';

export interface ChildRowDeleteButtonProps {
  treeDepth: number;
  cellHeight: number;
  onDeleteSubRow(): void;
  isDeleteSubRowEnabled: boolean;
}

export default function ChildRowDeleteButton({ treeDepth, cellHeight, onDeleteSubRow, isDeleteSubRowEnabled }: ChildRowDeleteButtonProps) {
  const left = treeDepth * 15;
  const top = (cellHeight - 12) / 2;
  return (
    <>
      <div className="rdg-child-row-action-cross" />
      {isDeleteSubRowEnabled && (
        <div style={{ left, top }} className="rdg-child-row-btn" onClick={onDeleteSubRow}>
          <div className="glyphicon glyphicon-remove-sign" />
        </div>
      )}
    </>
  );
}
