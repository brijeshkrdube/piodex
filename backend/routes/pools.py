from fastapi import APIRouter, HTTPException
from typing import List, Optional
from pydantic import BaseModel
from models import Pool, PoolCreate, PoolResponse, Token
from database import db
import logging
import uuid

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/pools", tags=["pools"])


# Request models for liquidity operations
class AddLiquidityRequest(BaseModel):
    pool_id: str
    wallet_address: str
    amount0: float
    amount1: float
    tx_hash: Optional[str] = None


class RemoveLiquidityRequest(BaseModel):
    pool_id: str
    wallet_address: str
    percent: float = 100.0  # Percentage to remove (0-100)
    tx_hash: Optional[str] = None


class RegisterPoolRequest(BaseModel):
    """Register an existing on-chain pool"""
    token0_address: str
    token1_address: str
    pair_address: str
    creator_address: Optional[str] = None
    fee: float = 0.3


async def get_pool_with_tokens(pool: dict) -> PoolResponse:
    """Helper to get pool with token details"""
    token0_addr = pool["token0_address"].lower()
    token1_addr = pool["token1_address"].lower()
    
    token0 = await db.tokens.find_one({"address": token0_addr})
    token1 = await db.tokens.find_one({"address": token1_addr})
    
    if not token0 or not token1:
        logger.warning(f"Tokens not found for pool: {token0_addr}, {token1_addr}")
        return None
    
    return PoolResponse(
        id=pool["id"],
        token0=Token(**token0),
        token1=Token(**token1),
        fee=pool["fee"],
        tvl=pool["tvl"],
        volume_24h=pool["volume_24h"],
        apr=pool["apr"],
        token0_reserve=pool["token0_reserve"],
        token1_reserve=pool["token1_reserve"],
        creator_address=pool.get("creator_address"),
        pair_address=pool.get("pair_address")
    )


@router.get("", response_model=List[PoolResponse])
async def get_pools():
    """Get all pools with token details"""
    try:
        pools = await db.pools.find().to_list(1000)
        result = []
        for pool in pools:
            pool_response = await get_pool_with_tokens(pool)
            if pool_response:
                result.append(pool_response)
        return result
    except Exception as e:
        logger.error(f"Error fetching pools: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch pools")


@router.get("/{pool_id}", response_model=PoolResponse)
async def get_pool(pool_id: str):
    """Get pool by ID"""
    try:
        pool = await db.pools.find_one({"id": pool_id})
        if not pool:
            raise HTTPException(status_code=404, detail="Pool not found")
        
        pool_response = await get_pool_with_tokens(pool)
        if not pool_response:
            raise HTTPException(status_code=404, detail="Pool tokens not found")
        return pool_response
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching pool: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch pool")


@router.post("", response_model=PoolResponse)
async def create_pool(pool_data: PoolCreate):
    """Create a new liquidity pool - only creator can add/remove liquidity later"""
    try:
        # Normalize addresses
        token0_addr = pool_data.token0_address.lower()
        token1_addr = pool_data.token1_address.lower()
        creator_addr = pool_data.creator_address.lower() if pool_data.creator_address else None
        pair_addr = pool_data.pair_address.lower() if pool_data.pair_address else None
        
        # Check if tokens exist
        token0 = await db.tokens.find_one({"address": token0_addr})
        token1 = await db.tokens.find_one({"address": token1_addr})
        
        if not token0 or not token1:
            raise HTTPException(status_code=400, detail="One or both tokens not found")
        
        # Check if pool already exists
        existing = await db.pools.find_one({
            "$or": [
                {"token0_address": token0_addr, "token1_address": token1_addr},
                {"token0_address": token1_addr, "token1_address": token0_addr}
            ]
        })
        if existing:
            raise HTTPException(status_code=400, detail="Pool already exists")
        
        # Create pool with zero liquidity - liquidity added separately
        pool = Pool(
            id=str(uuid.uuid4()),
            token0_address=token0_addr,
            token1_address=token1_addr,
            fee=pool_data.fee,
            tvl=0.0,
            volume_24h=0.0,
            apr=0.0,
            token0_reserve=0.0,
            token1_reserve=0.0,
            creator_address=creator_addr,
            pair_address=pair_addr
        )
        
        await db.pools.insert_one(pool.model_dump())
        
        logger.info(f"Created new pool {pool.id} for {token0['symbol']}/{token1['symbol']} by {creator_addr}")
        
        return PoolResponse(
            id=pool.id,
            token0=Token(**token0),
            token1=Token(**token1),
            fee=pool.fee,
            tvl=pool.tvl,
            volume_24h=pool.volume_24h,
            apr=pool.apr,
            token0_reserve=pool.token0_reserve,
            token1_reserve=pool.token1_reserve,
            creator_address=pool.creator_address,
            pair_address=pool.pair_address
        )
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error creating pool: {e}")
        raise HTTPException(status_code=500, detail="Failed to create pool")


