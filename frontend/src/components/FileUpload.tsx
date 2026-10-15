import { useCallback, useRef, useState } from 'react'
import { Upload, File, X, AlertCircle, CheckCircle } from 'lucide-react'

interface FileUploadProps {
  id: string
  label: string
  accept: string
  maxSizeMB: number
  file: File | null
  onFileChange: (file: File | null) => void
  error?: string
  description?: string
  allowedExtensions: string[]
  icon?: React.ReactNode
  hint?: React.ReactNode
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export default function FileUpload({
  id,
  label,
  accept,
  maxSizeMB,
  file,
  onFileChange,
  error,
  description,
  allowedExtensions,
  icon,
  hint,
}: FileUploadProps) {
  const [isDragging, setIsDragging] = useState(false)
  const [localError, setLocalError] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const validateFile = (f: File): string | null => {
    const ext = '.' + f.name.split('.').pop()?.toLowerCase()
    if (!allowedExtensions.includes(ext)) {
      return `Invalid file type. Please upload: ${allowedExtensions.join(', ')}`
    }
    if (f.size === 0) {
      return 'File is empty. Please select a valid file.'
    }
    if (f.size > maxSizeMB * 1024 * 1024) {
      return `File too large (${formatBytes(f.size)}). Maximum: ${maxSizeMB} MB.`
    }
    return null
  }

  const handleFile = (f: File) => {
    const err = validateFile(f)
    if (err) {
      setLocalError(err)
      onFileChange(null)
    } else {
      setLocalError(null)
      onFileChange(f)
    }
  }

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    const dropped = e.dataTransfer.files[0]
    if (dropped) handleFile(dropped)
  }, [])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0]
    if (selected) handleFile(selected)
    // Reset input so same file can be re-selected
    e.target.value = ''
  }

  const displayError = localError || error

  return (
    <div className="space-y-2">
      <label htmlFor={id} className="label">{label}</label>
      {description && (
        <p className="text-xs text-pine-slate-light mb-2">{description}</p>
      )}

      {file ? (
        /* File selected state */
        <div className={`flex items-center gap-3 p-4 rounded-xl border transition-all ${
          displayError ? 'border-status-error bg-red-50' : 'border-pine-green bg-pine-green-light'
        }`}>
          <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
            displayError ? 'bg-red-100' : 'bg-pine-green bg-opacity-20'
          }`}>
            <File size={20} className={displayError ? 'text-status-error' : 'text-pine-green'} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-pine-navy truncate">{file.name}</p>
            <p className="text-xs text-pine-slate-light">{formatBytes(file.size)}</p>
          </div>
          <div className="flex items-center gap-2">
            {!displayError && <CheckCircle size={16} className="text-pine-green" />}
            <button
              type="button"
              onClick={() => {
                onFileChange(null)
                setLocalError(null)
              }}
              className="p-1.5 rounded-lg hover:bg-white text-pine-slate-light hover:text-pine-navy transition-colors"
              aria-label="Remove file"
            >
              <X size={16} />
            </button>
          </div>
        </div>
      ) : (
        /* Drop zone */
        <div
          className={`upload-zone ${isDragging ? 'upload-zone-active' : ''} ${
            displayError ? 'border-status-error' : ''
          }`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => inputRef.current?.click()}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => e.key === 'Enter' && inputRef.current?.click()}
          aria-label={`Upload ${label}`}
        >
          <input
            ref={inputRef}
            id={id}
            type="file"
            accept={accept}
            onChange={handleInputChange}
            className="hidden"
          />
          <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-3 transition-colors ${
            isDragging ? 'bg-pine-green' : 'bg-pine-cream'
          }`}>
            {icon || <Upload size={22} className={isDragging ? 'text-white' : 'text-pine-slate-light'} />}
          </div>
          <p className="text-sm font-semibold text-pine-navy">
            {isDragging ? 'Drop it here' : 'Drop file here or click to browse'}
          </p>
          <p className="text-xs text-pine-slate-light mt-1">
            {allowedExtensions.join(', ').toUpperCase()} · Max {maxSizeMB} MB
          </p>
        </div>
      )}

      {/* Hint */}
      {hint && !file && (
        <div className="mt-2 p-3 rounded-lg bg-pine-cream border border-pine-border">
          {hint}
        </div>
      )}

      {/* Error */}
      {displayError && (
        <p className="error-text">
          <AlertCircle size={12} />
          {displayError}
        </p>
      )}
    </div>
  )
}
