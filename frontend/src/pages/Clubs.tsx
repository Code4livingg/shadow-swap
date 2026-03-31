import { useState, type FormEvent } from 'react'
import { ClubCard, type DemoClub } from '../components/ClubCard'

type ClubsProps = {
  clubs: DemoClub[]
  createClub: (form: {
    accessType: 'Invite' | 'Open'
    name: string
    signalType: 'Analysis' | 'Both' | 'Trade alerts'
  }) => Promise<void>
  joinedClubIds: string[]
  joiningClubId: string | null
  joinClub: (id: string) => Promise<void>
  yourClub: { memberCount: string; name: string; role: string } | null
}

export function Clubs({
  clubs,
  createClub,
  joinedClubIds,
  joiningClubId,
  joinClub,
  yourClub,
}: ClubsProps) {
  const [open, setOpen] = useState(false)
  const [name, setName] = useState('')
  const [accessType, setAccessType] = useState<'Invite' | 'Open'>('Open')
  const [signalType, setSignalType] = useState<'Analysis' | 'Both' | 'Trade alerts'>('Trade alerts')

  const handleCreate = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    await createClub({ accessType, name, signalType })
    setOpen(false)
    setName('')
    setAccessType('Open')
    setSignalType('Trade alerts')
  }

  return (
    <section className="page-stack">
      <section className="glass-panel panel-stack">
        <div className="panel-heading">
          <div>
            <p className="eyebrow">Clubs</p>
            <h2>Your Club Status</h2>
          </div>
          <button className="primary-button primary-violet" onClick={() => setOpen(true)} type="button">
            Create Club
          </button>
        </div>

        {yourClub ? (
          <div className="status-grid">
            <article className="stat-card">
              <span>Club name</span>
              <strong>{yourClub.name}</strong>
            </article>
            <article className="stat-card">
              <span>Member count</span>
              <strong className="encrypted-blocks">{yourClub.memberCount}</strong>
            </article>
            <article className="stat-card">
              <span>Your role</span>
              <strong>{yourClub.role}</strong>
            </article>
          </div>
        ) : (
          <div className="empty-state">You're trading alone. Join a club to access private signals.</div>
        )}
      </section>

      <section className="club-grid">
        {clubs.map((club) => (
          <ClubCard
            club={club}
            joined={joinedClubIds.includes(club.id)}
            joining={joiningClubId === club.id}
            key={club.id}
            onJoin={(id) => {
              void joinClub(id)
            }}
          />
        ))}
      </section>

      <section className="glass-panel panel-stack">
        <p className="micro-copy">
          Club membership is stored as an encrypted euint handle on-chain. No observer can
          determine which address belongs to which club.
        </p>
      </section>

      {open ? (
        <div className="modal-backdrop">
          <div className="modal-card glass-panel">
            <div className="panel-heading">
              <div>
                <p className="eyebrow">Create Club</p>
                <h2>Seal a new private trading club</h2>
              </div>
              <button className="secondary-button compact" onClick={() => setOpen(false)} type="button">
                Close
              </button>
            </div>

            <form className="form-grid" onSubmit={(event) => void handleCreate(event)}>
              <label>
                Club Name
                <input onChange={(event) => setName(event.target.value)} required value={name} />
              </label>

              <label>
                Access Type
                <select onChange={(event) => setAccessType(event.target.value as 'Invite' | 'Open')} value={accessType}>
                  <option value="Open">Open</option>
                  <option value="Invite">Invite</option>
                </select>
              </label>

              <label>
                Signal Type
                <select
                  onChange={(event) =>
                    setSignalType(event.target.value as 'Analysis' | 'Both' | 'Trade alerts')
                  }
                  value={signalType}
                >
                  <option value="Trade alerts">Trade alerts</option>
                  <option value="Analysis">Analysis</option>
                  <option value="Both">Both</option>
                </select>
              </label>

              <button className="primary-button primary-violet wide" type="submit">
                Create Club
              </button>
              <p className="micro-copy">Club created. Your membership is encrypted on-chain.</p>
            </form>
          </div>
        </div>
      ) : null}
    </section>
  )
}
