import { useEffect, useState } from 'react'
import { BrowserRouter, NavLink, Route, Routes } from 'react-router-dom'
import { onAuthStateChanged, signInWithPopup, signOut } from 'firebase/auth'
import { auth, googleProvider } from './lib/firebase'

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
  { id: 'helenas', name: "Helena's Hawaiian Food", area: 'Kalihi', query: "Helena's Hawaiian Food Honolulu" },
  { id: 'marukame', name: 'Marukame Udon', area: 'Waikiki', query: 'Marukame Udon Waikiki' },
  { id: 'nicolas', name: "Nico's Pier 38", area: 'Honolulu', query: "Nico's Pier 38 Honolulu" },
  { id: 'giovannis', name: "Giovanni's Shrimp Truck", area: 'North Shore', query: "Giovanni's Shrimp Truck Kahuku" },
  { id: 'teds', name: "Ted's Bakery", area: 'North Shore', query: "Ted's Bakery Sunset Beach" },
  { id: 'highway', name: 'Highway Inn', area: 'Kakaako', query: 'Highway Inn Kakaako' },
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

function Home() {
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [editing, setEditing] = useState(false)

  useEffect(() => {
    setStartDate(localStorage.getItem('tripStart') || '')
    setEndDate(localStorage.getItem('tripEnd') || '')
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
          <button type="button" onClick={saveDates} className="rounded-full bg-[#1a7a78] px-4 py-2 text-white">Save dates</button>
        </div>
      )}
    </div>
  )
}

function Itinerary() {
  const [items, setItems] = useState([])
  const [date, setDate] = useState('')
  const [time, setTime] = useState('')
  const [title, setTitle] = useState('')

  useEffect(() => {
    const saved = localStorage.getItem('itinerary')
    if (saved) setItems(JSON.parse(saved))
  }, [])

  function addItem() {
    if (!date || !title) return
    const next = [...items, { id: Date.now(), date, time, title }]
    next.sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time))
    setItems(next)
    localStorage.setItem('itinerary', JSON.stringify(next))
    setTitle('')
    setTime('')
  }

  function removeItem(id) {
    const next = items.filter((item) => item.id !== id)
    setItems(next)
    localStorage.setItem('itinerary', JSON.stringify(next))
  }

  return (
    <div className="py-6">
      <h1 className="text-3xl font-semibold">Itinerary</h1>
      <p className="mt-2 text-[#7a6d62]">Add one plan at a time.</p>
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
    const saved = localStorage.getItem('tickets')
    if (saved) setItems(JSON.parse(saved))
  }, [])

  function addTicket() {
    if (!name) return
    const next = [...items, { id: Date.now(), name, date, confirmation, status }]
    setItems(next)
    localStorage.setItem('tickets', JSON.stringify(next))
    setName('')
    setDate('')
    setConfirmation('')
    setStatus('Need to book')
  }

  function removeTicket(id) {
    const next = items.filter((item) => item.id !== id)
    setItems(next)
    localStorage.setItem('tickets', JSON.stringify(next))
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

export default function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen bg-[#f3eee4] text-[#3a2f29]">
        <div className="sticky top-0 z-20 bg-[#f3eee4]">
          <div className="hawaii-hero">
            <div>
              <p className="aloha">Aloha</p>
              <h1 className="title">Oahu Vacay</h1>
            </div>
          </div>
          <nav className="flex flex-wrap items-center justify-center gap-2 px-3 py-4">
            <NavLink to="/" className={linkClass}>Home</NavLink>
            <NavLink to="/itinerary" className={linkClass}>Itinerary</NavLink>
            <NavLink to="/tickets" className={linkClass}>Tickets</NavLink>
            <NavLink to="/snorkel" className={linkClass}>Snorkel</NavLink>
            <NavLink to="/eats" className={linkClass}>Eats</NavLink>
            <NavLink to="/vote" className={linkClass}>Vote</NavLink>
            <SignIn />
          </nav>
        </div>
        <main className="mx-auto max-w-5xl px-4 pb-16">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/itinerary" element={<Itinerary />} />
            <Route path="/tickets" element={<Tickets />} />
            <Route path="/snorkel" element={<VoteList storageKey="snorkelVotes" list={SNORKEL} title="Snorkel spots" subtitle="Upvote the spots you want most." />} />
            <Route path="/vote" element={<VoteList storageKey="activityVotes" list={ACTIVITIES} title="Vote activities" subtitle="Upvote hikes, tours, and must-dos." />} />
            <Route path="/eats" element={<Eats />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  )
}