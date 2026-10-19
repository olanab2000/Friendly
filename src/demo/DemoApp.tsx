import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import FullCalendar from '@fullcalendar/react'
import dayGridPlugin from '@fullcalendar/daygrid'
import timeGridPlugin from '@fullcalendar/timegrid'
import interactionPlugin from '@fullcalendar/interaction'
import { format, isToday, isWeekend } from 'date-fns'
import { Calendar, Users, UserPlus, X, ArrowLeft, ChevronRight } from 'lucide-react'
import { MOCK_EVENTS, MOCK_FRIENDS, buildGroupAvailability } from './mockData'
import type { DayAvailability } from './mockData'

type Tab = 'calendar' | 'friends' | 'groups'

function Avatar({ name, color, size = 'md', greyed = false }: {
  name: string; color: string; size?: 'xs' | 'sm' | 'md' | 'lg'; greyed?: boolean
}) {
  const initials = name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
  const sizes = { xs: 'w-5 h-5 text-[10px]', sm: 'w-7 h-7 text-xs', md: 'w-9 h-9 text-sm', lg: 'w-11 h-11 text-base' }
  return (
    <div
      className={`${sizes[size]} rounded-full flex items-center justify-center font-semibold text-white flex-shrink-0 transition-all`}
      style={{ backgroundColor: greyed ? '#d1d5db' : color }}
      title={name}
    >
      {initials}
    </div>
  )
}

function DayCard({ day, selected, onClick }: {
  day: DayAvailability; selected: boolean; onClick: () => void
}) {
  const ratio = day.freeCount / day.total
  const allFree = day.freeCount === day.total
  const weekend = isWeekend(day.date)

  let bg = 'bg-white border-gray-200'
  let badge = ''
  if (allFree) { bg = 'bg-green-50 border-green-300'; badge = 'ring-2 ring-green-400' }
  else if (ratio >= 0.75) bg = 'bg-lime-50 border-lime-200'
  else if (ratio >= 0.5) bg = 'bg-yellow-50 border-yellow-200'

  return (
    <button
      onClick={onClick}
      className={`relative border rounded-xl p-3 text-left transition-all hover:-translate-y-0.5 hover:shadow-md ${bg} ${selected ? 'ring-2 ring-brand-500 shadow-md' : badge} ${weekend ? 'opacity-60' : ''}`}
    >
      {allFree && (
        <span className="absolute -top-2 left-1/2 -translate-x-1/2 text-xs bg-green-500 text-white px-2 py-0.5 rounded-full font-semibold whitespace-nowrap">
          All free ✓
        </span>
      )}

      <p className={`text-xs font-medium ${isToday(day.date) ? 'text-brand-600' : 'text-gray-500'}`}>
        {format(day.date, 'EEE')}
      </p>
      <p className={`text-lg font-bold leading-tight ${isToday(day.date) ? 'text-brand-600' : 'text-gray-900'}`}>
        {format(day.date, 'd')}
      </p>
      <p className="text-xs text-gray-400 mb-2.5">{format(day.date, 'MMM')}</p>

      {/* Member availability dots */}
      <div className="flex flex-wrap gap-1">
        {/* Me */}
        <Avatar name="You" color="#8b5cf6" size="xs" greyed={day.myBusy} />
        {day.members.map(m => (
          <Avatar key={m.id} name={m.name} color={m.color} size="xs" greyed={!m.free} />
        ))}
      </div>

      <p className="text-xs font-semibold mt-2" style={{
        color: allFree ? '#16a34a' : ratio >= 0.75 ? '#65a30d' : ratio >= 0.5 ? '#ca8a04' : '#9ca3af'
      }}>
        {day.freeCount}/{day.total} free
      </p>
    </button>
  )
}

