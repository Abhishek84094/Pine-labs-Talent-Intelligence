import { useState, useEffect } from 'react'
import {
  Mail, ShieldCheck, CheckCircle2, AlertCircle, X,
  Key, Server, Send, ExternalLink, HelpCircle, Eye, EyeOff
} from 'lucide-react'
import { emailApi } from '../services/api'

interface EmailConfigModalProps {
  onClose: () => void
  onSaved?: () => void
}

export default function EmailConfigModal({ onClose, onSaved }: EmailConfigModalProps) {
  const [host, setHost] = useState('smtp.gmail.com')
  const [port, setPort] = useState(587)
  const [user, setUser] = useState('')
  const [password, setPassword] = useState('')
  const [fromName, setFromName] = useState('Pine Labs Talent Intelligence')
  const [showPassword, setShowPassword] = useState(false)

  // Status & test
  const [currentStatus, setCurrentStatus] = useState<any>(null)
  const [testEmail, setTestEmail] = useState('abhishekkumarmahto9366@gmail.com')
  const [isTesting, setIsTesting] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null)
  const [error, setError] = useState('')

  useEffect(() => {
    emailApi.getStatus().then((status) => {
      setCurrentStatus(status)
      if (status.host) setHost(status.host)
      if (status.port) setPort(status.port)
      if (status.user) setUser(status.user)
      if (status.from_name) setFromName(status.from_name)
    }).catch(() => {})
  }, [])

  const handleSave = async () => {
    if (!user || !password) {
      setError('Please provide both your email address and 16-character App Password.')
      return
    }
    setIsSaving(true)
    setError('')
    try {
      await emailApi.updateConfig({
        smtp_host: host,
        smtp_port: Number(port),
        smtp_user: user.trim(),
        smtp_password: password.trim().replace(/\s+/g, ''),
        smtp_from_email: user.trim(),
        smtp_from_name: fromName,
      })
      const updated = await emailApi.getStatus()
      setCurrentStatus(updated)
      if (onSaved) onSaved()
      setTestResult({
        success: true,
        message: 'SMTP credentials saved successfully! You can now send real emails.'
      })
    } catch (err: any) {
      setError(err?.response?.data?.detail || err.message || 'Failed to save configuration.')
    } finally {
      setIsSaving(false)
    }
  }

  const handleSendTest = async () => {
    if (!testEmail) {
      setError('Please enter an email address to receive the test.')
      return
    }
    setIsTesting(true)
    setError('')
    setTestResult(null)

    // Save first if user changed password or username
    try {
      if (user && password) {
        await emailApi.updateConfig({
          smtp_host: host,
          smtp_port: Number(port),
          smtp_user: user.trim(),
          smtp_password: password.trim().replace(/\s+/g, ''),
          smtp_from_email: user.trim(),
          smtp_from_name: fromName,
        })
      }

      const res = await emailApi.sendTestEmail(testEmail)
      setTestResult({
        success: true,
        message: `Success! ${res.message} Please check your inbox (and Spam/Junk folder just in case).`
      })
      const updated = await emailApi.getStatus()
      setCurrentStatus(updated)
      if (onSaved) onSaved()
    } catch (err: any) {
      setError(err?.response?.data?.detail || err.message || 'Failed to send test email.')
    } finally {
      setIsTesting(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-pine-forest/70 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
      <div className="bg-white rounded-2xl max-w-xl w-full max-h-[92vh] flex flex-col shadow-2xl border border-pine-border overflow-hidden">
        
        {/* Header */}
        <div className="bg-pine-forest-deep text-white px-6 py-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-pine-lime text-pine-forest flex items-center justify-center font-bold">
              <Mail size={20} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-pine-lime">Email Configuration</span>
                <span className="text-white/40">·</span>
                <span className={`text-[11px] font-bold px-2 py-0.5 rounded ${
                  currentStatus?.is_configured ? 'bg-emerald-500/20 text-emerald-300' : 'bg-amber-500/20 text-amber-300'
                }`}>
                  {currentStatus?.is_configured ? 'Live SMTP Connected' : 'Simulated Demo Mode'}
                </span>
              </div>
              <h2 className="text-lg font-bold text-white">Deliver Real Emails to Inboxes</h2>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto flex-1 space-y-5">
          {error && (
            <div className="p-3.5 bg-red-50 border border-red-200 rounded-xl flex items-start gap-2.5 text-xs text-status-error leading-relaxed">
              <AlertCircle size={16} className="flex-shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {testResult && (
            <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl flex items-start gap-2.5 text-xs text-emerald-800 leading-relaxed">
              <CheckCircle2 size={16} className="text-emerald-700 flex-shrink-0 mt-0.5" />
              <span>{testResult.message}</span>
            </div>
          )}

          {/* Quick instructions banner */}
          <div className="p-4 bg-pine-cream border border-pine-border rounded-xl">
            <h4 className="text-xs font-bold text-pine-forest uppercase tracking-wider flex items-center gap-1.5 mb-2">
              <ShieldCheck size={15} className="text-pine-forest" />
              How to Send Real Emails via Gmail (1-Minute Setup)
            </h4>
            <p className="text-xs text-pine-slate-light leading-relaxed mb-2">
              Google requires a <strong>16-character App Password</strong> for external apps to send emails:
            </p>
            <ol className="text-xs text-pine-slate space-y-1 pl-4 list-decimal">
              <li>Go to your <a href="https://myaccount.google.com/security" target="_blank" rel="noreferrer" className="text-pine-forest font-bold hover:underline inline-flex items-center gap-0.5">Google Security Settings <ExternalLink size={10} /></a>.</li>
              <li>Ensure <strong>2-Step Verification</strong> is ON.</li>
              <li>Search for <strong>"App Passwords"</strong>, create one named <em>"Pine Labs"</em>, and copy the 16 characters below.</li>
            </ol>
          </div>

          {/* Form */}
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label">SMTP Provider / Host</label>
                <input
                  type="text"
                  value={host}
                  onChange={e => setHost(e.target.value)}
                  placeholder="smtp.gmail.com"
                  className="input-field text-sm"
                />
              </div>
              <div>
                <label className="label">Port</label>
                <input
                  type="number"
                  value={port}
                  onChange={e => setPort(Number(e.target.value))}
                  placeholder="587"
                  className="input-field text-sm"
                />
              </div>
            </div>

            <div>
              <label className="label">Your Gmail / Sender Email Address</label>
              <input
                type="email"
                value={user}
                onChange={e => setUser(e.target.value)}
                placeholder="your.email@gmail.com"
                className="input-field text-sm font-mono"
              />
            </div>

            <div>
              <label className="label flex items-center justify-between">
                <span>16-Character Google App Password</span>
                <span className="text-[11px] text-pine-slate-light font-normal">Not your personal Google password</span>
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="abcd efgh ijkl mnop"
                  className="input-field text-sm font-mono pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-pine-slate-light hover:text-pine-forest"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <div>
              <label className="label">Display Name</label>
              <input
                type="text"
                value={fromName}
                onChange={e => setFromName(e.target.value)}
                placeholder="Pine Labs Talent Intelligence"
                className="input-field text-sm"
              />
            </div>
          </div>

          {/* Test Email Section */}
          <div className="pt-3 border-t border-pine-border">
            <label className="text-xs font-bold text-pine-forest uppercase tracking-wider block mb-1.5">
              Verify with Live Test Email
            </label>
            <div className="flex gap-2">
              <input
                type="email"
                value={testEmail}
                onChange={e => setTestEmail(e.target.value)}
                placeholder="Recipient email address"
                className="input-field text-xs flex-1 font-mono"
              />
              <button
                type="button"
                onClick={handleSendTest}
                disabled={isTesting || !user || !password}
                className="btn-primary text-xs flex items-center gap-1.5 flex-shrink-0"
              >
                {isTesting ? (
                  <>
                    <div className="spinner w-3 h-3 border-pine-forest" />
                    Sending Test...
                  </>
                ) : (
                  <>
                    <Send size={13} />
                    Send Test Email
                  </>
                )}
              </button>
            </div>
            <p className="text-[11px] text-pine-slate-light mt-1">
              Sends an immediate verification email to verify SMTP connectivity.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-pine-cream border-t border-pine-border px-6 py-4 flex items-center justify-between">
          <button
            type="button"
            onClick={onClose}
            className="btn-secondary text-xs"
          >
            Close
          </button>

          <button
            type="button"
            onClick={handleSave}
            disabled={isSaving}
            className="btn-primary text-xs flex items-center gap-1.5"
          >
            {isSaving ? (
              <>
                <div className="spinner w-3 h-3 border-pine-forest" />
                Saving...
              </>
            ) : (
              <>
                <CheckCircle2 size={14} />
                Save Email Credentials
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
