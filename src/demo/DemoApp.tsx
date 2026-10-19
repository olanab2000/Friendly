import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import FullCalendar from '@fullcalendar/react'
import dayGridPlugin from '@fullcalendar/daygrid'
import timeGridPlugin from '@fullcalendar/timegrid'
import interactionPlugin from '@fullcalendar/interaction'
import { format } from 'date-fns'
import { Calendar, Users, UserPlus, Sparkles, X, ArrowLeft } from 'lucide-react'
import { MOCK_EVENTS, MOCK_FRIENDS, MOCK_SUGGESTIONS } from './mockData'

type Tab = 'calendar' | 'friends' | 'groups'

function Avatar({ name, color, size = 'md' }: { name: string; color: string; size?: 'sm' | 'md' | 'lg' }) {
  const initials = name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
  const sizes = { sm: 'w-7 h-7 text-xs', md: 'w-9 h-9 text-sm', lg: 'w-11 h-11 text-base' }
  return (
    <div className={`${sizes[size]} rounded-full flex items-center justify-center font-semibold text-white flex-shrink-0`} style={{ backgroundColor: color }}>
      {initials}
    </div>
  )
}

function AvailabilityBar({ available, total }: { available: number; total: number }) {
  const pct = (available / total) * 100
  const color = pct === 100 ? '#22c55e' : pct >= 75 ? '#84cc16' : pct >= 50 ? '#eab308' : '#f97316'
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
        <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, backgroundColor: color }} />
      </div>
      <span className="text-xs text-gray-500 w-10 text-right">{available}/{total}</span>
    </div>
  )
}

