from fastapi import APIRouter, HTTPException
from typing import List
from models import Transaction, TransactionResponse, Token
from database import db
import logging

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/transactions", tags=["transactions"])


@router.get("/{wallet_address}", response_model=List[TransactionResponse])
async def get_transactions(wallet_address: str, limit: int = 50):
    """Get user's transaction history"""
    try:
        transactions = await db.transactions.find(
            {"wallet_address": wallet_address.lower()}
        ).sort("timestamp", -1).limit(limit).to_list(limit)
        
        result = []
        for tx in transactions:
            token0 = await db.tokens.find_one({"address": tx["token0_address"]})
            token1 = await db.tokens.find_one({"address": tx["token1_address"]})
            
            if token0 and token1:
                result.append(TransactionResponse(
                    id=tx["id"],
                    type=tx["type"],
                    wallet_address=tx["wallet_address"],
                    token0=Token(**token0),
                    token1=Token(**token1),
                    amount0=tx["amount0"],
                    amount1=tx["amount1"],
                    tx_hash=tx.get("tx_hash"),
                    timestamp=tx["timestamp"],
                    status=tx["status"]
                ))
        
        return result
    except Exception as e:
        logger.error(f"Error fetching transactions: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch transactions")


@router.get("", response_model=List[TransactionResponse])
async def get_all_transactions(limit: int = 100):
    """Get all recent transactions"""
    try:
        transactions = await db.transactions.find().sort("timestamp", -1).limit(limit).to_list(limit)
        
        result = []
        for tx in transactions:
            token0 = await db.tokens.find_one({"address": tx["token0_address"]})
            token1 = await db.tokens.find_one({"address": tx["token1_address"]})
            
            if token0 and token1:
                result.append(TransactionResponse(
                    id=tx["id"],
                    type=tx["type"],
                    wallet_address=tx["wallet_address"],
                    token0=Token(**token0),
                    token1=Token(**token1),
                    amount0=tx["amount0"],
                    amount1=tx["amount1"],
                    tx_hash=tx.get("tx_hash"),
                    timestamp=tx["timestamp"],
                    status=tx["status"]
                ))
        
        return result
    except Exception as e:
        logger.error(f"Error fetching transactions: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch transactions")
