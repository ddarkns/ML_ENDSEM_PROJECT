"use client";
import React, { useState, useEffect } from "react";
import Navbar from "@/components/Navbar";
import MovieCard from "@/components/MovieCard";
import { Movie } from "@/types/movie";
import { movieApi } from "@/lib/api";
import { useMyList } from "@/context/ListContext";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Loader2, Sparkles, X, Wand2, Play, Info } from "lucide-react";

interface RecommendationGroup {
  sourceTitle: string;
  movies: Movie[];
}

export default function HomePage() {
  const [initialMovies, setInitialMovies] = useState<Movie[]>([]);
  const [exploreMovies, setExploreMovies] = useState<Movie[]>([]);
  const [groupedRecommendations, setGroupedRecommendations] = useState<RecommendationGroup[]>([]);
  const [selectedMovie, setSelectedMovie] = useState<Movie | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { myList, removeFromList, addToList } = useMyList();

  // Hero Slider State
  const [currentSliderIndex, setCurrentSliderIndex] = useState(0);

  // Magic Feature UI States
  const [isMagicOpen, setIsMagicOpen] = useState(false);
  const [magicPrompt, setMagicPrompt] = useState("");
  const [isMagicLoading, setIsMagicLoading] = useState(false);
  const [descriptionRecommendations, setDescriptionRecommendations] = useState<Movie[]>([]);

  useEffect(() => {
    movieApi.getAllMovies().then((movies) => {
      setInitialMovies(movies);
      
      if (movies.length > 0) {
        const shuffled = [...movies].sort(() => 0.5 - Math.random());
        setExploreMovies(shuffled);
      }
    });
  }, []);

  // Automatic Hero Carousel Slider Interval (Changes every 6 seconds for a relaxed read)
  useEffect(() => {
    if (initialMovies.length === 0) return;
    
    const interval = setInterval(() => {
      setCurrentSliderIndex((prevIndex) => 
        prevIndex === Math.min(initialMovies.length - 1, 9) ? 0 : prevIndex + 1
      );
    }, 6000);

    return () => clearInterval(interval);
  }, [initialMovies]);

  const handleGetRecommendations = async () => {
    if (myList.length === 0) return;
    setIsLoading(true);
    try {
      const groups: RecommendationGroup[] = [];
      for (const movie of myList) {
        try {
          const recs = await movieApi.getRecommendations([movie.Title]);
          if (recs && recs.length > 0) {
            groups.push({
              sourceTitle: movie.Title,
              movies: recs
            });
          }
        } catch (err) {
          console.error(`Failed to fetch recommendations for ${movie.Title}:`, err);
        }
      }
      setGroupedRecommendations(groups);
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleMagicRecommend = async () => {
    if (!magicPrompt.trim()) return;
    setIsMagicLoading(true);
    try {
      const response = await fetch("http://localhost:8000/recommend-by-description", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ description: magicPrompt }),
      });

      if (!response.ok) {
        throw new Error("Failed to fetch magic descriptions from backend server");
      }

      const recs = await response.json();
      setDescriptionRecommendations(recs);
      setIsMagicOpen(false);
    } catch (error) {
      console.error("Magic Feature Error:", error);
    } finally {
      setIsMagicLoading(false);
    }
  };

  const featuredMovie = initialMovies[currentSliderIndex] || initialMovies[0];

  return (
    <main className="min-h-screen pb-24 bg-[#0a0a0c] text-zinc-50 antialiased relative selection:bg-red-500 selection:text-white">
      
      {/* Premium Magic Floating Controller Action */}
      <div className="fixed bottom-6 right-8 z-[999]">
        <Button 
          onClick={() => setIsMagicOpen(true)}
          className="bg-gradient-to-r from-amber-500 via-orange-600 to-red-600 hover:opacity-95 text-white font-bold gap-2.5 shadow-2xl shadow-red-900/30 tracking-wide rounded-full px-6 py-6 transition-all duration-300 hover:scale-105 border border-white/10 backdrop-blur-md"
        >
          <Wand2 className="w-5 h-5 animate-pulse text-amber-200" />
          <span className="text-sm font-semibold tracking-tight">Magic Search</span>
        </Button>
      </div>

      <Navbar onSelectMovie={(m) => setSelectedMovie(m)} />

      {/* Cinematic Hero Spotlight Slider Canvas */}
      <div className="relative h-[85vh] w-full flex items-center px-8 md:px-16 overflow-hidden bg-black">
        <div className="absolute inset-0 z-0">
          <img 
            key={featuredMovie?.Title}
            src={featuredMovie?.Poster_Url} 
            className="w-full h-full object-cover opacity-35 scale-100 transition-all duration-1000 ease-out animate-in fade-in zoom-in-105"
            alt="Hero Canvas Background"
          />
          {/* Multi-layered cinematic gradient masking system */}
          <div className="absolute inset-0 bg-gradient-to-r from-[#0a0a0c] via-[#0a0a0c]/70 to-transparent z-10" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0c] via-transparent to-black/30 z-10" />
        </div>
        
        <div className="relative z-20 max-w-3xl mt-12 animate-in fade-in slide-in-from-left-6 duration-1000">
          <div className="flex items-center gap-2.5 mb-4">
            <span className="bg-red-600/10 text-red-500 border border-red-500/20 text-[11px] font-bold tracking-widest uppercase px-2.5 py-1 rounded-sm">
              Spotlight
            </span>
            <span className="text-zinc-400 text-xs font-medium tracking-wide">
              {featuredMovie?.Genre?.split(',')[0] || "Trending"}
            </span>
            <span className="w-1 h-1 bg-zinc-600 rounded-full" />
            <span className="text-zinc-400 text-xs font-semibold text-green-400">
              {featuredMovie?.Vote_Average ? `${featuredMovie.Vote_Average * 10}% Match` : ""}
            </span>
          </div>

          <h1 className="text-5xl md:text-7xl font-black mb-4 uppercase tracking-tighter text-white leading-none drop-shadow-sm">
            {featuredMovie?.Title || "Featured Spotlight"}
          </h1>
          
          <p className="text-zinc-300 text-base md:text-lg leading-relaxed font-normal line-clamp-3 mb-8 max-w-xl text-zinc-300/90 [text-shadow:_0_1px_2px_rgba(0,0,0,0.6)]">
            {featuredMovie?.Overview}
          </p>

          <div className="flex items-center gap-4">
            <Button 
              size="lg" 
              className="bg-white text-black hover:bg-zinc-200 font-bold px-8 rounded-md shadow-lg transition-transform active:scale-95 flex items-center gap-2 text-sm"
              onClick={() => setSelectedMovie(featuredMovie)}
            >
              <Play className="w-4 h-4 fill-black text-black" /> Play Overview
            </Button>
            <Button 
              size="lg" 
              variant="outline"
              className="bg-zinc-900/40 hover:bg-zinc-800/60 border-zinc-700/60 text-white font-bold px-6 rounded-md backdrop-blur-md transition-all flex items-center gap-2 text-sm"
              onClick={() => setSelectedMovie(featuredMovie)}
            >
              <Info className="w-4 h-4 text-zinc-300" /> More Info
            </Button>
          </div>
        </div>

        {/* Minimal Premium Pagination Dashboard */}
        <div className="absolute bottom-12 right-8 md:right-16 z-20 flex items-center gap-2.5 bg-black/20 px-4 py-2 rounded-full backdrop-blur-md border border-white/5">
          {initialMovies.slice(0, 6).map((_, idx) => (
            <button
              key={idx}
              onClick={() => setCurrentSliderIndex(idx)}
              className={`h-1 rounded-full transition-all duration-500 ${idx === currentSliderIndex ? 'w-8 bg-red-600' : 'w-2 bg-zinc-600 hover:bg-zinc-400'}`}
              aria-label={`Go to slide ${idx + 1}`}
            />
          ))}
        </div>
      </div>

      {/* Main Structural Content Grid */}
      <div className="px-6 md:px-16 space-y-16 -mt-16 relative z-30">
        
        {/* My List Row */}
        <section className="bg-gradient-to-b from-transparent to-[#0a0a0c]">
          <div className="flex items-center justify-between mb-6">
            <div className="space-y-1">
              <h2 className="text-2xl font-bold tracking-tight text-white">My List</h2>
              <p className="text-xs text-zinc-500">Your personal curated watchlist</p>
            </div>
            {myList.length > 0 && (
              <Button 
                onClick={handleGetRecommendations} 
                disabled={isLoading}
                className="bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-200 text-xs font-semibold px-4 py-2 rounded-md transition-all gap-2"
              >
                {isLoading ? <Loader2 className="animate-spin w-3.5 h-3.5 text-zinc-400" /> : <Sparkles className="w-3.5 h-3.5 text-red-500" />}
                Recommendations
              </Button>
            )}
          </div>
          
          {myList.length === 0 ? (
            <div className="border border-dashed border-zinc-800/80 rounded-xl py-12 px-4 text-center bg-zinc-950/20 backdrop-blur-sm">
              <p className="text-zinc-500 text-sm font-medium italic">Your list is empty. Explore and add movies above to kickstart your pipeline.</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
              {myList.map(movie => (
                <div key={movie.Title} className="relative group transition-transform duration-300 ease-out hover:scale-[1.03] z-10 hover:z-20">
                  <MovieCard movie={movie} onClick={() => setSelectedMovie(movie)} />
                  <button 
                    onClick={() => removeFromList(movie.Title)}
                    className="absolute top-3 right-3 p-1.5 bg-black/80 hover:bg-red-600 rounded-full opacity-0 group-hover:opacity-100 text-zinc-400 hover:text-white border border-white/10 transition-all shadow-xl backdrop-blur-md"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Magic Prompt Section Row Output Layout */}
        {descriptionRecommendations.length > 0 && (
          <section className="animate-in fade-in slide-in-from-top-6 duration-700 bg-gradient-to-r from-amber-950/10 via-zinc-950/40 to-transparent p-6 rounded-2xl border border-amber-500/10 shadow-2xl">
            <div className="mb-6 space-y-1">
              <h2 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-orange-400 flex items-center gap-2 tracking-tight">
                <Wand2 className="w-5 h-5 text-amber-400 animate-pulse" /> 
                Conceptual Discoveries
              </h2>
              <p className="text-xs text-zinc-500">Matching context vectors extracted from your criteria description</p>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
              {descriptionRecommendations.map(movie => (
                <div key={movie.Title} className="transition-transform duration-300 ease-out hover:scale-[1.03]">
                  <MovieCard movie={movie} onClick={() => setSelectedMovie(movie)} />
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Dynamic Multi-Section Filter Pipeline Recommendations */}
        {groupedRecommendations.length > 0 && (
          <div className="space-y-16 animate-in fade-in slide-in-from-bottom-6 duration-700">
            {groupedRecommendations.map((group) => (
              <section key={group.sourceTitle} className="border-t border-zinc-900 pt-12">
                <div className="mb-6 space-y-1">
                  <h2 className="text-xl font-bold tracking-tight text-zinc-100 flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-red-500" /> 
                    Because you liked <span className="text-red-500 underline decoration-red-600/30 underline-offset-4 font-extrabold">{group.sourceTitle}</span>
                  </h2>
                  <p className="text-xs text-zinc-500">Deep semantic suggestions drawn from structural similarities</p>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
                  {group.movies.map(movie => (
                    <div key={movie.Title} className="transition-transform duration-300 ease-out hover:scale-[1.03]">
                      <MovieCard movie={movie} onClick={() => setSelectedMovie(movie)} />
                    </div>
                  ))}
                </div>
              </section>
            ))}
          </div>
        )}

        {/* Explore Portfolio Grid Section */}
        <section className="border-t border-zinc-900 pt-12">
          <div className="mb-6 space-y-1">
            <h2 className="text-2xl font-bold tracking-tight text-white">Explore Movies</h2>
            <p className="text-xs text-zinc-500">Browse through the full index catalogue collection</p>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
            {exploreMovies.map(movie => (
              <div key={movie.Title} className="transition-transform duration-300 ease-out hover:scale-[1.03]">
                <MovieCard movie={movie} onClick={() => setSelectedMovie(movie)} />
              </div>
            ))}
          </div>
        </section>
      </div>

      {/* Premium Dark Matte Blurred Search Modal */}
      <Dialog open={isMagicOpen} onOpenChange={setIsMagicOpen}>
        <DialogContent className="bg-[#0e0e11] border border-zinc-800/80 text-white max-w-lg p-8 rounded-2xl shadow-2xl backdrop-blur-xl">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold flex items-center gap-2.5 text-zinc-100 tracking-tight">
              <Wand2 className="w-5 h-5 text-amber-400" /> Neural Context Search
            </DialogTitle>
            <DialogDescription className="text-zinc-400 text-xs leading-relaxed pt-2">
              Describe plots, moods, structural backdrops, or themes in natural prose language. Our custom engine maps descriptions into embedded vectors to compute similarities across databases.
            </DialogDescription>
          </DialogHeader>
          <div className="my-5 space-y-5">
            <textarea
              className="w-full h-32 p-4 rounded-xl bg-zinc-900/60 border border-zinc-800/80 text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-amber-500/60 text-sm resize-none transition-colors duration-200"
              placeholder="Describe a mood, e.g., 'A cerebral cosmic mind-bender with neon cyber aesthetics and high existential stakes...'"
              value={magicPrompt}
              onChange={(e) => setMagicPrompt(e.target.value)}
            />
            <Button
              className="w-full bg-gradient-to-r from-amber-500 via-orange-600 to-red-600 text-white font-bold py-6 rounded-xl transition-all duration-300 shadow-lg shadow-orange-950/20 text-sm hover:opacity-95"
              onClick={handleMagicRecommend}
              disabled={isMagicLoading || !magicPrompt.trim()}
            >
              {isMagicLoading ? (
                <span className="flex items-center gap-2 justify-center">
                  <Loader2 className="animate-spin w-4 h-4 text-amber-200" />
                  Computing Core Matrix Vectors...
                </span>
              ) : (
                "Generate Conceptual Matches"
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Movie Details Modal */}
      <Dialog open={!!selectedMovie} onOpenChange={() => setSelectedMovie(null)}>
        {selectedMovie && (
          <DialogContent className="bg-[#0a0a0c] border border-zinc-900 text-white max-w-3xl overflow-hidden p-0 rounded-2xl shadow-2xl">
            <div className="relative h-72">
              <img src={selectedMovie.Poster_Url} className="w-full h-full object-cover opacity-40" alt="Details Banner" />
              <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0c] via-[#0a0a0c]/40 to-transparent" />
            </div>
            <div className="p-8 -mt-24 relative z-10">
              <DialogHeader>
                <DialogTitle className="text-4xl font-extrabold mb-2 tracking-tight text-white">{selectedMovie.Title}</DialogTitle>
                <div className="flex items-center gap-3 text-zinc-400 text-xs font-semibold mb-4">
                  <span className="text-green-400 bg-green-500/10 border border-green-500/20 px-2 py-0.5 rounded-sm">{selectedMovie.Vote_Average * 10}% Match</span>
                  <span className="text-zinc-500">•</span>
                  <span>{selectedMovie.Genre || "General"}</span>
                  {selectedMovie.Release_Date && (
                    <>
                      <span className="text-zinc-500">•</span>
                      <span className="text-zinc-400">{selectedMovie.Release_Date.split('-')[0] || selectedMovie.Release_Date}</span>
                    </>
                  )}
                </div>
              </DialogHeader>
              <p className="text-zinc-300 text-sm leading-relaxed mb-6 font-normal max-w-2xl">{selectedMovie.Overview}</p>
              <Button 
                className="w-full bg-zinc-50 text-black hover:bg-zinc-200 py-6 text-sm font-bold rounded-xl transition-all shadow-md"
                onClick={() => {
                  addToList(selectedMovie);
                  setSelectedMovie(null);
                }}
              >
                Add to Watchlist
              </Button>
            </div>
          </DialogContent>
        )}
      </Dialog>
    </main>
  );
}