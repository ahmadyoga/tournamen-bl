'use client';

import RegistrationForm from '@/components/RegistrationForm';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import { ThemeToggle } from '@/components/theme-toggle';

export default function RegisterPage() {
  const [isRegistrationClosed, setIsRegistrationClosed] = useState(false);

  useEffect(() => {
    // Check if current date is after November 21, 2025
    const currentDate = new Date();
    const closingDate = new Date('2025-11-21T23:59:59');
    setIsRegistrationClosed(currentDate > closingDate);
  }, []);

  return (
    <div className="min-h-screen p-5 relative overflow-hidden bg-gradient-to-br from-amber-950 via-orange-950 to-amber-950">
      {/* Background Effects */}
      <div className="absolute inset-0 bg-gradient-to-br from-amber-800/20 via-orange-800/20 to-amber-800/20"></div>

      {/* Spotlight Effects */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl"></div>
      <div className="absolute top-0 right-1/4 w-96 h-96 bg-orange-500/10 rounded-full blur-3xl"></div>

      {/* Header with Back Button */}
      <div className="w-full max-w-md md:max-w-2xl mx-auto mb-2 relative z-10">
        <div className="flex items-center justify-between mb-6">
          <div className="leaderboard-row">
            <Link href="/" className="bg-gradient-to-r from-amber-100 to-amber-50 rounded-[14px] px-4 py-2 text-amber-900 font-bold press-effect inline-flex items-center gap-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Kembali ke Halaman Utama
            </Link>
          </div>
          <ThemeToggle />
        </div>
      </div>

      {/* Registration Form or Closed Message */}
      <div className="max-w-4xl mx-auto relative z-10">
        {isRegistrationClosed ? (
          <div className="w-full max-w-md md:max-w-2xl mx-auto bg-card rounded-2xl shadow-2xl overflow-hidden border border-border">
            {/* Closed Header */}
            <div className="bg-gradient-to-br from-destructive via-destructive to-destructive text-white p-6 text-center relative overflow-hidden">
              <div className="relative z-10">
                <div className="w-16 h-16 bg-gradient-to-br from-destructive via-destructive to-destructive rounded-full mx-auto mb-4 flex items-center justify-center text-3xl shadow-[0_8px_25px_rgba(239,68,68,0.4)] border-2 border-red-400/30">
                  ❌
                </div>
                <h2 className="text-2xl font-bold mb-2">PENDAFTARAN DITUTUP</h2>
                <p className="text-sm opacity-90 text-red-200">Registrasi berakhir 21 November 2025</p>
              </div>
            </div>

            {/* Closed Content */}
            <div className="p-8 text-center">
              <div className="mb-6">
                <h3 className="text-xl font-bold text-foreground mb-4">📅 Maaf, Waktu Pendaftaran Telah Berakhir</h3>
                <p className="text-lg text-muted-foreground mb-8">
                  Pendaftaran untuk TI Billiard Cup 2025 telah ditutup pada tanggal 21 November 2025.
                </p>

                <div className="bg-secondary border-l-4 border-green-500 p-4 mb-6 backdrop-blur-sm text-left">
                  <h4 className="font-semibold text-green-500 mb-2">📋 Informasi Turnamen:</h4>
                  <ul className="text-sm text-muted-foreground space-y-2">
                    <li>• Batas Pendaftaran: 21 November 2025</li>
                    <li>• Tanggal Turnamen: 22 November 2025</li>
                    <li>• Waktu: 18.00 - 20.00 WIB</li>
                    <li>• Lokasi: Greenlight Cafe & Billiard</li>
                    <li>• Alamat: Jl. Purnawarman No.3, Bandung</li>
                    <li>• Peserta yang sudah terdaftar akan dihubungi panitia</li>
                  </ul>

                  {/* Google Maps Embed */}
                  <div className="mt-4">
                    <div className="relative w-full h-48 rounded-lg overflow-hidden border border-border">
                      <iframe
                        width="100%"
                        height="100%"
                        src="https://maps.google.com/maps?q=greenlight+cafe+%26+billiard&t=&z=15&ie=UTF8&iwloc=&output=embed"
                        frameBorder="0"
                        scrolling="no"
                        className="w-full h-full"
                        title="Lokasi Greenlight Cafe & Billiard"
                      ></iframe>
                    </div>
                  </div>
                </div>

                <div className="mb-6">
                  <p className="text-sm text-muted-foreground mb-3">📞 Butuh informasi? Hubungi:</p>
                  <div className="space-y-2">
                    <a
                      href="https://wa.me/+6285189970998"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-semibold text-foreground hover:text-accent transition-colors duration-300 block"
                    >
                      📱 085189970998 (Michael Sean - TI)
                    </a>
                    <a
                      href="https://wa.me/+6285624055869"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-semibold text-foreground hover:text-accent transition-colors duration-300 block"
                    >
                      📱 085624055869 (Novi - TI)
                    </a>
                  </div>
                </div>

                <Link href="/">
                  <button className="w-full bg-gradient-to-r from-accent to-accent/80 text-accent-foreground py-3 px-6 rounded-lg font-bold hover:opacity-90 transition-all border border-accent/50">
                    🏠 Kembali ke Halaman Utama
                  </button>
                </Link>
              </div>
            </div>
          </div>
        ) : (
          <RegistrationForm />
        )}
      </div>
    </div>
  );
}