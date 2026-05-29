"use client";
import React from "react";
import { Card } from "@/components/ui/card";
import { Star, Plus, Play, X } from "lucide-react"; // Added X
import { Movie } from "@/types/movie";
import { useMyList } from "@/context/ListContext";

export default function MovieCard({ movie, onClick }: { movie: Movie, onClick: () => void }) {
  const { addToList, removeFromList } = useMyList(); // Added removeFromList

  return (
    <div className="group relative transition-all duration-500 hover:scale-105 cursor-pointer z-10 hover:z-20">
      <Card className="bg-zinc-900 border-zinc-800 overflow-hidden shadow-xl" onClick={onClick}>
        <div className="relative aspect-[2/3] w-full">
          <img 
            src={movie.Poster_Url} 
            className="w-full h-full object-cover transition-transform duration-700 group-hover:brightness-50"
            onError={(e) => { (e.target as HTMLImageElement).src = "https://via.placeholder.com/500x750?text=No+Poster"; }}
          />
          <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-all duration-300 flex flex-col justify-end p-4 bg-gradient-to-t from-black via-black/40 to-transparent">
             <div className="flex justify-center mb-12 translate-y-4 group-hover:translate-y-0 transition-transform duration-500">
                <div className="bg-white/20 backdrop-blur-md p-3 rounded-full border border-white/30">
                  <Play className="w-6 h-6 fill-white text-white" />
                </div>
             </div>
             <h3 className="text-white font-black text-sm uppercase tracking-tight line-clamp-2">{movie.Title}</h3>
             <div className="flex items-center justify-between mt-2">
                <div className="flex items-center text-green-400 gap-1">
                  <Star className="w-3 h-3 fill-current" />
                  <span className="text-xs font-bold">{movie.Vote_Average}</span>
                </div>
                
                {/* Action Buttons Container */}
                <div className="flex gap-2">
                    <button 
                      onClick={(e) => { e.stopPropagation(); removeFromList(movie.Title); }}
                      className="relative z-50 bg-zinc-800 text-white p-1.5 rounded-full hover:bg-zinc-700 active:scale-90"
                      title="Remove from List"
                    >
                      <X className="w-4 h-4" />
                    </button>
                    <button 
                      onClick={(e) => { e.stopPropagation(); addToList(movie); }}
                      className="relative z-50 bg-red-600 text-white p-1.5 rounded-full hover:bg-red-700 active:scale-90"
                      title="Add to List"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                </div>
             </div>
          </div>
        </div>
      </Card>
      <p className="mt-2 text-[10px] uppercase tracking-widest font-bold text-zinc-500 truncate group-hover:text-red-500">
        {movie.Title}
      </p>
    </div>
  );
}