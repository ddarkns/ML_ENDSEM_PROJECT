"use client";
import React, { useState, useEffect } from "react";
import Navbar from "@/components/Navbar";
import MovieCard from "@/components/MovieCard";
import { Movie } from "@/types/movie";
import { movieApi } from "@/lib/api";
import { useMyList } from "@/context/ListContext";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Loader2, Sparkles, X, Wand2 } from "lucide-react";

interface RecommendationGroup {
  sourceTitle: string;
  movies: Movie[];
}

export default function HomePage() {
  const [initialMovies, setInitialMovies] = useState<Movie[]>([]);
  const [groupedRecommendations, setGroupedRecommendations] = useState<RecommendationGroup[]>([]);
  const [selectedMovie, setSelectedMovie] = useState<Movie | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { myList, removeFromList, addToList } = useMyList();

  // Magic Feature UI States
  const [isMagicOpen, setIsMagicOpen] = useState(false);
  const [magicPrompt, setMagicPrompt] = useState("");
  const [isMagicLoading, setIsMagicLoading] = useState(false);
  const [descriptionRecommendations, setDescriptionRecommendations] = useState<Movie[]>([]);

  useEffect(() => {
    movieApi.getAllMovies().then(setInitialMovies);
  }, []);

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

  // Magic Feature execution handler using direct fetch
  const handleMagicRecommend = async () => {
    if (!magicPrompt.trim()) return;
    setIsMagicLoading(true);
    try {
      // Swapped out movieApi for a direct fetch endpoint hit to bypass missing functions
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
      setIsMagicOpen(false); // Close dialog to reveal the injected results row
    } catch (error) {
      console.error("Magic Feature Error:", error);
    } finally {
      setIsMagicLoading(false);
    }
  };

  return (
    <main className="min-h-screen pb-20 bg-black text-white relative">
      
      {/* FIXED POSITIONING: 
        Using 'fixed' instead of 'absolute' bypasses Navbar wrapping entirely.
        'z-[999]' forces it above any navbar layer.
      */}
      <div className="fixed top-4 right-6 z-[999]">
        <Button 
          onClick={() => setIsMagicOpen(true)}
          className="bg-gradient-to-r from-amber-500 to-red-600 hover:from-amber-600 hover:to-red-700 text-white font-bold gap-2 shadow-xl shadow-black/50 tracking-wide rounded-md px-5 py-2 transition-all duration-300"
        >
          <Wand2 className="w-4 h-4 animate-pulse" />
          Magic Feature
        </Button>
      </div>

      <Navbar onSelectMovie={(m) => setSelectedMovie(m)} />

      {/* Hero Section */}
      <div className="relative h-[70vh] w-full flex items-center px-12 pt-20 overflow-hidden">
        <div className="absolute inset-0 z-0">
          <img 
            src={initialMovies[0]?.Poster_Url} 
            className="w-full h-full object-cover opacity-40 blur-sm"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-black via-black/60 to-transparent" />
        </div>
        
        <div className="relative z-10 max-w-2xl">
          <h1 className="text-6xl font-black mb-4 uppercase tracking-tighter">
            {initialMovies[0]?.Title || "Featured Movie"}
          </h1>
          <p className="text-zinc-400 text-lg line-clamp-3 mb-6">
            {initialMovies[0]?.Overview}
          </p>
          <Button size="lg" className="bg-white text-black hover:bg-zinc-200 font-bold px-8" onClick={() => setSelectedMovie(initialMovies[0])}>
            View Details
          </Button>
        </div>
      </div>

      <div className="px-12 space-y-12 -mt-20 relative z-20">
        
        {/* My List Section */}
        <section>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold">My List</h2>
            {myList.length > 0 && (
              <Button 
                onClick={handleGetRecommendations} 
                disabled={isLoading}
                className="bg-red-600 hover:bg-red-700 text-white gap-2"
              >
                {isLoading ? <Loader2 className="animate-spin w-4 h-4" /> : <Sparkles className="w-4 h-4" />}
                Get AI Recommendations
              </Button>
            )}
          </div>
          
          {myList.length === 0 ? (
            <p className="text-zinc-500 italic">Your list is empty. Search for movies to add them!</p>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-6">
              {myList.map(movie => (
                <div key={movie.Title} className="relative group">
                  <MovieCard movie={movie} onClick={() => setSelectedMovie(movie)} />
                  <button 
                    onClick={() => removeFromList(movie.Title)}
                    className="absolute top-2 right-2 p-1 bg-black/60 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Magic Prompt Section Row */}
        {descriptionRecommendations.length > 0 && (
          <section className="animate-in fade-in slide-in-from-top-4 duration-700 bg-zinc-950/40 p-6 rounded-xl border border-amber-500/20">
            <h2 className="text-2xl font-bold mb-6 text-amber-400 flex items-center gap-2">
              <Wand2 className="w-6 h-6 text-amber-400" /> 
              Movies similar to your description
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-6">
              {descriptionRecommendations.map(movie => (
                <MovieCard key={movie.Title} movie={movie} onClick={() => setSelectedMovie(movie)} />
              ))}
            </div>
          </section>
        )}

        {/* Dynamic Multi-Section Recommendations */}
        {groupedRecommendations.length > 0 && (
          <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
            {groupedRecommendations.map((group) => (
              <section key={group.sourceTitle}>
                <h2 className="text-2xl font-bold mb-6 text-red-500 flex items-center gap-2">
                  <Sparkles className="w-6 h-6" /> 
                  Movies similar to {group.sourceTitle}
                </h2>
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-6">
                  {group.movies.map(movie => (
                    <MovieCard key={movie.Title} movie={movie} onClick={() => setSelectedMovie(movie)} />
                  ))}
                </div>
              </section>
            ))}
          </div>
        )}

        {/* All Movies Grid */}
        <section>
          <h2 className="text-2xl font-bold mb-6">Explore Movies</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-6">
            {initialMovies.map(movie => (
              <MovieCard key={movie.Title} movie={movie} onClick={() => setSelectedMovie(movie)} />
            ))}
          </div>
        </section>
      </div>

      {/* Magic Feature Modal */}
      <Dialog open={isMagicOpen} onOpenChange={setIsMagicOpen}>
        <DialogContent className="bg-zinc-950 border border-zinc-800 text-white max-w-md p-6">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold flex items-center gap-2 text-amber-400">
              <Wand2 className="w-5 h-5" /> Magic AI Search
            </DialogTitle>
            <DialogDescription className="text-zinc-400 text-sm pt-2">
              Type anything you are feeling or looking for in plain text. Our system converts your description into vector representations to explore contextual themes in our continuous embedding space.
            </DialogDescription>
          </DialogHeader>
          <div className="my-4 space-y-4">
            <textarea
              className="w-full h-28 p-3 rounded-md bg-zinc-900 border border-zinc-700 text-white placeholder-zinc-500 focus:outline-none focus:border-amber-500 text-sm resize-none"
              placeholder="e.g., A gritty cyberpunk mystery thriller with neon vibes and detective work..."
              value={magicPrompt}
              onChange={(e) => setMagicPrompt(e.target.value)}
            />
            <Button
              className="w-full bg-gradient-to-r from-amber-500 to-red-600 text-white hover:opacity-90 py-5 text-md font-bold transition-all"
              onClick={handleMagicRecommend}
              disabled={isMagicLoading || !magicPrompt.trim()}
            >
              {isMagicLoading ? (
                <>
                  <Loader2 className="animate-spin w-4 h-4 mr-2" />
                  Analyzing Embeddings...
                </>
              ) : (
                "Recommend"
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Movie Details Modal */}
      <Dialog open={!!selectedMovie} onOpenChange={() => setSelectedMovie(null)}>
        {selectedMovie && (
          <DialogContent className="bg-zinc-950 border-zinc-800 text-white max-w-3xl overflow-hidden p-0">
            <div className="relative h-64">
              <img src={selectedMovie.Poster_Url} className="w-full h-full object-cover opacity-50" />
              <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 to-transparent" />
            </div>
            <div className="p-8 -mt-20 relative z-10">
              <DialogHeader>
                <DialogTitle className="text-4xl font-bold mb-2">{selectedMovie.Title}</DialogTitle>
                <div className="flex items-center gap-4 text-zinc-400 text-sm mb-4">
                  <span className="text-green-500 font-bold">{selectedMovie.Vote_Average * 10}% Match</span>
                  <span>{selectedMovie.Genre}</span>
                </div>
              </DialogHeader>
              <p className="text-zinc-300 leading-relaxed mb-6">{selectedMovie.Overview}</p>
              <Button 
                className="w-full bg-white text-black hover:bg-zinc-200 py-6 text-lg font-bold"
                onClick={() => {
                  addToList(selectedMovie);
                  setSelectedMovie(null);
                }}
              >
                Add to My List
              </Button>
            </div>
          </DialogContent>
        )}
      </Dialog>
    </main>
  );
}