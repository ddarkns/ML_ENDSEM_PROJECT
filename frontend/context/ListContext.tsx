"use client";
import React, { createContext, useContext, useState, useEffect } from "react";
import { Movie } from "../types/movie";

interface ListContextType {
  myList: Movie[];
  addToList: (movie: Movie) => void;
  removeFromList: (title: string) => void;
}

const ListContext = createContext<ListContextType | undefined>(undefined);

export function ListProvider({ children }: { children: React.ReactNode }) {
  const [myList, setMyList] = useState<Movie[]>([]);

  useEffect(() => {
    const saved = localStorage.getItem("my-movie-list");
    if (saved) setMyList(JSON.parse(saved));
  }, []);

  const addToList = (movie: Movie) => {
    if (!myList.find((m) => m.Title === movie.Title)) {
      const updated = [...myList, movie];
      setMyList(updated);
      localStorage.setItem("my-movie-list", JSON.stringify(updated));
    }
  };

  const removeFromList = (title: string) => {
    const updated = myList.filter((m) => m.Title !== title);
    setMyList(updated);
    localStorage.setItem("my-movie-list", JSON.stringify(updated));
  };

  return (
    <ListContext.Provider value={{ myList, addToList, removeFromList }}>
      {children}
    </ListContext.Provider>
  );
}

export const useMyList = () => {
  const context = useContext(ListContext);
  if (!context) throw new Error("useMyList must be used within a ListProvider");
  return context;
};