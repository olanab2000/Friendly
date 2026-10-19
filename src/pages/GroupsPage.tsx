import { useEffect, useState } from 'react'
import { Users, Plus, X, ChevronRight, Sparkles } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import { Group, Friendship, Profile, TimeSlot } from '../types'
import { format, addDays, startOfDay, parseISO, isWithinInterval } from 'date-fns'

export default function GroupsPage() {
  const { user } = useAuth()
  const [groups, setGroups] = useState<Group[]>([])
  const [friends, setFriends] = useState<Profile[]>([])
  const [showCreate, setShowCreate] = useState(false)
  const [selectedGroup, setSelectedGroup] = useState<Group | null>(null)
  const [suggestions, setSuggestions] = useState<TimeSlot[]>([])
  const [loadingSuggestions, setLoadingSuggestions] = useState(false)
  const [newGroupName, setNewGroupName] = useState('')
  const [selectedMembers, setSelectedMembers] = useState<string[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (user) { loadGroups(); loadFriends() }
  }, [user])

  async function loadGroups() {
    setLoading(true)
    const { data } = await supabase
      .from('group_members')
      .select(`
        group_id,
        groups(
          id, name, created_by, created_at,
          group_members(user_id, profiles(*))
        )
      `)
      .eq('user_id', user!.id)
    if (data) {
      const groupList = data.map((d: any) => d.groups).filter(Boolean)
      setGroups(groupList)
    }
    setLoading(false)
  }

  async function loadFriends() {
    const { data } = await supabase
      .from('friendships')
      .select(`
        requester_id, addressee_id,
        requester:profiles!friendships_requester_id_fkey(*),
        addressee:profiles!friendships_addressee_id_fkey(*)
      `)
      .eq('status', 'accepted')
      .or(`requester_id.eq.${user!.id},addressee_id.eq.${user!.id}`)
    if (data) {
      const profiles: Profile[] = data.map((f: any) =>
        f.requester_id === user!.id ? f.addressee : f.requester
      )
      setFriends(profiles)
    }
  }

  async function createGroup() {
    if (!newGroupName.trim()) return
    const { data: group } = await supabase
      .from('groups')
      .insert({ name: newGroupName.trim(), created_by: user!.id })
      .select()
      .single()

    if (group) {
      const members = [user!.id, ...selectedMembers].map(uid => ({
        group_id: group.id,
        user_id: uid,
      }))
      await supabase.from('group_members').insert(members)
    }

    setNewGroupName('')
    setSelectedMembers([])
    setShowCreate(false)
    await loadGroups()
  }

  async function findBestTimes(group: Group) {
    setSelectedGroup(group)
    setLoadingSuggestions(true)
    setSuggestions([])

    const memberIds = (group.members ?? []).map(m => m.user_id)
    const start = new Date()
    const end = addDays(start, 14)

    const { data: busyEvents } = await supabase
      .from('events')
      .select('user_id, start_time, end_time')
      .in('user_id', memberIds)
      .eq('is_busy', true)
      .gte('start_time', start.toISOString())
      .lte('end_time', end.toISOString())

    const slots = generateTimeSlots(start, end)
    const scored: TimeSlot[] = slots.map(slot => {
      const busyUsers = new Set<string>()
      for (const ev of busyEvents ?? []) {
        const evStart = parseISO(ev.start_time)
        const evEnd = parseISO(ev.end_time)
        if (evStart < slot.end && evEnd > slot.start) {
          busyUsers.add(ev.user_id)
        }
      }
      const availableUsers = memberIds.filter(id => !busyUsers.has(id))
      return {
        ...slot,
        availableCount: availableUsers.length,
        totalMembers: memberIds.length,
        availableUsers,
      }
    })

    const best = scored
      .filter(s => s.availableCount > 1)
      .sort((a, b) => b.availableCount - a.availableCount || a.start.getTime() - b.start.getTime())
      .slice(0, 8)

    setSuggestions(best)
    setLoadingSuggestions(false)
  }

  function generateTimeSlots(start: Date, end: Date): Omit<TimeSlot, 'availableCount' | 'totalMembers' | 'availableUsers'>[] {
    const slots = []
    let current = startOfDay(start)
    while (current < end) {
      const day = new Date(current)
      const dayOfWeek = day.getDay()
      if (dayOfWeek !== 0 && dayOfWeek !== 6) {
        for (const hour of [10, 12, 14, 16, 18]) {
          const slotStart = new Date(day)
          slotStart.setHours(hour, 0, 0, 0)
          const slotEnd = new Date(day)
          slotEnd.setHours(hour + 2, 0, 0, 0)
          if (slotStart > new Date()) {
            slots.push({ start: slotStart, end: slotEnd })
          }
        }
      }
      current = addDays(current, 1)
    }
    return slots
  }

  function availabilityColor(count: number, total: number) {
    const ratio = count / total
    if (ratio === 1) return 'bg-green-100 border-green-300 text-green-800'
    if (ratio >= 0.7) return 'bg-lime-100 border-lime-300 text-lime-800'
    if (ratio >= 0.5) return 'bg-yellow-100 border-yellow-300 text-yellow-800'
    return 'bg-orange-100 border-orange-300 text-orange-800'
  }

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-semibold text-gray-900">Groups</h1>
        <button
          onClick={() => setShowCreate(true)}
          className="flex items-center gap-2 bg-brand-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-brand-700 transition-colors"
        >
          <Plus size={16} />
          New group
        </button>
      </div>

      {/* Create group modal */}
      {showCreate && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-semibold text-gray-900">Create group</h2>
              <button onClick={() => setShowCreate(false)} className="text-gray-400 hover:text-gray-600">
                <X size={20} />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Group name</label>
                <input
                  type="text"
                  value={newGroupName}
                  onChange={e => setNewGroupName(e.target.value)}
                  placeholder="e.g. Weekend crew"
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Add friends</label>
                {friends.length === 0 ? (
                  <p className="text-sm text-gray-400">No friends yet. Add friends first!</p>
                ) : (
                  <ul className="space-y-2 max-h-48 overflow-y-auto">
                    {friends.map(f => (
                      <li key={f.id} className="flex items-center gap-3">
                        <input
                          type="checkbox"
                          id={`m-${f.id}`}
                          checked={selectedMembers.includes(f.id)}
                          onChange={e => {
                            setSelectedMembers(prev =>
                              e.target.checked ? [...prev, f.id] : prev.filter(id => id !== f.id)
                            )
                          }}
                          className="rounded"
                        />
                        <label htmlFor={`m-${f.id}`} className="text-sm text-gray-800 cursor-pointer">
                          {f.full_name}
                          {f.username && <span className="text-gray-400 ml-1">@{f.username}</span>}
                        </label>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowCreate(false)}
                className="flex-1 border border-gray-200 text-gray-700 py-2 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={createGroup}
                disabled={!newGroupName.trim()}
                className="flex-1 bg-brand-600 text-white py-2 rounded-lg text-sm font-medium hover:bg-brand-700 disabled:opacity-50 transition-colors"
              >
                Create
              </button>
            </div>
          </div>
        </div>
      )}

      {loading ? (
        <p className="text-sm text-gray-400">Loading…</p>
      ) : groups.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <div className="w-14 h-14 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Users size={24} className="text-gray-400" />
          </div>
          <p className="text-gray-500 mb-4">No groups yet. Create one to start planning together!</p>
          <button
            onClick={() => setShowCreate(true)}
            className="bg-brand-600 text-white px-5 py-2 rounded-lg text-sm font-medium hover:bg-brand-700 transition-colors"
          >
            Create your first group
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {groups.map(group => {
            const memberCount = (group.members ?? []).length
            return (
              <div key={group.id} className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                <div className="flex items-center justify-between p-5">
                  <div>
                    <h3 className="font-semibold text-gray-900">{group.name}</h3>
                    <p className="text-sm text-gray-500 mt-0.5">{memberCount} member{memberCount !== 1 ? 's' : ''}</p>
                  </div>
                  <button
                    onClick={() => findBestTimes(group)}
                    className="flex items-center gap-2 bg-brand-50 text-brand-700 px-4 py-2 rounded-lg text-sm font-medium hover:bg-brand-100 transition-colors"
                  >
                    <Sparkles size={15} />
                    Find best times
                  </button>
                </div>

                {selectedGroup?.id === group.id && (
                  <div className="border-t border-gray-100 p-5">
                    <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                      <Sparkles size={14} className="text-brand-500" />
                      Best times to meet — next 2 weeks
                    </h4>

                    {loadingSuggestions ? (
                      <p className="text-sm text-gray-400">Checking everyone's calendars…</p>
                    ) : suggestions.length === 0 ? (
                      <p className="text-sm text-gray-400">No common free slots found in the next 2 weeks.</p>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {suggestions.map((slot, i) => (
                          <div
                            key={i}
                            className={`border rounded-lg p-3 ${availabilityColor(slot.availableCount, slot.totalMembers)}`}
                          >
                            <p className="font-medium text-sm">
                              {format(slot.start, 'EEE, MMM d')}
                            </p>
                            <p className="text-sm">
                              {format(slot.start, 'h:mm a')} – {format(slot.end, 'h:mm a')}
                            </p>
                            <p className="text-xs mt-1 opacity-80">
                              {slot.availableCount}/{slot.totalMembers} available
                            </p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
