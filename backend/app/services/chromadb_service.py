import logging
import os
from typing import Any, Dict, List, Optional

logger = logging.getLogger(__name__)

_chroma_client = None
_collection = None


def get_chroma_client():
    global _chroma_client, _collection
    if _chroma_client is None:
        try:
            import chromadb

            from app.core.config import settings

            os.makedirs(settings.CHROMA_PERSIST_DIR, exist_ok=True)
            _chroma_client = chromadb.PersistentClient(path=settings.CHROMA_PERSIST_DIR)
            _collection = _chroma_client.get_or_create_collection(
                name="projects",
                metadata={"hnsw:space": "cosine"}
            )
            logger.info("ChromaDB persistent client initialized successfully.")
        except Exception as e:
            logger.warning(f"Could not initialize ChromaDB client: {e}")
            _chroma_client = None
            _collection = None
    return _chroma_client, _collection


class ChromaService:
    @staticmethod
    def is_available() -> bool:
        client, collection = get_chroma_client()
        return client is not None and collection is not None

    @staticmethod
    def health_check() -> Dict[str, Any]:
        try:
            client, collection = get_chroma_client()
            if client is None or collection is None:
                return {"status": "unavailable", "details": "ChromaDB client failed to load"}
            count = collection.count()
            return {"status": "connected", "details": f"ChromaDB active with {count} indexed project embeddings"}
        except Exception as e:
            return {"status": "unavailable", "details": str(e)}

    @staticmethod
    def index_project(
        project_id: str,
        name: str,
        description: str,
        readme_summary: Optional[str] = None,
        technologies: Optional[List[str]] = None,
    ) -> bool:
        try:
            _, collection = get_chroma_client()
            if collection is None:
                return False

            tech_str = ", ".join(technologies or [])
            combined_text = f"Project: {name}\nTechnologies: {tech_str}\nDescription: {description or ''}\nSummary: {readme_summary or ''}"

            collection.upsert(
                ids=[project_id],
                documents=[combined_text],
                metadatas=[{
                    "name": name,
                    "technologies": tech_str[:500],
                }]
            )
            return True
        except Exception as e:
            logger.error(f"Failed to index project {project_id} in ChromaDB: {e}")
            return False

    @staticmethod
    def delete_project(project_id: str) -> bool:
        try:
            _, collection = get_chroma_client()
            if collection is None:
                return False
            collection.delete(ids=[project_id])
            return True
        except Exception as e:
            logger.warning(f"Failed to delete project {project_id} from ChromaDB: {e}")
            return False

    @staticmethod
    def search(query: str, n_results: int = 5) -> List[str]:
        try:
            _, collection = get_chroma_client()
            if collection is None:
                return []
            if collection.count() == 0:
                return []
            results = collection.query(
                query_texts=[query],
                n_results=min(n_results, collection.count())
            )
            if results and results.get("ids") and len(results["ids"]) > 0:
                return results["ids"][0]
            return []
        except Exception as e:
            logger.warning(f"Error querying ChromaDB: {e}")
            return []