@router.post("/add-liquidity")
async def add_liquidity(request: AddLiquidityRequest):
    """Add liquidity to a pool - ONLY pool creator can add liquidity"""
    try:
        pool = await db.pools.find_one({"id": request.pool_id})
        if not pool:
            raise HTTPException(status_code=404, detail="Pool not found")
        
        # Check if caller is the pool creator
        wallet_addr = request.wallet_address.lower()
        creator_addr = pool.get("creator_address", "").lower()
        
        if creator_addr and wallet_addr != creator_addr:
            raise HTTPException(
                status_code=403, 
                detail=f"Only the pool creator ({creator_addr[:10]}...) can add liquidity to this pool"
            )
        
        # Get token prices for TVL calculation
        token0 = await db.tokens.find_one({"address": pool["token0_address"]})
        token1 = await db.tokens.find_one({"address": pool["token1_address"]})
        
        token0_price = token0.get("price", 1) if token0 else 1
        token1_price = token1.get("price", 1) if token1 else 1
        
        # Update reserves
        new_reserve0 = pool["token0_reserve"] + request.amount0
        new_reserve1 = pool["token1_reserve"] + request.amount1
        new_tvl = (new_reserve0 * token0_price) + (new_reserve1 * token1_price)
        
        # Calculate APR based on TVL
        base_apr = pool["fee"] * 100
        new_apr = min(base_apr * (1 + (new_tvl / 1000000)), 100.0)
        
        # Update pool
        await db.pools.update_one(
            {"id": request.pool_id},
            {"$set": {
                "token0_reserve": new_reserve0,
                "token1_reserve": new_reserve1,
                "tvl": new_tvl,
                "apr": new_apr
            }}
        )
        
        logger.info(f"Added liquidity to pool {request.pool_id}: +{request.amount0}/{request.amount1}, TVL: ${new_tvl:.2f}")
        
        return {
            "success": True,
            "pool_id": request.pool_id,
            "token0_reserve": new_reserve0,
            "token1_reserve": new_reserve1,
            "tvl": new_tvl,
            "tx_hash": request.tx_hash
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error adding liquidity: {e}")
        raise HTTPException(status_code=500, detail="Failed to add liquidity")


@router.post("/remove-liquidity")
async def remove_liquidity(request: RemoveLiquidityRequest):
    """Remove liquidity from a pool - ONLY pool creator can remove liquidity
    Tokens will be transferred back to the creator's wallet
    """
    try:
        pool = await db.pools.find_one({"id": request.pool_id})
        if not pool:
            raise HTTPException(status_code=404, detail="Pool not found")
        
        # Check if caller is the pool creator
        wallet_addr = request.wallet_address.lower()
        creator_addr = pool.get("creator_address", "").lower()
        
        if creator_addr and wallet_addr != creator_addr:
            raise HTTPException(
                status_code=403, 
                detail=f"Only the pool creator ({creator_addr[:10]}...) can remove liquidity from this pool"
            )
        
        # Validate percent
        percent = min(max(request.percent, 0), 100) / 100.0
        
        # Calculate amounts to remove
        amount0_to_remove = pool["token0_reserve"] * percent
        amount1_to_remove = pool["token1_reserve"] * percent
        
        # Get token prices for TVL calculation
        token0 = await db.tokens.find_one({"address": pool["token0_address"]})
        token1 = await db.tokens.find_one({"address": pool["token1_address"]})
        
        token0_price = token0.get("price", 1) if token0 else 1
        token1_price = token1.get("price", 1) if token1 else 1
        
        # Update reserves
        new_reserve0 = pool["token0_reserve"] - amount0_to_remove
        new_reserve1 = pool["token1_reserve"] - amount1_to_remove
        new_tvl = (new_reserve0 * token0_price) + (new_reserve1 * token1_price)
        
        # Calculate APR based on TVL
        base_apr = pool["fee"] * 100
        new_apr = min(base_apr * (1 + (new_tvl / 1000000)), 100.0) if new_tvl > 0 else 0
        
        # Update pool
        await db.pools.update_one(
            {"id": request.pool_id},
            {"$set": {
                "token0_reserve": new_reserve0,
                "token1_reserve": new_reserve1,
                "tvl": new_tvl,
                "apr": new_apr
            }}
        )
        
        logger.info(f"Removed {percent*100}% liquidity from pool {request.pool_id}: -{amount0_to_remove:.4f}/{amount1_to_remove:.4f}")
        
        return {
            "success": True,
            "pool_id": request.pool_id,
            "amount0_removed": amount0_to_remove,
            "amount1_removed": amount1_to_remove,
            "token0_symbol": token0["symbol"] if token0 else "Token0",
            "token1_symbol": token1["symbol"] if token1 else "Token1",
            "new_token0_reserve": new_reserve0,
            "new_token1_reserve": new_reserve1,
            "new_tvl": new_tvl,
            "recipient": wallet_addr,  # Tokens transferred to this address
            "tx_hash": request.tx_hash
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error removing liquidity: {e}")
        raise HTTPException(status_code=500, detail="Failed to remove liquidity")
