'use client'

import React, { useRef, useState } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Trophy, ZoomIn, ZoomOut, Maximize2, X, Download } from 'lucide-react'
import { toPng } from 'html-to-image'
import { TransformWrapper, TransformComponent } from 'react-zoom-pan-pinch'

interface Team {
  id: string
  name: string
  tournament_id: string
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
  next_match_id?: string | null
  note?: string
}

interface TournamentBracketProps {
  format: string
  matches: Match[]
  teams: Team[]
}

interface RoundColumn {
  name: string
  round: number
  matches: Match[]
}

export function TournamentBracket({ format, matches, teams }: TournamentBracketProps) {
  const bracketContentRefs = useRef<Record<string, HTMLDivElement | null>>({})

  // Screenshot modal state
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

  // Filter only knockout matches
  const knockoutMatches = matches.filter(match => match.match_type === 'knockout')

  const isDoubleElimination = String(format || '').toLowerCase() === 'double_elimination'

  const upperBracketMatches = isDoubleElimination
    ? knockoutMatches.filter(match => match.round_name === 'upper')
    : []

  const lowerBracketMatches = isDoubleElimination
    ? knockoutMatches.filter(match => match.round_name === 'lower')
    : []

  const grandFinalMatches = isDoubleElimination
    ? knockoutMatches.filter(match => {
      const rn = String(match.round_name || '').toLowerCase()
      return rn === 'grand-final' || rn === 'grand_final' || rn === 'grandfinal'
    })
    : []

  const otherMatches = isDoubleElimination ? [] : knockoutMatches

  // Check if there are no knockout matches
  if (knockoutMatches.length === 0) {
    return null
  }

  // Separate matches by bracket type

  // Build rounds structure based on next_match_id
  const buildRounds = (bracketMatches: Match[]): RoundColumn[] => {
    if (bracketMatches.length === 0) return []

    // Group by round number
    const roundsMap = new Map<number, Match[]>()
    bracketMatches.forEach(match => {
      const round = match.round_number || 0
      if (!roundsMap.has(round)) {
        roundsMap.set(round, [])
      }
      roundsMap.get(round)!.push(match)
    })

    // Sort matches within each round by match_number
    const rounds: RoundColumn[] = Array.from(roundsMap.entries())
      .sort(([a], [b]) => a - b)
      .map(([round, matches]) => ({
        name: matches[0]?.round_name || `Round ${round}`,
        round,
        matches: matches.sort((a, b) => (a.match_number || 0) - (b.match_number || 0))
      }))

    return rounds
  }

  // Screenshot functionality
  const captureScreenshot = async (bracketId: string, title: string) => {
    const element = bracketContentRefs.current[bracketId]
    if (!element) return

    setIsCapturing(prev => ({ ...prev, [bracketId]: true }))

    try {
      // Wait a bit for any animations to complete
      await new Promise(resolve => setTimeout(resolve, 100))

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

  const closeModal = () => {
    setScreenshotModal({
      isOpen: false,
      imageUrl: null,
      bracketTitle: ''
    })
  }

  const downloadImage = () => {
    if (!screenshotModal.imageUrl) return

    const link = document.createElement('a')
    link.download = `${screenshotModal.bracketTitle.replace(/\s+/g, '-').toLowerCase()}.png`
    link.href = screenshotModal.imageUrl
    link.click()
  }


  const renderBracket = (bracketMatches: Match[], title: string, bracketType: 'upper' | 'lower' | 'grand-final' | 'other') => {
    if (bracketMatches.length === 0) return null

    const bracketId = `bracket-${bracketType}`

    const rounds = buildRounds(bracketMatches)

    // Calculate positions for each match based on next_match_id relationships
    const matchPositions = new Map<string, { x: number, y: number }>()
    const MATCH_HEIGHT = 100
    const ROUND_WIDTH = 340
    const HEADER_HEIGHT = 60

    // Find the round with the most matches - this will be our reference
    const maxMatchesInRound = Math.max(...rounds.map(r => r.matches.length))
    const benchmarkRoundIndex = rounds.findIndex(r => r.matches.length === maxMatchesInRound)

    // Start with the benchmark round - distribute evenly
    rounds[benchmarkRoundIndex]?.matches.forEach((match, index) => {
      matchPositions.set(match.id, {
        x: benchmarkRoundIndex * ROUND_WIDTH,
        y: HEADER_HEIGHT + (index * MATCH_HEIGHT * 2) // Space them out evenly
      })
    })

    // Position rounds BEFORE benchmark (working backwards)
    for (let roundIndex = benchmarkRoundIndex - 1; roundIndex >= 0; roundIndex--) {
      const round = rounds[roundIndex]
      round.matches.forEach((match) => {
        // Find which match in the next round this feeds into
        const nextRound = rounds[roundIndex + 1]
        const nextMatch = nextRound?.matches.find(m => m.id === match.next_match_id)

        if (nextMatch) {
          const nextPos = matchPositions.get(nextMatch.id)
          if (nextPos) {
            // Check if another match also feeds into the same next match
            const siblingMatch = round.matches.find(
              m => m.id !== match.id && m.next_match_id === match.next_match_id
            )

            if (siblingMatch && !matchPositions.has(siblingMatch.id)) {
              // This is the first of a pair - position above the next match
              matchPositions.set(match.id, {
                x: roundIndex * ROUND_WIDTH,
                y: nextPos.y - MATCH_HEIGHT
              })
            } else if (siblingMatch && matchPositions.has(siblingMatch.id)) {
              // This is the second of a pair - position below the next match
              matchPositions.set(match.id, {
                x: roundIndex * ROUND_WIDTH,
                y: nextPos.y + MATCH_HEIGHT
              })
            } else {
              // Single feeder - align horizontally
              matchPositions.set(match.id, {
                x: roundIndex * ROUND_WIDTH,
                y: nextPos.y
              })
            }
          }
        } else {
          // No next match found, use default positioning
          const existingPositions = Array.from(matchPositions.values())
            .filter(pos => pos.x === roundIndex * ROUND_WIDTH)
          const lastY = existingPositions.length > 0
            ? Math.max(...existingPositions.map(p => p.y))
            : HEADER_HEIGHT
          matchPositions.set(match.id, {
            x: roundIndex * ROUND_WIDTH,
            y: lastY + MATCH_HEIGHT * 2
          })
        }
      })
    }

    // Position rounds AFTER benchmark (working forwards)
    for (let roundIndex = benchmarkRoundIndex + 1; roundIndex < rounds.length; roundIndex++) {
      const round = rounds[roundIndex]
      round.matches.forEach((match) => {
        // Find all matches that feed into this match
        const feedingMatches = rounds[roundIndex - 1]?.matches.filter(
          m => m.next_match_id === match.id
        ) || []

        if (feedingMatches.length === 0) {
          // No feeding matches, use default position
          const existingPositions = Array.from(matchPositions.values())
            .filter(pos => pos.x === roundIndex * ROUND_WIDTH)
          const lastY = existingPositions.length > 0
            ? Math.max(...existingPositions.map(p => p.y))
            : HEADER_HEIGHT
          matchPositions.set(match.id, {
            x: roundIndex * ROUND_WIDTH,
            y: lastY + MATCH_HEIGHT * 2
          })
        } else if (feedingMatches.length === 1) {
          // Single feeder - align horizontally
          const feederPos = matchPositions.get(feedingMatches[0].id)
          if (feederPos) {
            matchPositions.set(match.id, {
              x: roundIndex * ROUND_WIDTH,
              y: feederPos.y
            })
          }
        } else {
          // Multiple feeders - position at midpoint
          const feederPositions = feedingMatches
            .map(m => matchPositions.get(m.id))
            .filter(Boolean) as { x: number, y: number }[]

          if (feederPositions.length > 0) {
            const avgY = feederPositions.reduce((sum, pos) => sum + pos.y, 0) / feederPositions.length
            matchPositions.set(match.id, {
              x: roundIndex * ROUND_WIDTH,
              y: avgY
            })
          }
        }
      })
    }

    // Calculate container dimensions
    const maxY = Math.max(...Array.from(matchPositions.values()).map(p => p.y)) + 150
    const containerWidth = rounds.length * ROUND_WIDTH + 10

    // Adjust height for brackets with very few matches (like grand final)
    const minHeight = bracketType === 'grand-final' && rounds[0]?.matches.length === 1 ? '100px' : '400px'

    return (
      <div className="game-ui-container animate-bounce-in mb-8">
        <div className="game-ui-inner">
          <div className="game-ui-content p-4 md:p-6">
            <div className="mb-4 md:mb-6 flex flex-row justify-between gap-3 bracket-controls">
              <h2 className="text-xl md:text-2xl font-bold text-white flex items-center gap-3 neon-glow">
                {bracketType === 'grand-final' && <Trophy className="text-yellow-400 animate-glow-pulse" size={28} />}
                {title}
              </h2>

              {/* Zoom Controls */}
              <div className="flex items-center gap-2 flex-wrap">
                <div className="leaderboard-row">
                  <button
                    onClick={() => captureScreenshot(bracketId, title)}
                    className="bg-gradient-to-r from-amber-100 to-amber-50 rounded-[14px] px-4 py-2 flex items-center gap-2 press-effect"
                    title="Lihat Fullscreen"
                    disabled={isCapturing[bracketId]}
                  >
                    {isCapturing[bracketId] ? (
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-amber-700"></div>
                    ) : (
                      <Maximize2 className="h-4 w-4 text-amber-700" />
                    )}
                    <span className="text-sm font-bold text-amber-900">View</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Hint for mobile users */}
            <div className="mb-4">
              <div className="leaderboard-row">
                <div className="bg-gradient-to-r from-amber-100 to-amber-50 rounded-[14px] px-4 py-2 text-center">
                  <p className="text-xs text-amber-900 font-medium">
                    <span className="md:hidden">💡 Tap View untuk melihat bracket secara penuh</span>
                    <span className="hidden md:inline">💡 Klik View untuk melihat bracket dalam mode fullscreen</span>
                  </p>
                </div>
              </div>
            </div>

            <div className="overflow-x-auto rounded-xl bg-black/60 p-6 border-2 border-amber-600/30">
              <div
                ref={(el) => { bracketContentRefs.current[bracketId] = el }}
                className="relative"
                style={{ width: `${containerWidth}px`, height: `${maxY}px`, minHeight }}
              >
                {/* Round Headers */}
                {rounds.map((round, roundIndex) => (
                  <div
                    key={`header-${round.round}`}
                    className="absolute top-0"
                    style={{ left: `${roundIndex * ROUND_WIDTH}px` }}
                  >
                    <div className="leaderboard-row">
                      <h3 className="bg-gradient-to-r from-amber-100 to-amber-50 rounded-[14px] px-4 py-2 text-lg font-bold text-amber-900 text-left" style={{ width: '280px' }}>
                        {bracketType === 'grand-final'
                          ? '🏆 Final'
                          : `⚡ ${round.name || `Round ${round.round}`}`}
                      </h3>
                    </div>
                  </div>
                ))}

                {/* Matches */}
                {rounds.map((round) =>
                  round.matches.map((match) => {
                    const pos = matchPositions.get(match.id)
                    if (!pos) return null

                    const team1 = teams.find(t => t.id === match.team1_id)
                    const team2 = teams.find(t => t.id === match.team2_id)
                    const hasWinner = match.winner_id !== null && match.winner_id !== undefined
                    const isTeam1Winner = hasWinner && match.team1_id !== null && match.team1_id !== undefined && match.winner_id === match.team1_id
                    const isTeam2Winner = hasWinner && match.team2_id !== null && match.team2_id !== undefined && match.winner_id === match.team2_id

                    return (
                      <div
                        key={match.id}
                        className='absolute'
                        style={{
                          left: `${pos.x}px`,
                          top: `${pos.y}px`,
                          width: '280px'
                        }}
                      >
                        <div className="text-center text-sm text-amber-200 mb-2 font-medium">
                          {match.note}
                        </div>
                        <div className="game-ui-container press-effect">
                          <div className="game-ui-inner">
                            <div className="game-ui-content overflow-hidden relative">
                              {isTeam1Winner && (
                                <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-yellow-400 via-yellow-500 to-yellow-400 animate-pulse"></div>
                              )}
                              {isTeam2Winner && (
                                <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-yellow-400 via-yellow-500 to-yellow-400 animate-pulse"></div>
                              )}

                              <div className="leaderboard-row mb-2">
                                <div className={`bg-gradient-to-r from-amber-100 to-amber-50 rounded-[14px] px-4 py-3 flex items-center justify-between ${isTeam1Winner
                                  ? 'ring-2 ring-yellow-400 bg-gradient-to-r from-yellow-100 to-yellow-50'
                                  : ''
                                  }`}>
                                  <span className={`font-bold text-sm truncate max-w-[180px] ${isTeam1Winner ? 'text-yellow-800' : 'text-amber-900'
                                    }`} title={team1?.name || 'TBD'}>
                                    {isTeam1Winner && '👑 '}{team1?.name || 'TBD'}
                                  </span>
                                  <span className={`font-black text-2xl ml-3 score-display ${isTeam1Winner ? 'text-yellow-700' : 'text-amber-700'
                                    }`}>
                                    {match.team1_score ?? '-'}
                                  </span>
                                </div>
                              </div>

                              <div className="leaderboard-row">
                                <div className={`bg-gradient-to-r from-amber-100 to-amber-50 rounded-[14px] px-4 py-3 flex items-center justify-between ${isTeam2Winner
                                  ? 'ring-2 ring-yellow-400 bg-gradient-to-r from-yellow-100 to-yellow-50'
                                  : ''
                                  }`}>
                                  <span className={`font-bold text-sm truncate max-w-[180px] ${isTeam2Winner ? 'text-yellow-800' : 'text-amber-900'
                                    }`} title={team2?.name || 'TBD'}>
                                    {isTeam2Winner && '👑 '}{team2?.name || 'TBD'}
                                  </span>
                                  <span className={`font-black text-2xl ml-3 score-display ${isTeam2Winner ? 'text-yellow-700' : 'text-amber-700'
                                    }`}>
                                    {match.team2_score ?? '-'}
                                  </span>
                                </div>
                              </div>

                              {match.status === 'in_progress' && (
                                <div className="mt-2">
                                  <div className="leaderboard-row">
                                    <div className="bg-gradient-to-r from-red-100 to-red-50 rounded-[14px] py-2 text-center border-2 border-red-400">
                                      <span className="text-xs text-red-800 font-bold uppercase tracking-wider animate-pulse">⚡ LIVE MATCH ⚡</span>
                                    </div>
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    )
                  })
                )}

                {/* Connector Lines */}
                <svg className="absolute top-0 left-0 pointer-events-none" width="100%" height="100%">
                  {rounds.map((round, roundIndex) => {
                    const nextRound = rounds[roundIndex + 1]
                    if (!nextRound) return null

                    return round.matches.map((match) => {
                      if (!match.next_match_id) return null

                      const currentPos = matchPositions.get(match.id)
                      const nextPos = matchPositions.get(match.next_match_id)
                      if (!currentPos || !nextPos) return null

                      // Find sibling match (another match with same next_match_id)
                      const siblingMatch = round.matches.find(
                        m => m.id !== match.id && m.next_match_id === match.next_match_id
                      )

                      const x1 = currentPos.x + 280
                      const y1 = currentPos.y + 50 // Center of match card
                      const x2 = nextPos.x
                      const y2 = nextPos.y + 50

                      if (siblingMatch) {
                        const siblingPos = matchPositions.get(siblingMatch.id)
                        if (!siblingPos) return null

                        const siblingY = siblingPos.y + 50
                        const isFirstMatch = currentPos.y < siblingPos.y

                        if (!isFirstMatch) {
                          // Only draw from the second (bottom) match
                          const midX = x1 + 30

                          return (
                            <g key={match.id}>
                              {/* Horizontal from current match */}
                              <line x1={x1} y1={y1} x2={midX} y2={y1} stroke="#D2691E" strokeWidth="3" />
                              {/* Horizontal from sibling match */}
                              <line x1={x1} y1={siblingY} x2={midX} y2={siblingY} stroke="#D2691E" strokeWidth="3" />
                              {/* Vertical connecting both */}
                              <line x1={midX} y1={siblingY} x2={midX} y2={y1} stroke="#D2691E" strokeWidth="3" />
                              {/* Horizontal to next match */}
                              <line x1={midX} y1={y2} x2={x2} y2={y2} stroke="#D2691E" strokeWidth="3" />
                              {/* Vertical to next match level */}
                              <line x1={midX} y1={Math.min(y1, siblingY)} x2={midX} y2={y2} stroke="#D2691E" strokeWidth="3" />
                            </g>
                          )
                        }
                        return null
                      } else {
                        // Single feeder - straight horizontal line (solid)
                        const midX = x1 + 30
                        return (
                          <g key={match.id}>
                            <line x1={x1} y1={y1} x2={midX} y2={y1} stroke="#D2691E" strokeWidth="3" />
                            <line x1={midX} y1={y1} x2={midX} y2={y2} stroke="#D2691E" strokeWidth="3" />
                            <line x1={midX} y1={y2} x2={x2} y2={y2} stroke="#D2691E" strokeWidth="3" />
                          </g>
                        )
                      }
                    })
                  })}
                </svg>
              </div>
            </div>
          </div>
        </div>
      </div>

    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-950 via-orange-950 to-amber-950">
      <div className="space-y-8 p-4 md:p-8">
        {renderBracket(upperBracketMatches, 'Upper Bracket (Winners)', 'upper')}
        {renderBracket(lowerBracketMatches, 'Lower Bracket (Losers)', 'lower')}
        {renderBracket(grandFinalMatches, 'Grand Final', 'grand-final')}
        {renderBracket(otherMatches, 'Knockout', 'other')}
      </div>

      {/* Screenshot Modal */}
      {screenshotModal.isOpen && screenshotModal.imageUrl && (
        <div
          className="fixed inset-0 z-50 bg-black/90 backdrop-blur-sm flex items-center justify-center"
          onClick={closeModal}
        >
          <div
            className="relative w-full h-full flex flex-col bg-black/95 overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between p-3 md:p-4 border-b border-amber-600/30 bg-gradient-to-r from-amber-900/80 to-orange-900/80 backdrop-blur flex-shrink-0">
              <h3 className="text-base md:text-lg font-semibold text-amber-100 truncate mr-2 neon-glow">
                {screenshotModal.bracketTitle}
              </h3>
              <div className="flex items-center gap-2">
                <div className="leaderboard-row">
                  <button
                    onClick={downloadImage}
                    className="bg-gradient-to-r from-amber-100 to-amber-50 rounded-[12px] px-3 py-2 flex items-center gap-2 press-effect"
                    title="Download"
                  >
                    <Download className="h-4 w-4 text-amber-700" />
                    <span className="text-sm font-bold text-amber-900 hidden sm:inline">Download</span>
                  </button>
                </div>
                <div className="leaderboard-row">
                  <button
                    onClick={closeModal}
                    className="bg-gradient-to-r from-red-100 to-red-50 rounded-[12px] px-3 py-2 flex items-center gap-2 press-effect"
                    title="Close"
                  >
                    <X className="h-4 w-4 text-red-700" />
                    <span className="text-sm font-bold text-red-900 hidden sm:inline">Close</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Modal Content with Zoom/Pan */}
            <div className="flex-1 min-h-0 bg-black/90 relative">
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
                    <div className="absolute top-4 right-4 z-10 flex flex-col gap-2 bg-amber-900/95 backdrop-blur rounded-xl p-2 border-2 border-amber-600/50">
                      <div className="leaderboard-row">
                        <button
                          onClick={() => zoomIn()}
                          className="bg-gradient-to-r from-amber-100 to-amber-50 rounded-[12px] p-2 press-effect"
                          title="Zoom In"
                        >
                          <ZoomIn className="h-4 w-4 text-amber-700" />
                        </button>
                      </div>
                      <div className="leaderboard-row">
                        <button
                          onClick={() => resetTransform()}
                          className="bg-gradient-to-r from-amber-100 to-amber-50 rounded-[12px] p-2 press-effect"
                          title="Reset"
                        >
                          <Maximize2 className="h-4 w-4 text-amber-700" />
                        </button>
                      </div>
                      <div className="leaderboard-row">
                        <button
                          onClick={() => zoomOut()}
                          className="bg-gradient-to-r from-amber-100 to-amber-50 rounded-[12px] p-2 press-effect"
                          title="Zoom Out"
                        >
                          <ZoomOut className="h-4 w-4 text-amber-700" />
                        </button>
                      </div>
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
            <div className="p-2 md:p-3 border-t border-amber-600/30 bg-gradient-to-r from-amber-900/80 to-orange-900/80 backdrop-blur text-center flex-shrink-0">
              <div className="leaderboard-row max-w-2xl mx-auto">
                <div className="bg-gradient-to-r from-amber-100 to-amber-50 rounded-[14px] px-4 py-2">
                  <p className="text-[10px] md:text-xs text-amber-900 font-medium">
                    💡 <span className="hidden sm:inline">Gunakan scroll mouse, pinch gesture, atau tombol untuk zoom. Drag untuk pan. Double-click untuk reset.</span>
                    <span className="sm:hidden">Pinch untuk zoom, drag untuk pan, double-tap untuk reset.</span>
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
