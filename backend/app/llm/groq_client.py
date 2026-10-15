"""Groq LLM client initialization"""
from typing import Optional
from app.core.config import get_settings

settings = get_settings()


def get_groq_chat_model(temperature: float = 0.1, max_tokens: int = 8192):
    """
    Initialize a ChatGroq model instance.
    Raises ValueError if API key is not configured.
    """
    current_settings = get_settings()
    if not current_settings.groq_api_key or not current_settings.groq_api_key.strip():
        raise ValueError(
            "GROQ_API_KEY is not configured. Please set it in your .env file. "
            "Obtain a free API key at https://console.groq.com/"
        )

    try:
        from langchain_groq import ChatGroq
        return ChatGroq(
            api_key=current_settings.groq_api_key,
            model=current_settings.groq_model,
            temperature=temperature,
            max_tokens=max_tokens,
            timeout=current_settings.llm_timeout_seconds,
        )
    except ImportError:
        raise ImportError("langchain-groq is not installed. Run: pip install langchain-groq")


def is_groq_configured() -> bool:
    """Check if Groq API key is available"""
    current_settings = get_settings()
    return bool(current_settings.groq_api_key and current_settings.groq_api_key.strip())
