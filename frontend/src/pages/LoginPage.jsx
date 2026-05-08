import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { useAuth } from '../context/AuthContext'
import { authAPI } from '../api/client'
import toast from 'react-hot-toast'
import { Eye, EyeOff, Lock, Mail } from 'lucide-react'
import { Spinner } from '../components/ui'

const ROLE_ROUTES = {
  hr: '/hr/dashboard',
  accounts: '/accounts/dashboard',
  it: '/it/dashboard',
  manager: '/manager/dashboard',
}

export default function LoginPage() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const { register, handleSubmit, formState: { errors } } = useForm()
  const [loading, setLoading] = useState(false)
  const [showPass, setShowPass] = useState(false)

  const onSubmit = async (data) => {
    setLoading(true)
    try {
      const res = await authAPI.login(data)
      login(res.data)
      toast.success(`Welcome back, ${res.data.name}!`)
      navigate(ROLE_ROUTES[res.data.role] || '/')
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Login failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex">
      {/* Left panel */}
      <div className="hidden lg:flex w-1/2 bg-slate-900 flex-col justify-between p-12 relative overflow-hidden">
        {/* Geometric decoration */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 left-20 w-64 h-64 border border-white rounded-full" />
          <div className="absolute top-32 left-32 w-40 h-40 border border-white rounded-full" />
          <div className="absolute bottom-32 right-20 w-80 h-80 border border-white rounded-full" />
        </div>
        <div className="relative z-10">
          <div className="w-10 h-10 bg-brand-500 rounded-xl flex items-center justify-center mb-8">
            <span className="text-white font-display font-bold text-lg">G</span>
          </div>
          <h1 className="font-display font-semibold text-4xl text-white leading-tight mb-4">
            Intern<br/>Onboarding<br/>System
          </h1>
          <p className="text-slate-400 text-base leading-relaxed max-w-xs">
            Streamlined digital onboarding for Grasim Industries Ltd. — MBDD &amp; TRADC divisions.
          </p>
        </div>
        <div className="relative z-10 flex flex-col gap-4">
          {['HR Admin', 'Accounts Team', 'IT Team', 'Project Manager'].map(role => (
            <div key={role} className="flex items-center gap-3">
              <div className="w-2 h-2 rounded-full bg-brand-400" />
              <span className="text-slate-400 text-sm">{role}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Right panel */}
      <div className="flex-1 flex items-center justify-center p-8 bg-white">
        <div className="w-full max-w-sm animate-fade-in">
          <div className="mb-8">
            <h2 className="font-display font-semibold text-2xl text-slate-900 mb-1">Sign in</h2>
            <p className="text-sm text-slate-500">Access your dashboard</p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <div>
              <label className="label">Email address</label>
              <div className="relative">
                <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="email"
                  placeholder="you@grasim.com"
                  className={`input pl-10 ${errors.email ? 'input-error' : ''}`}
                  {...register('email', { required: 'Email is required' })}
                />
              </div>
              {errors.email && <p className="text-xs text-red-500 mt-1">{errors.email.message}</p>}
            </div>

            <div>
              <label className="label">Password</label>
              <div className="relative">
                <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type={showPass ? 'text' : 'password'}
                  placeholder="••••••••"
                  className={`input pl-10 pr-10 ${errors.password ? 'input-error' : ''}`}
                  {...register('password', { required: 'Password is required' })}
                />
                <button type="button" onClick={() => setShowPass(!showPass)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                  {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {errors.password && <p className="text-xs text-red-500 mt-1">{errors.password.message}</p>}
            </div>

            <button type="submit" disabled={loading} className="btn-primary w-full justify-center py-3">
              {loading ? <Spinner size="sm" /> : 'Sign in'}
            </button>
          </form>

          <p className="text-xs text-slate-400 text-center mt-8">
            Grasim Industries Ltd. — Internal System<br/>
            For access, contact HR at hr@grasim.com
          </p>
        </div>
      </div>
    </div>
  )
}
