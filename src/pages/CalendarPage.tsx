import { useEffect, useRef, useState } from 'react'
import FullCalendar from '@fullcalendar/react'
import dayGridPlugin from '@fullcalendar/daygrid'
import timeGridPlugin from '@fullcalendar/timegrid'
import interactionPlugin from '@fullcalendar/interaction'
import { DateSelectArg, EventClickArg, EventInput } from '@fullcalendar/core'
import { Plus, X, Clock, AlignLeft } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import { CalendarEvent } from '../types'

const EVENT_COLORS = [
  { label: 'Purple', value: '#8b5cf6' },
  { label: 'Blue', value: '#3b82f6' },
  { label: 'Green', value: '#22c55e' },
  { label: 'Orange', value: '#f97316' },
  { label: 'Red', value: '#ef4444' },
  { label: 'Pink', value: '#ec4899' },
]

interface EventForm {
  title: string
  start: string
  end: string
  allDay: boolean
  color: string
  isBusy: boolean
  id?: string
}

const defaultForm = (): EventForm => ({
  title: '',
  start: '',
  end: '',
  allDay: false,
  color: '#8b5cf6',
  isBusy: true,
})

export default function CalendarPage() {
  const { user } = useAuth()
  const calendarRef = useRef<FullCalendar>(null)
  const [events, setEvents] = useState<CalendarEvent[]>([])
  const [showModal, setShowModal] = useState(false)
  const [form, setForm] = useState<EventForm>(defaultForm())
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (user) loadEvents()
  }, [user])

  async function loadEvents() {
    const { data } = await supabase
      .from('events')
      .select('*')
      .eq('user_id', user!.id)
      .order('start_time')
    if (data) setEvents(data)
  }

  function toFCEvents(): EventInput[] {
    return events.map(e => ({
      id: e.id,
      title: e.title,
      start: e.start_time,
      end: e.end_time,
      allDay: e.all_day,
      backgroundColor: e.color ?? '#8b5cf6',
      borderColor: e.color ?? '#8b5cf6',
      extendedProps: { isBusy: e.is_busy },
    }))
  }

  function handleDateSelect(arg: DateSelectArg) {
    const start = arg.allDay
      ? arg.startStr + 'T09:00'
      : arg.startStr.slice(0, 16)
    const end = arg.allDay
      ? arg.startStr + 'T10:00'
      : arg.endStr.slice(0, 16)
    setForm({ ...defaultForm(), start, end, allDay: arg.allDay })
    setShowModal(true)
  }

  function handleEventClick(arg: EventClickArg) {
    const ev = events.find(e => e.id === arg.event.id)
    if (!ev) return
    setForm({
      id: ev.id,
      title: ev.title,
      start: ev.start_time.slice(0, 16),
      end: ev.end_time.slice(0, 16),
      allDay: ev.all_day,
      color: ev.color ?? '#8b5cf6',
      isBusy: ev.is_busy,
    })
    setShowModal(true)
  }

  async function saveEvent() {
    if (!form.title.trim() || !user) return
    setSaving(true)

    const payload = {
      user_id: user.id,
      title: form.title.trim(),
      start_time: form.start,
      end_time: form.end,
      all_day: form.allDay,
      color: form.color,
      is_busy: form.isBusy,
    }

    if (form.id) {
      await supabase.from('events').update(payload).eq('id', form.id)
    } else {
      await supabase.from('events').insert(payload)
    }

    await loadEvents()
    setShowModal(false)
    setForm(defaultForm())
    setSaving(false)
  }

  async function deleteEvent() {
    if (!form.id) return
    await supabase.from('events').delete().eq('id', form.id)
    await loadEvents()
    setShowModal(false)
    setForm(defaultForm())
  }

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-white">
        <h1 className="text-xl font-semibold text-gray-900">My Calendar</h1>
        <button
          onClick={() => { setForm(defaultForm()); setShowModal(true) }}
          className="flex items-center gap-2 bg-brand-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-brand-700 transition-colors"
        >
          <Plus size={16} />
          New event
        </button>
      </div>

      <div className="flex-1 p-6">
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden h-full">
          <FullCalendar
            ref={calendarRef}
            plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
            initialView="dayGridMonth"
            headerToolbar={{
              left: 'prev,next today',
              center: 'title',
              right: 'dayGridMonth,timeGridWeek,timeGridDay',
            }}
            selectable
            selectMirror
            dayMaxEvents
            weekends
            events={toFCEvents()}
            select={handleDateSelect}
            eventClick={handleEventClick}
            height="100%"
          />
        </div>
      </div>

      {/* Event modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-semibold text-gray-900">
                {form.id ? 'Edit event' : 'New event'}
              </h2>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600">
                <X size={20} />
              </button>
            </div>

            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <AlignLeft size={16} className="text-gray-400 flex-shrink-0" />
                <input
                  type="text"
                  value={form.title}
                  onChange={e => setForm({ ...form, title: e.target.value })}
                  placeholder="Event title"
                  className="flex-1 text-base font-medium border-b border-gray-200 pb-1 focus:outline-none focus:border-brand-500"
                  autoFocus
                />
              </div>

              <div className="flex items-start gap-3">
                <Clock size={16} className="text-gray-400 flex-shrink-0 mt-2.5" />
                <div className="flex-1 space-y-2">
                  <div>
                    <label className="text-xs text-gray-500">Start</label>
                    <input
                      type="datetime-local"
                      value={form.start}
                      onChange={e => setForm({ ...form, start: e.target.value })}
                      className="w-full border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-gray-500">End</label>
                    <input
                      type="datetime-local"
                      value={form.end}
                      onChange={e => setForm({ ...form, end: e.target.value })}
                      className="w-full border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="text-xs text-gray-500 block mb-2">Color</label>
                <div className="flex gap-2">
                  {EVENT_COLORS.map(c => (
                    <button
                      key={c.value}
                      onClick={() => setForm({ ...form, color: c.value })}
                      style={{ backgroundColor: c.value }}
                      className={`w-7 h-7 rounded-full transition-transform ${form.color === c.value ? 'scale-125 ring-2 ring-offset-1 ring-gray-400' : 'hover:scale-110'}`}
                      title={c.label}
                    />
                  ))}
                </div>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="isBusy"
                  checked={form.isBusy}
                  onChange={e => setForm({ ...form, isBusy: e.target.checked })}
                  className="rounded"
                />
                <label htmlFor="isBusy" className="text-sm text-gray-700">
                  Mark as busy (visible to groups for planning)
                </label>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              {form.id && (
                <button
                  onClick={deleteEvent}
                  className="flex-1 border border-red-200 text-red-600 py-2 rounded-lg text-sm font-medium hover:bg-red-50 transition-colors"
                >
                  Delete
                </button>
              )}
              <button
                onClick={() => setShowModal(false)}
                className="flex-1 border border-gray-200 text-gray-700 py-2 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={saveEvent}
                disabled={saving || !form.title.trim()}
                className="flex-1 bg-brand-600 text-white py-2 rounded-lg text-sm font-medium hover:bg-brand-700 disabled:opacity-50 transition-colors"
              >
                {saving ? 'Saving…' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
