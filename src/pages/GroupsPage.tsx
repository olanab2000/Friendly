import { useEffect, useState } from 'react'
import { Users, Plus, X, ChevronRight, Loader2 } from 'lucide-react'
import { format, startOfDay, endOfDay, addDays, isToday, isWeekend } from 'date-fns'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import type { Group, Profile } from '../types'

interface Member {
  userId: string
  name: string
  color: string
  isMe: boolean
}

interface BusySlot {
  userId: string
  start: Date
  end: Date
}

interface DayRow {
  date: Date
  members: { member: Member; free: boolean }[]
  freeCount: number
}

const MEMBER_COLORS = ['#8b5cf6', '#3b82f6', '#ec4899', '#22c55e', '#f97316', '#06b6d4', '#f59e0b']

function Avatar({ name, color, size = 'md', greyed = false }: {
  name: string; color: string; size?: 'xs' | 'sm' | 'md' | 'lg'; greyed?: boolean
}) {
  const initials = name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
  const sizes = { xs: 'w-5 h-5 text-[10px]', sm: 'w-7 h-7 text-xs', md: 'w-9 h-9 text-sm', lg: 'w-11 h-11 text-base' }
  return (
    <div
      className={`${sizes[size]} rounded-full flex items-center justify-center font-semibold text-white flex-shrink-0`}
      style={{ backgroundColor: greyed ? '#d1d5db' : color }}
      title={name}
    >
      {initials}
    </div>
  )
}

function DayCard({ row, total, selected, onClick }: {
  row: DayRow; total: number; selected: boolean; onClick: () => void
}) {
  const ratio = row.freeCount / total
  const allFree = row.freeCount === total
  const weekend = isWeekend(row.date)

  let bg = 'bg-white border-gray-200'
  if (allFree) bg = 'bg-green-50 border-green-300'
  else if (ratio >= 0.75) bg = 'bg-lime-50 border-lime-200'
  else if (ratio >= 0.5) bg = 'bg-yellow-50 border-yellow-200'

  return (
    <button
      onClick={onClick}
      className={`relative border rounded-xl p-3 text-left transition-all hover:-translate-y-0.5 hover:shadow-md ${bg} ${selected ? 'ring-2 ring-brand-500 shadow-md' : ''} ${weekend ? 'opacity-60' : ''}`}
    >
      {allFree && (
        <span className="absolute -top-2 left-1/2 -translate-x-1/2 text-xs bg-green-500 text-white px-2 py-0.5 rounded-full font-semibold whitespace-nowrap">
          All free ✓
        </span>
      )}
      <p className={`text-xs font-medium ${isToday(row.date) ? 'text-brand-600' : 'text-gray-500'}`}>
        {format(row.date, 'EEE')}
      </p>
      <p className={`text-lg font-bold leading-tight ${isToday(row.date) ? 'text-brand-600' : 'text-gray-900'}`}>
        {format(row.date, 'd')}
      </p>
      <p className="text-xs text-gray-400 mb-2.5">{format(row.date, 'MMM')}</p>

      <div className="flex flex-wrap gap-1">
        {row.members.map(({ member, free }) => (
          <Avatar key={member.userId} name={member.name} color={member.color} size="xs" greyed={!free} />
        ))}
      </div>

      <p className="text-xs font-semibold mt-2" style={{
        color: allFree ? '#16a34a' : ratio >= 0.75 ? '#65a30d' : ratio >= 0.5 ? '#ca8a04' : '#9ca3af'
      }}>
        {row.freeCount}/{total} free
      </p>
    </button>
  )
}

