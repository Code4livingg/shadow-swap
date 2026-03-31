import { useMemo, useState } from 'react'
import type { DemoClub } from '../components/ClubCard'

type CreateClubForm = {
  accessType: 'Invite' | 'Open'
  name: string
  signalType: 'Analysis' | 'Both' | 'Trade alerts'
}

const demoClubs: DemoClub[] = [
  {
    description: 'Encrypted signals. No leaks.',
    id: 'shadow-alpha',
    members: '████',
    name: 'Shadow Alpha',
    role: 'Applicant',
    status: 'Open',
  },
  {
    description: 'Institutional-grade privacy.',
    id: 'cipher-desk',
    members: '████',
    name: 'Cipher Desk',
    role: 'Guest',
    status: 'Invite only',
  },
  {
    description: 'Trade without footprint.',
    id: 'dark-liquidity',
    members: '████',
    name: 'Dark Liquidity',
    role: 'Applicant',
    status: 'Open',
  },
  {
    description: 'Maximum anonymity.',
    id: 'ghost-protocol',
    members: '████',
    name: 'Ghost Protocol',
    role: 'Observer',
    status: 'Full',
  },
] as const

export function useClubs() {
  const [joinedClubIds, setJoinedClubIds] = useState<string[]>([])
  const [joiningClubId, setJoiningClubId] = useState<string | null>(null)
  const [createdClubName, setCreatedClubName] = useState<string | null>(null)

  const joinClub = async (clubId: string) => {
    setJoiningClubId(clubId)
    await new Promise((resolve) => window.setTimeout(resolve, 1200))
    setJoiningClubId(null)
    setJoinedClubIds((current) => (current.includes(clubId) ? current : [clubId, ...current]))
  }

  const createClub = async (form: CreateClubForm) => {
    await new Promise((resolve) => window.setTimeout(resolve, 900))
    setCreatedClubName(form.name)
  }

  const yourClub = useMemo(() => {
    const joined = demoClubs.find((club) => joinedClubIds.includes(club.id))
    if (joined) {
      return { memberCount: '██', name: joined.name, role: 'Member' }
    }

    if (createdClubName) {
      return { memberCount: '██', name: createdClubName, role: 'Founder' }
    }

    return null
  }, [createdClubName, joinedClubIds])

  return {
    clubs: demoClubs,
    createClub,
    createdClubName,
    joinedClubIds,
    joiningClubId,
    joinClub,
    yourClub,
  }
}
