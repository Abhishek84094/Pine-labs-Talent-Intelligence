"""Groq LLM client initialization"""
from typing import Optional
from app.core.config import get_settings

settings = get_settings()


def get_groq_chat_model(temperature: float = 0.1):
    """
    Initialize a ChatGroq model instance.
    Raises ValueError if API key is not configured.
    """
    if not settings.groq_api_key:
        raise ValueError(
            "GROQ_API_KEY is not configured. Please set it in your .env file. "
            "Obtain a free API key at https://console.groq.com/"
        )

    try:
        from langchain_groq import ChatGroq
        return ChatGroq(
            api_key=settings.groq_api_key,
            model=settings.groq_model,
            temperature=temperature,
            timeout=settings.llm_timeout_seconds,
        )
    except ImportError:
        raise ImportError("langchain-groq is not installed. Run: pip install langchain-groq")


def is_groq_configured() -> bool:
    """Check if Groq API key is available"""
    return bool(settings.groq_api_key and settings.groq_api_key.strip())
