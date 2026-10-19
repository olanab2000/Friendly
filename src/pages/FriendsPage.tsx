import { useEffect, useState } from 'react'
import { UserPlus, Check, X, Clock, Search, User } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import type { Friendship, Profile } from '../types'

export default function FriendsPage() {
  const { user } = useAuth()
  const [friendships, setFriendships] = useState<Friendship[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<Profile[]>([])
  const [searching, setSearching] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (user) loadFriendships()
  }, [user])

  async function loadFriendships() {
    setLoading(true)
    const { data } = await supabase
      .from('friendships')
      .select(`
        *,
        requester:profiles!friendships_requester_id_fkey(*),
        addressee:profiles!friendships_addressee_id_fkey(*)
      `)
      .or(`requester_id.eq.${user!.id},addressee_id.eq.${user!.id}`)
      .order('created_at', { ascending: false })
    if (data) setFriendships(data)
    setLoading(false)
  }

  async function searchUsers() {
    if (!searchQuery.trim()) return
    setSearching(true)
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .neq('id', user!.id)
      .or(`username.ilike.%${searchQuery}%,full_name.ilike.%${searchQuery}%`)
      .limit(10)
    setSearchResults(data ?? [])
    setSearching(false)
  }

  async function sendFriendRequest(addresseeId: string) {
    await supabase.from('friendships').insert({
      requester_id: user!.id,
      addressee_id: addresseeId,
      status: 'pending',
    })
    setSearchResults([])
    setSearchQuery('')
    await loadFriendships()
  }

  async function respondToRequest(friendshipId: string, accept: boolean) {
    await supabase
      .from('friendships')
      .update({ status: accept ? 'accepted' : 'blocked' })
      .eq('id', friendshipId)
    await loadFriendships()
  }

  async function removeFriend(friendshipId: string) {
    await supabase.from('friendships').delete().eq('id', friendshipId)
    await loadFriendships()
  }

  const accepted = friendships.filter(f => f.status === 'accepted')
  const incoming = friendships.filter(
    f => f.status === 'pending' && f.addressee_id === user?.id
  )
  const outgoing = friendships.filter(
    f => f.status === 'pending' && f.requester_id === user?.id
  )

  function otherProfile(f: Friendship): Profile | undefined {
    return f.requester_id === user?.id ? f.addressee : f.requester
  }

  function alreadyConnected(profileId: string) {
    return friendships.some(
      f =>
        (f.requester_id === user?.id && f.addressee_id === profileId) ||
        (f.addressee_id === user?.id && f.requester_id === profileId)
    )
  }

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <h1 className="text-xl font-semibold text-gray-900 mb-6">Friends</h1>

      {/* Search */}
      <div className="bg-white rounded-xl border border-gray-200 p-5 mb-6">
        <h2 className="font-medium text-gray-900 mb-3 flex items-center gap-2">
          <UserPlus size={17} />
          Add friend
        </h2>
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && searchUsers()}
              placeholder="Search by name or username…"
              className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>
          <button
            onClick={searchUsers}
            disabled={searching}
            className="bg-brand-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-brand-700 disabled:opacity-50 transition-colors"
          >
            Search
          </button>
        </div>

        {searchResults.length > 0 && (
          <ul className="mt-3 divide-y divide-gray-100 border border-gray-100 rounded-lg overflow-hidden">
            {searchResults.map(p => (
              <li key={p.id} className="flex items-center justify-between px-4 py-3">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-brand-100 rounded-full flex items-center justify-center text-brand-700">
                    <User size={15} />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">{p.full_name}</p>
                    {p.username && <p className="text-xs text-gray-500">@{p.username}</p>}
                  </div>
                </div>
                {alreadyConnected(p.id) ? (
                  <span className="text-xs text-gray-400">Already connected</span>
                ) : (
                  <button
                    onClick={() => sendFriendRequest(p.id)}
                    className="text-xs bg-brand-600 text-white px-3 py-1.5 rounded-lg hover:bg-brand-700 transition-colors"
                  >
                    Add friend
                  </button>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Incoming requests */}
      {incoming.length > 0 && (
        <div className="bg-white rounded-xl border border-amber-200 p-5 mb-6">
          <h2 className="font-medium text-gray-900 mb-3 flex items-center gap-2">
            <Clock size={17} className="text-amber-500" />
            Friend requests ({incoming.length})
          </h2>
          <ul className="space-y-3">
            {incoming.map(f => {
              const p = otherProfile(f)
              return (
                <li key={f.id} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 bg-brand-100 rounded-full flex items-center justify-center text-brand-700">
                      <User size={16} />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">{p?.full_name}</p>
                      {p?.username && <p className="text-xs text-gray-500">@{p.username}</p>}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => respondToRequest(f.id, true)}
                      className="p-1.5 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition-colors"
                      title="Accept"
                    >
                      <Check size={15} />
                    </button>
                    <button
                      onClick={() => respondToRequest(f.id, false)}
                      className="p-1.5 bg-red-100 text-red-600 rounded-lg hover:bg-red-200 transition-colors"
                      title="Decline"
                    >
                      <X size={15} />
                    </button>
                  </div>
                </li>
              )
            })}
          </ul>
        </div>
      )}

      {/* Friends list */}
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <h2 className="font-medium text-gray-900 mb-4">
          My friends {accepted.length > 0 && <span className="text-gray-400 font-normal">({accepted.length})</span>}
        </h2>

        {loading ? (
          <p className="text-sm text-gray-400">Loading…</p>
        ) : accepted.length === 0 ? (
          <div className="text-center py-8">
            <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <UserPlus size={22} className="text-gray-400" />
            </div>
            <p className="text-sm text-gray-500">No friends yet. Search above to add some!</p>
          </div>
        ) : (
          <ul className="space-y-3">
            {accepted.map(f => {
              const p = otherProfile(f)
              return (
                <li key={f.id} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 bg-brand-100 rounded-full flex items-center justify-center text-brand-700">
                      <User size={16} />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">{p?.full_name}</p>
                      {p?.username && <p className="text-xs text-gray-500">@{p.username}</p>}
                    </div>
                  </div>
                  <button
                    onClick={() => removeFriend(f.id)}
                    className="text-xs text-gray-400 hover:text-red-500 transition-colors"
                  >
                    Remove
                  </button>
                </li>
              )
            })}
          </ul>
        )}

        {outgoing.length > 0 && (
          <div className="mt-5 pt-5 border-t border-gray-100">
            <p className="text-xs text-gray-500 font-medium mb-3">Pending requests sent</p>
            <ul className="space-y-2">
              {outgoing.map(f => {
                const p = otherProfile(f)
                return (
                  <li key={f.id} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center text-gray-400">
                        <User size={14} />
                      </div>
                      <p className="text-sm text-gray-600">{p?.full_name}</p>
                    </div>
                    <span className="text-xs bg-amber-50 text-amber-600 px-2 py-0.5 rounded-full">Pending</span>
                  </li>
                )
              })}
            </ul>
          </div>
        )}
      </div>
    </div>
  )
}
