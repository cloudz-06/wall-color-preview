import { useState, useEffect, useRef } from 'react'

export default function InlineEdit({ value, onSave, className }) {
  const [isEditing, setIsEditing] = useState(false)
  const [tempValue, setTempValue] = useState(value)
  const inputRef = useRef(null)

  useEffect(() => {
    setTempValue(value)
  }, [value])

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus()
      inputRef.current.select()
    }
  }, [isEditing])

  const handleSave = () => {
    if (tempValue.trim() !== '') {
      onSave(tempValue.trim())
    } else {
      setTempValue(value)
    }
    setIsEditing(false)
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') handleSave()
    if (e.key === 'Escape') {
      setTempValue(value)
      setIsEditing(false)
    }
  }

  if (isEditing) {
    return (
      <input
        ref={inputRef}
        type="text"
        value={tempValue}
        onChange={(e) => setTempValue(e.target.value)}
        onBlur={handleSave}
        onKeyDown={handleKeyDown}
        maxLength={50}
        onClick={(e) => e.stopPropagation()}
        className={`bg-transparent outline-none border-b border-brand-500 focus:border-brand-600 focus:ring-0 px-1 py-0.5 m-0 transition-colors ${className}`}
        style={{ width: `${Math.max(10, tempValue.length)}ch` }}
      />
    )
  }

  return (
    <span
      onClick={(e) => {
        e.stopPropagation();
        setIsEditing(true);
      }}
      className={`cursor-pointer hover:bg-black/5 px-1 py-0.5 rounded transition-colors ${className}`}
      title="Click to rename"
    >
      {value}
    </span>
  )
}
