'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { Trophy, Target, Users, Award, ChevronRight, Gamepad2, Flame, Calendar, MapPin, Phone, Timer } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ThemeToggle } from '@/components/theme-toggle';

interface Tournament {
  id: string;
  name: string;
  start_date: string;
  end_date: string;
  status: string;
  max_teams: number;
  current_teams: number;
}

interface Match {
  id: string;
  team1_name: string;
  team2_name: string;
  team1_score: number | null;
  team2_score: number | null;
  status: string;
  scheduled_time: string;
  table_number?: number;
  updated_at?: string;
}

export default function Home() {
  const [isRegistrationClosed, setIsRegistrationClosed] = useState(false);
  const [activeTournaments, setActiveTournaments] = useState<Tournament[]>([]);
  const [upcomingMatches, setUpcomingMatches] = useState<Match[]>([]);
  const [lastMatches, setLastMatches] = useState<Match[]>([]);
  const [totalPlayers, setTotalPlayers] = useState(0);

  useEffect(() => {
    // Check if current date is after November 21, 2025
    const currentDate = new Date();
    const closingDate = new Date('2025-11-21T23:59:59');
    setIsRegistrationClosed(currentDate > closingDate);

    // Load dashboard data
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      // Fetch active tournaments
      const tournamentsResponse = await fetch('/api/tournaments');
      const tournamentsData = await tournamentsResponse.json();
      if (tournamentsData.success) {
        setActiveTournaments(tournamentsData.tournaments);
      }

      // Fetch player count from registrations
      const registrationsResponse = await fetch('/api/registrations');
      const registrationsData = await registrationsResponse.json();
      if (registrationsData.success) {
        setTotalPlayers(registrationsData.totalPlayers || 0);
      }

      // Fetch matches data
      const matchesResponse = await fetch('/api/matches');
      const matchesData = await matchesResponse.json();
      if (matchesData.success) {
        setUpcomingMatches(matchesData.matches || []);
      }

      // Fetch last matches data
      const lastMatchesResponse = await fetch('/api/matches?type=lastMatches');
      const lastMatchesData = await lastMatchesResponse.json();
      if (lastMatchesData.success) {
        setLastMatches(lastMatchesData.matches || []);
      }

    } catch (error) {
      console.error('Error loading dashboard data:', error);
    }
  };

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

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-background via-primary/5 to-background text-foreground overflow-hidden">
        <div className="absolute inset-0 opacity-30">
          <div className="absolute top-10 left-10 w-48 h-48 md:w-72 md:h-72 bg-primary rounded-full blur-3xl animate-float"></div>
          <div className="absolute bottom-10 right-10 w-64 h-64 md:w-96 md:h-96 bg-primary rounded-full blur-3xl animate-float" style={{ animationDelay: '3s' }}></div>
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-primary/20 rounded-full blur-3xl"></div>
        </div>

        {/* Theme Toggle */}
        <div className="absolute top-4 right-4 z-20">
          <ThemeToggle />
        </div>

        <div className="container mx-auto px-4 py-12 md:py-20 relative z-10">
          <div className="max-w-4xl mx-auto text-center space-y-6 md:space-y-8">
            {/* Animated Badge */}
            <div className="inline-flex items-center gap-2 px-6 py-3 rounded-full border-2 border-primary bg-primary/20 backdrop-blur-sm animate-bounce-in shadow-lg shadow-primary/30">
              <Flame className="w-5 h-5 text-primary animate-glow-pulse" />
              <span className="text-sm md:text-base font-bold text-primary">🔥 TOURNAMENT LIVE!</span>
            </div>

            {/* Big Trophy Animation */}
            <div className="text-7xl md:text-9xl animate-bounce-in" style={{ animationDelay: '0.2s' }}>
              🎱
            </div>

            <h1 className="text-4xl md:text-6xl lg:text-7xl font-black tracking-tight animate-slide-in-left">
              <span className="neon-glow text-primary">TI BILLIARD</span>
              <br />
              <span className="text-foreground">CUP 2025</span>
            </h1>

            <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed animate-slide-in-right">
              ⚡ Solidaritas Antar Bidang ⚡
              <br />
              Bergabung • Berkompetisi • Menang!
            </p>

            {/* Big CTA Buttons */}
            <div className="flex flex-col gap-4 pt-6">
              <Link href="/register" className="w-full">
                <Button size="lg" className="w-full bg-gradient-to-r from-primary to-emerald-600 hover:from-primary/90 hover:to-emerald-600/90 text-white font-bold px-8 py-7 text-xl rounded-2xl shadow-2xl shadow-primary/40 game-card press-effect animate-pulse-glow" disabled={isRegistrationClosed}>
                  {isRegistrationClosed ? '🔒 Pendaftaran Ditutup' : '🎮 DAFTAR SEKARANG!'}
                  {!isRegistrationClosed && <ChevronRight className="ml-2 w-6 h-6" />}
                </Button>
              </Link>
              <Link href="/tournaments" className="w-full">
                <Button size="lg" variant="outline" className="w-full border-2 border-primary bg-primary/10 hover:bg-primary/20 text-foreground font-bold px-8 py-7 text-xl rounded-2xl press-effect">
                  🏆 Lihat Turnamen
                </Button>
              </Link>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-3 gap-3 md:gap-6 pt-8 max-w-2xl mx-auto">
              <div className="bg-card/80 backdrop-blur-sm border-2 border-primary/30 rounded-2xl p-4 md:p-6 game-card animate-bounce-in" style={{ animationDelay: '0.3s' }}>
                <div className="text-3xl md:text-4xl mb-2">👥</div>
                <div className="text-2xl md:text-3xl font-black text-primary score-display">{totalPlayers}+</div>
                <div className="text-xs md:text-sm text-muted-foreground font-medium">Players</div>
              </div>
              <div className="bg-card/80 backdrop-blur-sm border-2 border-primary/30 rounded-2xl p-4 md:p-6 game-card animate-bounce-in" style={{ animationDelay: '0.4s' }}>
                <div className="text-3xl md:text-4xl mb-2">🎮</div>
                <div className="text-2xl md:text-3xl font-black text-primary score-display">{activeTournaments.length}</div>
                <div className="text-xs md:text-sm text-muted-foreground font-medium">Active</div>
              </div>
              <div className="bg-card/80 backdrop-blur-sm border-2 border-primary/30 rounded-2xl p-4 md:p-6 game-card animate-bounce-in" style={{ animationDelay: '0.5s' }}>
                <div className="text-3xl md:text-4xl mb-2">🏆</div>
                <div className="text-2xl md:text-3xl font-black text-primary score-display">1</div>
                <div className="text-xs md:text-sm text-muted-foreground font-medium">Trophy</div>
              </div>
            </div>

            {/* Event Info Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-6 max-w-2xl mx-auto text-sm">
              <div className="bg-card/60 backdrop-blur-sm border border-primary/20 rounded-xl p-3 flex items-center gap-3">
                <Calendar className="w-5 h-5 text-primary flex-shrink-0" />
                <div className="text-left">
                  <div className="font-bold text-foreground">Daftar hingga</div>
                  <div className="text-muted-foreground">21 November 2025</div>
                </div>
              </div>
              <div className="bg-card/60 backdrop-blur-sm border border-primary/20 rounded-xl p-3 flex items-center gap-3">
                <Calendar className="w-5 h-5 text-primary flex-shrink-0" />
                <div className="text-left">
                  <div className="font-bold text-foreground">Turnamen</div>
                  <div className="text-muted-foreground">22 November 2025</div>
                </div>
              </div>
              <div className="bg-card/60 backdrop-blur-sm border border-primary/20 rounded-xl p-3 flex items-center gap-3">
                <Timer className="w-5 h-5 text-primary flex-shrink-0" />
                <div className="text-left">
                  <div className="font-bold text-foreground">Jam</div>
                  <div className="text-muted-foreground">18:00 - 20:00 WIB</div>
                </div>
              </div>
              <div className="bg-card/60 backdrop-blur-sm border border-primary/20 rounded-xl p-3 flex items-center gap-3">
                <MapPin className="w-5 h-5 text-primary flex-shrink-0" />
                <div className="text-left">
                  <div className="font-bold text-foreground">Lokasi</div>
                  <div className="text-muted-foreground text-xs">Greenlight Cafe</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-background to-transparent"></div>
      </section>

      {/* Active Tournaments Section */}
      <section className="py-12 md:py-20 bg-background">
        <div className="container mx-auto px-4">
          <div className="text-center space-y-3 mb-8 md:mb-12">
            <div className="inline-flex items-center gap-2 px-6 py-2 rounded-full border-2 border-primary bg-primary/20 animate-pulse-glow">
              <span className="text-2xl animate-coin-flip">🏆</span>
              <span className="text-sm md:text-base font-bold text-primary">ACTIVE TOURNAMENTS</span>
            </div>
            <h2 className="text-3xl md:text-5xl font-black neon-glow">Turnamen Aktif</h2>
            <p className="text-muted-foreground text-base md:text-lg max-w-2xl mx-auto">
              ⚡ Terjun ke aksi dan raih kemenangan!
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
            {activeTournaments.map((tournament, index) => (
              <Card
                key={tournament.id}
                className="group cursor-pointer border-2 border-primary/30 hover:border-primary transition-all duration-300 overflow-hidden bg-gradient-to-br from-card to-card/50 game-card animate-bounce-in press-effect"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <div className="relative h-40 md:h-48 overflow-hidden bg-gradient-to-br from-primary/30 via-primary/20 to-transparent">
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-6xl md:text-7xl animate-float">🎱</div>
                  </div>
                  <div className="absolute top-3 right-3">
                    <Badge className="bg-primary text-primary-foreground font-bold text-xs md:text-sm px-3 py-1 shadow-lg animate-wiggle">
                      🔥 {tournament.status}
                    </Badge>
                  </div>
                  <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-primary via-emerald-400 to-primary"></div>
                </div>
                <CardContent className="p-4 md:p-6 space-y-4">
                  <h3 className="text-lg md:text-xl font-black group-hover:text-primary transition-colors line-clamp-2">
                    {tournament.name}
                  </h3>
                  <div className="flex items-center justify-between text-xs md:text-sm">
                    <div className="flex items-center gap-2 bg-muted/50 rounded-full px-3 py-2">
                      <Users className="w-4 h-4 text-primary" />
                      <span className="font-bold">{tournament.current_teams}/{tournament.max_teams}</span>
                    </div>
                    <div className="flex items-center gap-1 text-primary font-bold">
                      <Trophy className="w-4 h-4 animate-glow-pulse" />
                      <span>WIN!</span>
                    </div>
                  </div>
                  <Link href={`/tournament/${tournament.id}`} className="block">
                    <Button className="w-full bg-gradient-to-r from-primary to-emerald-600 hover:from-primary/90 hover:to-emerald-600/90 text-white font-bold py-3 rounded-xl shadow-lg shadow-primary/30 press-effect">
                      🎮 MAINKAN
                      <Target className="ml-2 w-4 h-4 group-hover:rotate-90 transition-transform" />
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Recent Matches Section */}
      <section className="py-20 bg-background">
        <div className="container mx-auto px-6">
          <div className="text-center space-y-4 mb-12 animate-fade-in-up">
            <Badge className="bg-primary/10 text-primary border-primary/20 px-4 py-1">
              Update Pertandingan
            </Badge>
            <h2 className="text-4xl md:text-5xl font-bold">Pertandingan Terbaru</h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              Tetap update dengan hasil pertandingan terbaru dan pertandingan yang akan datang
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Upcoming Matches */}
            <Card className="animate-fade-in-up border-border bg-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="text-primary" size={24} />
                  Pertandingan Mendatang
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {upcomingMatches.filter(match => match.status === 'pending').slice(0, 3).map((match, index) => (
                    <div key={match.id} className="p-4 rounded-lg bg-muted/50 border border-border animate-fade-in-up hover:border-primary/30 transition-colors" style={{ animationDelay: `${index * 0.1}s` }}>
                      <div className="flex justify-between items-center mb-2">
                        <Badge className="bg-primary/10 text-primary border-primary/20">Terjadwal</Badge>
                        <span className="text-xs text-muted-foreground">
                          {formatDate(match.scheduled_time)}
                        </span>
                      </div>
                      <div className="text-center space-y-2">
                        <div className="flex items-center justify-center gap-4">
                          <span className="font-medium text-sm truncate w-[50%]" title={match.team1_name}>{match.team1_name}</span>
                          <span className="text-muted-foreground">vs</span>
                          <span className="font-medium text-sm truncate w-[50%]" title={match.team2_name}>{match.team2_name}</span>
                        </div>
                        {match.table_number && (
                          <div>
                            <span className="text-xs text-muted-foreground">
                              Meja {match.table_number}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                  {upcomingMatches.filter(match => match.status === 'pending').length === 0 && (
                    <div className="p-4 rounded-lg bg-muted/50 border border-border text-center text-muted-foreground">
                      Tidak ada pertandingan mendatang yang terjadwal
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Recent Results */}
            <Card className="animate-fade-in-up border-border bg-card" style={{ animationDelay: '0.2s' }}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Award className="text-primary" size={24} />
                  Hasil Terbaru
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {lastMatches.filter(match => match.status === 'completed').slice(0, 3).map((match, index) => (
                    <div key={match.id} className="p-4 rounded-lg bg-muted/50 border border-border animate-fade-in-up hover:border-primary/30 transition-colors" style={{ animationDelay: `${index * 0.1}s` }}>
                      <div className="flex justify-between items-center mb-2">
                        <Badge variant="outline" className="border-primary text-primary">Selesai</Badge>
                        <span className="text-xs text-muted-foreground">
                          {formatDate(match.updated_at || '')}
                        </span>
                      </div>
                      <div className="text-center">
                        <div className="flex items-center justify-center gap-4 w-full">
                          <div className="text-right w-1/2">
                            <div className="font-medium text-sm">{match.team1_name}</div>
                            <div className="text-2xl font-bold text-primary">{match.team1_score}</div>
                          </div>
                          <span className="text-muted-foreground">-</span>
                          <div className="text-left w-1/2">
                            <div className="font-medium text-sm">{match.team2_name}</div>
                            <div className="text-2xl font-bold text-primary">{match.team2_score}</div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                  {lastMatches.filter(match => match.status === 'completed').length === 0 && (
                    <div className="p-4 rounded-lg bg-muted/50 border border-border text-center text-muted-foreground">
                      Belum ada pertandingan yang selesai
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section className="py-20 bg-background border-t border-border">
        <div className="container mx-auto px-6">
          <div className="max-w-4xl mx-auto">
            <div className="text-center space-y-4 mb-12 animate-fade-in-up">
              <Badge className="bg-primary/10 text-primary border-primary/20 px-4 py-1">
                Hubungi Kami
              </Badge>
              <h2 className="text-4xl md:text-5xl font-bold">Informasi Kontak</h2>
              <p className="text-muted-foreground text-lg">
                Ada pertanyaan? Hubungi panitia turnamen kami
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card className="animate-fade-in-up border-border bg-card">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Phone className="text-primary" size={24} />
                    Panitia Turnamen
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <a
                      href="https://wa.me/+6285189970998"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 border border-border hover:border-primary/30 hover:bg-primary/5 transition-colors group"
                    >
                      <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center text-primary-foreground">
                        📱
                      </div>
                      <div>
                        <div className="font-medium group-hover:text-primary transition-colors">Michael Sean</div>
                        <div className="text-sm text-muted-foreground">085189970998 (TI)</div>
                      </div>
                    </a>
                    <a
                      href="https://wa.me/+6285624055869"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 border border-border hover:border-primary/30 hover:bg-primary/5 transition-colors group"
                    >
                      <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center text-primary-foreground">
                        📱
                      </div>
                      <div>
                        <div className="font-medium group-hover:text-primary transition-colors">Novi</div>
                        <div className="text-sm text-muted-foreground">085624055869 (TI)</div>
                      </div>
                    </a>
                  </div>
                </CardContent>
              </Card>

              <Card className="animate-fade-in-up border-border bg-card" style={{ animationDelay: '0.1s' }}>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MapPin className="text-primary" size={24} />
                    Informasi Venue
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="p-4 rounded-lg bg-muted/50 border border-border">
                    <div className="flex items-start gap-3">
                      <MapPin className="text-primary mt-1" size={20} />
                      <div>
                        <div className="font-medium">Greenlight Cafe & Billiard</div>
                        <div className="text-sm text-muted-foreground">Jl. Purnawarman No.3, Bandung</div>
                        <div className="text-sm text-muted-foreground mt-2">
                          18:00 - 20:00 WIB | Daftar hingga: 21 Nov | Turnamen: 22 Nov 2025
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-card border-t border-border text-foreground py-12">
        <div className="container mx-auto px-6">
          <div className="grid md:grid-cols-3 gap-8 mb-8">
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Trophy className="w-8 h-8 text-primary" />
                <span className="text-2xl font-bold">TI BILLIARD CUP</span>
              </div>
              <p className="text-muted-foreground">
                Menyatukan tim melalui billiard kompetitif dan kesenangan.
              </p>
            </div>

            <div>
              <h4 className="font-bold text-lg mb-4">Tautan Cepat</h4>
              <ul className="space-y-2 text-muted-foreground">
                <li><Link href="/tournaments" className="hover:text-primary cursor-pointer transition-colors">Turnamen</Link></li>
                <li><Link href="/register" className="hover:text-primary cursor-pointer transition-colors">Pendaftaran</Link></li>
                <li className="hover:text-primary cursor-pointer transition-colors">Aturan</li>
                <li className="hover:text-primary cursor-pointer transition-colors">FAQ</li>
              </ul>
            </div>

            <div>
              <h4 className="font-bold text-lg mb-4">Info Turnamen</h4>
              <ul className="space-y-2 text-muted-foreground">
                <li>Daftar hingga: 21 November 2025</li>
                <li>Turnamen: 22 November 2025</li>
                <li>Greenlight Cafe & Billiard</li>
                <li>18:00 - 20:00 WIB</li>
              </ul>
            </div>
          </div>

          <div className="border-t border-border pt-8 text-center text-muted-foreground">
            <p>&copy; 2025 TI BILLIARD CUP. Seluruh hak cipta dilindungi.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}