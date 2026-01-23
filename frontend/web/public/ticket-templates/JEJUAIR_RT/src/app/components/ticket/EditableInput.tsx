import React, { useState, useEffect } from 'react';

interface EditableInputProps {
  initialValue: string;
  className?: string;
  multiline?: boolean;
}

export const EditableInput: React.FC<EditableInputProps> = ({ initialValue, className = "", multiline = false }) => {
  const [value, setValue] = useState(initialValue);

  // Sync state if prop changes (optional, but good for reset)
  useEffect(() => {
    setValue(initialValue);
  }, [initialValue]);

  // Added 'font-inherit' (via style) and text alignment classes to ensure it matches parent styles perfectly.
  // Using inline styles for font inheritance is often more reliable for form inputs than utility classes alone
  // depending on the reset being used.
  const baseStyles = "bg-transparent border-b border-transparent hover:border-gray-300 focus:border-orange-500 focus:outline-none transition-colors w-full p-0 rounded-sm leading-inherit";

  const styleProps = {
    font: 'inherit',
    color: 'inherit',
    letterSpacing: 'inherit',
    textAlign: 'inherit' as const,
  };

  if (multiline) {
    return (
      <textarea
        value={value}
        onChange={(e) => setValue(e.target.value)}
        className={`${baseStyles} resize-none overflow-hidden ${className}`}
        rows={1}
        style={{ ...styleProps, height: 'auto', minHeight: '1.5em' }}
        onInput={(e) => {
          const target = e.target as HTMLTextAreaElement;
          target.style.height = 'auto';
          target.style.height = `${target.scrollHeight}px`;
        }}
      />
    );
  }

  return (
    <input
      type="text"
      value={value}
      onChange={(e) => setValue(e.target.value)}
      className={`${baseStyles} ${className}`}
      style={styleProps}
    />
  );
};
