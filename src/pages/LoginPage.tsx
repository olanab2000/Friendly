import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'

export default function LoginPage() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isSignUp, setIsSignUp] = useState(false)
  const [fullName, setFullName] = useState('')
  const [username, setUsername] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<{ type: 'error' | 'success'; text: string } | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setMessage(null)

    if (isSignUp) {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { full_name: fullName, username } },
      })
      if (error) setMessage({ type: 'error', text: error.message })
      else setMessage({ type: 'success', text: 'Check your email to confirm your account!' })
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) setMessage({ type: 'error', text: error.message })
    }
    setLoading(false)
  }

  return (
    <div className="min-h-screen flex bg-white">
      {/* Left panel — branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-brand-600 to-brand-800 flex-col justify-between p-12 relative overflow-hidden">
        {/* Decorative blobs */}
        <div className="absolute -top-20 -left-20 w-72 h-72 bg-white/10 rounded-full" />
        <div className="absolute bottom-10 right-0 w-96 h-96 bg-white/5 rounded-full translate-x-1/2" />

        <div className="relative z-10">
          <div className="flex items-center gap-3">
            <div className="bg-white/20 backdrop-blur-sm p-2.5 rounded-xl">
              <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <span className="text-white font-bold text-xl tracking-tight">Friendly</span>
          </div>
        </div>

        <div className="relative z-10 space-y-6">
          <div>
            <h1 className="text-4xl font-bold text-white leading-snug">
              Plan together,<br />effortlessly.
            </h1>
            <p className="mt-3 text-brand-200 text-lg leading-relaxed">
              Connect your calendar with friends, find when everyone's free, and make plans happen.
            </p>
          </div>

          <div className="space-y-4">
            {[
              { icon: '📅', text: 'Sync your personal calendar' },
              { icon: '👥', text: 'See when friends are available' },
              { icon: '✨', text: 'Get smart meetup suggestions' },
            ].map(item => (
              <div key={item.text} className="flex items-center gap-3">
                <span className="text-xl">{item.icon}</span>
                <span className="text-white/90 text-sm">{item.text}</span>
              </div>
            ))}
          </div>
        </div>

        <p className="relative z-10 text-brand-300 text-xs">© 2026 Friendly</p>
      </div>

      {/* Right panel — form */}
      <div className="flex-1 flex flex-col justify-center px-6 sm:px-12 lg:px-16 xl:px-24 py-12">
        <div className="max-w-sm w-full mx-auto">
          {/* Mobile logo */}
          <div className="flex items-center gap-2 mb-10 lg:hidden">
            <div className="bg-brand-600 p-2 rounded-xl">
              <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <span className="font-bold text-gray-900 text-lg">Friendly</span>
          </div>

          <h2 className="text-2xl font-bold text-gray-900">
            {isSignUp ? 'Create your account' : 'Welcome back'}
          </h2>
          <p className="mt-1.5 text-sm text-gray-500">
            {isSignUp ? 'Start planning with friends in minutes.' : 'Sign in to your account.'}
          </p>

          <form onSubmit={handleSubmit} className="mt-8 space-y-4">
            {isSignUp && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Full name</label>
                  <input
                    type="text"
                    value={fullName}
                    onChange={e => setFullName(e.target.value)}
                    required
                    className="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent transition"
                    placeholder="Jane Smith"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Username</label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-sm">@</span>
                    <input
                      type="text"
                      value={username}
                      onChange={e => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
                      required
                      className="w-full border border-gray-300 rounded-xl pl-8 pr-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent transition"
                      placeholder="janesmith"
                    />
                  </div>
                </div>
              </>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Email</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                className="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent transition"
                placeholder="you@example.com"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-sm font-medium text-gray-700">Password</label>
              </div>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                minLength={6}
                className="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent transition"
                placeholder="••••••••"
              />
            </div>

            {message && (
              <div className={`p-3.5 rounded-xl text-sm font-medium ${message.type === 'error' ? 'bg-red-50 text-red-700 border border-red-100' : 'bg-green-50 text-green-700 border border-green-100'}`}>
                {message.text}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-brand-600 text-white py-3 rounded-xl font-semibold hover:bg-brand-700 disabled:opacity-50 transition-colors mt-2 shadow-sm shadow-brand-200"
            >
              {loading ? 'Loading…' : isSignUp ? 'Create account' : 'Sign in'}
            </button>
          </form>

          <div className="mt-4 relative">
            <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-gray-200" /></div>
            <div className="relative flex justify-center text-xs text-gray-400 bg-white px-3">or</div>
          </div>

          <button
            onClick={() => navigate('/demo')}
            className="mt-4 w-full border border-gray-200 text-gray-600 py-3 rounded-xl font-medium hover:bg-gray-50 transition-colors text-sm"
          >
            Preview the app →
          </button>

          <p className="mt-6 text-center text-sm text-gray-500">
            {isSignUp ? 'Already have an account?' : "Don't have an account?"}{' '}
            <button
              onClick={() => { setIsSignUp(!isSignUp); setMessage(null) }}
              className="text-brand-600 font-semibold hover:underline"
            >
              {isSignUp ? 'Sign in' : 'Sign up free'}
            </button>
          </p>
        </div>
      </div>
    </div>
  )
}