export default function DemoApp() {
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState<Tab>('calendar')
  const [showBanner, setShowBanner] = useState(true)

  const fcEvents = MOCK_EVENTS.map(e => ({
    id: e.id,
    title: e.title,
    start: e.start_time,
    end: e.end_time,
    allDay: e.all_day,
    backgroundColor: e.color,
    borderColor: e.color,
  }))

  const navItems: { id: Tab; label: string; icon: typeof Calendar }[] = [
    { id: 'calendar', label: 'Calendar', icon: Calendar },
    { id: 'friends', label: 'Friends', icon: UserPlus },
    { id: 'groups', label: 'Groups', icon: Users },
  ]

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      {/* Sidebar */}
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
          {navItems.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                activeTab === id
                  ? 'bg-brand-50 text-brand-700'
                  : 'text-gray-500 hover:bg-gray-50 hover:text-gray-800'
              }`}
            >
              <Icon size={16} className={activeTab === id ? 'text-brand-600' : ''} />
              {label}
            </button>
          ))}
        </nav>

        <div className="p-3 border-t border-gray-100">
          <div className="flex items-center gap-3 px-2 py-2">
            <Avatar name="Olivia Abrink" color="#8b5cf6" size="sm" />
            <div className="min-w-0">
              <p className="text-xs font-semibold text-gray-900 truncate">Olivia</p>
              <p className="text-xs text-gray-400 truncate">@olivia</p>
            </div>
          </div>
          <button
            onClick={() => navigate('/')}
            className="mt-2 w-full flex items-center gap-2 px-3 py-2 text-xs text-brand-600 font-medium bg-brand-50 hover:bg-brand-100 rounded-lg transition-colors"
          >
            <ArrowLeft size={12} />
            Sign up to save your data
          </button>
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Demo banner */}
        {showBanner && (
          <div className="bg-amber-50 border-b border-amber-200 px-5 py-2.5 flex items-center justify-between flex-shrink-0">
            <p className="text-xs text-amber-800">
              <span className="font-semibold">Preview mode</span> — this is demo data.{' '}
              <button onClick={() => navigate('/')} className="underline hover:text-amber-900">Sign up</button>{' '}
              to use your real calendar.
            </p>
            <button onClick={() => setShowBanner(false)} className="text-amber-500 hover:text-amber-700 ml-4">
              <X size={14} />
            </button>
          </div>
        )}

        {/* Calendar tab */}
        {activeTab === 'calendar' && (
          <div className="flex-1 flex flex-col min-h-0">
            <div className="flex items-center justify-between px-6 py-4 bg-white border-b border-gray-100">
              <div>
                <h1 className="text-base font-semibold text-gray-900">My Calendar</h1>
                <p className="text-xs text-gray-400">{format(new Date(), 'MMMM yyyy')}</p>
              </div>
              <button className="flex items-center gap-1.5 bg-brand-600 text-white px-4 py-2 rounded-lg text-xs font-semibold hover:bg-brand-700 transition-colors shadow-sm">
                <span className="text-base leading-none">+</span> New event
              </button>
            </div>
            <div className="flex-1 p-5 min-h-0">
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden h-full">
                <FullCalendar
                  plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
                  initialView="dayGridMonth"
                  headerToolbar={{ left: 'prev,next today', center: 'title', right: 'dayGridMonth,timeGridWeek' }}
                  events={fcEvents}
                  height="100%"
                  dayMaxEvents={3}
                />
              </div>
            </div>
          </div>
        )}

        {/* Friends tab */}
        {activeTab === 'friends' && (
          <div className="flex-1 overflow-y-auto">
            <div className="flex items-center justify-between px-6 py-4 bg-white border-b border-gray-100">
              <div>
                <h1 className="text-base font-semibold text-gray-900">Friends</h1>
                <p className="text-xs text-gray-400">{MOCK_FRIENDS.length} friends</p>
              </div>
              <button className="flex items-center gap-1.5 bg-brand-600 text-white px-4 py-2 rounded-lg text-xs font-semibold hover:bg-brand-700 transition-colors shadow-sm">
                <UserPlus size={13} /> Add friend
              </button>
            </div>

            <div className="p-5 space-y-4">
              {/* Search bar */}
              <div className="relative">
                <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <input
                  type="text"
                  placeholder="Search by name or username…"
                  className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent"
                />
              </div>

              {/* Friends grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {MOCK_FRIENDS.map(friend => (
                  <div key={friend.id} className="bg-white rounded-2xl border border-gray-100 p-4 flex items-center gap-4 hover:border-brand-200 hover:shadow-sm transition-all group">
                    <Avatar name={friend.full_name} color={friend.color} size="lg" />
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-gray-900 text-sm">{friend.full_name}</p>
                      <p className="text-xs text-gray-400 mt-0.5">@{friend.username}</p>
                    </div>
                    <div className="flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button className="text-xs bg-brand-50 text-brand-700 px-3 py-1.5 rounded-lg font-medium hover:bg-brand-100 transition-colors">
                        View
                      </button>
                    </div>
                  </div>
                ))}

                {/* Add friend card */}
                <button className="bg-gray-50 rounded-2xl border border-dashed border-gray-300 p-4 flex items-center gap-3 hover:border-brand-400 hover:bg-brand-50 transition-all group">
                  <div className="w-11 h-11 rounded-full border-2 border-dashed border-gray-300 group-hover:border-brand-400 flex items-center justify-center transition-colors">
                    <span className="text-gray-400 group-hover:text-brand-500 text-xl leading-none">+</span>
                  </div>
                  <span className="text-sm text-gray-400 group-hover:text-brand-600 font-medium transition-colors">Add a friend</span>
                </button>
              </div>

              {/* Pending requests */}
              <div className="bg-white rounded-2xl border border-amber-200 p-4">
                <p className="text-xs font-semibold text-amber-700 uppercase tracking-wide mb-3">1 pending request</p>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Avatar name="Maria Lindqvist" color="#f59e0b" size="md" />
                    <div>
                      <p className="text-sm font-medium text-gray-900">Maria Lindqvist</p>
                      <p className="text-xs text-gray-400">@marialindqvist</p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button className="text-xs bg-green-100 text-green-700 px-3 py-1.5 rounded-lg font-semibold hover:bg-green-200 transition-colors">Accept</button>
                    <button className="text-xs bg-gray-100 text-gray-500 px-3 py-1.5 rounded-lg font-semibold hover:bg-gray-200 transition-colors">Decline</button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Groups tab */}
        {activeTab === 'groups' && (
          <div className="flex-1 overflow-y-auto">
            <div className="flex items-center justify-between px-6 py-4 bg-white border-b border-gray-100">
              <div>
                <h1 className="text-base font-semibold text-gray-900">Groups</h1>
                <p className="text-xs text-gray-400">Plan meetups together</p>
              </div>
              <button className="flex items-center gap-1.5 bg-brand-600 text-white px-4 py-2 rounded-lg text-xs font-semibold hover:bg-brand-700 transition-colors shadow-sm">
                <span className="text-base leading-none">+</span> New group
              </button>
            </div>

            <div className="p-5 space-y-4">
              {/* Group card */}
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="p-5">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-semibold text-gray-900">Weekend crew</h3>
                      <div className="flex items-center gap-2 mt-2">
                        <div className="flex -space-x-2">
                          {MOCK_FRIENDS.map(f => (
                            <Avatar key={f.id} name={f.full_name} color={f.color} size="sm" />
                          ))}
                        </div>
                        <span className="text-xs text-gray-400">{MOCK_FRIENDS.length + 1} members including you</span>
                      </div>
                    </div>
                    <span className="text-xs bg-green-50 text-green-700 border border-green-200 px-2.5 py-1 rounded-full font-medium">Active</span>
                  </div>
                </div>

                {/* Suggestions */}
                <div className="border-t border-gray-100 p-5 bg-gray-50/50">
                  <div className="flex items-center gap-2 mb-4">
                    <Sparkles size={14} className="text-brand-500" />
                    <p className="text-xs font-semibold text-gray-700 uppercase tracking-wide">Best times to meet</p>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    {MOCK_SUGGESTIONS.map((s, i) => {
                      const pct = s.available / s.total
                      const isAll = pct === 1
                      return (
                        <div
                          key={i}
                          className={`rounded-xl p-3.5 border cursor-pointer hover:-translate-y-0.5 transition-all ${
                            isAll
                              ? 'bg-green-50 border-green-200 hover:border-green-400'
                              : 'bg-white border-gray-200 hover:border-brand-300'
                          }`}
                        >
                          <p className="text-xs font-semibold text-gray-700">
                            {format(s.start, 'EEE, MMM d')}
                          </p>
                          <p className="text-sm font-bold text-gray-900 mt-0.5">{s.hour}</p>
                          <div className="mt-2">
                            <AvailabilityBar available={s.available} total={s.total} />
                          </div>
                          {isAll && (
                            <span className="inline-block mt-2 text-xs text-green-700 font-semibold bg-green-100 px-2 py-0.5 rounded-full">
                              Everyone free ✓
                            </span>
                          )}
                        </div>
                      )
                    })}
                  </div>

                  <button className="mt-4 w-full text-xs text-brand-600 font-semibold hover:text-brand-700 py-2 border border-brand-200 rounded-xl hover:bg-brand-50 transition-colors">
                    Suggest a time to the group →
                  </button>
                </div>
              </div>

              {/* Empty state card */}
              <button className="w-full bg-white rounded-2xl border border-dashed border-gray-300 p-8 flex flex-col items-center gap-2 hover:border-brand-400 hover:bg-brand-50/30 transition-all group">
                <div className="w-10 h-10 rounded-full border-2 border-dashed border-gray-300 group-hover:border-brand-400 flex items-center justify-center transition-colors">
                  <span className="text-gray-400 group-hover:text-brand-500 text-xl leading-none">+</span>
                </div>
                <p className="text-sm font-medium text-gray-400 group-hover:text-brand-600 transition-colors">Create another group</p>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
