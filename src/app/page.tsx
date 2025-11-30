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
      <section className="relative bg-gradient-to-br from-background via-background to-primary/5 text-foreground overflow-hidden border-b border-border">
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-20 left-20 w-72 h-72 bg-primary rounded-full blur-3xl animate-float"></div>
          <div className="absolute bottom-20 right-20 w-96 h-96 bg-primary rounded-full blur-3xl animate-float" style={{ animationDelay: '3s' }}></div>
        </div>

        {/* Theme Toggle */}
        <div className="absolute top-6 right-6 z-20">
          <ThemeToggle />
        </div>

        <div className="container mx-auto px-6 py-24 relative z-10">
          <div className="max-w-4xl mx-auto text-center space-y-8 animate-fade-in-up">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-primary/50 bg-primary/10 backdrop-blur-sm">
              <Flame className="w-4 h-4 text-primary" />
              <span className="text-sm font-medium text-primary">TI BILLIARD CUP 2025 Sedang Berlangsung</span>
            </div>

            <h1 className="text-5xl md:text-7xl font-bold tracking-tight">
              Selamat Datang di{' '}
              <span className="text-primary">TI BILLIARD CUP!</span>
            </h1>

            <p className="text-xl md:text-2xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
              Solidaritas Antar Bidang - Bergabung. Berkompetisi. Rayakan kerja sama tim dan kesenangan.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center pt-6">
              <Link href="/register">
                <Button size="lg" className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold px-8 py-6 text-lg group shadow-lg shadow-primary/20" disabled={isRegistrationClosed}>
                  {isRegistrationClosed ? 'Pendaftaran Ditutup' : 'Daftar Sekarang'}
                  {!isRegistrationClosed && <ChevronRight className="ml-2 group-hover:translate-x-1 transition-transform" />}
                </Button>
              </Link>
              <Link href="/tournaments">
                <Button size="lg" variant="outline" className="border-2 border-primary/30 bg-transparent hover:bg-primary/10 text-foreground font-semibold px-8 py-6 text-lg">
                  Lihat Turnamen
                </Button>
              </Link>
            </div>

            <div className="flex flex-wrap justify-center gap-8 pt-12 text-sm">
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5 text-primary" />
                <span className="text-muted-foreground">{`${totalPlayers}+ Pemain`}</span>
              </div>
              <div className="flex items-center gap-2">
                <Gamepad2 className="w-5 h-5 text-primary" />
                <span className="text-muted-foreground">{activeTournaments.length} Turnamen Aktif</span>
              </div>
              <div className="flex items-center gap-2">
                <Trophy className="w-5 h-5 text-primary" />
                <span className="text-muted-foreground">Trofi Juara</span>
              </div>
            </div>

            <div className="flex flex-wrap justify-center gap-4 pt-8 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-primary" />
                <span>Daftar hingga: 21 November 2025</span>
              </div>
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-primary" />
                <span>Turnamen: 22 November 2025</span>
              </div>
              <div className="flex items-center gap-2">
                <Timer className="w-4 h-4 text-primary" />
                <span>18:00 - 20:00 WIB</span>
              </div>
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-primary" />
                <span>Greenlight Cafe & Billiard</span>
              </div>
            </div>
          </div>
        </div>

        <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-background to-transparent"></div>
      </section>

      {/* Active Tournaments Section */}
      <section className="py-20 bg-background">
        <div className="container mx-auto px-6">
          <div className="text-center space-y-4 mb-12 animate-fade-in-up">
            <Badge className="bg-primary/10 text-primary border-primary/20 px-4 py-1">
              Sedang Aktif
            </Badge>
            <h2 className="text-4xl md:text-5xl font-bold">Turnamen Aktif</h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              Terjun ke aksi dan berkompetisi dengan rekan kerja Anda
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {activeTournaments.map((tournament, index) => (
              <Card
                key={tournament.id}
                className="group cursor-pointer border border-border hover:border-primary/50 transition-all duration-300 hover:shadow-xl hover:shadow-primary/10 hover:-translate-y-2 overflow-hidden animate-fade-in-up bg-card"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <div className="relative h-48 overflow-hidden bg-gradient-to-br from-primary/20 to-primary/5">
                  <div className="absolute inset-0 flex items-center justify-center text-6xl">
                    🎱
                  </div>
                  <div className="absolute top-3 right-3">
                    <Badge className="bg-primary text-primary-foreground font-semibold">
                      {tournament.status}
                    </Badge>
                  </div>
                  <div className="absolute inset-0 bg-gradient-to-t from-card/60 to-transparent"></div>
                </div>
                <CardContent className="p-6 space-y-4">
                  <h3 className="text-xl font-bold group-hover:text-primary transition-colors">
                    {tournament.name}
                  </h3>
                  <div className="flex items-center justify-between text-sm text-muted-foreground">
                    <div className="flex items-center gap-2">
                      <Users className="w-4 h-4" />
                      <span>{tournament.current_teams}/{tournament.max_teams} tim</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Trophy className="w-4 h-4 text-primary" />
                      <span className="font-medium text-foreground">Gelar Juara</span>
                    </div>
                  </div>
                  <Link href={`/tournament/${tournament.id}`}>
                    <Button className="w-full bg-primary hover:bg-primary/90 text-primary-foreground group shadow-lg shadow-primary/20">
                      Lihat Turnamen
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