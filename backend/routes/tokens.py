from fastapi import APIRouter, HTTPException
from typing import List
from models import Token, TokenCreate
from database import db
import logging

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/tokens", tags=["tokens"])


@router.get("", response_model=List[Token])
async def get_tokens():
    """Get all tokens"""
    try:
        tokens = await db.tokens.find().to_list(1000)
        return [Token(**token) for token in tokens]
    except Exception as e:
        logger.error(f"Error fetching tokens: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch tokens")


@router.get("/{address}", response_model=Token)
async def get_token(address: str):
    """Get token by address"""
    try:
        token = await db.tokens.find_one({"address": address.lower()})
        if not token:
            raise HTTPException(status_code=404, detail="Token not found")
        return Token(**token)
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching token: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch token")


@router.post("", response_model=Token)
async def create_token(token_data: TokenCreate):
    """Add a new token"""
    try:
        # Check if token already exists
        existing = await db.tokens.find_one({"address": token_data.address.lower()})
        if existing:
            raise HTTPException(status_code=400, detail="Token already exists")
        
        token = Token(
            **token_data.model_dump(),
            address=token_data.address.lower()
        )
        await db.tokens.insert_one(token.model_dump())
        return token
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error creating token: {e}")
        raise HTTPException(status_code=500, detail="Failed to create token")
