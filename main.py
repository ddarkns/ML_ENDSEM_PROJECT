import os
import joblib
import numpy as np
import pandas as pd
from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List

# LangChain / Chroma / Embedding Imports
from langchain_huggingface import HuggingFaceEmbeddings
from langchain_chroma import Chroma
import chromadb

app = FastAPI(title="AI-FLIX Final Recommender")

# Enable CORS for Next.js
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- CONFIGURATION ---
MODEL_PATH = "models/kmeans_movie_model.joblib"
DB_PATH = "./final_chroma_db"
DATA_PATH = "data/mymoviedb.xlsx"

print("🚀 Initializing AI-FLIX Engine...")

# 1. Load Data
df = pd.read_excel(DATA_PATH)
df = df.drop_duplicates(subset=['Title'], keep='first').reset_index(drop=True)
df['Overview'] = df['Overview'].fillna('').astype(str)
# Ensure Title is string for searching
df['Title_Str'] = df['Title'].astype(str)

# 2. Load K-Means
kmeans_final = joblib.load(MODEL_PATH)

# 3. Setup Embeddings
hf_embeddings = HuggingFaceEmbeddings(model_name='all-MiniLM-L6-v2')

# 4. Connect to ChromaDB
chroma_client = chromadb.PersistentClient(path=DB_PATH)
vectorstore = Chroma(
    client=chroma_client,
    embedding_function=hf_embeddings,
    collection_name="langchain" 
)

print(f"✅ Loaded {len(df)} movies. System Online.")

# --- DATA MODELS ---

class WatchHistory(BaseModel):
    movie_titles: List[str]

# Added model for Description-based recommendations
class DescriptionPayload(BaseModel):
    description: str

def format_movie_data(title: str, cluster_id: int = -1, score: float = 0.0):
    """Merges Chroma results with full Excel metadata."""
    row = df[df['Title_Str'] == title]
    if row.empty:
        return None
    
    movie = row.iloc[0]
    return {
        "Title": str(movie.get('Title', 'Unknown')),
        "Overview": str(movie.get('Overview', '')),
        "Genre": str(movie.get('Genre', 'General')),
        "Poster_Url": str(movie.get('Poster_Url', '')),
        "Vote_Average": float(movie.get('Vote_Average', 0)),
        "Release_Date": str(movie.get('Release_Date', '')),
        "similarity_score": float(score),
        "cluster": int(cluster_id)
    }

# --- ENDPOINTS ---

@app.get("/movies")
def list_movies(limit: int = 40):
    """Initial load for the UI grid.""" 
            filter={"cluster": cluster_id}
        )

        for doc, dist_score in results:
            t = doc.metadata.get('title')
            if t == title: continue # Skip the clicked movie
            
            # Distance to Similarity conversion
            sim_val = max(0, 1 - (dist_score / 2)) 
            
            movie_obj = format_movie_data(t, cluster_id, sim_val)
            if movie_obj:
                all_recs.append(movie_obj)

    # De-duplicate results
    unique_recs = {res['Title']: res for res in all_recs}.values()
    return list(unique_recs)[:]

@app.post("/recommend-by-description")
def recommend_by_description(payload: DescriptionPayload):
    """
    Converts user description text into a vector embedding,
    queries ChromaDB for semantics, and returns the top 5 matches.
    """
    if not payload.description.strip():
        return []
    
    try:
        # Directly run similarity search over the entire collection using the vector store
        results = vectorstore.similarity_search_with_score(
            query=payload.description,
            k=10
        )
        
        description_recs = []
        for doc, dist_score in results:
            title = doc.metadata.get('title')
            sim_val = max(0, 1 - (dist_score / 2))
            
            # Retrieve complete metadata from DataFrame
            movie_obj = format_movie_data(title, score=sim_val)
            if movie_obj:
                description_recs.append(movie_obj)
                
        return description_recs
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    
if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)