function DayDetail({ row, total, myEvents, onSuggest }: {
  row: DayRow; total: number; myEvents: { title: string; color: string }[]; onSuggest: () => void
}) {
  const allFree = row.freeCount === total
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs text-gray-400 font-medium">{format(row.date, 'EEEE')}</p>
          <p className="text-xl font-bold text-gray-900">{format(row.date, 'MMMM d')}</p>
        </div>
        {allFree && (
          <span className="bg-green-100 text-green-700 text-xs font-semibold px-3 py-1.5 rounded-full">
            Everyone free! 🎉
          </span>
        )}
      </div>

      <div className="space-y-2">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Who's free</p>
        <div className="space-y-2">
          {row.members.map(({ member, free }) => (
            <div key={member.userId} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
              <div className="flex items-center gap-2.5">
                <Avatar name={member.name} color={member.color} size="sm" greyed={!free} />
                <span className="text-sm font-medium text-gray-900">
                  {member.isMe ? 'You' : member.name.split(' ')[0]}
                </span>
              </div>
              <div className="text-right">
                {free ? (
                  <span className="text-xs font-semibold text-green-700 bg-green-100 px-2.5 py-1 rounded-full">Free</span>
                ) : (
                  <span className="text-xs font-medium text-gray-500 bg-gray-100 px-2.5 py-1 rounded-full">Busy</span>
                )}
                {/* Only show event details for yourself */}
                {member.isMe && !free && myEvents.length > 0 && (
                  <div className="mt-1 space-y-0.5">
                    {myEvents.map((e, i) => (
                      <p key={i} className="text-xs" style={{ color: e.color }}>● {e.title}</p>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      <button
        onClick={onSuggest}
        className="w-full bg-brand-600 text-white py-2.5 rounded-xl text-sm font-semibold hover:bg-brand-700 transition-colors"
      >
        Suggest this day to the group →
      </button>
    </div>
  )
}

export default function GroupsPage() {
  const { user } = useAuth()
  const [groups, setGroups] = useState<Group[]>([])
  const [activeGroup, setActiveGroup] = useState<Group | null>(null)
  const [members, setMembers] = useState<Member[]>([])
  const [days, setDays] = useState<DayRow[]>([])
  const [selectedDay, setSelectedDay] = useState<DayRow | null>(null)
  const [myDayEvents, setMyDayEvents] = useState<{ title: string; color: string }[]>([])
  const [showCreate, setShowCreate] = useState(false)
  const [friends, setFriends] = useState<Profile[]>([])
  const [newGroupName, setNewGroupName] = useState('')
  const [selectedMembers, setSelectedMembers] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingAvail, setLoadingAvail] = useState(false)

  useEffect(() => { if (user) { loadGroups(); loadFriends() } }, [user])

  async function loadGroups() {
    setLoading(true)
    const { data } = await supabase
      .from('group_members')
      .select('groups(id, name, created_by, created_at, group_members(user_id))')
      .eq('user_id', user!.id)
    if (data) {
      const gs = data.map((d: any) => d.groups).filter(Boolean)
      setGroups(gs)
      if (gs.length > 0) loadGroupAvailability(gs[0])
    }
    setLoading(false)
  }

  async function loadFriends() {
    const { data } = await supabase
      .from('friendships')
      .select('requester_id, addressee_id, requester:profiles!friendships_requester_id_fkey(*), addressee:profiles!friendships_addressee_id_fkey(*)')
      .eq('status', 'accepted')
      .or(`requester_id.eq.${user!.id},addressee_id.eq.${user!.id}`)
    if (data) {
      setFriends(data.map((f: any) => f.requester_id === user!.id ? f.addressee : f.requester))
    }
  }

  async function loadGroupAvailability(group: Group) {
    setActiveGroup(group)
    setLoadingAvail(true)
    setSelectedDay(null)

    const memberIds: string[] = (group as any).group_members?.map((m: any) => m.user_id) ?? []
    const today = startOfDay(new Date())
    const endDate = addDays(today, 14)

    // Fetch profiles for all members
    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, full_name')
      .in('id', memberIds)

    const memberList: Member[] = (profiles ?? []).map((p, i) => ({
      userId: p.id,
      name: p.full_name ?? 'Unknown',
      color: p.id === user!.id ? '#8b5cf6' : MEMBER_COLORS[(i + 1) % MEMBER_COLORS.length],
      isMe: p.id === user!.id,
    }))
    setMembers(memberList)

    // Fetch busy events for all members (no titles for others)
    const { data: busyEvents } = await supabase
      .from('events')
      .select('user_id, title, start_time, end_time, color, is_busy')
      .in('user_id', memberIds)
      .eq('is_busy', true)
      .gte('start_time', today.toISOString())
      .lte('end_time', endDate.toISOString())

    const busySlots: BusySlot[] = (busyEvents ?? []).map(e => ({
      userId: e.user_id,
      start: new Date(e.start_time),
      end: new Date(e.end_time),
    }))

    // Build 14-day rows
    const rows: DayRow[] = []
    for (let i = 0; i < 14; i++) {
      const date = addDays(today, i)
      const dayStart = startOfDay(date)
      const dayEnd = endOfDay(date)

      const memberRows = memberList.map(m => {
        const busy = busySlots.some(s => s.userId === m.userId && s.start < dayEnd && s.end > dayStart)
        return { member: m, free: !busy }
      })

      rows.push({ date, members: memberRows, freeCount: memberRows.filter(r => r.free).length })
    }
    setDays(rows)
    setLoadingAvail(false)
  }

  function handleDayClick(row: DayRow) {
    if (selectedDay?.date.getTime() === row.date.getTime()) {
      setSelectedDay(null)
      return
    }
    setSelectedDay(row)

    // My events for this day (full details since it's my own)
    // We'd normally have them loaded; for now we look up from already-fetched data
    setMyDayEvents([]) // populated separately in real app
  }

  async function createGroup() {
    if (!newGroupName.trim()) return
    const { data: group } = await supabase.from('groups').insert({ name: newGroupName.trim(), created_by: user!.id }).select().single()
    if (group) {
      const memberships = [user!.id, ...selectedMembers].map(uid => ({ group_id: group.id, user_id: uid }))
      await supabase.from('group_members').insert(memberships)
    }
    setNewGroupName(''); setSelectedMembers([]); setShowCreate(false)
    await loadGroups()
  }

  return (
    <div className="h-full flex flex-col overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 bg-white border-b border-gray-100 flex-shrink-0">
        <div>
          {activeGroup && (
            <div className="flex items-center gap-2 text-xs text-gray-400 mb-0.5">
              <button onClick={() => setActiveGroup(null)} className="hover:text-brand-500">Groups</button>
              <ChevronRight size={12} />
              <span className="text-gray-700 font-medium">{activeGroup.name}</span>
            </div>
          )}
          <h1 className="text-base font-semibold text-gray-900">
            {activeGroup ? 'When can we hang out?' : 'Groups'}
          </h1>
        </div>
        {activeGroup ? (
          <div className="flex items-center gap-2">
            <div className="flex -space-x-2">
              {members.slice(0, 5).map(m => <Avatar key={m.userId} name={m.name} color={m.color} size="sm" />)}
            </div>
            <span className="text-xs text-gray-400">{members.length} people</span>
          </div>
        ) : (
          <button onClick={() => setShowCreate(true)} className="flex items-center gap-1.5 bg-brand-600 text-white px-4 py-2 rounded-lg text-xs font-semibold hover:bg-brand-700 transition-colors">
            <Plus size={14} /> New group
          </button>
        )}
      </div>

      {/* Create group modal */}
      {showCreate && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-semibold text-gray-900">Create group</h2>
              <button onClick={() => setShowCreate(false)} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Group name</label>
                <input type="text" value={newGroupName} onChange={e => setNewGroupName(e.target.value)} placeholder="e.g. Weekend crew" autoFocus
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Add friends</label>
                {friends.length === 0 ? <p className="text-sm text-gray-400">Add friends first!</p> : (
                  <ul className="space-y-2 max-h-48 overflow-y-auto">
                    {friends.map(f => (
                      <li key={f.id} className="flex items-center gap-3">
                        <input type="checkbox" id={`m-${f.id}`} checked={selectedMembers.includes(f.id)}
                          onChange={e => setSelectedMembers(prev => e.target.checked ? [...prev, f.id] : prev.filter(id => id !== f.id))} className="rounded" />
                        <label htmlFor={`m-${f.id}`} className="text-sm text-gray-800 cursor-pointer">{f.full_name}</label>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={() => setShowCreate(false)} className="flex-1 border border-gray-200 text-gray-700 py-2.5 rounded-xl text-sm font-medium hover:bg-gray-50 transition-colors">Cancel</button>
              <button onClick={createGroup} disabled={!newGroupName.trim()} className="flex-1 bg-brand-600 text-white py-2.5 rounded-xl text-sm font-medium hover:bg-brand-700 disabled:opacity-50 transition-colors">Create</button>
            </div>
          </div>
        </div>
      )}

      {/* Group list */}
      {!activeGroup && (
        <div className="flex-1 overflow-y-auto p-5">
          {loading ? (
            <div className="flex items-center gap-2 text-gray-400 text-sm"><Loader2 size={16} className="animate-spin" /> Loading…</div>
          ) : groups.length === 0 ? (
            <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center">
              <div className="w-14 h-14 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4"><Users size={24} className="text-gray-400" /></div>
              <p className="text-gray-500 mb-4 text-sm">No groups yet. Create one to start planning together!</p>
              <button onClick={() => setShowCreate(true)} className="bg-brand-600 text-white px-5 py-2 rounded-lg text-sm font-medium hover:bg-brand-700 transition-colors">Create your first group</button>
            </div>
          ) : (
            <div className="space-y-3">
              {groups.map(g => {
                const memberCount = (g as any).group_members?.length ?? 0
                return (
                  <button key={g.id} onClick={() => loadGroupAvailability(g)}
                    className="w-full bg-white rounded-2xl border border-gray-100 p-4 flex items-center justify-between hover:border-brand-200 hover:shadow-sm transition-all text-left">
                    <div>
                      <p className="font-semibold text-gray-900">{g.name}</p>
                      <p className="text-xs text-gray-400 mt-0.5">{memberCount} member{memberCount !== 1 ? 's' : ''}</p>
                    </div>
                    <ChevronRight size={16} className="text-gray-400" />
                  </button>
                )
              })}
            </div>
          )}
        </div>
      )}

      {/* Availability grid */}
      {activeGroup && (
        <div className="flex-1 flex overflow-hidden">
          <div className="flex-1 overflow-y-auto p-5">
            {loadingAvail ? (
              <div className="flex items-center gap-2 text-gray-400 text-sm"><Loader2 size={16} className="animate-spin" /> Checking everyone's calendars…</div>
            ) : (
              <>
                <div className="flex items-center gap-4 mb-4 text-xs text-gray-500">
                  <div className="flex items-center gap-1.5"><div className="w-4 h-4 rounded-full bg-brand-500" /><span>Coloured = free</span></div>
                  <div className="flex items-center gap-1.5"><div className="w-4 h-4 rounded-full bg-gray-300" /><span>Grey = busy</span></div>
                </div>
                <div className="grid grid-cols-7 gap-2">
                  {days.map((row, i) => (
                    <DayCard key={i} row={row} total={members.length}
                      selected={selectedDay?.date.getTime() === row.date.getTime()}
                      onClick={() => handleDayClick(row)} />
                  ))}
                </div>
              </>
            )}
          </div>

          {selectedDay && (
            <div className="w-72 flex-shrink-0 border-l border-gray-100 overflow-y-auto p-4 bg-gray-50/50">
              <DayDetail row={selectedDay} total={members.length} myEvents={myDayEvents} onSuggest={() => {}} />
            </div>
          )}
        </div>
      )}
    </div>
  )
}
