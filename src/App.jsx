import { useEffect, useState } from 'react'
import { BrowserRouter, NavLink, Route, Routes } from 'react-router-dom'
import { onAuthStateChanged, signInWithPopup, signOut } from 'firebase/auth'
import { auth, googleProvider, db, storage } from './lib/firebase'
import { collection, addDoc, onSnapshot, updateDoc, deleteDoc, doc } from 'firebase/firestore'
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage'

const linkClass = ({ isActive }) =>
  isActive
    ? 'rounded-full bg-[#1a7a78] px-4 py-2 text-sm text-white'
    : 'rounded-full bg-[#e8e0d4] px-4 py-2 text-sm text-[#3a2f29]'

const SNORKEL = [
  { id: 'hanauma', name: 'Hanauma Bay', skill: 'Beginner', note: 'Reserve ahead. Closed Mon–Tue.' },
  { id: 'sharks', name: "Shark's Cove", skill: 'Intermediate', note: 'Best in summer. North Shore.' },
  { id: 'electric', name: 'Electric Beach', skill: 'Advanced', note: 'Currents. Turtles. Bring a buddy.' },
  { id: 'kuilima', name: 'Kuilima Cove', skill: 'Beginner', note: 'Calm water at Turtle Bay.' },
  { id: 'three', name: 'Three Tables', skill: 'Intermediate', note: 'Next to Shark’s Cove. Summer.' },
  { id: 'koolina', name: 'Ko Olina Lagoons', skill: 'Beginner', note: 'Easy, good for kids.' },
]

const ACTIVITIES = [
  { id: 'diamond', name: 'Diamond Head hike' },
  { id: 'kualoa', name: 'Kualoa Ranch' },
  { id: 'pearl', name: 'Pearl Harbor' },
  { id: 'waimea', name: 'Waimea Bay / North Shore' },
  { id: 'lanikai', name: 'Lanikai Pillbox hike' },
  { id: 'sunset', name: 'Sunset on the West Side' },
]

const RESTAURANTS = [
  { id: 'south', name: 'South Shore', area: 'South Shore', query: 'restaurants South Shore Honolulu Oahu' },
  { id: 'north', name: 'North Shore', area: 'North Shore', query: 'restaurants North Shore Oahu' },
  { id: 'windward', name: 'Windward Coast', area: 'Windward Coast', query: 'restaurants Windward Oahu' },
  { id: 'leeward', name: 'Leeward Coast', area: 'Leeward Coast', query: 'restaurants Leeward Coast Oahu' },
  { id: 'central', name: 'Central Oahu', area: 'Central Oahu', query: 'restaurants Central Oahu' },
]

function daysUntil(startDate) {
  if (!startDate) return null
  const start = new Date(startDate + 'T00:00:00')
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  return Math.round((start - today) / 86400000)
}

function loadVotes(key, list) {
  const saved = localStorage.getItem(key)
  if (saved) return JSON.parse(saved)
  const start = {}
  list.forEach((item) => { start[item.id] = 0 })
  return start
}

function mapsEmbed(query) {
  return `https://www.google.com/maps?q=${encodeURIComponent(query)}&output=embed`
}

