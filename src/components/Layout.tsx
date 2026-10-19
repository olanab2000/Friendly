import type { ReactNode } from 'react'
import { NavLink } from 'react-router-dom'
import { Calendar, Users, UserPlus, LogOut } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'

function Avatar({ name }: { name: string }) {
  const initials = name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
  return (
    <div className="w-7 h-7 rounded-full bg-brand-600 flex items-center justify-center text-white text-xs font-semibold flex-shrink-0">
      {initials}
    </div>
  )
}

export default function Layout({ children }: { children: ReactNode }) {
  const { profile, signOut } = useAuth()
  const displayName = profile?.full_name ?? 'My Account'

  const navItems = [
    { to: '/', label: 'Calendar', icon: Calendar },
    { to: '/friends', label: 'Friends', icon: UserPlus },
    { to: '/groups', label: 'Groups', icon: Users },
  ]

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      <aside className="w-56 bg-white border-r border-gray-100 flex flex-col flex-shrink-0">
        <div className="px-5 py-5 border-b border-gray-100">
          <div className="flex items-center gap-2.5">
            <div className="bg-brand-600 text-white p-1.5 rounded-lg">
              <Calendar size={16} />
            </div>
            <span className="font-bold text-gray-900 tracking-tight">Friendly</span>
          </div>
        </div>

        <nav className="flex-1 p-3 space-y-0.5">
          {navItems.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                  isActive
                    ? 'bg-brand-50 text-brand-700'
                    : 'text-gray-500 hover:bg-gray-50 hover:text-gray-800'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <Icon size={16} className={isActive ? 'text-brand-600' : ''} />
                  {label}
                </>
              )}
            </NavLink>
          ))}
        </nav>

        <div className="p-3 border-t border-gray-100">
          <div className="flex items-center gap-2.5 px-2 py-2">
            <Avatar name={displayName} />
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-gray-900 truncate">{displayName}</p>
              {profile?.username && (
                <p className="text-xs text-gray-400 truncate">@{profile.username}</p>
              )}
            </div>
          </div>
          <button
            onClick={signOut}
            className="mt-1 w-full flex items-center gap-2 px-3 py-2 text-xs text-gray-400 hover:text-red-500 rounded-lg hover:bg-red-50 transition-colors"
          >
            <LogOut size={13} />
            Sign out
          </button>
        </div>
      </aside>

      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {children}
      </main>
    </div>
  )
}
