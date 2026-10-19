import { addDays, startOfWeek, setHours, setMinutes, startOfDay, endOfDay } from 'date-fns'

const now = new Date()
const weekStart = startOfWeek(now, { weekStartsOn: 1 })

function dt(dayOffset: number, hour: number, min = 0) {
  return setMinutes(setHours(addDays(weekStart, dayOffset), hour), min).toISOString()
}

export const MOCK_EVENTS = [
  { id: '1', title: 'Team standup', start_time: dt(0, 9), end_time: dt(0, 9, 30), color: '#8b5cf6', is_busy: true, all_day: false },
  { id: '2', title: 'Lunch with Alex', start_time: dt(1, 12), end_time: dt(1, 13), color: '#f97316', is_busy: true, all_day: false },
  { id: '3', title: 'Gym', start_time: dt(1, 7), end_time: dt(1, 8), color: '#22c55e', is_busy: true, all_day: false },
  { id: '4', title: 'Project review', start_time: dt(2, 14), end_time: dt(2, 15, 30), color: '#3b82f6', is_busy: true, all_day: false },
  { id: '5', title: "Sara's birthday", start_time: dt(3, 0), end_time: dt(3, 0), color: '#ec4899', is_busy: false, all_day: true },
  { id: '6', title: 'Doctor appointment', start_time: dt(3, 10), end_time: dt(3, 11), color: '#ef4444', is_busy: true, all_day: false },
  { id: '7', title: 'Movie night 🎬', start_time: dt(4, 19), end_time: dt(4, 22), color: '#8b5cf6', is_busy: true, all_day: false },
  { id: '8', title: 'Coffee with Emma', start_time: dt(7, 10), end_time: dt(7, 11), color: '#f97316', is_busy: true, all_day: false },
  { id: '9', title: 'Weekend hike', start_time: dt(5, 9), end_time: dt(5, 13), color: '#22c55e', is_busy: true, all_day: false },
]

export const MOCK_FRIENDS = [
  { id: 'f1', full_name: 'Emma Larsson', username: 'emlarsson', color: '#8b5cf6' },
  { id: 'f2', full_name: 'Alex Svensson', username: 'alexsv', color: '#3b82f6' },
  { id: 'f3', full_name: 'Sara Nilsson', username: 'saranilsson', color: '#ec4899' },
  { id: 'f4', full_name: 'Johan Berg', username: 'johanberg', color: '#22c55e' },
]

// Seeded busy slots per friend for next 14 days (true = busy that day)
// Only we know they're busy — we never see WHY
const FRIEND_BUSY: Record<string, number[]> = {
  f1: [0, 2, 5, 9, 12],       // Emma busy on these day offsets from today
  f2: [1, 3, 6, 7, 11],       // Alex
  f3: [0, 4, 5, 8, 13],       // Sara
  f4: [2, 3, 6, 10, 12],      // Johan
}

export interface DayAvailability {
  date: Date
  myBusy: boolean          // I have busy events that day
  members: {
    id: string
    name: string
    color: string
    free: boolean
  }[]
  freeCount: number        // how many members (incl. me) are free
  total: number            // total group members incl. me
}

export function buildGroupAvailability(days = 14): DayAvailability[] {
  const today = startOfDay(now)
  const result: DayAvailability[] = []

  for (let i = 0; i < days; i++) {
    const date = addDays(today, i)
    const dayStart = startOfDay(date)
    const dayEnd = endOfDay(date)

    // Am I busy? Check MOCK_EVENTS
    const myBusy = MOCK_EVENTS.some(e => {
      if (!e.is_busy) return false
      const s = new Date(e.start_time)
      const en = new Date(e.end_time)
      return s < dayEnd && en > dayStart
    })

    const members = MOCK_FRIENDS.map(f => ({
      id: f.id,
      name: f.full_name,
      color: f.color,
      free: !FRIEND_BUSY[f.id].includes(i),
    }))

    const freeCount = (myBusy ? 0 : 1) + members.filter(m => m.free).length

    result.push({ date, myBusy, members, freeCount, total: members.length + 1 })
  }

  return result
}
