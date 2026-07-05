import React from 'react';

interface DateFieldProps {
  label: string;
  value: string;
  onChange: (date: string) => void;
}

export function DateField({ label, value, onChange }: DateFieldProps) {
  return (
    <div style={{ marginBottom: 14 }}>
      <div style={{
        fontSize: 11.5,
        fontWeight: 700,
        color: '#6B7280',
        marginBottom: 6,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
      }}>
        {label}
      </div>
      <input
        type="date"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        style={{
          width: '100%',
          boxSizing: 'border-box',
          backgroundColor: '#FFFFFF',
          border: '1px solid #E5EAF0',
          borderRadius: 12,
          padding: '12px 14px',
          fontSize: 14,
          color: '#07152F',
          outline: 'none',
          cursor: 'pointer',
          fontFamily: 'inherit',
        }}
      />
    </div>
  );
}
