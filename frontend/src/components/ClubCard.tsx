import { Lock } from 'lucide-react'

export type DemoClub = {
  description: string
  id: string
  members: string
  name: string
  role?: string
  status: 'Full' | 'Invite only' | 'Open'
}

type ClubCardProps = {
  club: DemoClub
  joining: boolean
  joined: boolean
  onJoin: (id: string) => void
}

export function ClubCard({ club, joining, joined, onJoin }: ClubCardProps) {
  return (
    <article className={`club-card glass-panel ${joining ? 'joining' : ''} ${joined ? 'joined' : ''}`}>
      <div className="panel-heading">
        <div>
          <h3>{club.name}</h3>
          <p className="muted-line">{club.description}</p>
        </div>
        <span className={`badge club-badge ${club.status.toLowerCase().replace(' ', '-')}`}>{club.status}</span>
      </div>

      <div className="club-meta">
        <div>
          <span className="detail-label">Members</span>
          <strong className="encrypted-blocks">{club.members}</strong>
        </div>
        <div>
          <span className="detail-label">Role</span>
          <strong>{club.role ?? 'Observer'}</strong>
        </div>
      </div>

      <button
        className="primary-button wide"
        disabled={joining || joined || club.status === 'Full'}
        onClick={() => onJoin(club.id)}
        type="button"
      >
        {joined ? (
          'Member · Sealed 🔐'
        ) : joining ? (
          <span className="button-inline">
            <Lock className="spin" size={16} />
            Encrypting membership...
          </span>
        ) : (
          'Join Club'
        )}
      </button>
    </article>
  )
}
