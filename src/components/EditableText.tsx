import { Pencil } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { useSiteContent } from '../context/ContentContext';

interface EditableTextProps {
  value: string;
  onCommit: (nextValue: string) => void;
  multiline?: boolean;
  className?: string;
  inputClassName?: string;
  placeholder?: string;
  allowEmpty?: boolean;
}

export function EditableText({
  value,
  onCommit,
  multiline = false,
  className = '',
  inputClassName = '',
  placeholder = 'Text eingeben…',
  allowEmpty = false,
}: EditableTextProps) {
  const { canInlineEdit } = useSiteContent();
  const [editing, setEditing] = useState(false);
  const [localVal, setLocalVal] = useState(value);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  useEffect(() => {
    if (!editing) {
      setLocalVal(value);
    }
  }, [value, editing]);

  useEffect(() => {
    if (!canInlineEdit && editing) {
      setEditing(false);
    }
  }, [canInlineEdit, editing]);

  useEffect(() => {
    if (!editing) return;
    const el = multiline ? textareaRef.current : inputRef.current;
    if (!el) return;
    el.focus();
    const len = el.value.length;
    el.setSelectionRange(len, len);
    if (multiline && textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [editing, multiline]);

  if (!canInlineEdit) {
    return <>{value}</>;
  }

  const commitValue = () => {
    setEditing(false);
    const trimmed = localVal.trim();
    if (!allowEmpty && trimmed.length === 0) {
      setLocalVal(value);
      return;
    }
    if (localVal !== value) {
      onCommit(allowEmpty ? localVal : trimmed);
    }
  };

  if (editing) {
    if (multiline) {
      return (
        <textarea
          ref={textareaRef}
          value={localVal}
          placeholder={placeholder}
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
          }}
          onChange={(e) => {
            setLocalVal(e.target.value);
            e.target.style.height = 'auto';
            e.target.style.height = `${e.target.scrollHeight}px`;
          }}
          onBlur={commitValue}
          onKeyDown={(e) => {
            if (e.key === 'Escape') {
              e.preventDefault();
              setLocalVal(value);
              setEditing(false);
            } else if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
              e.preventDefault();
              commitValue();
            }
          }}
          rows={2}
          className={`w-full min-w-[140px] resize-none rounded-lg border border-emerald-400/80 bg-[#070b0f]/95 px-2.5 py-1.5 text-inherit font-inherit leading-inherit tracking-inherit text-[#f7f8f8] shadow-[0_0_0_3px_rgba(16,185,129,0.18)] focus:outline-none ${inputClassName}`}
        />
      );
    }

    return (
      <input
        ref={inputRef}
        type="text"
        value={localVal}
        placeholder={placeholder}
        size={Math.max(8, Math.min(64, localVal.length + 2))}
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
        }}
        onChange={(e) => setLocalVal(e.target.value)}
        onBlur={commitValue}
        onKeyDown={(e) => {
          if (e.key === 'Escape') {
            e.preventDefault();
            setLocalVal(value);
            setEditing(false);
          } else if (e.key === 'Enter') {
            e.preventDefault();
            commitValue();
          }
        }}
        className={`inline-block max-w-full rounded-lg border border-emerald-400/80 bg-[#070b0f]/95 px-2 py-0.5 text-inherit font-inherit leading-inherit tracking-inherit text-[#f7f8f8] shadow-[0_0_0_3px_rgba(16,185,129,0.18)] focus:outline-none ${inputClassName}`}
      />
    );
  }

  return (
    <span
      role="button"
      tabIndex={0}
      title="Klicken zum Bearbeiten"
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        setEditing(true);
      }}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          e.stopPropagation();
          setEditing(true);
        }
      }}
      className={`group/edit relative inline rounded-md border border-dashed border-transparent px-0.5 -mx-0.5 transition-colors cursor-text hover:border-emerald-400/65 hover:bg-emerald-400/[0.07] ${className}`}
    >
      <span>{value}</span>
      <Pencil
        className="ml-1 inline-block h-[0.75em] w-[0.75em] align-middle text-emerald-400 opacity-0 transition-opacity group-hover/edit:opacity-100"
        aria-hidden="true"
      />
    </span>
  );
}

interface EditableNumberProps {
  value: number;
  onCommit: (nextValue: number) => void;
  min?: number;
  max?: number;
  step?: number;
  suffix?: string;
  className?: string;
}

export function EditableNumber({
  value,
  onCommit,
  min = 0,
  max = 100,
  step = 1,
  suffix = '',
  className = '',
}: EditableNumberProps) {
  const { canInlineEdit } = useSiteContent();
  const [editing, setEditing] = useState(false);
  const [localVal, setLocalVal] = useState(String(value));
  const inputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (!editing) {
      setLocalVal(String(value));
    }
  }, [value, editing]);

  useEffect(() => {
    if (!canInlineEdit && editing) {
      setEditing(false);
    }
  }, [canInlineEdit, editing]);

  useEffect(() => {
    if (editing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [editing]);

  if (!canInlineEdit) {
    return (
      <>
        {value}
        {suffix}
      </>
    );
  }

  const commit = () => {
    setEditing(false);
    const parsed = Number(localVal.replace(',', '.'));
    if (!Number.isFinite(parsed)) {
      setLocalVal(String(value));
      return;
    }
    const clamped = Math.max(min, Math.min(max, parsed));
    const rounded = step < 1 ? Math.round(clamped * 10) / 10 : Math.round(clamped);
    if (rounded !== value) {
      onCommit(rounded);
    }
  };

  if (editing) {
    return (
      <span
        className="inline-flex items-center gap-1"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
        }}
      >
        <input
          ref={inputRef}
          type="number"
          min={min}
          max={max}
          step={step}
          value={localVal}
          onChange={(e) => setLocalVal(e.target.value)}
          onBlur={commit}
          onKeyDown={(e) => {
            if (e.key === 'Escape') {
              e.preventDefault();
              setLocalVal(String(value));
              setEditing(false);
            } else if (e.key === 'Enter') {
              e.preventDefault();
              commit();
            }
          }}
          className="w-18 rounded-lg border border-emerald-400/80 bg-[#070b0f] px-1.5 py-0.5 text-center font-mono-tabular text-sm text-[#f7f8f8] focus:outline-none"
        />
        {suffix && <span>{suffix}</span>}
      </span>
    );
  }

  return (
    <span
      role="button"
      tabIndex={0}
      title="Zahl anklicken zum Bearbeiten"
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        setEditing(true);
      }}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          e.stopPropagation();
          setEditing(true);
        }
      }}
      className={`inline-flex items-center rounded-md border border-dashed border-transparent px-1 -mx-1 cursor-text transition-colors hover:border-emerald-400/70 hover:bg-emerald-400/[0.08] ${className}`}
    >
      {value}
      {suffix}
    </span>
  );
}
