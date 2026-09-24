import { useState, type InputHTMLAttributes } from 'react';

const DECIMAL = /^-?\d*(?:[.,]\d*)?$/;

interface NumberInputProps extends Omit<
  InputHTMLAttributes<HTMLInputElement>,
  'value' | 'onChange' | 'type'
> {
  value: number;
  onValueChange: (value: number) => void;
  /** Allow negative numbers (e.g. a credit line). */
  allowNegative?: boolean;
}

const display = (value: number) => (Number.isFinite(value) ? String(value).replace('.', ',') : '');

function parse(text: string): number | null {
  if (text === '' || text === '-' || text === ',' || text === '.') return 0;
  const n = Number(text.replace(',', '.'));
  return Number.isFinite(n) ? n : null;
}

/**
 * Text input for decimal numbers that accepts both "," and "." as the decimal
 * separator (Spanish users type commas) and never fights the user while
 * typing intermediate values like "12," or "-".
 */
export function NumberInput({
  value,
  onValueChange,
  allowNegative = false,
  className = 'input input-num',
  onBlur,
  ...props
}: NumberInputProps) {
  const [text, setText] = useState(() => display(value));
  const [prevValue, setPrevValue] = useState(value);

  // Sync when the value changes from outside (e.g. data import).
  if (value !== prevValue) {
    setPrevValue(value);
    if (parse(text) !== value) setText(display(value));
  }

  return (
    <input
      {...props}
      type="text"
      inputMode="decimal"
      autoComplete="off"
      className={className}
      value={text}
      onChange={(event) => {
        const next = event.target.value.trim();
        if (!DECIMAL.test(next) || (!allowNegative && next.startsWith('-'))) return;
        setText(next);
        const parsed = parse(next);
        if (parsed !== null && parsed !== value) {
          setPrevValue(parsed);
          onValueChange(parsed);
        }
      }}
      onBlur={(event) => {
        setText(display(value));
        onBlur?.(event);
      }}
    />
  );
}
