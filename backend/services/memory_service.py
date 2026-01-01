"""
Memory Service - Qdrant Vector Database + Embeddings
Handles long-term AI memory storage and semantic search
"""

import logging
from typing import List, Dict, Any, Optional
from sentence_transformers import SentenceTransformer
from qdrant_client import QdrantClient
from qdrant_client.models import Distance, VectorParams, PointStruct
import uuid

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Constants
COLLECTION_NAME = "studypal"
VECTOR_SIZE = 384  # all-MiniLM-L6-v2 embedding size
DISTANCE_METRIC = Distance.COSINE


class MemoryService:
    """
    Manages vector embeddings and semantic search using Qdrant.
    Uses sentence-transformers for local embedding generation.
    """
    
    def __init__(self, qdrant_url: str = "http://localhost:6333"):
        """
        Initialize memory service with Qdrant client and embedding model.
        
        Args:
            qdrant_url: Qdrant server URL (default: localhost:6333)
        """
        try:
            self.client = QdrantClient(url=qdrant_url)
            logger.info(f"✓ Connected to Qdrant at {qdrant_url}")
            
            # Load embedding model (runs locally)
            logger.info("Loading sentence-transformers model...")
            self.encoder = SentenceTransformer('all-MiniLM-L6-v2')
            logger.info("✓ Embedding model loaded")
            
            # Ensure collection exists
            self.ensure_collection()
            
        except Exception as e:
            logger.error(f"Failed to initialize MemoryService: {e}")
            raise
    
    
    def ensure_collection(self):
        """
        Create 'studypal' collection if it doesn't exist.
        Auto-creates with proper vector configuration.
        """
        try:
            collections = self.client.get_collections().collections
            collection_names = [col.name for col in collections]
            
            if COLLECTION_NAME not in collection_names:
                logger.info(f"Creating collection '{COLLECTION_NAME}'...")
                self.client.create_collection(
                    collection_name=COLLECTION_NAME,
                    vectors_config=VectorParams(
                        size=VECTOR_SIZE,
                        distance=DISTANCE_METRIC
                    )
                )
                logger.info(f"✓ Collection '{COLLECTION_NAME}' created")
            else:
                logger.info(f"✓ Collection '{COLLECTION_NAME}' already exists")
                
        except Exception as e:
            logger.error(f"Failed to ensure collection: {e}")
            raise
    
    
    def add_text(self, text: str, metadata: Optional[Dict[str, Any]] = None) -> str:
        """
        Add text to memory with semantic embeddings.
        
        Args:
            text: Text content to store
            metadata: Optional metadata (course, topic, source, etc.)
        
        Returns:
            point_id: UUID of stored vector
        """
        try:
            if not text or not text.strip():
                raise ValueError("Text cannot be empty")
            
            # Generate embedding
            embedding = self.encoder.encode(text).tolist()
            
            # Create unique ID
            point_id = str(uuid.uuid4())
            
            # Prepare payload
            payload = {
                "text": text,
                "metadata": metadata or {}
            }
            
            # Store in Qdrant
            self.client.upsert(
                collection_name=COLLECTION_NAME,
                points=[
                    PointStruct(
                        id=point_id,
                        vector=embedding,
                        payload=payload
                    )
                ]
            )
            
            logger.info(f"✓ Stored text chunk: {point_id}")
            return point_id
            
        except Exception as e:
            logger.error(f"Failed to add text to memory: {e}")
            raise
    
    
    def add_texts_batch(self, texts: List[str], metadata: Optional[Dict[str, Any]] = None) -> List[str]:
        """
        Add multiple text chunks in batch for efficiency.
        
        Args:
            texts: List of text chunks
            metadata: Shared metadata for all chunks
        
        Returns:
            List of point IDs
        """
        try:
            if not texts:
                return []
            
            # Filter empty texts
            valid_texts = [t for t in texts if t and t.strip()]
            if not valid_texts:
                return []
            
            # Generate embeddings in batch
            embeddings = self.encoder.encode(valid_texts).tolist()
            
            # Create points
            points = []
            point_ids = []
            
            for text, embedding in zip(valid_texts, embeddings):
                point_id = str(uuid.uuid4())
                point_ids.append(point_id)
                
                points.append(
                    PointStruct(
                        id=point_id,
                        vector=embedding,
                        payload={
                            "text": text,
                            "metadata": metadata or {}
                        }
                    )
                )
            
            # Batch upsert
            self.client.upsert(
                collection_name=COLLECTION_NAME,
                points=points
            )
            
            logger.info(f"✓ Stored {len(point_ids)} text chunks in batch")
            return point_ids
            
        except Exception as e:
            logger.error(f"Failed to add texts in batch: {e}")
            raise
    
    
    def search(self, query: str, top_k: int = 5) -> List[Dict[str, Any]]:
        """
        Semantic search for relevant content.
        
        Args:
            query: Search query text
            top_k: Number of results to return (default: 5)
        
        Returns:
            List of matching results with text and metadata
        """
        try:
            if not query or not query.strip():
                raise ValueError("Query cannot be empty")
            
            # Generate query embedding
            query_embedding = self.encoder.encode(query).tolist()
            
            # Search Qdrant
            search_results = self.client.search(
                collection_name=COLLECTION_NAME,
                query_vector=query_embedding,
                limit=top_k
            )
            
            # Format results
            results = []
            for hit in search_results:
                results.append({
                    "text": hit.payload.get("text", ""),
                    "metadata": hit.payload.get("metadata", {}),
                    "score": hit.score,
                    "id": hit.id
                })
            
            logger.info(f"✓ Found {len(results)} relevant chunks for query")
            return results
            
        except Exception as e:
            logger.error(f"Failed to search memory: {e}")
            raise
    
    
    def get_collection_stats(self) -> Dict[str, Any]:
        """
        Get statistics about the memory collection.
        
        Returns:
            Dictionary with collection info
        """
        try:
            # Use count endpoint instead of get_collection to avoid Pydantic issues
            collection_info = self.client.count(collection_name=COLLECTION_NAME)
            return {
                "collection_name": COLLECTION_NAME,
                "vectors_count": collection_info.count if hasattr(collection_info, 'count') else 0,
                "points_count": collection_info.count if hasattr(collection_info, 'count') else 0,
                "status": "active"
            }
        except Exception as e:
            logger.error(f"Failed to get collection stats: {e}")
            return {
                "collection_name": COLLECTION_NAME,
                "error": "Could not retrieve stats",
                "status": "unknown"
            }


# Global instance
memory_service = None

def get_memory_service() -> MemoryService:
    """
    Get or create singleton MemoryService instance.
    """
    global memory_service
    if memory_service is None:
        memory_service = MemoryService()
    return memory_service