function mapsLink(query) {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`
}

function SignIn() {
  const [user, setUser] = useState(null)

  useEffect(() => {
    return onAuthStateChanged(auth, setUser)
  }, [])

  if (user) {
    return (
      <button type="button" onClick={() => signOut(auth)} className="rounded-full bg-[#e8a0b0] px-4 py-2 text-sm text-white">
        Sign out
      </button>
    )
  }

  return (
    <button
      type="button"
      onClick={() => signInWithPopup(auth, googleProvider)}
      className="rounded-full bg-[#e8a0b0] px-4 py-2 text-sm text-white"
    >
      Sign in
    </button>
  )
}
function weatherText(code) {
  const n = Number(code)
  if (n === 0) return 'Clear'
  if (n === 1) return 'Mainly clear'
  if (n === 2) return 'Partly cloudy'
  if (n === 3) return 'Overcast'
  if (n === 45 || n === 48) return 'Fog'
  if (n >= 51 && n <= 57) return 'Drizzle'
  if (n >= 61 && n <= 67) return 'Rain'
  if (n >= 71 && n <= 77) return 'Snow'
  if (n >= 80 && n <= 82) return 'Rain showers'
  if (n >= 95) return 'Thunder'
  return 'Partly cloudy'
}
function weatherEmoji(text) {
  const t = (text || '').toLowerCase()
  if (t.includes('thunder')) return '⛈️'
  if (t.includes('rain') || t.includes('drizzle') || t.includes('shower')) return '🌧️'
  if (t.includes('snow')) return '❄️'
  if (t.includes('fog') || t.includes('mist')) return '🌫️'
  if (t.includes('cloud') || t.includes('overcast')) return '☁️'
  if (t.includes('sun') || t.includes('clear')) return '☀️'
  return '🌤️'
}
function Home() {
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [editing, setEditing] = useState(false)
  const [weather, setWeather] = useState(null)

  useEffect(() => {
    setStartDate(localStorage.getItem('tripStart') || '')
    setEndDate(localStorage.getItem('tripEnd') || '')
fetch('https://api.open-meteo.com/v1/forecast?latitude=21.31&longitude=-157.86&current=temperature_2m,relative_humidity_2m,weather_code&temperature_unit=fahrenheit')
  .then((res) => res.json())
  .then((data) => {
    const now = data.current
    setWeather({
      temp: Math.round(now.temperature_2m),
      text: weatherText(now.weather_code),
      humidity: now.relative_humidity_2m,
    })
  })
      .catch(() => setWeather(null))
  }, [])

  function saveDates() {
    localStorage.setItem('tripStart', startDate)
    localStorage.setItem('tripEnd', endDate)
    setEditing(false)
  }

  const days = daysUntil(startDate)

  return (
    <div className="py-4">
      <div className="countdown-card">
        {!startDate && <p className="text-xl">No trip dates yet.</p>}
        {startDate && days > 0 && (
          <>
            <p className="countdown-num">{days}</p>
            <p className="countdown-label">days to go</p>
          </>
        )}
        {startDate && days === 0 && <p className="text-3xl">It’s today — aloha</p>}
        {startDate && days < 0 && <p className="text-3xl">Trip already started</p>}
        {startDate && (
          <p className="countdown-dates">
            {startDate} — {endDate || 'end TBD'}
          </p>
        )}
      </div>

      <div className="mx-auto mt-8 max-w-[420px] rounded-2xl border border-[#e7dccb] bg-[#f7f2e9] px-5 py-4 text-center">
        <p className="text-sm uppercase tracking-widest text-[#1a7a78]">Honolulu today</p>
        {!weather && <p className="mt-2 text-[#7a6d62]">Loading weather…</p>}
        {weather && (
          <>
<p className="mt-3 text-6xl">{weatherEmoji(weather.text)}</p>
            <p className="mt-2 text-4xl font-semibold text-[#1a7a78]">{weather.temp}°F</p>
            <p className="mt-1 text-lg">{weather.text}</p>
            <p className="mt-1 text-sm text-[#7a6d62]">Humidity {weather.humidity}%</p>
          </>
        )}
        <a
          href="https://www.google.com/search?q=Honolulu+weather"
          target="_blank"
          rel="noreferrer"
          className="mt-3 inline-block text-sm text-[#1a7a78] underline"
        >
          Open Google Weather
        </a>
      </div>

      <div className="mt-5 text-center">
        <button type="button" onClick={() => setEditing(!editing)} className="text-sm text-[#1a7a78] underline">
          {editing ? 'Cancel' : 'Change dates'}
        </button>
      </div>
      {editing && (
        <div className="mx-auto mt-6 grid max-w-md gap-4">
          <label className="grid gap-1 text-sm">Start date
            <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="rounded-lg border border-black/10 bg-white px-3 py-2" />
          </label>
          <label className="grid gap-1 text-sm">End date
            <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="rounded-lg border border-black/10 bg-white px-3 py-2" />
          </label>
          <button type="button" onClick={saveDates} className="rounded-full bg-[#e8a0b0] px-3 py-2 text-sm text-white">Save dates</button>
        </div>
      )}
    </div>
  )
}
const WEEK1 = [
  '2026-12-22',
  '2026-12-23',
  '2026-12-24',
  '2026-12-25',
  '2026-12-26',
  '2026-12-27',
  '2026-12-28',
]

const WEEK2 = [
  '2026-12-29',
  '2026-12-30',
  '2026-12-31',
  '2027-01-01',
  '2027-01-02',
  '2027-01-03',
  '2027-01-04',
  '2027-01-05',
]

function dayNum(iso) {
  return Number(iso.slice(8))
}

function dayName(iso) {
  const names = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
  return names[new Date(iso + 'T12:00:00').getDay()]
}

function TripCalendar({ items, selected, onSelect }) {
  function notes(iso) {
    const hits = items.filter((item) => item.date === iso)
    if (hits.length === 0) return 'Open'
    return hits.map((item) => item.title).join(', ')
  }

  function row(dates) {
    return (
      <div className="grid gap-2" style={{ gridTemplateColumns: 'repeat(' + dates.length + ', minmax(0, 1fr))' }}>
        {dates.map((iso) => (
          <div key={iso} className="text-center">
            <p className="mb-1 text-xs text-[#1a7a78]">{dayName(iso)}</p>
            <button
              type="button"
             onClick={() => {
  onSelect(iso)
  const el = document.getElementById('plan-' + iso)
  if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' })
}}
              className="mx-auto flex h-10 w-10 items-center justify-center rounded-full border-2 border-[#1a7a78] bg-white text-sm text-[#3a2f29]"
            >
              {dayNum(iso)}
            </button>
            <p className="mt-2 text-xs leading-snug text-[#7a6d62]">{notes(iso)}</p>
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className="mb-8 rounded-2xl border border-[#e7dccb] bg-[#f7f2e9] px-3 py-4">
      <p className="mb-4 text-center text-sm text-[#1a7a78]">Dec 22, 2026 – Jan 5, 2027</p>
      {row(WEEK1)}
      <div className="h-6" />
      {row(WEEK2)}
    </div>
  )
}
function Itinerary() {
  const [items, setItems] = useState([])
  const [date, setDate] = useState('')
  const [time, setTime] = useState('')
  const [title, setTitle] = useState('')

   useEffect(() => {
    const unsub = onSnapshot(collection(db, 'itinerary'), (snap) => {
      const next = snap.docs.map((d) => ({ id: d.id, ...d.data() }))
      next.sort((a, b) => (String(a.date) + String(a.time || '')).localeCompare(String(b.date) + String(b.time || '')))
      setItems(next)
    })
    return unsub
  }, [])
  async function addItem() {
    if (!date || !title) return
    await addDoc(collection(db, 'itinerary'), { date, time, title })
    setTitle('')
    setTime('')
  }
  async function removeItem(id) {
    await deleteDoc(doc(db, 'itinerary', id))
  }

  return (
    <div className="py-6">
      <h1 className="text-3xl font-semibold">Itinerary</h1>
      <p className="mt-2 text-[#7a6d62]">Add one plan at a time.</p>
<TripCalendar items={items} selected={date} onSelect={setDate} />
{date && (
  <p className="mb-4 text-sm text-[#1a7a78]">
    Selected {date}. Add a title below to plan this day.
  </p>
)}
      <div className="mt-6 grid max-w-xl gap-3">
        <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="rounded-lg border border-black/10 bg-white px-3 py-2" />
        <input type="time" value={time} onChange={(e) => setTime(e.target.value)} className="rounded-lg border border-black/10 bg-white px-3 py-2" />
        <input type="text" placeholder="Example: Hanauma Bay snorkel" value={title} onChange={(e) => setTitle(e.target.value)} className="rounded-lg border border-black/10 bg-white px-3 py-2" />
        <button type="button" onClick={addItem} className="rounded-full bg-[#1a7a78] px-4 py-2 text-white">Add to itinerary</button>
      </div>
      <ul className="mt-8 grid gap-3">
        {items.length === 0 && <li className="text-[#7a6d62]">Nothing planned yet.</li>}
        {items.map((item) => (
          <li key={item.id} className="flex items-center justify-between rounded-2xl border border-[#e7dccb] bg-[#f7f2e9] px-4 py-3">
            <div>
              <p className="text-sm text-[#1a7a78]">{item.date} {item.time}</p>
              <p className="text-lg">{item.title}</p>
            </div>
            <button type="button" onClick={() => removeItem(item.id)} className="text-sm text-[#7a6d62]">Remove</button>
          </li>
        ))}
      </ul>
    </div>
  )
}

function Tickets() {
  const [items, setItems] = useState([])
  const [name, setName] = useState('')
  const [date, setDate] = useState('')
  const [confirmation, setConfirmation] = useState('')
  const [status, setStatus] = useState('Need to book')

  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'tickets'), (snap) => {
      const next = snap.docs.map((d) => ({ id: d.id, ...d.data() }))
      setItems(next)
    })
    return unsub
  }, [])

  async function addTicket() {
    if (!name) return
    await addDoc(collection(db, 'tickets'), { name, date, confirmation, status })
    setName('')
    setDate('')
    setConfirmation('')
    setStatus('Need to book')
  }
  async function removeItem(id) {
    alert('delete ' + id)
    try {
      await deleteDoc(doc(db, 'voteItems', id))
    } catch (err) {
      alert(err.message)
    }
  }


  return (
    <div className="py-6">
      <h1 className="text-3xl font-semibold">Tickets and plans</h1>
      <p className="mt-2 text-[#7a6d62]">Flights, Hanauma reservation, luau, car rental, etc.</p>
      <div className="mt-6 grid max-w-xl gap-3">
        <input type="text" placeholder="Name, example: Hanauma Bay reservation" value={name} onChange={(e) => setName(e.target.value)} className="rounded-lg border border-black/10 bg-white px-3 py-2" />
        <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="rounded-lg border border-black/10 bg-white px-3 py-2" />
        <input type="text" placeholder="Confirmation number (optional)" value={confirmation} onChange={(e) => setConfirmation(e.target.value)} className="rounded-lg border border-black/10 bg-white px-3 py-2" />
        <select value={status} onChange={(e) => setStatus(e.target.value)} className="rounded-lg border border-black/10 bg-white px-3 py-2">
          <option>Need to book</option>
          <option>Booked</option>
          <option>Paid</option>
        </select>
        <button type="button" onClick={addTicket} className="rounded-full bg-[#1a7a78] px-4 py-2 text-white">Add ticket</button>
      </div>
      <ul className="mt-8 grid gap-3">
        {items.length === 0 && <li className="text-[#7a6d62]">No tickets yet.</li>}
        {items.map((item) => (
          <li key={item.id} className="flex items-center justify-between rounded-2xl border border-[#e7dccb] bg-[#f7f2e9] px-4 py-3">
            <div>
              <p className="text-lg">{item.name}</p>
              <p className="text-sm text-[#1a7a78]">{item.status}</p>
            </div>
            <button type="button" onClick={() => removeTicket(item.id)} className="text-sm text-[#7a6d62]">Remove</button>
          </li>
        ))}
      </ul>
    </div>
  )
}

function VoteList({ storageKey, list, title, subtitle }) {
  const [votes, setVotes] = useState(() => loadVotes(storageKey, list))

  function upvote(id) {
    const next = { ...votes, [id]: (votes[id] || 0) + 1 }
    setVotes(next)
    localStorage.setItem(storageKey, JSON.stringify(next))
  }

  const ranked = [...list].sort((a, b) => (votes[b.id] || 0) - (votes[a.id] || 0))

  return (
    <div className="py-6">
      <h1 className="text-3xl font-semibold">{title}</h1>
      <p className="mt-2 text-[#7a6d62]">{subtitle}</p>
      <ul className="mt-8 grid gap-3">
        {ranked.map((item) => (
          <li key={item.id} className="flex items-center justify-between rounded-2xl border border-[#e7dccb] bg-[#f7f2e9] px-4 py-3">
            <div>
              <p className="text-lg">{item.name}</p>
              {item.skill && <p className="text-sm text-[#1a7a78]">{item.skill} · {item.note}</p>}
            </div>
            <button type="button" onClick={() => upvote(item.id)} className="rounded-full bg-[#1a7a78] px-3 py-2 text-sm text-white">
              ♥ {votes[item.id] || 0}
            </button>
          </li>
        ))}
      </ul>
    </div>
  )
}

function Eats() {
  const [active, setActive] = useState(RESTAURANTS[0])

  return (
    <div className="py-6">
      <h1 className="text-3xl font-semibold">Eats</h1>
      <p className="mt-2 text-[#7a6d62]">Click a restaurant. Map updates.</p>
      <iframe title="Restaurant map" src={mapsEmbed(active.query)} className="mt-6 h-72 w-full rounded-2xl border-0" />
      <p className="mt-3 text-sm text-[#7a6d62]">
        Showing <span className="text-[#3a2f29]">{active.name}</span> · {active.area}
      </p>
      <a href={mapsLink(active.query)} target="_blank" rel="noreferrer" className="mt-2 inline-block text-[#1a7a78] underline">
        Open in Google Maps
      </a>
      <ul className="mt-8 grid gap-3">
        {RESTAURANTS.map((place) => (
          <li key={place.id}>
            <button
              type="button"
              onClick={() => setActive(place)}
              className={`w-full rounded-2xl border px-4 py-3 text-left ${
                active.id === place.id ? 'border-[#1a7a78] bg-[#f7f2e9]' : 'border-[#e7dccb] bg-white'
              }`}
            >
              <p className="text-lg">{place.name}</p>
              <p className="text-sm text-[#1a7a78]">{place.area}</p>
            </button>
          </li>
        ))}
      </ul>
    </div>
  )
}
function GearList() {
  const [items, setItems] = useState([])
  const [name, setName] = useState('')

  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'basket'), (snap) => {
      const next = snap.docs.map((d) => ({ id: d.id, ...d.data() }))
      setItems(next)
    })
    return unsub
  }, [])

  async function addItem() {
    if (!name.trim()) return
    await addDoc(collection(db, 'basket'), { name: name.trim(), done: false })
    setName('')
  }

  async function toggle(id, done) {
    await updateDoc(doc(db, 'basket', id), { done: !done })
  }

  async function removeItem(id) {
    await deleteDoc(doc(db, 'basket', id))
  }

  return (
    <div className="py-6">
      <h1 className="text-3xl font-semibold">Basket</h1>
      <p className="mt-2 text-[#7a6d62]">Add what you need. Cross it off after you buy it.</p>
      <div className="mt-6 grid max-w-xl gap-3">
        <input
          type="text"
          placeholder="Example: snorkel mask"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="rounded-lg border border-black/10 bg-white px-3 py-2"
        />
        <button type="button" onClick={addItem} className="rounded-full bg-[#1a7a78] px-4 py-2 text-white">
          Add item
        </button>
      </div>
      <ul className="mt-8 grid gap-3">
        {items.length === 0 && <li className="text-[#7a6d62]">Nothing on the list yet.</li>}
        {items.map((item) => (
          <li key={item.id} className="flex items-center justify-between rounded-2xl border border-[#e7dccb] bg-[#f7f2e9] px-4 py-3">
            <button
              type="button"
              onClick={() => toggle(item.id, item.done)}
              className={'text-left text-lg ' + (item.done ? 'text-[#7a6d62] line-through' : '')}
            >
              {item.name}
            </button>
            <button type="button" onClick={() => removeItem(item.id)} className="text-lg text-[#1a7a78]">
              X
            </button>
          </li>
        ))}
      </ul>
    </div>
  )
}
function ActivityVote() {
  const [items, setItems] = useState([])
  const [name, setName] = useState('')

  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'voteItems'), (snap) => {
      const next = snap.docs.map((d) => ({ id: d.id, ...d.data() }))
      next.sort((a, b) => (b.hearts || 0) - (a.hearts || 0))
      setItems(next)
    })
    return unsub
  }, [])

  async function addItem() {
    if (!name.trim()) return
    await addDoc(collection(db, 'voteItems'), { name: name.trim(), hearts: 0 })
    setName('')
  }

  async function heart(id) {
    const item = items.find((i) => i.id === id)
    const next = Number(item && item.hearts ? item.hearts : 0) + 1
    await updateDoc(doc(db, 'voteItems', id), { hearts: next })
  }

  async function removeItem(id) {
    await deleteDoc(doc(db, 'voteItems', id))
  }

  return (
    <div className="py-6">
      <h1 className="text-3xl font-semibold">Vote activities</h1>
      <p className="mt-2 text-[#7a6d62]">Add an idea, then heart the ones you want most.</p>
      <div className="mt-6 grid max-w-xl gap-3">
        <input
          type="text"
          placeholder="Example: Pearl Harbor"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="rounded-lg border border-black/10 bg-white px-3 py-2"
        />
        <button type="button" onClick={addItem} className="rounded-full bg-[#1a7a78] px-4 py-2 text-white">
          Add suggestion
        </button>
      </div>
      <ul className="mt-8 grid gap-3">
        {items.length === 0 && <li className="text-[#7a6d62]">No suggestions yet.</li>}
        {items.map((item) => (
          <li key={item.id} className="flex items-center justify-between rounded-2xl border border-[#e7dccb] bg-[#f7f2e9] px-4 py-3">
            <p className="text-lg">{item.name}</p>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => heart(item.id)}
                className="rounded-full bg-[#1a7a78] px-3 py-2 text-sm text-white"
              >
                <span className="text-[#e8a0b0]">♥</span> {item.hearts || 0}
              </button>
              <button
                type="button"
                onClick={() => removeItem(item.id)}
                className="text-lg text-[#1a7a78]"
              >
                X
              </button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  )
}
function Pics() {
  const [items, setItems] = useState([])
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'pics'), (snap) => {
      const next = snap.docs.map((d) => ({ id: d.id, ...d.data() }))
      next.sort((a, b) => String(b.createdAt || '').localeCompare(String(a.createdAt || '')))
      setItems(next)
    })
    return unsub
  }, [])

  async function uploadFile(e) {
    const file = e.target.files && e.target.files[0]
    if (!file) return
    setBusy(true)
    try {
      const path = 'pics/' + Date.now() + '-' + file.name
      const fileRef = ref(storage, path)
      await uploadBytes(fileRef, file)
      const url = await getDownloadURL(fileRef)
      await addDoc(collection(db, 'pics'), {
        url,
        path,
        name: file.name,
        createdAt: new Date().toISOString(),
      })
    } catch (err) {
      alert(err.message)
    }
    setBusy(false)
    e.target.value = ''
  }

  async function removePic(item) {
    try {
      if (item.path) await deleteObject(ref(storage, item.path))
      await deleteDoc(doc(db, 'pics', item.id))
    } catch (err) {
      alert(err.message)
    }
  }

  return (
    <div className="py-6">
      <h1 className="text-3xl font-semibold">Pics</h1>
      <p className="mt-2 text-[#7a6d62]">Upload a photo from the trip. X deletes it.</p>
      <label className="mt-6 inline-block rounded-full bg-[#1a7a78] px-4 py-2 text-white">
        {busy ? 'Uploading…' : 'Upload photo'}
        <input type="file" accept="image/*" className="hidden" onChange={uploadFile} />
      </label>
      <div className="mt-8 grid gap-4 sm:grid-cols-2">
        {items.length === 0 && <p className="text-[#7a6d62]">No photos yet.</p>}
        {items.map((item) => (
          <div key={item.id} className="rounded-2xl border border-[#e7dccb] bg-white p-3">
            <img src={item.url} alt={item.name} className="h-48 w-full rounded-xl object-cover" />
            <div className="mt-2 flex items-center justify-between">
              <p className="truncate text-sm text-[#7a6d62]">{item.name}</p>
              <button type="button" onClick={() => removePic(item)} className="text-lg text-[#1a7a78]">
                X
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
export default function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen overflow-y-scroll bg-[#f3eee4] text-[#3a2f29]">
                <div className="relative z-0 bg-[#f3eee4]">
          <div className="hawaii-hero">
            <div>
              <p className="aloha">Aloha</p>
              <h1 className="title">Oahu Vacay</h1>
            </div>
          </div>
        </div>
            <div className="cream-panel relative z-30 -mt-10 rounded-t-3xl bg-[#f7f2e9] pt-2">
                    <nav className="flex flex-wrap items-center justify-center gap-2 px-3 py-4">
            <NavLink to="/" className={linkClass}>Today</NavLink>
            <NavLink to="/itinerary" className={linkClass}>Itinerary</NavLink>
            <NavLink to="/tickets" className={linkClass}>Tickets</NavLink>
            <NavLink to="/snorkel" className={linkClass}>Basket</NavLink>
            <NavLink to="/eats" className={linkClass}>Eats</NavLink>
            <NavLink to="/pics" className={linkClass}>Pics</NavLink>
            <NavLink to="/vote" className={linkClass}>Vote</NavLink>
            <SignIn />
          </nav>
          <main className="mx-auto max-w-5xl px-4 pb-16">
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/itinerary" element={<Itinerary />} />
              <Route path="/tickets" element={<Tickets />} />
              <Route path="/snorkel" element={<GearList />} />
              <Route path="/vote" element={<ActivityVote />} />
              <Route path="/eats" element={<Eats />} />
            <Route path="/pics" element={<Pics />} />
            </Routes>
          </main>
        </div>
      </div>
    </BrowserRouter>
  )
}