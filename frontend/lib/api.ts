import { Movie } from "./types/movie"; // Updated path

const API_BASE = "http://127.0.0.1:8000";

export const movieApi = {
  getAllMovies: async (): Promise<Movie[]> => {
    const res = await fetch(`${API_BASE}/movies?limit=100`);
    if (!res.ok) throw new Error("Failed to fetch");
    return res.json();
  },

  searchMovies: async (query: string): Promise<Movie[]> => {
    const res = await fetch(`${API_BASE}/search`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query, top_n: 10 }),
    });
    return res.json();
  },

  getRecommendations: async (titles: string[]): Promise<Movie[]> => {
    const res = await fetch(`${API_BASE}/recommend`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ movie_titles: titles }),
    });
    return res.json();
  }
};