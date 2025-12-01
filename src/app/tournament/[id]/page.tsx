'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { TournamentBracket } from '@/components/TournamentBracket'
import { supabase } from '@/lib/supabase'
import { ThemeToggle } from '@/components/theme-toggle';
import { toPng } from 'html-to-image'
import { Button } from '@/components/ui/button'
import { Camera, Download, Maximize2, X, ZoomIn, ZoomOut } from 'lucide-react'
import { TransformComponent, TransformWrapper } from 'react-zoom-pan-pinch'


interface Tournament {
  id: string
  name: string
  format: string
  status: string
  max_teams: number
  group_size?: number
  description?: string
  start_date?: string
  end_date?: string
  location?: string
}

interface Team {
  id: string
  name: string
  tournament_id: string
  captain: string
  players: string[]
}

interface Match {
  id: string
  tournament_id: string
  match_type: 'group' | 'knockout'
  round_name?: string
  round_number?: number
  match_number?: number
  status: 'pending' | 'in_progress' | 'completed'
  scheduled_at?: string
  team1_id?: string
  team2_id?: string
  team1_score?: number
  team2_score?: number
  team1_balls?: number
  team2_balls?: number
  table_number?: number
  winner_id?: string
}

interface GroupStanding {
  teamId: string
  teamName: string
  played: number
  won: number
  drawn: number
  lost: number
  goalsFor: number
  goalsAgainst: number
  goalDifference: number
  ballsFor: number
  ballsAgainst: number
  ballDifference: number
  points: number
}

interface PageProps {
  params: Promise<{ id: string }>
}

const formatLabels: Record<string, string> = {
  group_knockout: "Babak Grup + Knockout",
  single_elimination: "Eliminasi Tunggal",
  double_elimination: "Eliminasi Ganda",
}

const statusLabels: Record<string, string> = {
  setup: "Persiapan",
  group_stage: "Babak Grup",
  knockout: "Babak Knockout",
  completed: "Selesai",
}

const statusStyles: Record<string, string> = {
  setup: "bg-accent/15 text-accent border-accent/30",
  group_stage: "bg-blue-500/15 text-blue-500 border-blue-500/30",
  knockout: "bg-orange-500/15 text-orange-500 border-orange-500/30",
  completed: "bg-green-500/15 text-green-500 border-green-500/30",
}

