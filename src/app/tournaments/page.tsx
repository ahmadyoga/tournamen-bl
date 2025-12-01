'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ThemeToggle } from '@/components/theme-toggle'
import { ArrowLeft, Trophy, Users, Zap, Flame, Star } from 'lucide-react'

interface Tournament {
  id: string
  name: string
  format: string
  status: string
  max_teams: number
  description?: string
  start_date?: string
  end_date?: string
  location?: string
}

const formatLabels: Record<string, string> = {
  group_knockout: "Grup + Knockout",
  single_elimination: "Eliminasi Tunggal",
  double_elimination: "Eliminasi Ganda",
}

const statusLabels: Record<string, string> = {
  setup: "Persiapan",
  group_stage: "Babak Grup",
  knockout: "Babak Knockout",
  completed: "Selesai",
}

export default function TournamentsPage() {
  const [tournaments, setTournaments] = useState<Tournament[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchTournaments()
  }, [])

  const fetchTournaments = async () => {
    try {
      const response = await fetch('/api/tournaments')
      const data = await response.json()

      if (data.success) {
        setTournaments(data.tournaments)
      } else {
        setError('Gagal memuat turnamen')
      }
    } catch (err) {
      setError('Error memuat turnamen')
      console.error('Error fetching tournaments:', err)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-primary/5 to-background flex items-center justify-center">
        <div className="text-center animate-bounce-in">
          <div className="text-7xl mb-4 animate-coin-flip">🎱</div>
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary border-t-transparent mx-auto mb-4"></div>
          <p className="text-foreground font-bold text-lg">Loading Tournament...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-red-500/5 to-background flex items-center justify-center p-4">
        <div className="text-center max-w-md">
          <div className="text-7xl mb-4">😢</div>
          <p className="text-red-500 mb-6 text-lg font-bold">{error}</p>
          <Button
            onClick={fetchTournaments}
            className="bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-600 hover:to-pink-600 text-white font-bold px-8 py-6 rounded-2xl shadow-lg shadow-red-500/30 press-effect"
          >
            🔄 Coba Lagi
          </Button>
        </div>
      </div>
    )
  }

  const colors = [
    { from: 'from-cyan-500/30', to: 'to-blue-500/30', border: 'border-cyan-400', glow: 'shadow-cyan-500/40', accent: 'bg-cyan-500', icon: '💎' },
    { from: 'from-purple-500/30', to: 'to-pink-500/30', border: 'border-purple-400', glow: 'shadow-purple-500/40', accent: 'bg-purple-500', icon: '⚡' },
    { from: 'from-orange-500/30', to: 'to-red-500/30', border: 'border-orange-400', glow: 'shadow-orange-500/40', accent: 'bg-orange-500', icon: '🔥' },
    { from: 'from-green-500/30', to: 'to-emerald-500/30', border: 'border-green-400', glow: 'shadow-green-500/40', accent: 'bg-green-500', icon: '⭐' },
    { from: 'from-blue-500/30', to: 'to-indigo-500/30', border: 'border-blue-400', glow: 'shadow-blue-500/40', accent: 'bg-blue-500', icon: '💫' },
    { from: 'from-pink-500/30', to: 'to-rose-500/30', border: 'border-pink-400', glow: 'shadow-pink-500/40', accent: 'bg-pink-500', icon: '🌟' },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-950 via-orange-950 to-amber-950">

      <div className="container mx-auto max-w-7xl py-8 md:py-12 px-4 relative z-10">
        {/* Header */}
        <div className="flex flex-col gap-6 mb-8 md:mb-12">
          <div className="flex items-center justify-between">
            <Link href="/">
              <Button variant="outline" className="border-2 border-primary/30 hover:bg-primary/10 press-effect">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Home
              </Button>
            </Link>
            <ThemeToggle />
          </div>

          <div className="text-center space-y-4 animate-bounce-in">
            <div className="inline-flex items-center gap-2 px-6 py-3 rounded-full border-2 border-primary bg-primary/20 backdrop-blur-sm shadow-lg animate-pulse-glow">
              <Trophy className="w-5 h-5 text-primary animate-glow-pulse" />
              <span className="text-sm md:text-base font-bold text-primary">ALL TOURNAMENTS</span>
            </div>
            <h1 className="text-4xl md:text-6xl font-black neon-glow">
              🎮 Turnamen Aktif
            </h1>
            <p className="text-muted-foreground text-lg md:text-xl">
              Pilih turnamen dan tunjukkan skill kamu!
            </p>
          </div>
        </div>

        {/* Tournaments Grid */}
        {tournaments.length === 0 ? (
          <Card className="bg-card/80 backdrop-blur-sm border-2 border-primary/30 shadow-xl animate-bounce-in">
            <CardContent className="flex flex-col items-center justify-center py-16">
              <div className="text-7xl mb-4">🎱</div>
              <p className="text-foreground text-center text-lg font-bold mb-2">
                Belum Ada Turnamen Aktif
              </p>
              <p className="text-muted-foreground">
                Cek lagi nanti untuk update! ⚡
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {tournaments.map((tournament, index) => {
              const colorScheme = colors[index % colors.length];

              return (
                <Link key={tournament.id} href={`/tournament/${tournament.id}`} className="block">
                  <div className="game-ui-container animate-bounce-in press-effect" style={{ animationDelay: `${index * 0.1}s` }}>
                    <div className="game-ui-inner">
                      <div className="game-ui-content p-4 md:p-6 space-y-4">
                        {/* Tournament Header */}
                        <div className="flex items-start justify-between gap-2">
                          <div className="text-4xl animate-wiggle" style={{ animationDelay: `${index * 0.2}s` }}>
                            {colorScheme.icon}
                          </div>
                          <Badge className={`${colorScheme.accent} text-white font-bold text-xs px-3 py-1 rounded-full shadow-lg`}>
                            🔥 {statusLabels[tournament.status] || tournament.status}
                          </Badge>
                        </div>

                        {/* Tournament Name */}
                        <h3 className="text-xl md:text-2xl font-black text-white line-clamp-2 min-h-[3.5rem]">
                          {tournament.name}
                        </h3>

                        {/* Tournament Info */}
                        <div className="space-y-2">
                          <div className="leaderboard-row">
                            <div className="bg-gradient-to-r from-amber-100 to-amber-50 rounded-[14px] px-4 py-2 flex items-center gap-2">
                              <Zap className="w-4 h-4 text-amber-700" />
                              <span className="text-sm font-bold text-amber-900">{formatLabels[tournament.format] || tournament.format}</span>
                            </div>
                          </div>

                          <div className="leaderboard-row">
                            <div className="bg-gradient-to-r from-amber-100 to-amber-50 rounded-[14px] px-4 py-2 flex items-center gap-2">
                              <Users className="w-4 h-4 text-amber-700" />
                              <span className="text-sm font-bold text-amber-900">Max {tournament.max_teams} Teams</span>
                            </div>
                          </div>
                        </div>

                        {/* Description */}
                        {tournament.description && (
                          <p className="text-sm text-amber-200 line-clamp-2">
                            {tournament.description}
                          </p>
                        )}

                        {/* Location & Date */}
                        <div className="space-y-2 text-xs text-amber-200">
                          {tournament.location && (
                            <div className="flex items-center gap-2">
                              <span>📍</span>
                              <span className="font-medium">{tournament.location}</span>
                            </div>
                          )}
                          {tournament.start_date && (
                            <div className="flex items-center gap-2">
                              <span>📅</span>
                              <span className="font-medium">
                                {new Date(tournament.start_date).toLocaleDateString('id-ID', {
                                  day: 'numeric',
                                  month: 'short',
                                  year: 'numeric'
                                })}
                              </span>
                            </div>
                          )}
                        </div>

                        {/* CTA Button */}
                        <div className="leaderboard-row">
                          <div className="bg-gradient-to-r from-amber-100 to-amber-50 rounded-[14px] py-3 text-center">
                            <span className="font-black text-amber-900 text-base">
                              🎮 LIHAT DETAIL
                              <Star className="inline ml-2 w-4 h-4" />
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  )
}
