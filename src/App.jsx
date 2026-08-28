import { useEffect, useState } from 'react'
import { BrowserRouter, NavLink, Route, Routes } from 'react-router-dom'

const linkClass = ({ isActive }) =>
  isActive ? 'text-white' : 'text-white/60 hover:text-white'

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
    <div className="py-8">
      <p className="text-sm uppercase tracking-widest text-[#1b9aaa]">Days until Oʻahu</p>
      <div className="mt-4 rounded-2xl border border-white/10 bg-white/5 p-8 text-center">
        {!startDate && <p className="text-2xl">No trip dates yet.</p>}
        {startDate && days > 0 && (
          <>
            <p className="text-8xl font-semibold text-white">{days}</p>
            <p className="mt-2 text-xl text-white/80">days to go</p>
          </>
        )}
        {startDate && days === 0 && <p className="text-4xl">It’s today — aloha</p>}
        {startDate && days < 0 && <p className="text-4xl">Trip already started</p>}
      </div>
      {startDate && (
        <p className="mt-4 text-center text-white/70">
          {startDate} → {endDate || 'end date TBD'}
        </p>
      )}
      <div className="mt-6 text-center">
        <button type="button" onClick={() => setEditing(!editing)} className="text-sm text-[#1b9aaa] underline">
          {editing ? 'Cancel' : 'Change dates'}
        </button>
      </div>
      {editing && (
        <div className="mx-auto mt-6 grid max-w-md gap-4">
          <label className="grid gap-1 text-sm">Start date
            <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="rounded-lg border border-white/20 bg-white px-3 py-2 text-black" />
          </label>
          <label className="grid gap-1 text-sm">End date
            <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="rounded-lg border border-white/20 bg-white px-3 py-2 text-black" />
          </label>
          <button type="button" onClick={saveDates} className="rounded-lg bg-[#1b9aaa] px-4 py-2 font-medium text-white">Save dates</button>
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
    <div className="py-8">
      <h1 className="text-3xl font-semibold">Itinerary</h1>
      <p className="mt-2 text-white/70">Add one plan at a time.</p>
      <div className="mt-6 grid max-w-xl gap-3">
        <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="rounded-lg border border-white/20 bg-white px-3 py-2 text-black" />
        <input type="time" value={time} onChange={(e) => setTime(e.target.value)} className="rounded-lg border border-white/20 bg-white px-3 py-2 text-black" />
        <input type="text" placeholder="Example: Hanauma Bay snorkel" value={title} onChange={(e) => setTitle(e.target.value)} className="rounded-lg border border-white/20 bg-white px-3 py-2 text-black" />
        <button type="button" onClick={addItem} className="rounded-lg bg-[#1b9aaa] px-4 py-2 font-medium text-white">Add to itinerary</button>
      </div>
      <ul className="mt-8 grid gap-3">
        {items.length === 0 && <li className="text-white/60">Nothing planned yet.</li>}
        {items.map((item) => (
          <li key={item.id} className="flex items-center justify-between rounded-xl border border-white/10 bg-white/5 px-4 py-3">
            <div>
              <p className="text-sm text-[#1b9aaa]">{item.date} {item.time}</p>
              <p className="text-lg">{item.title}</p>
            </div>
            <button type="button" onClick={() => removeItem(item.id)} className="text-sm text-white/50 hover:text-white">Remove</button>
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
    <div className="py-8">
      <h1 className="text-3xl font-semibold">Tickets & plans</h1>
      <p className="mt-2 text-white/70">Flights, Hanauma reservation, luau, car rental, etc.</p>
      <div className="mt-6 grid max-w-xl gap-3">
        <input type="text" placeholder="Name, example: Hanauma Bay reservation" value={name} onChange={(e) => setName(e.target.value)} className="rounded-lg border border-white/20 bg-white px-3 py-2 text-black" />
        <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="rounded-lg border border-white/20 bg-white px-3 py-2 text-black" />
        <input type="text" placeholder="Confirmation number (optional)" value={confirmation} onChange={(e) => setConfirmation(e.target.value)} className="rounded-lg border border-white/20 bg-white px-3 py-2 text-black" />
        <select value={status} onChange={(e) => setStatus(e.target.value)} className="rounded-lg border border-white/20 bg-white px-3 py-2 text-black">
          <option>Need to book</option>
          <option>Booked</option>
          <option>Paid</option>
        </select>
        <button type="button" onClick={addTicket} className="rounded-lg bg-[#1b9aaa] px-4 py-2 font-medium text-white">Add ticket</button>
      </div>
      <ul className="mt-8 grid gap-3">
        {items.length === 0 && <li className="text-white/60">No tickets yet.</li>}
        {items.map((item) => (
          <li key={item.id} className="flex items-center justify-between rounded-xl border border-white/10 bg-white/5 px-4 py-3">
            <div>
              <p className="text-lg">{item.name}</p>
              <p className="text-sm text-[#1b9aaa]">
                {item.status}{item.date ? ` · ${item.date}` : ''}{item.confirmation ? ` · #${item.confirmation}` : ''}
              </p>
            </div>
            <button type="button" onClick={() => removeTicket(item.id)} className="text-sm text-white/50 hover:text-white">Remove</button>
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
    <div className="py-8">
      <h1 className="text-3xl font-semibold">{title}</h1>
      <p className="mt-2 text-white/70">{subtitle}</p>
      <ul className="mt-8 grid gap-3">
        {ranked.map((item) => (
          <li key={item.id} className="flex items-center justify-between rounded-xl border border-white/10 bg-white/5 px-4 py-3">
            <div>
              <p className="text-lg">{item.name}</p>
              {item.skill && <p className="text-sm text-[#1b9aaa]">{item.skill} · {item.note}</p>}
            </div>
            <button type="button" onClick={() => upvote(item.id)} className="rounded-lg bg-[#1b9aaa] px-3 py-2 text-sm font-medium text-white">
              ▲ {votes[item.id] || 0}
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
    <div className="py-8">
      <h1 className="text-3xl font-semibold">Eats</h1>
      <p className="mt-2 text-white/70">Click a restaurant. Map updates. Open in Google Maps for directions.</p>
      <iframe title="Restaurant map" src={mapsEmbed(active.query)} className="mt-6 h-72 w-full rounded-xl border-0" />
      <p className="mt-3 text-sm text-white/70">
        Showing <span className="text-white">{active.name}</span> · {active.area}
      </p>
      <a href={mapsLink(active.query)} target="_blank" rel="noreferrer" className="mt-2 inline-block text-[#1b9aaa] underline">
        Open in Google Maps
      </a>
      <ul className="mt-8 grid gap-3">
        {RESTAURANTS.map((place) => (
          <li key={place.id}>
            <button
              type="button"
              onClick={() => setActive(place)}
              className={`w-full rounded-xl border px-4 py-3 text-left ${
                active.id === place.id ? 'border-[#1b9aaa] bg-white/10' : 'border-white/10 bg-white/5'
              }`}
            >
              <p className="text-lg">{place.name}</p>
              <p className="text-sm text-[#1b9aaa]">{place.area}</p>
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
      <div className="min-h-screen bg-[#071821]">
        <header className="border-b border-white/10">
          <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
            <span className="font-semibold tracking-wide">OʻAHU VACAY</span>
            <nav className="flex flex-wrap gap-4 text-sm">
              <NavLink to="/" className={linkClass}>Home</NavLink>
              <NavLink to="/itinerary" className={linkClass}>Itinerary</NavLink>
              <NavLink to="/tickets" className={linkClass}>Tickets</NavLink>
              <NavLink to="/snorkel" className={linkClass}>Snorkel</NavLink>
              <NavLink to="/eats" className={linkClass}>Eats</NavLink>
              <NavLink to="/vote" className={linkClass}>Vote</NavLink>
            </nav>
          </div>
        </header>
        <main className="mx-auto max-w-5xl px-4">
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