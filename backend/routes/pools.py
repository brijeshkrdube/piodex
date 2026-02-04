from fastapi import APIRouter, HTTPException
from typing import List
from models import Pool, PoolCreate, PoolResponse, Token
from database import db
import logging
import uuid

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/pools", tags=["pools"])


async def get_pool_with_tokens(pool: dict) -> PoolResponse:
    """Helper to get pool with token details"""
    token0 = await db.tokens.find_one({"address": pool["token0_address"]})
    token1 = await db.tokens.find_one({"address": pool["token1_address"]})
    
    if not token0 or not token1:
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
        token1_reserve=pool["token1_reserve"]
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
    """Create a new liquidity pool with optional initial liquidity"""
    try:
        # Normalize addresses
        token0_addr = pool_data.token0_address.lower()
        token1_addr = pool_data.token1_address.lower()
        
        # Check if tokens exist
        token0 = await db.tokens.find_one({"address": token0_addr})
        token1 = await db.tokens.find_one({"address": token1_addr})
        
        if not token0 or not token1:
            raise HTTPException(status_code=400, detail="One or both tokens not found")
        
        # Check if pool already exists
        existing = await db.pools.find_one({
            "$or": [
                {"token0_address": token0_addr, "token1_address": token1_addr, "fee": pool_data.fee},
                {"token0_address": token1_addr, "token1_address": token0_addr, "fee": pool_data.fee}
            ]
        })
        if existing:
            raise HTTPException(status_code=400, detail="Pool already exists")
        
        # Calculate initial TVL from liquidity amounts
        amount0 = pool_data.amount0 or 0.0
        amount1 = pool_data.amount1 or 0.0
        token0_price = token0.get("price", 1)
        token1_price = token1.get("price", 1)
        initial_tvl = (amount0 * token0_price) + (amount1 * token1_price)
        
        # Calculate estimated APR based on fee tier and liquidity
        base_apr = pool_data.fee * 100  # Higher fee = higher potential APR
        estimated_apr = base_apr * (1 + (initial_tvl / 1000000)) if initial_tvl > 0 else base_apr
        
        pool = Pool(
            id=str(uuid.uuid4()),
            token0_address=token0_addr,
            token1_address=token1_addr,
            fee=pool_data.fee,
            tvl=initial_tvl,
            volume_24h=0.0,
            apr=min(estimated_apr, 100.0),  # Cap APR at 100%
            token0_reserve=amount0,
            token1_reserve=amount1
        )
        
        await db.pools.insert_one(pool.model_dump())
        
        logger.info(f"Created new pool {pool.id} for {token0['symbol']}/{token1['symbol']} with TVL ${initial_tvl:.2f}")
        
        return PoolResponse(
            id=pool.id,
            token0=Token(**token0),
            token1=Token(**token1),
            fee=pool.fee,
            tvl=pool.tvl,
            volume_24h=pool.volume_24h,
            apr=pool.apr,
            token0_reserve=pool.token0_reserve,
            token1_reserve=pool.token1_reserve
        )
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error creating pool: {e}")
        raise HTTPException(status_code=500, detail="Failed to create pool")
