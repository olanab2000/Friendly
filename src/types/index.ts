export interface Profile {
  id: string
  username: string | null
  full_name: string | null
  avatar_url: string | null
  updated_at: string | null
}

export interface CalendarEvent {
  id: string
  user_id: string
  title: string
  start_time: string
  end_time: string
  all_day: boolean
  color: string | null
  is_busy: boolean
  created_at: string
}

export interface Friendship {
  id: string
  requester_id: string
  addressee_id: string
  status: 'pending' | 'accepted' | 'blocked'
  created_at: string
  requester?: Profile
  addressee?: Profile
}

export interface Group {
  id: string
  name: string
  created_by: string
  created_at: string
  members?: GroupMember[]
}

export interface GroupMember {
  group_id: string
  user_id: string
  joined_at: string
  profile?: Profile
}

export interface MeetupSuggestion {
  id: string
  group_id: string
  suggested_by: string
  start_time: string
  end_time: string
  title: string
  status: 'suggested' | 'confirmed' | 'cancelled'
  created_at: string
}

export interface TimeSlot {
  start: Date
  end: Date
  availableCount: number
  totalMembers: number
  availableUsers: string[]
}
