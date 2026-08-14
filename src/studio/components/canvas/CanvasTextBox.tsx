'use client';

/**
 * CanvasTextBox - Standalone text element for the canvas.
 * Unlike visuals, textboxes don't have data buckets or queries.
 * They are simple text elements that can be positioned and formatted.
 */

import React, { useState, useRef, useCallback, useEffect } from 'react';
import type { CanvasTextBox as CanvasTextBoxType } from '../../types/dashboard';
import { TABLE_COLORS } from '../../lib/colors';

interface CanvasTextBoxProps {
  textBox: CanvasTextBoxType;
  isSelected: boolean;
  onSelect: () => void;
  onUpdate: (updates: Partial<CanvasTextBoxType>) => void;
}

/** Default formatting for new textboxes */
export const DEFAULT_TEXTBOX_FORMATTING: CanvasTextBoxType['formatting'] = {
  fontSize: 14,
  fontWeight: 'normal',
  fontStyle: 'normal',
  textDecoration: 'none',
  textAlign: 'left',
  color: TABLE_COLORS.headerText,
};

export const CanvasTextBox = React.memo(function CanvasTextBox({ textBox, isSelected, onSelect, onUpdate }: CanvasTextBoxProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [text, setText] = useState(textBox.text);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Sync text from props when not editing
  useEffect(() => {
    if (!isEditing) {
      setText(textBox.text);
    }
  }, [textBox.text, isEditing]);

  /** Handle click outside to finish editing */
  const handleBlur = useCallback(() => {
    setIsEditing(false);
    if (text !== textBox.text) {
      onUpdate({ text });
    }
  }, [text, textBox.text, onUpdate]);

  /** Handle keyboard shortcuts while editing */
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      setIsEditing(false);
      setText(textBox.text); // Revert
    }
    // Stop propagation to prevent canvas shortcuts
    e.stopPropagation();
  }, [textBox.text]);

  /** Auto-resize textarea to fit content */
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = textareaRef.current.scrollHeight + 'px';
    }
  }, [text, isEditing]);

  /** Build inline styles from formatting */
  const containerStyle: React.CSSProperties = {
    width: '100%',
    height: '100%',
    cursor: isEditing ? 'text' : 'move',
    border: isSelected ? '2px solid #FFB03F' : '2px solid transparent',
    boxSizing: 'border-box',
  };

  const textStyle: React.CSSProperties = {
    fontSize: textBox.formatting.fontSize,
    fontWeight: textBox.formatting.fontWeight,
    fontStyle: textBox.formatting.fontStyle,
    textDecoration: textBox.formatting.textDecoration,
    textAlign: textBox.formatting.textAlign,
    color: textBox.formatting.color,
    width: '100%',
    height: '100%',
    padding: '4px',
    overflow: 'hidden',
    whiteSpace: 'pre-wrap',
    wordBreak: 'break-word',
  };

  const textareaStyle: React.CSSProperties = {
    ...textStyle,
    resize: 'none',
    outline: 'none',
    background: 'transparent',
    border: 'none',
    fontFamily: 'inherit',
    lineHeight: 'inherit',
  };

  return (
    <div
      style={containerStyle}
      onClick={(e) => {
        e.stopPropagation();
        onSelect();
      }}
      onDoubleClick={(e) => {
        e.stopPropagation();
        setIsEditing(true);
      }}
    >
      {isEditing ? (
        <textarea
          ref={textareaRef}
          value={text}
          onChange={(e) => setText(e.target.value)}
          onBlur={handleBlur}
          onKeyDown={handleKeyDown}
          style={textareaStyle}
          autoFocus
        />
      ) : (
        <div
          style={textStyle}
          className="select-none"
        >
          {textBox.text || 'Duplo-clique para editar'}
        </div>
      )}
    </div>
  );
}, (prev, next) => {
  return prev.textBox.id === next.textBox.id
    && prev.textBox.text === next.textBox.text
    && prev.textBox.width === next.textBox.width
    && prev.textBox.height === next.textBox.height
    && prev.textBox.formatting.fontSize === next.textBox.formatting.fontSize
    && prev.textBox.formatting.fontWeight === next.textBox.formatting.fontWeight
    && prev.textBox.formatting.fontStyle === next.textBox.formatting.fontStyle
    && prev.textBox.formatting.textAlign === next.textBox.formatting.textAlign
    && prev.textBox.formatting.color === next.textBox.formatting.color
    && prev.isSelected === next.isSelected;
});
