"use client";
import React, { useState, useEffect, useRef } from "react";
import { Input } from "@/components/ui/input";
import { Search, Film, Loader2 } from "lucide-react";
import { Movie } from "@/types/movie";

export default function Navbar({ onSelectMovie }: { onSelectMovie: (m: Movie) => void }) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Movie[]>([]);
  const [loading, setLoading] = useState(false);
  const debounceTimer = useRef<NodeJS.Timeout | null>(null);

  const performSearch = async (searchTerm: string) => {
    if (searchTerm.trim().length === 0) {
      setResults([]);
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`http://127.0.0.1:8000/search?query=${encodeURIComponent(searchTerm)}`);
      const data = await response.json();
      
      console.log("🔍 Search API Response:", data); // THIS IS CRITICAL FOR DEBUGGING
      
      // Ensure we are setting an array
      setResults(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("❌ Search API error:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (debounceTimer.current) clearTimeout(debounceTimer.current);
    debounceTimer.current = setTimeout(() => {
      performSearch(query);
    }, 300);
    return () => { if (debounceTimer.current) clearTimeout(debounceTimer.current); };
  }, [query]);

  return (
    <nav className="fixed top-0 w-full z-[100] bg-black/90 backdrop-blur-xl border-b border-white/10 px-6 py-3 flex justify-between items-center">
      <div className="flex items-center gap-2">
        <Film className="text-red-600 w-8 h-8" />
        <span className="text-red-600 font-black text-2xl tracking-tighter uppercase">Maddali's-Movies</span>
      </div>
      
      <div className="relative w-full max-w-lg">
        <div className="relative">
          {loading ? (
            <Loader2 className="absolute left-3 top-1/2 -translate-y-1/2 text-red-600 w-4 h-4 animate-spin" />
          ) : (
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 w-4 h-4" />
          )}
          <Input 
            className="bg-zinc-900 border-zinc-700 pl-10 text-white focus:ring-2 focus:ring-red-600 rounded-md h-10"
            placeholder="Search all 9,000+ movies..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>

        {/* Search Results Dropdown */}
        {results.length > 0 && (
          <div className="absolute top-full left-0 mt-2 w-full bg-zinc-950 border border-zinc-800 rounded-md shadow-2xl overflow-hidden z-[110]">
            {results.map((movie, index) => (
              <div 
                key={`${movie.Title}-${index}`}
                className="p-3 hover:bg-zinc-800 cursor-pointer flex items-center gap-4 border-b border-zinc-900 last:border-0"
                onClick={() => {
                  console.log("🎯 Selected Movie:", movie);
                  onSelectMovie(movie);
                  setQuery("");
                  setResults([]);
                }}
              >
                <img 
                  src={movie.Poster_Url} 
                  className="w-10 h-14 object-cover rounded bg-zinc-900" 
                  alt=""
                  onError={(e) => { (e.target as HTMLImageElement).src = "https://via.placeholder.com/100x150?text=?" }}
                />
                <div className="flex flex-col min-w-0">
                  <span className="text-sm font-bold text-white truncate">{movie.Title}</span>
                  <span className="text-xs text-zinc-500">{movie.Vote_Average} ★</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      <div className="w-32"></div> {/* Spacer for symmetry */}
    </nav>
  );
}