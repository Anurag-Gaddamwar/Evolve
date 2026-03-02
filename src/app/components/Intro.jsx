import React from 'react';
import Link from 'next/link';

// a dark hero with video or animation background; overlay text in white
const Intro = () => {
  return (
    <>
      <div className="relative w-full overflow-hidden bg-black" style={{ height: 'calc(var(--vh, 1vh) * 100)' }}>
        {/* background video (place hero-bg.mp4 in public folder or update src) */}
        {/* replace hero-bg.mp4 with your own full‑screen animation or video; add file to public/ */}
        <video
          className="absolute inset-0 w-full h-full object-cover"
          src="/hero-bg.mp4"
          poster="/hero-fallback.jpg"
          autoPlay
          muted
          loop
          playsInline
        />
        {/* dark overlay */}
        <div className="absolute inset-0 bg-black opacity-70"></div>

        {/* central heading */}
        <div className="relative z-10 flex flex-col items-center justify-center h-full px-4 text-center">
          <h1 className="text-white font-extrabold text-6xl sm:text-7xl md:text-8xl lg:text-9xl leading-tight hero-heading">
            <span className="block">Born for</span>
            <span className="block hero-accent">Creators</span>
          </h1>
          <p className="text-gray-300 mt-6 text-lg sm:text-xl max-w-2xl">
            A next‑generation toolkit that transcends dimensions. Analyze, brainstorm, and upload with AI‑powered precision.
          </p>
          <Link href="/analytics">
            <button className="mt-10 px-8 py-4 bg-purple-600 text-white font-semibold rounded-full hover:opacity-90 transition">
              Get Started
            </button>
          </Link>
        </div>
      </div>

      {/* additional content below hero */}
      <section id="features" className="py-20 bg-gray-100 dark:bg-gray-900">
        <div className="max-w-6xl mx-auto px-6">
          <h2 className="text-3xl font-bold text-center theme-text mb-12">Features Tailored for Creators</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="theme-surface theme-shadow rounded-lg p-6 text-center">
              <h3 className="text-xl font-semibold mb-4 theme-text">Video Analyzer</h3>
              <p className="theme-muted">
                Paste a YouTube link and receive a comprehensive report with engagement metrics, user sentiment, and specific recommendations to improve your content.
              </p>
            </div>
            <div className="theme-surface theme-shadow rounded-lg p-6 text-center">
              <h3 className="text-xl font-semibold mb-4 theme-text">AI Brainstormer</h3>
              <p className="theme-muted">
                Chat with our AI assistant to generate scripts, refine ideas, or get feedback—context preserved across messages.
              </p>
            </div>
            <div className="theme-surface theme-shadow rounded-lg p-6 text-center">
              <h3 className="text-xl font-semibold mb-4 theme-text">Content Hub</h3>
              <p className="theme-muted">
                View and access all your channel’s uploads in one dashboard; analyze without switching to YouTube.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section id="testimonials" className="py-20 bg-white dark:bg-gray-800">
        <div className="max-w-6xl mx-auto px-6">
          <h2 className="text-3xl font-bold text-center theme-text mb-12">What creators are saying</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <blockquote className="theme-surface theme-shadow p-6 rounded-lg">
              <p className="theme-text italic">"Evolve helped me double my engagement by pinpointing what my viewers actually care about. The AI assistant writes my scripts for me now!"</p>
              <footer className="mt-4 theme-muted">— Sara K., tech vlogger</footer>
            </blockquote>
            <blockquote className="theme-surface theme-shadow p-6 rounded-lg">
              <p className="theme-text italic">"This is the first tool that understands the creator workflow. I paste a link and get real recommendations in seconds."</p>
              <footer className="mt-4 theme-muted">— Dev R., gaming channel</footer>
            </blockquote>
          </div>
        </div>
      </section>
    </>
  );
};

export default Intro;