function DayDetail({ day }: { day: DayAvailability }) {
  const allFree = day.freeCount === day.total

  // My events on this day
  const myDayEvents = MOCK_EVENTS.filter(e => {
    const s = new Date(e.start_time)
    return format(s, 'yyyy-MM-dd') === format(day.date, 'yyyy-MM-dd') && e.is_busy
  })

  return (
    <div className="bg-white border border-gray-100 rounded-2xl p-5 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs text-gray-400 font-medium">{format(day.date, 'EEEE')}</p>
          <p className="text-xl font-bold text-gray-900">{format(day.date, 'MMMM d')}</p>
        </div>
        {allFree && (
          <span className="bg-green-100 text-green-700 text-xs font-semibold px-3 py-1.5 rounded-full">
            Everyone's free! 🎉
          </span>
        )}
      </div>

      {/* Who's free / busy */}
      <div className="space-y-2">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Group availability</p>

        <div className="space-y-2">
          {/* Me */}
          <div className="flex items-center justify-between py-2 border-b border-gray-50">
            <div className="flex items-center gap-2.5">
              <Avatar name="You" color="#8b5cf6" size="sm" greyed={day.myBusy} />
              <span className="text-sm font-medium text-gray-900">You</span>
            </div>
            {day.myBusy ? (
              <div className="text-right">
                <span className="text-xs font-medium text-gray-500 bg-gray-100 px-2.5 py-1 rounded-full">Busy</span>
                {myDayEvents.length > 0 && (
                  <div className="mt-1 space-y-0.5">
                    {myDayEvents.map(e => (
                      <p key={e.id} className="text-xs text-gray-400" style={{ color: e.color }}>
                        ● {e.title}
                      </p>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <span className="text-xs font-semibold text-green-700 bg-green-100 px-2.5 py-1 rounded-full">Free</span>
            )}
          </div>

          {/* Friends — no event details, just free/busy */}
          {day.members.map(m => (
            <div key={m.id} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
              <div className="flex items-center gap-2.5">
                <Avatar name={m.name} color={m.color} size="sm" greyed={!m.free} />
                <span className="text-sm font-medium text-gray-900">{m.name.split(' ')[0]}</span>
              </div>
              {m.free ? (
                <span className="text-xs font-semibold text-green-700 bg-green-100 px-2.5 py-1 rounded-full">Free</span>
              ) : (
                <span className="text-xs font-medium text-gray-500 bg-gray-100 px-2.5 py-1 rounded-full">Busy</span>
              )}
            </div>
          ))}
        </div>
      </div>

      <button className="w-full bg-brand-600 text-white py-2.5 rounded-xl text-sm font-semibold hover:bg-brand-700 transition-colors">
        Suggest this day to the group →
      </button>
    </div>
  )
}

export default function DemoApp() {
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState<Tab>('calendar')
  const [showBanner, setShowBanner] = useState(true)
  const [selectedDay, setSelectedDay] = useState<DayAvailability | null>(null)

  const availability = buildGroupAvailability(14)

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
              onClick={() => { setActiveTab(id); setSelectedDay(null) }}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                activeTab === id ? 'bg-brand-50 text-brand-700' : 'text-gray-500 hover:bg-gray-50 hover:text-gray-800'
              }`}
            >
              <Icon size={16} className={activeTab === id ? 'text-brand-600' : ''} />
              {label}
            </button>
          ))}
        </nav>

        <div className="p-3 border-t border-gray-100">
          <div className="flex items-center gap-2.5 px-2 py-2">
            <div className="w-7 h-7 rounded-full bg-brand-600 flex items-center justify-center text-white text-xs font-semibold">OA</div>
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
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {showBanner && (
          <div className="bg-amber-50 border-b border-amber-200 px-5 py-2.5 flex items-center justify-between flex-shrink-0">
            <p className="text-xs text-amber-800">
              <span className="font-semibold">Preview mode</span> — this is demo data.{' '}
              <button onClick={() => navigate('/')} className="underline hover:text-amber-900">Sign up</button>{' '}
              to use your real calendar.
            </p>
            <button onClick={() => setShowBanner(false)} className="text-amber-500 hover:text-amber-700 ml-4"><X size={14} /></button>
          </div>
        )}

        {/* ── CALENDAR ── */}
        {activeTab === 'calendar' && (
          <div className="flex-1 flex flex-col min-h-0">
            <div className="flex items-center justify-between px-6 py-4 bg-white border-b border-gray-100 flex-shrink-0">
              <div>
                <h1 className="text-base font-semibold text-gray-900">My Calendar</h1>
                <p className="text-xs text-gray-400">{format(new Date(), 'MMMM yyyy')}</p>
              </div>
              <button className="flex items-center gap-1.5 bg-brand-600 text-white px-4 py-2 rounded-lg text-xs font-semibold hover:bg-brand-700 transition-colors">
                <span className="text-base leading-none">+</span> New event
              </button>
            </div>
            <div className="flex-1 p-5 min-h-0 overflow-hidden">
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

        {/* ── FRIENDS ── */}
        {activeTab === 'friends' && (
          <div className="flex-1 overflow-y-auto">
            <div className="flex items-center justify-between px-6 py-4 bg-white border-b border-gray-100">
              <div>
                <h1 className="text-base font-semibold text-gray-900">Friends</h1>
                <p className="text-xs text-gray-400">{MOCK_FRIENDS.length} friends</p>
              </div>
              <button className="flex items-center gap-1.5 bg-brand-600 text-white px-4 py-2 rounded-lg text-xs font-semibold hover:bg-brand-700 transition-colors">
                <UserPlus size={13} /> Add friend
              </button>
            </div>
            <div className="p-5 space-y-4">
              <div className="relative">
                <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <input type="text" placeholder="Search by name or username…" className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {MOCK_FRIENDS.map(friend => (
                  <div key={friend.id} className="bg-white rounded-2xl border border-gray-100 p-4 flex items-center gap-3 hover:border-brand-200 hover:shadow-sm transition-all group">
                    <Avatar name={friend.full_name} color={friend.color} size="lg" />
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-gray-900 text-sm">{friend.full_name}</p>
                      <p className="text-xs text-gray-400">@{friend.username}</p>
                    </div>
                    <ChevronRight size={16} className="text-gray-300 group-hover:text-brand-400 transition-colors" />
                  </div>
                ))}
                <button className="bg-gray-50 rounded-2xl border border-dashed border-gray-300 p-4 flex items-center gap-3 hover:border-brand-400 hover:bg-brand-50 transition-all group">
                  <div className="w-11 h-11 rounded-full border-2 border-dashed border-gray-300 group-hover:border-brand-400 flex items-center justify-center">
                    <span className="text-gray-400 group-hover:text-brand-500 text-xl">+</span>
                  </div>
                  <span className="text-sm text-gray-400 group-hover:text-brand-600 font-medium">Add a friend</span>
                </button>
              </div>
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

        {/* ── GROUPS ── */}
        {activeTab === 'groups' && (
          <div className="flex-1 flex flex-col overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 bg-white border-b border-gray-100 flex-shrink-0">
              <div>
                <div className="flex items-center gap-2 text-xs text-gray-400 mb-0.5">
                  <span>Groups</span>
                  <ChevronRight size={12} />
                  <span className="text-gray-700 font-medium">Weekend crew</span>
                </div>
                <h1 className="text-base font-semibold text-gray-900">When can we hang out?</h1>
              </div>
              <div className="flex items-center gap-2">
                <div className="flex -space-x-2">
                  <div className="w-7 h-7 rounded-full bg-brand-600 border-2 border-white flex items-center justify-center text-white text-xs font-bold">OA</div>
                  {MOCK_FRIENDS.map(f => (
                    <Avatar key={f.id} name={f.full_name} color={f.color} size="sm" />
                  ))}
                </div>
                <span className="text-xs text-gray-400">{MOCK_FRIENDS.length + 1} people</span>
              </div>
            </div>

            <div className="flex-1 flex overflow-hidden">
              {/* Day grid */}
              <div className="flex-1 overflow-y-auto p-5">
                {/* Legend */}
                <div className="flex items-center gap-4 mb-4 text-xs text-gray-500">
                  <div className="flex items-center gap-1.5">
                    <div className="w-4 h-4 rounded-full bg-brand-500 flex items-center justify-center text-white text-[8px] font-bold">OA</div>
                    <span>Coloured = free</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className="w-4 h-4 rounded-full bg-gray-300" />
                    <span>Grey = busy</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className="w-3 h-3 rounded-full bg-green-400" />
                    <span>Everyone free</span>
                  </div>
                </div>

                <div className="grid grid-cols-7 gap-2">
                  {availability.map((day, i) => (
                    <DayCard
                      key={i}
                      day={day}
                      selected={selectedDay?.date.getTime() === day.date.getTime()}
                      onClick={() => setSelectedDay(prev =>
                        prev?.date.getTime() === day.date.getTime() ? null : day
                      )}
                    />
                  ))}
                </div>
              </div>

              {/* Day detail panel */}
              {selectedDay && (
                <div className="w-72 flex-shrink-0 border-l border-gray-100 overflow-y-auto p-4 bg-gray-50/50">
                  <DayDetail day={selectedDay} />
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
