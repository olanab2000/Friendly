import { addDays, startOfWeek, setHours, setMinutes } from 'date-fns'

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
  { id: 'f1', full_name: 'Emma Larsson', username: 'emlarsson', initials: 'EL', color: '#8b5cf6' },
  { id: 'f2', full_name: 'Alex Svensson', username: 'alexsv', initials: 'AS', color: '#3b82f6' },
  { id: 'f3', full_name: 'Sara Nilsson', username: 'saranilsson', initials: 'SN', color: '#ec4899' },
  { id: 'f4', full_name: 'Johan Berg', username: 'johanberg', initials: 'JB', color: '#22c55e' },
]

export const MOCK_SUGGESTIONS = [
  { start: addDays(now, 2), end: addDays(now, 2), hour: '10:00 – 12:00', available: 3, total: 4 },
  { start: addDays(now, 3), end: addDays(now, 3), hour: '14:00 – 16:00', available: 4, total: 4 },
  { start: addDays(now, 5), end: addDays(now, 5), hour: '18:00 – 20:00', available: 3, total: 4 },
  { start: addDays(now, 8), end: addDays(now, 8), hour: '12:00 – 14:00', available: 2, total: 4 },
]
