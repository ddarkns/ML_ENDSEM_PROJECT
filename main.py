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

# --- HELPER LOGIC ---

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
    return df.head(limit).to_dict(orient="records")

@app.get("/search")
async def dynamic_search(query: str = Query(..., min_length=1)):
    """
    Scans all 9,000+ movies for a partial match.
    This will find 'Home Bound' even if you just type 'Home'.
    """
    if not query:
        return []
    
    # Partial string match across the whole dataset
    mask = df['Title_Str'].str.contains(query, case=False, na=False)
    results = df[mask].head(10)
    return results.to_dict(orient="records")

@app.post("/recommend")
def recommend(payload: WatchHistory):
    """
    AI Recommendation using Hybrid K-Means + ChromaDB.
    Accepts POST with movie_titles list.
    """
    if not payload.movie_titles:
        return []

    all_recs = []
    
    for title in payload.movie_titles:
        # Find the specific movie info
        row = df[df['Title_Str'] == title]
        if row.empty:
            continue
            
        target_overview = str(row.iloc[0]['Overview'])
        
        # 1. AI Logic: Predict Cluster
        query_emb = hf_embeddings.embed_query(target_overview)
        query_vec = np.array([query_emb], dtype=kmeans_final.cluster_centers_.dtype)
        cluster_id = int(kmeans_final.predict(query_vec)[0])

        # 2. AI Logic: Vector Search in predicted cluster
        results = vectorstore.similarity_search_with_score(
            query=target_overview,
            k=8, # Get 8 to filter out the seed movie
            filter={"cluster": cluster_id}
        )

        for doc, dist_score in results:
            t = doc.metadata.get('title')
            if t == title: 
                continue # Skip the clicked movie
            
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
            k=5 # Changed to 5 so it returns the exact limit expected by the UI
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