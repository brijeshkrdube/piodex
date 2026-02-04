from fastapi import APIRouter, HTTPException
from typing import List
from models import Position, PositionCreate, PositionRemove, Transaction
from database import db
import logging
import uuid
from datetime import datetime
import math

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/positions", tags=["positions"])


@router.get("/{wallet_address}", response_model=List[Position])
async def get_positions(wallet_address: str):
    """Get user's liquidity positions"""
    try:
        positions = await db.positions.find({"wallet_address": wallet_address.lower()}).to_list(1000)
        return [Position(**pos) for pos in positions]
    except Exception as e:
        logger.error(f"Error fetching positions: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch positions")


@router.post("/add", response_model=Position)
async def add_liquidity(position_data: PositionCreate):
    """Add liquidity to a pool"""
    try:
        # Verify pool exists
        pool = await db.pools.find_one({"id": position_data.pool_id})
        if not pool:
            raise HTTPException(status_code=404, detail="Pool not found")
        
        # Calculate liquidity (simplified AMM formula)
        liquidity = math.sqrt(position_data.token0_amount * position_data.token1_amount)
        
        # Check if user already has a position in this pool
        existing = await db.positions.find_one({
            "pool_id": position_data.pool_id,
            "wallet_address": position_data.wallet_address.lower()
        })
        
        if existing:
            # Update existing position
            new_token0 = existing["token0_amount"] + position_data.token0_amount
            new_token1 = existing["token1_amount"] + position_data.token1_amount
            new_liquidity = math.sqrt(new_token0 * new_token1)
            
            await db.positions.update_one(
                {"id": existing["id"]},
                {"$set": {
                    "token0_amount": new_token0,
                    "token1_amount": new_token1,
                    "liquidity": new_liquidity,
                    "min_price": position_data.min_price,
                    "max_price": position_data.max_price,
                    "updated_at": datetime.utcnow()
                }}
            )
            position = await db.positions.find_one({"id": existing["id"]})
        else:
            # Create new position
            position = Position(
                id=str(uuid.uuid4()),
                pool_id=position_data.pool_id,
                wallet_address=position_data.wallet_address.lower(),
                token0_amount=position_data.token0_amount,
                token1_amount=position_data.token1_amount,
                liquidity=liquidity,
                min_price=position_data.min_price,
                max_price=position_data.max_price,
                in_range=True,
                unclaimed_fees=0.0
            )
            await db.positions.insert_one(position.model_dump())
            position = position.model_dump()
        
        # Update pool reserves and TVL
        token0 = await db.tokens.find_one({"address": pool["token0_address"]})
        token1 = await db.tokens.find_one({"address": pool["token1_address"]})
        
        new_reserve0 = pool["token0_reserve"] + position_data.token0_amount
        new_reserve1 = pool["token1_reserve"] + position_data.token1_amount
        
        token0_price = token0.get("price", 1) if token0 else 1
        token1_price = token1.get("price", 1) if token1 else 1
        new_tvl = (new_reserve0 * token0_price) + (new_reserve1 * token1_price)
        
        await db.pools.update_one(
            {"id": position_data.pool_id},
            {"$set": {
                "token0_reserve": new_reserve0,
                "token1_reserve": new_reserve1,
                "tvl": new_tvl
            }}
        )
        
        # Record transaction
        tx = Transaction(
            id=str(uuid.uuid4()),
            type="add",
            wallet_address=position_data.wallet_address.lower(),
            token0_address=pool["token0_address"],
            token1_address=pool["token1_address"],
            amount0=position_data.token0_amount,
            amount1=position_data.token1_amount,
            status="confirmed"
        )
        await db.transactions.insert_one(tx.model_dump())
        
        return Position(**position)
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error adding liquidity: {e}")
        raise HTTPException(status_code=500, detail="Failed to add liquidity")


@router.post("/remove", response_model=Position)
async def remove_liquidity(remove_data: PositionRemove):
    """Remove liquidity from a pool"""
    try:
        # Find position
        position = await db.positions.find_one({
            "id": remove_data.position_id,
            "wallet_address": remove_data.wallet_address.lower()
        })
        
        if not position:
            raise HTTPException(status_code=404, detail="Position not found")
        
        pool = await db.pools.find_one({"id": position["pool_id"]})
        if not pool:
            raise HTTPException(status_code=404, detail="Pool not found")
        
        # Calculate amounts to remove
        percent = min(remove_data.percent, 100) / 100
        remove_token0 = position["token0_amount"] * percent
        remove_token1 = position["token1_amount"] * percent
        
        if percent >= 1:
            # Remove entire position
            await db.positions.delete_one({"id": remove_data.position_id})
            position["token0_amount"] = 0
            position["token1_amount"] = 0
            position["liquidity"] = 0
        else:
            # Partial removal
            new_token0 = position["token0_amount"] - remove_token0
            new_token1 = position["token1_amount"] - remove_token1
            new_liquidity = math.sqrt(new_token0 * new_token1) if new_token0 > 0 and new_token1 > 0 else 0
            
            await db.positions.update_one(
                {"id": remove_data.position_id},
                {"$set": {
                    "token0_amount": new_token0,
                    "token1_amount": new_token1,
                    "liquidity": new_liquidity,
                    "updated_at": datetime.utcnow()
                }}
            )
            position = await db.positions.find_one({"id": remove_data.position_id})
        
        # Update pool reserves
        token0 = await db.tokens.find_one({"address": pool["token0_address"]})
        token1 = await db.tokens.find_one({"address": pool["token1_address"]})
        
        new_reserve0 = max(0, pool["token0_reserve"] - remove_token0)
        new_reserve1 = max(0, pool["token1_reserve"] - remove_token1)
        
        token0_price = token0.get("price", 1) if token0 else 1
        token1_price = token1.get("price", 1) if token1 else 1
        new_tvl = (new_reserve0 * token0_price) + (new_reserve1 * token1_price)
        
        await db.pools.update_one(
            {"id": position["pool_id"]},
            {"$set": {
                "token0_reserve": new_reserve0,
                "token1_reserve": new_reserve1,
                "tvl": new_tvl
            }}
        )
        
        # Record transaction
        tx = Transaction(
            id=str(uuid.uuid4()),
            type="remove",
            wallet_address=remove_data.wallet_address.lower(),
            token0_address=pool["token0_address"],
            token1_address=pool["token1_address"],
            amount0=remove_token0,
            amount1=remove_token1,
            status="confirmed"
        )
        await db.transactions.insert_one(tx.model_dump())
        
        return Position(**position) if position.get("liquidity", 0) > 0 else Position(
            id=remove_data.position_id,
            pool_id=pool["id"],
            wallet_address=remove_data.wallet_address.lower(),
            token0_amount=0,
            token1_amount=0,
            liquidity=0,
            min_price=0,
            max_price=0,
            in_range=False,
            unclaimed_fees=0
        )
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error removing liquidity: {e}")
        raise HTTPException(status_code=500, detail="Failed to remove liquidity")
