'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { Trophy, Target, Users, Award, ChevronRight, Gamepad2, Calendar, MapPin, Timer, Zap, Star, TrendingUp } from 'lucide-react';
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
  updated_at?: string;
}

export default function Home() {
  const [isRegistrationClosed, setIsRegistrationClosed] = useState(false);
  const [activeTournaments, setActiveTournaments] = useState<Tournament[]>([]);
  const [upcomingMatches, setUpcomingMatches] = useState<Match[]>([]);
  const [lastMatches, setLastMatches] = useState<Match[]>([]);
  const [totalPlayers, setTotalPlayers] = useState(0);

  useEffect(() => {
    const currentDate = new Date();
    const closingDate = new Date('2025-11-15T23:59:59');
    setIsRegistrationClosed(currentDate > closingDate);

    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      const tournamentsResponse = await fetch('/api/tournaments');
      const tournamentsData = await tournamentsResponse.json();
      if (tournamentsData.success) {
        setActiveTournaments(tournamentsData.tournaments);
      }

      const registrationsResponse = await fetch('/api/registrations');
      const registrationsData = await registrationsResponse.json();
      if (registrationsData.success) {
        setTotalPlayers(registrationsData.totalPlayers || 0);
      }

      const matchesResponse = await fetch('/api/matches');
      const matchesData = await matchesResponse.json();
      if (matchesData.success) {
        setUpcomingMatches(matchesData.matches || []);
      }

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
    <div className="min-h-screen bg-gradient-to-b from-background via-background to-secondary/30">
      <div className="absolute top-6 right-6 z-50">
        <ThemeToggle />
      </div>

      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent/5"></div>
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl animate-float"></div>
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-accent/10 rounded-full blur-3xl animate-float" style={{ animationDelay: '2s' }}></div>

        <div className="container mx-auto px-6 py-20 md:py-32 relative z-10">
          <div className="max-w-5xl mx-auto">
            <div className="text-center space-y-8 animate-fade-in-up">
              <Badge className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium bg-primary/10 text-primary border-primary/20 hover:bg-primary/20 transition-colors">
                <Zap className="w-4 h-4" />
                Kompetisi Internal 2025
              </Badge>

              <h1 className="text-5xl md:text-7xl lg:text-8xl font-black tracking-tight">
                <span className="block text-foreground">Game Competition</span>
                <span className="block gradient-text mt-2">Portal</span>
              </h1>

              <p className="text-xl md:text-2xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
                Platform kompetisi olahraga internal. Bergabung, berkompetisi, dan tunjukkan kemampuan terbaikmu.
              </p>

              <div className="flex flex-col sm:flex-row gap-4 justify-center pt-6">
                <Link href="/register">
                  <Button
                    size="lg"
                    className="px-8 py-6 text-lg font-semibold shadow-xl hover:shadow-2xl transition-all group"
                    disabled={isRegistrationClosed}
                  >
                    {isRegistrationClosed ? 'Pendaftaran Ditutup' : 'Daftar Sekarang'}
                    {!isRegistrationClosed && <ChevronRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />}
                  </Button>
                </Link>
                <Link href="/tournaments">
                  <Button
                    size="lg"
                    variant="outline"
                    className="px-8 py-6 text-lg font-semibold border-2 hover:bg-primary/5"
                  >
                    Lihat Turnamen
                  </Button>
                </Link>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 pt-12 max-w-3xl mx-auto">
                <div className="glass-effect rounded-2xl p-6 card-hover">
                  <Users className="w-8 h-8 text-primary mx-auto mb-3" />
                  <div className="text-3xl font-bold text-foreground">{totalPlayers}+</div>
                  <div className="text-sm text-muted-foreground">Pemain Aktif</div>
                </div>
                <div className="glass-effect rounded-2xl p-6 card-hover">
                  <Trophy className="w-8 h-8 text-primary mx-auto mb-3" />
                  <div className="text-3xl font-bold text-foreground">{activeTournaments.length}</div>
                  <div className="text-sm text-muted-foreground">Turnamen Aktif</div>
                </div>
                <div className="glass-effect rounded-2xl p-6 card-hover">
                  <Star className="w-8 h-8 text-primary mx-auto mb-3" />
                  <div className="text-3xl font-bold text-foreground">10+</div>
                  <div className="text-sm text-muted-foreground">Cabang Olahraga</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="py-20">
        <div className="container mx-auto px-6">
          <div className="text-center space-y-4 mb-16 animate-fade-in-up">
            <Badge className="bg-primary/10 text-primary border-primary/20">
              <TrendingUp className="w-4 h-4 mr-2" />
              Sedang Berlangsung
            </Badge>
            <h2 className="text-4xl md:text-5xl font-bold text-foreground">Turnamen Aktif</h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              Bergabunglah dengan kompetisi yang sedang berlangsung
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {activeTournaments.map((tournament, index) => (
              <Card
                key={tournament.id}
                className="group border-2 border-border hover:border-primary/50 transition-all duration-300 card-hover overflow-hidden animate-fade-in-up bg-card/50 backdrop-blur"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <div className="relative h-52 overflow-hidden bg-gradient-to-br from-primary/20 to-accent/20">
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Gamepad2 className="w-20 h-20 text-primary/30" />
                  </div>
                  <div className="absolute top-4 right-4">
                    <Badge className="bg-primary text-primary-foreground font-semibold shadow-lg">
                      {tournament.status}
                    </Badge>
                  </div>
                  <div className="absolute inset-0 bg-gradient-to-t from-card via-transparent to-transparent"></div>
                </div>
                <CardContent className="p-6 space-y-4">
                  <h3 className="text-xl font-bold text-foreground group-hover:text-primary transition-colors">
                    {tournament.name}
                  </h3>
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Users className="w-4 h-4" />
                      <span>{tournament.current_teams}/{tournament.max_teams} tim</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Trophy className="w-4 h-4 text-primary" />
                      <span className="font-medium text-foreground">Hadiah</span>
                    </div>
                  </div>
                  <Link href={`/tournament/${tournament.id}`}>
                    <Button className="w-full group/btn">
                      Lihat Detail
                      <Target className="ml-2 w-4 h-4 group-hover/btn:rotate-90 transition-transform" />
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20 bg-gradient-to-b from-transparent to-secondary/30">
        <div className="container mx-auto px-6">
          <div className="text-center space-y-4 mb-16 animate-fade-in-up">
            <Badge className="bg-primary/10 text-primary border-primary/20">
              <Calendar className="w-4 h-4 mr-2" />
              Update Terbaru
            </Badge>
            <h2 className="text-4xl md:text-5xl font-bold text-foreground">Live Matches</h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              Ikuti pertandingan yang sedang berlangsung dan hasil terbaru
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-6xl mx-auto">
            <Card className="animate-fade-in-up glass-effect">
              <CardHeader className="border-b border-border/50">
                <CardTitle className="flex items-center gap-3 text-foreground">
                  <div className="p-2 rounded-lg bg-primary/10">
                    <Timer className="text-primary w-5 h-5" />
                  </div>
                  Pertandingan Mendatang
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="space-y-4">
                  {upcomingMatches.filter(match => match.status === 'pending').slice(0, 3).map((match, index) => (
                    <div
                      key={match.id}
                      className="p-4 rounded-xl bg-secondary/50 border border-border hover:border-primary/50 transition-all card-hover animate-fade-in-up"
                      style={{ animationDelay: `${index * 0.1}s` }}
                    >
                      <div className="flex justify-between items-center mb-3">
                        <Badge className="bg-primary/10 text-primary border-primary/20 text-xs">Terjadwal</Badge>
                        <span className="text-xs text-muted-foreground">
                          {formatDate(match.scheduled_time)}
                        </span>
                      </div>
                      <div className="flex items-center justify-between gap-4">
                        <span className="font-semibold text-sm flex-1 truncate text-foreground">{match.team1_name}</span>
                        <span className="text-muted-foreground font-medium">vs</span>
                        <span className="font-semibold text-sm flex-1 truncate text-right text-foreground">{match.team2_name}</span>
                      </div>
                    </div>
                  ))}
                  {upcomingMatches.filter(match => match.status === 'pending').length === 0 && (
                    <div className="p-8 rounded-xl bg-secondary/30 border border-dashed border-border text-center">
                      <Calendar className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
                      <p className="text-muted-foreground">Tidak ada pertandingan terjadwal</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card className="animate-fade-in-up glass-effect" style={{ animationDelay: '0.2s' }}>
              <CardHeader className="border-b border-border/50">
                <CardTitle className="flex items-center gap-3 text-foreground">
                  <div className="p-2 rounded-lg bg-primary/10">
                    <Award className="text-primary w-5 h-5" />
                  </div>
                  Hasil Terbaru
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="space-y-4">
                  {lastMatches.filter(match => match.status === 'completed').slice(0, 3).map((match, index) => (
                    <div
                      key={match.id}
                      className="p-4 rounded-xl bg-secondary/50 border border-border hover:border-primary/50 transition-all card-hover animate-fade-in-up"
                      style={{ animationDelay: `${index * 0.1}s` }}
                    >
                      <div className="flex justify-between items-center mb-3">
                        <Badge variant="outline" className="border-primary/30 text-primary text-xs">Selesai</Badge>
                        <span className="text-xs text-muted-foreground">
                          {formatDate(match.updated_at || '')}
                        </span>
                      </div>
                      <div className="grid grid-cols-3 gap-4 items-center">
                        <div className="text-right">
                          <div className="font-semibold text-sm text-foreground truncate">{match.team1_name}</div>
                          <div className="text-2xl font-bold text-primary mt-1">{match.team1_score}</div>
                        </div>
                        <div className="text-center text-muted-foreground font-medium">-</div>
                        <div className="text-left">
                          <div className="font-semibold text-sm text-foreground truncate">{match.team2_name}</div>
                          <div className="text-2xl font-bold text-primary mt-1">{match.team2_score}</div>
                        </div>
                      </div>
                    </div>
                  ))}
                  {lastMatches.filter(match => match.status === 'completed').length === 0 && (
                    <div className="p-8 rounded-xl bg-secondary/30 border border-dashed border-border text-center">
                      <Award className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
                      <p className="text-muted-foreground">Belum ada hasil pertandingan</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      <section className="py-20">
        <div className="container mx-auto px-6">
          <div className="max-w-4xl mx-auto">
            <div className="text-center space-y-4 mb-12">
              <Badge className="bg-primary/10 text-primary border-primary/20">
                <MapPin className="w-4 h-4 mr-2" />
                Informasi
              </Badge>
              <h2 className="text-4xl md:text-5xl font-bold text-foreground">Hubungi Kami</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card className="glass-effect card-hover">
                <CardHeader>
                  <CardTitle className="text-foreground">Panitia Turnamen</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <a
                    href="https://wa.me/+6285189970998"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 p-4 rounded-xl bg-secondary/50 hover:bg-primary/10 border border-border hover:border-primary/30 transition-all group"
                  >
                    <div className="w-12 h-12 bg-primary/20 rounded-full flex items-center justify-center group-hover:bg-primary/30 transition-colors">
                      <span className="text-2xl">📱</span>
                    </div>
                    <div>
                      <div className="font-semibold text-foreground group-hover:text-primary transition-colors">Michael Sean</div>
                      <div className="text-sm text-muted-foreground">085189970998 (TI)</div>
                    </div>
                  </a>
                  <a
                    href="https://wa.me/+6285624055869"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 p-4 rounded-xl bg-secondary/50 hover:bg-primary/10 border border-border hover:border-primary/30 transition-all group"
                  >
                    <div className="w-12 h-12 bg-primary/20 rounded-full flex items-center justify-center group-hover:bg-primary/30 transition-colors">
                      <span className="text-2xl">📱</span>
                    </div>
                    <div>
                      <div className="font-semibold text-foreground group-hover:text-primary transition-colors">Novi</div>
                      <div className="text-sm text-muted-foreground">085624055869 (TI)</div>
                    </div>
                  </a>
                </CardContent>
              </Card>

              <Card className="glass-effect card-hover">
                <CardHeader>
                  <CardTitle className="text-foreground">Informasi Venue</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="p-4 rounded-xl bg-secondary/50 border border-border">
                    <div className="flex items-start gap-3 mb-4">
                      <MapPin className="text-primary mt-1 w-5 h-5 flex-shrink-0" />
                      <div>
                        <div className="font-semibold text-foreground">Greenlight Cafe & Billiard</div>
                        <div className="text-sm text-muted-foreground mt-1">Jl. Purnawarman No.3, Bandung</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Timer className="w-4 h-4 text-primary" />
                      <span>18:00 - 20:00 WIB</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      <footer className="border-t border-border bg-card/50 backdrop-blur">
        <div className="container mx-auto px-6 py-12">
          <div className="grid md:grid-cols-3 gap-8 mb-8">
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary/20 rounded-lg">
                  <Trophy className="w-6 h-6 text-primary" />
                </div>
                <span className="text-xl font-bold text-foreground">Game Portal</span>
              </div>
              <p className="text-muted-foreground text-sm">
                Platform kompetisi olahraga internal untuk meningkatkan kebersamaan dan sportivitas.
              </p>
            </div>

            <div>
              <h4 className="font-bold text-foreground mb-4">Navigasi</h4>
              <ul className="space-y-2 text-sm">
                <li>
                  <Link href="/tournaments" className="text-muted-foreground hover:text-primary transition-colors">
                    Turnamen
                  </Link>
                </li>
                <li>
                  <Link href="/register" className="text-muted-foreground hover:text-primary transition-colors">
                    Pendaftaran
                  </Link>
                </li>
              </ul>
            </div>

            <div>
              <h4 className="font-bold text-foreground mb-4">Info Turnamen</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-primary" />
                  22 November 2025
                </li>
                <li className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-primary" />
                  Greenlight Cafe
                </li>
                <li className="flex items-center gap-2">
                  <Timer className="w-4 h-4 text-primary" />
                  18:00 - 20:00 WIB
                </li>
              </ul>
            </div>
          </div>

          <div className="border-t border-border pt-8 text-center text-sm text-muted-foreground">
            <p>&copy; 2025 Internal Game Competition Portal. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