export default function TournamentDetailPage({ params }: PageProps) {
  const [tournament, setTournament] = useState<Tournament | null>(null)
  const [teams, setTeams] = useState<Team[]>([])
  const [matches, setMatches] = useState<Match[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showAllParticipants, setShowAllParticipants] = useState(false)
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({})
  const [expandedKnockoutRounds, setExpandedKnockoutRounds] = useState<Record<string, boolean>>({})

  // Screenshot modal state
  const groupsContentRefs = useRef<Record<string, HTMLDivElement | null>>({})
  const [screenshotModal, setScreenshotModal] = useState<{
    isOpen: boolean
    imageUrl: string | null
    bracketTitle: string
  }>({
    isOpen: false,
    imageUrl: null,
    bracketTitle: ''
  })
  const [isCapturing, setIsCapturing] = useState<Record<string, boolean>>({})

  useEffect(() => {
    const fetchTournamentData = async () => {
      try {
        const { id } = await params
        const response = await fetch(`/api/tournament/${id}`)
        const data = await response.json()

        if (data.success) {
          setTournament(data.tournament)
          setTeams(data.teams)
          setMatches(data.matches)
        } else {
          setError('Gagal memuat data turnamen')
        }
      } catch (err) {
        setError('Error memuat turnamen')
        console.error('Error fetching tournament:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchTournamentData()
  }, [params])

  // Realtime subscription for matches updates with fallback polling
  useEffect(() => {
    let subscription: ReturnType<typeof supabase.channel> | null = null
    let pollingInterval: NodeJS.Timeout | null = null

    const fetchLatestMatches = async (tournamentId: string) => {
      try {
        const { data: latestMatches, error } = await supabase
          .from('matches')
          .select('*')
          .eq('tournament_id', tournamentId)

        if (error) throw error

        if (latestMatches) {
          setMatches(latestMatches as Match[])
        }
      } catch (err) {
        console.error('Error fetching latest matches:', err)
      }
    }

    const setupRealtimeSubscription = async () => {
      try {
        const { id } = await params

        // Try to set up realtime subscription first
        subscription = supabase
          .channel(`matches_${id}`)
          .on(
            'postgres_changes',
            {
              event: '*',
              schema: 'public',
              table: 'matches',
              filter: `tournament_id=eq.${id}`,
            },
            (payload) => {
              if (payload.eventType === 'INSERT') {
                // Add new match
                setMatches(prev => [...prev, payload.new as Match])
              } else if (payload.eventType === 'UPDATE') {
                // Update existing match
                setMatches(prev =>
                  prev.map(match =>
                    match.id === payload.new.id
                      ? { ...match, ...payload.new } as Match
                      : match
                  )
                )
              } else if (payload.eventType === 'DELETE') {
                // Remove deleted match
                setMatches(prev =>
                  prev.filter(match => match.id !== payload.old.id)
                )
              }
            }
          )
          .subscribe((status) => {
            // If realtime fails, fall back to polling
            if (status === 'SUBSCRIBED') {

              if (pollingInterval) {
                clearInterval(pollingInterval)
                pollingInterval = null
              }
            } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
              // Set up polling as fallback (every 5 seconds)
              pollingInterval = setInterval(() => {
                fetchLatestMatches(id)
              }, 5000)
            }
          })
      } catch (err) {
        console.error('Error setting up realtime subscription:', err)
        // Fall back to polling if realtime setup fails
        const { id } = await params
        pollingInterval = setInterval(() => {
          fetchLatestMatches(id)
        }, 5000)
      }
    }

    // Only setup subscription after tournament data is loaded
    if (tournament?.id) {
      setupRealtimeSubscription()
    }

    // Cleanup subscription and polling on unmount
    return () => {
      if (subscription) {
        supabase.removeChannel(subscription)
      }
      if (pollingInterval) {
        clearInterval(pollingInterval)
      }
    }
  }, [params, tournament?.id])

  // Process group matches and standings
  const groupMatches = matches.filter(match => match.match_type === 'group')
  const knockoutMatches = matches
    .filter(match => match.match_type === 'knockout')
    .map(match => ({
      id: match.id,
      roundNumber: match.round_number || 1,
      matchNumber: match.match_number || 0,
      status: match.status,
      team1: teams.find(t => t.id === match.team1_id),
      team2: teams.find(t => t.id === match.team2_id),
      team1Score: match.team1_score,
      team2Score: match.team2_score,
      winnerId: match.winner_id,
    }))

  // Screenshot functionality
  const captureScreenshot = async (bracketId: string, title: string) => {
    const element = groupsContentRefs.current[bracketId]

    if (!element) return

    setIsCapturing(prev => ({ ...prev, [bracketId]: true }))

    try {
      // Wait a bit for the button to hide with opacity transition
      await new Promise(resolve => setTimeout(resolve, 200))

      // Get computed background color from root or body
      const rootStyles = getComputedStyle(document.documentElement)
      const backgroundColor = rootStyles.getPropertyValue('--background').trim() || '#ffffff'

      // Convert CSS variable to actual color if needed
      let bgColor = backgroundColor
      if (backgroundColor.includes('hsl')) {
        // Create a temporary element to compute the color
        const temp = document.createElement('div')
        temp.style.color = backgroundColor
        temp.style.display = 'none'
        document.body.appendChild(temp)
        bgColor = getComputedStyle(temp).color
        document.body.removeChild(temp)
      } else if (!backgroundColor.startsWith('#')) {
        // If it's a CSS variable reference, try to get the actual value
        const actualBg = getComputedStyle(document.body).backgroundColor
        bgColor = actualBg || '#ffffff'
      }

      const dataUrl = await toPng(element, {
        quality: 1,
        backgroundColor: bgColor,
        style: {
          transform: 'scale(1)',
        },
        filter: (node) => {
          // Filter out the screenshot button from the capture
          return !node.classList?.contains('opacity-0')
        }
      })

      setScreenshotModal({
        isOpen: true,
        imageUrl: dataUrl,
        bracketTitle: title
      })
    } catch (error) {
      console.error('Error capturing screenshot:', error)
      alert('Gagal mengambil screenshot. Silakan coba lagi.')
    } finally {
      setIsCapturing(prev => ({ ...prev, [bracketId]: false }))
    }
  }

  const downloadImage = () => {
    if (!screenshotModal.imageUrl) return

    const link = document.createElement('a')
    link.download = `${screenshotModal.bracketTitle.replace(/\s+/g, '-').toLowerCase()}.png`
    link.href = screenshotModal.imageUrl
    link.click()
  }

  const closeModal = () => {
    setScreenshotModal({
      isOpen: false,
      imageUrl: null,
      bracketTitle: ''
    })
  }

  // Calculate group standings
  const calculateGroupStandings = (groupName: string): GroupStanding[] => {
    const groupTeams = teams.filter(team =>
      groupMatches.some(match =>
        (match.team1_id === team.id || match.team2_id === team.id) &&
        match.round_name === groupName
      )
    )

    const standings = groupTeams.map(team => ({
      teamId: team.id,
      teamName: team.name,
      played: 0,
      won: 0,
      drawn: 0,
      lost: 0,
      goalsFor: 0,
      goalsAgainst: 0,
      goalDifference: 0,
      ballsFor: 0,
      ballsAgainst: 0,
      ballDifference: 0,
      points: 0,
    }))

    const relevantMatches = groupMatches.filter(match =>
      match.round_name === groupName && match.status === 'completed'
    )

    relevantMatches.forEach(match => {
      const team1Standing = standings.find(s => s.teamId === match.team1_id)
      const team2Standing = standings.find(s => s.teamId === match.team2_id)

      if (team1Standing && team2Standing) {
        const team1Score = match.team1_score || 0
        const team2Score = match.team2_score || 0
        const team1Balls = match.team1_balls || 0
        const team2Balls = match.team2_balls || 0

        team1Standing.played += 1
        team2Standing.played += 1
        team1Standing.goalsFor += team1Score
        team1Standing.goalsAgainst += team2Score
        team2Standing.goalsFor += team2Score
        team2Standing.goalsAgainst += team1Score
        team1Standing.ballsFor += team1Balls
        team1Standing.ballsAgainst += team2Balls
        team2Standing.ballsFor += team2Balls
        team2Standing.ballsAgainst += team1Balls

        if (team1Score > team2Score) {
          team1Standing.won += 1
          team1Standing.points += 3
          team2Standing.lost += 1
        } else if (team2Score > team1Score) {
          team2Standing.won += 1
          team2Standing.points += 3
          team1Standing.lost += 1
        } else {
          team1Standing.drawn += 1
          team2Standing.drawn += 1
          team1Standing.points += 1
          team2Standing.points += 1
        }

        team1Standing.goalDifference = team1Standing.goalsFor - team1Standing.goalsAgainst
        team2Standing.goalDifference = team2Standing.goalsFor - team2Standing.goalsAgainst
        team1Standing.ballDifference = team1Standing.ballsFor - team1Standing.ballsAgainst
        team2Standing.ballDifference = team2Standing.ballsFor - team2Standing.ballsAgainst
      }
    })


    return standings.sort((a, b) => {
      if (b.points !== a.points) return b.points - a.points
      if (b.ballDifference !== a.ballDifference) return b.ballDifference - a.ballDifference
      return a.teamName.localeCompare(b.teamName)
    })
  }

  // Helper to format date
  const formatDate = (dateString: string) => {
    if (!dateString) return 'TBD';
    return new Date(dateString).toLocaleDateString('id-ID', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Toggle group expansion
  const toggleGroupExpansion = (groupName: string) => {
    setExpandedGroups(prev => ({
      ...prev,
      [groupName]: !prev[groupName]
    }))
  }

  // Get unique groups
  const groups = Array.from(
    new Set(
      groupMatches
        .map(m => m.round_name)
        .filter(Boolean) as string[]
    )
  ).sort((a, b) => {
    const aNum = parseInt((a.match(/(\d+)$/) || [])[1] || '', 10)
    const bNum = parseInt((b.match(/(\d+)$/) || [])[1] || '', 10)

    if (!isNaN(aNum) && !isNaN(bNum)) return aNum - bNum
    if (!isNaN(aNum)) return -1
    if (!isNaN(bNum)) return 1

    return a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' })
  })

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-amber-950 via-orange-950 to-amber-950 flex items-center justify-center">
        <div className="game-ui-container animate-bounce-in">
          <div className="game-ui-inner">
            <div className="game-ui-content p-8 text-center space-y-4">
              <div className="text-7xl mb-4 animate-coin-flip">🎱</div>
              <div className="animate-spin rounded-full h-12 w-12 border-4 border-amber-600 border-t-transparent mx-auto mb-4"></div>
              <p className="text-white font-bold text-lg">Loading Tournament...</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (error || !tournament) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-amber-950 via-orange-950 to-amber-950 flex items-center justify-center p-4">
        <div className="game-ui-container animate-bounce-in">
          <div className="game-ui-inner">
            <div className="game-ui-content p-8 text-center space-y-6">
              <div className="text-7xl mb-4">😢</div>
              <p className="text-red-400 mb-6 text-lg font-bold">{error || 'Turnamen tidak ditemukan'}</p>
              <div className="leaderboard-row">
                <Link href="/tournaments" className="bg-gradient-to-r from-amber-100 to-amber-50 rounded-[14px] px-6 py-3 text-amber-900 font-bold press-effect inline-block">
                  ← Kembali ke turnamen
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-950 via-orange-950 to-amber-950">
      <div className="container mx-auto max-w-7xl px-4 py-6 md:py-8 relative z-10">
        {/* Navigation */}
        <div className="flex items-center justify-between mb-6">
          <div className="leaderboard-row">
            <Link href="/tournaments" className="bg-gradient-to-r from-amber-100 to-amber-50 rounded-[14px] px-4 py-2 text-amber-900 font-bold press-effect inline-flex items-center gap-2">
              ← Kembali
            </Link>
          </div>
          <ThemeToggle />
        </div>

        {/* Tournament Header - Game UI Style */}
        <div className="game-ui-container animate-bounce-in mb-6">
          <div className="game-ui-inner">
            <div className="game-ui-content p-4 md:p-6 space-y-4">
              <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-3 mb-3">
                    <span className="text-5xl animate-wiggle">🏆</span>
                    <h1 className="text-3xl md:text-4xl font-black text-white break-words">{tournament.name}</h1>
                  </div>
                  <div className="flex flex-wrap gap-2 text-sm md:text-base">
                    <Badge className="bg-cyan-500 text-white font-bold px-4 py-2 rounded-full">
                      ⚡ {formatLabels[tournament.format] || tournament.format}
                    </Badge>
                    <Badge className="bg-purple-500 text-white font-bold px-4 py-2 rounded-full">
                      👥 Max {tournament.max_teams} Teams
                    </Badge>
                  </div>
                </div>
                <Badge className="text-base md:text-lg font-bold px-6 py-3 flex-shrink-0 shadow-lg bg-orange-500 text-white rounded-full border-0">
                  🔥 {statusLabels[tournament.status] || tournament.status}
                </Badge>
              </div>

              {/* Tournament Info Grid */}
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                <div className="leaderboard-row">
                  <div className="bg-gradient-to-r from-amber-100 to-amber-50 rounded-[14px] p-3 md:p-4">
                    <p className="text-xs uppercase tracking-wide text-amber-700 mb-1 font-bold">Format</p>
                    <p className="text-sm text-amber-900 font-bold">{formatLabels[tournament.format] || tournament.format}</p>
                  </div>
                </div>
                <div className="leaderboard-row">
                  <div className="bg-gradient-to-r from-amber-100 to-amber-50 rounded-[14px] p-3 md:p-4">
                    <p className="text-xs uppercase tracking-wide text-amber-700 mb-1 font-bold">Tim Terdaftar</p>
                    <p className="text-sm text-amber-900 font-bold">{teams.length} / {tournament.max_teams}</p>
                  </div>
                </div>
                <div className="leaderboard-row sm:col-span-2 lg:col-span-1">
                  <div className="bg-gradient-to-r from-amber-100 to-amber-50 rounded-[14px] p-3 md:p-4">
                    <p className="text-xs uppercase tracking-wide text-amber-700 mb-1 font-bold">Status</p>
                    <p className="text-sm text-amber-900 font-bold">{statusLabels[tournament.status] || tournament.status}</p>
                  </div>
                </div>
              </div>

              {/* Additional Info */}
              {(tournament.description || tournament.location || tournament.start_date) && (
                <div className="space-y-3 pt-4 border-t border-amber-700/30">
                  {tournament.description && (
                    <p className="text-sm text-amber-200">{tournament.description}</p>
                  )}
                  {tournament.location && (
                    <div className="flex items-center gap-2 text-sm text-amber-200">
                      <span>📍</span>
                      <span>{tournament.location}</span>
                    </div>
                  )}
                  {tournament.start_date && (
                    <div className="flex items-center gap-2 text-sm text-amber-200">
                      <span>📅</span>
                      <span>
                        {new Date(tournament.start_date).toLocaleDateString('id-ID', {
                          day: 'numeric',
                          month: 'long',
                          year: 'numeric'
                        })}
                        {tournament.end_date && tournament.end_date !== tournament.start_date && (
                          ` - ${new Date(tournament.end_date).toLocaleDateString('id-ID', {
                            day: 'numeric',
                            month: 'long',
                            year: 'numeric'
                          })}`
                        )}
                      </span>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Participants - Game UI Style */}
        {teams.length > 0 && (
          <div className="game-ui-container mb-6">
            <div className="game-ui-inner">
              <div className="game-ui-content p-4 md:p-6 space-y-4">
                <h2 className="text-lg md:text-xl font-black text-white flex items-center gap-2">
                  <span>👥</span> Peserta ({teams.length})
                </h2>
                <div className="grid w-full min-w-0 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {(showAllParticipants ? teams : teams.slice(0, 6)).map((team) => (
                    <div key={team.id} className="leaderboard-row">
                      <div className="bg-gradient-to-r from-amber-100 to-amber-50 rounded-[14px] p-3 flex flex-col min-w-0">
                        <div className="font-bold text-amber-900 truncate min-w-0 flex-1 mb-1">
                          {team.name}
                        </div>
                        <div className="text-xs text-amber-700 space-y-0.5">
                          {(team.players?.[1] && team.players?.[1] != '-') && (
                            <div className="truncate">* {team.players[1]}</div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                {teams.length > 6 && (
                  <div className="mt-4 text-center">
                    <button
                      onClick={() => setShowAllParticipants(!showAllParticipants)}
                      className="text-sm text-amber-200 hover:text-white font-bold transition-colors"
                    >
                      {showAllParticipants ? '← Tampilkan Lebih Sedikit' : `Tampilkan Semua (${teams.length - 6} lainnya) →`}
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Group Stage */}
        {groups.length > 0 && (
          <div className="space-y-6">
            <div className="game-ui-container animate-bounce-in">
              <div className="game-ui-inner">
                <div className="game-ui-content p-4">
                  <h2 className="text-xl md:text-2xl font-bold text-white neon-glow flex items-center gap-2">
                    <span>⚡</span> Babak Grup
                  </h2>
                </div>
              </div>
            </div>
            <div className="grid gap-4 md:gap-6 xl:grid-cols-2">
              {groups.map((groupName) => {
                const standings = calculateGroupStandings(groupName!)
                const groupMatchList = groupMatches
                  .filter(match => match.round_name === groupName)
                  .sort((a, b) => {
                    // First, sort by status priority: pending > in_progress > completed
                    const statusPriority: Record<string, number> = {
                      'in_progress': 1,
                      'pending': 2,
                      'completed': 3,
                    }
                    const statusA = statusPriority[a.status] || 999
                    const statusB = statusPriority[b.status] || 999
                    if (statusA !== statusB) return statusA - statusB

                    // Then sort by scheduled time
                    const parseTime = (s?: string) => {
                      if (!s) return Infinity
                      const t = Date.parse(s)
                      return Number.isNaN(t) ? Infinity : t
                    }

                    const tA = parseTime(a.scheduled_at)
                    const tB = parseTime(b.scheduled_at)
                    if (tA !== tB) return tA - tB

                    // If scheduled times are equal or both missing, sort by table_number (if present)
                    const tableA = typeof a.table_number === 'number' ? a.table_number : Infinity
                    const tableB = typeof b.table_number === 'number' ? b.table_number : Infinity
                    if (tableA !== tableB) return tableA - tableB

                    // Fallback to match_number, then id for stable ordering
                    const mA = typeof a.match_number === 'number' ? a.match_number : Infinity
                    const mB = typeof b.match_number === 'number' ? b.match_number : Infinity
                    if (mA !== mB) return mA - mB

                    return a.id.localeCompare(b.id)
                  })

                return (
                  <div ref={(el) => { groupsContentRefs.current[groupName] = el }} key={groupName} className="game-ui-container animate-bounce-in w-full overflow-hidden">
                    <div className="game-ui-inner">
                      <div className="game-ui-content">
                        <div className="p-4 md:p-6 border-b border-amber-700/30">
                          <div className="flex items-center justify-between">
                            <h3 className="text-xl font-bold text-white neon-glow">
                              {groupName
                                ? groupName.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
                                : 'Grup'}
                            </h3>
                            <div className='flex gap-2'>
                              <div className="leaderboard-row">
                                <button
                                  onClick={() => {
                                    captureScreenshot(groupName, groupName.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase()))
                                  }}
                                  className={`bg-gradient-to-r from-amber-100 to-amber-50 rounded-[12px] p-2 press-effect ${isCapturing[groupName] ? 'opacity-0 pointer-events-none' : ''}`}
                                  title="Lihat Fullscreen"
                                  disabled={isCapturing[groupName]}
                                >
                                  {isCapturing[groupName] ? (
                                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-amber-700"></div>
                                  ) : (
                                    <Camera className="h-4 w-4 text-amber-700" />
                                  )}
                                </button>
                              </div>
                              <div className="leaderboard-row">
                                <div className="bg-gradient-to-r from-blue-100 to-blue-50 rounded-[12px] px-3 py-2">
                                  <span className="text-blue-800 font-bold text-sm">{groupMatchList.length} pertandingan</span>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                        <div className="p-4 md:p-6 space-y-4 w-full overflow-hidden">
                          {/* Standings */}
                          <div>
                            <div className="leaderboard-row mb-2">
                              <h4 className="bg-gradient-to-r from-amber-100 to-amber-50 rounded-[12px] px-3 py-2 text-sm font-bold text-amber-900">🏆 Klasemen</h4>
                            </div>
                            <div className="overflow-x-auto">
                              <Table>
                                <TableHeader>
                                  <TableRow>
                                    <TableHead className="w-8">#</TableHead>
                                    <TableHead className="min-w-[250px]">Tim</TableHead>
                                    <TableHead className="text-center w-8">M</TableHead>
                                    <TableHead className="text-center w-8">W</TableHead>
                                    <TableHead className="text-center w-8">D</TableHead>
                                    <TableHead className="text-center w-8">L</TableHead>
                                    <TableHead className="text-center w-8">BD</TableHead>
                                    <TableHead className="text-center w-8">Pts</TableHead>
                                  </TableRow>
                                </TableHeader>
                                <TableBody>
                                  {standings.map((standing, index) => (
                                    <TableRow key={standing.teamId}>
                                      <TableCell className="font-medium text-accent">{index + 1}</TableCell>
                                      <TableCell className="font-medium text-secondary-foreground">
                                        <div className="truncate max-w-[250px]">{standing.teamName}</div>
                                      </TableCell>
                                      <TableCell className="text-center text-secondary-foreground/70">{standing.played}</TableCell>
                                      <TableCell className="text-center text-secondary-foreground/70">{standing.won}</TableCell>
                                      <TableCell className="text-center text-secondary-foreground/70">{standing.drawn}</TableCell>
                                      <TableCell className="text-center text-secondary-foreground/70">{standing.lost}</TableCell>
                                      <TableCell className={`text-center font-medium ${standing.ballDifference > 0
                                        ? 'text-green-600'
                                        : standing.ballDifference < 0
                                          ? 'text-red-600'
                                          : 'text-secondary-foreground/70'
                                        }`}>
                                        {standing.ballDifference > 0 ? `+${standing.ballDifference}` : standing.ballDifference}
                                      </TableCell>
                                      <TableCell className="text-center font-semibold text-accent">{standing.points}</TableCell>
                                    </TableRow>
                                  ))}
                                </TableBody>
                              </Table>
                            </div>
                          </div>

                          {/* Matches */}
                          <div>
                            <div className="leaderboard-row mb-2">
                              <h4 className="bg-gradient-to-r from-amber-100 to-amber-50 rounded-[12px] px-3 py-2 text-sm font-bold text-amber-900">⚽ Pertandingan</h4>
                            </div>
                            <div className="space-y-3 w-full">
                              {(expandedGroups[groupName!] ? groupMatchList : groupMatchList.slice(0, 3)).map((match) => {
                                const team1 = teams.find(t => t.id === match.team1_id)
                                const team2 = teams.find(t => t.id === match.team2_id)
                                const isCompleted = match.status === 'completed'
                                const scoreDisplay = isCompleted &&
                                  typeof match.team1_score === 'number' &&
                                  typeof match.team2_score === 'number'
                                  ? `${match.team1_score} - ${match.team2_score}`
                                  : match.status === 'in_progress' ? 'Sedang Berlangsung' : match.scheduled_at ? formatDate(match.scheduled_at) : 'Terjadwal'

                                return (
                                  <div key={match.id} className="bg-secondary border border-border rounded-lg p-4 w-full overflow-hidden">
                                    <div className="flex flex-col items-center gap-2 w-full">
                                      {/* Team 1 */}
                                      <div className="w-full px-2">
                                        <p className="text-sm font-medium text-foreground text-center truncate">
                                          {team1?.name || 'TBD'}
                                        </p>
                                      </div>

                                      {/* VS divider */}
                                      <span className="text-xs text-muted-foreground font-semibold">vs</span>

                                      {/* Team 2 */}
                                      <div className="w-full px-2">
                                        <p className="text-sm font-medium text-foreground text-center truncate">
                                          {team2?.name || 'TBD'}
                                        </p>
                                      </div>

                                      {/* Score */}
                                      <div className="mt-2">
                                        <span className={`text-lg font-bold ${isCompleted ? 'text-accent' : 'text-muted-foreground'}`}>
                                          {scoreDisplay}
                                        </span>
                                      </div>

                                      {/* Table info */}
                                      {match.table_number && (
                                        <div className="text-xs text-muted-foreground mt-1">
                                          Meja {match.table_number}
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                )
                              })}
                            </div>
                            {groupMatchList.length > 3 && (
                              <div className="mt-3 text-center">
                                <button
                                  onClick={() => toggleGroupExpansion(groupName!)}
                                  className="text-sm text-accent hover:text-accent/80 font-medium transition-colors"
                                >
                                  {expandedGroups[groupName!] ? '← Tampilkan Lebih Sedikit' : `Tampilkan Semua Pertandingan (${groupMatchList.length - 3} lainnya) →`}
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )
        }

        {/* Knockout Bracket */}
        {
          knockoutMatches.length > 0 && (
            <TournamentBracket
              format={tournament.format}
              matches={matches}
              teams={teams}
            />
          )
        }

        {/* Knockout Match Schedule */}
        {
          knockoutMatches.length > 0 && (
            <div className="game-ui-container animate-bounce-in">
              <div className="game-ui-inner">
                <div className="game-ui-content">
                  <div className="p-4 md:p-6 border-b border-amber-700/30">
                    <h2 className="text-xl font-bold text-white neon-glow flex items-center gap-2">
                      <span>🥊</span> Jadwal Pertandingan Knockout
                    </h2>
                  </div>
                  <div className="p-4 md:p-6">
                    <div className="space-y-4">
                      {/* Group matches by round */}
                      {Array.from(new Set(matches.filter(m => m.match_type === 'knockout').map(m => m.round_name).filter(Boolean)))
                        .sort((a, b) => {
                          // Sort rounds in chronological order
                          const getRoundPriority = (roundName: string) => {
                            const rn = roundName?.toLowerCase() || ''
                            if (rn.includes('round-of-16') || rn.includes('16-besar')) return 1
                            if (rn.includes('quarter') || rn.includes('8-besar')) return 2
                            if (rn.includes('semi') || rn.includes('4-besar')) return 3
                            if (rn.includes('3rd') || rn.includes('3-4') || rn.includes('peringkat-3')) return 4
                            if (rn.includes('final') && !rn.includes('grand') && !rn.includes('semi')) return 5
                            if (rn.includes('grand')) return 6
                            return 0
                          }
                          return getRoundPriority(a || '') - getRoundPriority(b || '')
                        })
                        .map((roundName) => {
                          const roundMatches = matches
                            .filter(m => m.match_type === 'knockout' && m.round_name === roundName)
                            .sort((a, b) => {
                              // Sort by status, then by scheduled time
                              const statusPriority: Record<string, number> = {
                                'in_progress': 1,
                                'pending': 2,
                                'completed': 3,
                              }
                              const statusA = statusPriority[a.status] || 999
                              const statusB = statusPriority[b.status] || 999
                              if (statusA !== statusB) return statusA - statusB

                              const parseTime = (s?: string) => {
                                if (!s) return Infinity
                                const t = Date.parse(s)
                                return Number.isNaN(t) ? Infinity : t
                              }
                              const tA = parseTime(a.scheduled_at)
                              const tB = parseTime(b.scheduled_at)
                              if (tA !== tB) return tA - tB

                              return (a.match_number || 0) - (b.match_number || 0)
                            })

                          const isExpanded = expandedKnockoutRounds[roundName || '']
                          const displayMatches = isExpanded ? roundMatches : roundMatches.slice(0, 3)

                          return (
                            <div key={roundName} className="space-y-2 border border-border rounded-lg p-4 bg-secondary/50">
                              <div className="flex items-center justify-between">
                                <h3 className="text-lg font-semibold text-accent">
                                  {roundName
                                    ? roundName.replace(/-/g, ' ').replace(/\b\w/g, (c: string) => c.toUpperCase())
                                    : 'Round'}
                                </h3>
                                <Badge variant="outline" className="text-accent border-border">
                                  {roundMatches.length} pertandingan
                                </Badge>
                              </div>
                              <div className="space-y-2">
                                {displayMatches.map((match) => {
                                  const team1 = teams.find(t => t.id === match.team1_id)
                                  const team2 = teams.find(t => t.id === match.team2_id)
                                  const isCompleted = match.status === 'completed'
                                  const scoreDisplay = isCompleted &&
                                    typeof match.team1_score === 'number' &&
                                    typeof match.team2_score === 'number'
                                    ? `${match.team1_score} - ${match.team2_score}`
                                    : match.status === 'in_progress' ? 'Sedang Berlangsung' : match.scheduled_at ? formatDate(match.scheduled_at) : 'Belum Dijadwalkan'

                                  return (
                                    <div key={match.id} className="flex flex-col sm:flex-row items-center justify-between bg-card border border-border rounded-lg p-3 gap-2">
                                      <div className="flex-1 w-full">
                                        <div className="text-sm text-foreground flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-2">
                                          <span className="font-medium truncate md:w-[40%]">{team1?.name || 'TBD'}</span>
                                          <span className="text-accent text-xs sm:text-sm flex-shrink-0">vs</span>
                                          <span className="font-medium truncate md:w-[40%]">{team2?.name || 'TBD'}</span>
                                        </div>
                                      </div>
                                      <div className="flex flex-col items-center md:items-end  gap-1">
                                        <span className={`text-sm ${isCompleted ? 'text-accent font-bold' : 'text-muted-foreground font-medium'}`}>
                                          {scoreDisplay}
                                        </span>
                                        {match.table_number && match.scheduled_at && (
                                          <span className="text-xs text-muted-foreground">
                                            Meja {match.table_number}
                                          </span>
                                        )}
                                      </div>
                                    </div>
                                  )
                                })}
                              </div>
                              {roundMatches.length > 3 && (
                                <div className="mt-3 text-center">
                                  <button
                                    onClick={() => setExpandedKnockoutRounds(prev => ({
                                      ...prev,
                                      [roundName || '']: !prev[roundName || '']
                                    }))}
                                    className="text-sm text-accent hover:text-accent/80 font-medium transition-colors"
                                  >
                                    {isExpanded ? '← Tampilkan Lebih Sedikit' : `Tampilkan Semua Pertandingan (${roundMatches.length - 3} lainnya) →`}
                                  </button>
                                </div>
                              )}
                            </div>
                          )
                        })}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

        {/* Tournament Progress */}
        <div className="game-ui-container animate-bounce-in">
          <div className="game-ui-inner">
            <div className="game-ui-content">
              <div className="p-4 md:p-6 border-b border-amber-700/30">
                <h2 className="text-xl font-bold text-white neon-glow flex items-center gap-2">
                  <span>📊</span> Progress Turnamen
                </h2>
              </div>
              <div className="p-4 md:p-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Pertandingan Selesai</span>
                    <span className="text-accent font-medium">
                      {matches.filter(m => m.status === 'completed').length} / {matches.length}
                    </span>
                  </div>
                  <div className="w-full bg-secondary rounded-full h-2">
                    <div
                      className="bg-gradient-to-r from-[var(--foreground)] to-[var(--foreground)]/80 h-2 rounded-full transition-all duration-500"
                      style={{
                        width: `${matches.length > 0 ? (matches.filter(m => m.status === 'completed').length / matches.length) * 100 : 0}%`
                      }}
                    ></div>
                  </div>
                  <div className="text-center">
                    <span className="text-xs text-muted-foreground">
                      {matches.length > 0
                        ? `${Math.round((matches.filter(m => m.status === 'completed').length / matches.length) * 100)}% Selesai`
                        : 'Tidak ada pertandingan terjadwal'
                      }
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>     </div>
      </div>        {/* Screenshot Modal */}
      {
        screenshotModal.isOpen && screenshotModal.imageUrl && (
          <div
            className="fixed inset-0 z-50 bg-background/95 backdrop-blur-sm flex items-center justify-center"
            onClick={closeModal}
          >
            <div
              className="relative w-full h-full flex flex-col bg-background overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Modal Header */}
              <div className="flex items-center justify-between p-3 md:p-4 border-b border-border bg-card/95 backdrop-blur flex-shrink-0">
                <h3 className="text-base md:text-lg font-semibold text-foreground truncate mr-2">
                  {screenshotModal.bracketTitle}
                </h3>
                <div className="flex items-center gap-2">
                  <Button
                    onClick={downloadImage}
                    variant="outline"
                    size="icon"
                    className="h-8 w-8 md:h-9 md:w-9"
                    title="Download"
                  >
                    <Download className="h-3.5 w-3.5 md:h-4 md:w-4" />
                  </Button>
                  <Button
                    onClick={closeModal}
                    variant="outline"
                    size="icon"
                    className="h-8 w-8 md:h-9 md:w-9"
                    title="Close"
                  >
                    <X className="h-3.5 w-3.5 md:h-4 md:w-4" />
                  </Button>
                </div>
              </div>

              {/* Modal Content with Zoom/Pan */}
              <div className="flex-1 min-h-0 bg-background relative">
                <TransformWrapper
                  initialScale={1}
                  minScale={0.3}
                  maxScale={3}
                  centerOnInit
                  wheel={{ step: 0.1 }}
                  pinch={{ step: 5 }}
                  doubleClick={{ mode: 'reset' }}
                  limitToBounds={false}
                >
                  {({ zoomIn, zoomOut, resetTransform }) => (
                    <>
                      {/* Zoom Controls Overlay */}
                      <div className="absolute top-4 right-4 z-10 flex flex-col gap-2 bg-card/95 backdrop-blur rounded-lg p-2 border border-border shadow-lg">
                        <Button
                          onClick={() => zoomIn()}
                          variant="outline"
                          size="icon"
                          className="h-8 w-8 md:h-9 md:w-9"
                          title="Zoom In"
                        >
                          <ZoomIn className="h-3.5 w-3.5 md:h-4 md:w-4" />
                        </Button>
                        <Button
                          onClick={() => resetTransform()}
                          variant="outline"
                          size="icon"
                          className="h-8 w-8 md:h-9 md:w-9"
                          title="Reset"
                        >
                          <Maximize2 className="h-3.5 w-3.5 md:h-4 md:w-4" />
                        </Button>
                        <Button
                          onClick={() => zoomOut()}
                          variant="outline"
                          size="icon"
                          className="h-8 w-8 md:h-9 md:w-9"
                          title="Zoom Out"
                        >
                          <ZoomOut className="h-3.5 w-3.5 md:h-4 md:w-4" />
                        </Button>
                      </div>

                      <TransformComponent
                        wrapperClass="!w-full !h-full"
                        contentClass="!w-full !h-full !flex !items-center !justify-center"
                        wrapperStyle={{
                          width: '100%',
                          height: '100%',
                        }}
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={screenshotModal.imageUrl || ''}
                          alt={screenshotModal.bracketTitle}
                          className="max-w-full max-h-full object-contain"
                          style={{
                            maxWidth: '100%',
                            maxHeight: '100%',
                            width: 'auto',
                            height: 'auto'
                          }}
                        />
                      </TransformComponent>
                    </>
                  )}
                </TransformWrapper>
              </div>

              {/* Modal Footer */}
              <div className="p-2 md:p-3 border-t border-border bg-card/95 backdrop-blur text-center flex-shrink-0">
                <p className="text-[10px] md:text-xs text-muted-foreground">
                  💡 <span className="hidden sm:inline">Gunakan scroll mouse, pinch gesture, atau tombol untuk zoom. Drag untuk pan. Double-click untuk reset.</span>
                  <span className="sm:hidden">Pinch untuk zoom, drag untuk pan, double-tap untuk reset.</span>
                </p>
              </div>
            </div>
          </div>
        )
      }
    </div>
  )
}