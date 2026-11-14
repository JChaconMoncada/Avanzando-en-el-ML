import type { Metadata } from 'next';
import './globals.css';
import Navbar from '@/components/layout/Navbar';
import MentorChat from '@/components/chat/MentorChat';

export const metadata: Metadata = {
  title: 'Jesus Mastery Hub: Ruta a SLB & Data/ML Engineer (2026-2027)',
  description:
    'Plataforma de entrenamiento técnico intensivo y evaluación con IA para Jesús Chacón. Preparación para Schlumberger (SLB) y vacantes internacionales como Data/ML Engineer.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es" className="dark h-full bg-slate-950">
      <body className="min-h-full flex flex-col bg-slate-950 text-slate-100 antialiased selection:bg-cyan-500/20 selection:text-cyan-300">
        <Navbar />
        <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6 w-full flex-1">
          {children}
        </main>
        <MentorChat />
      </body>
    </html>
  );
}
