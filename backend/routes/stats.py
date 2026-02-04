from fastapi import APIRouter, HTTPException
from models import ProtocolStats
from database import db
import logging
from datetime import datetime

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/stats", tags=["stats"])


@router.get("", response_model=ProtocolStats)
async def get_stats():
    """Get protocol statistics"""
    try:
        # Get or create stats
        stats = await db.stats.find_one({})
        
        if not stats:
            # Calculate stats from data
            pools = await db.pools.find().to_list(1000)
            transactions = await db.transactions.find().to_list(10000)
            
            total_tvl = sum(pool.get("tvl", 0) for pool in pools)
            total_volume = sum(pool.get("volume_24h", 0) for pool in pools)
            unique_wallets = set(tx.get("wallet_address") for tx in transactions)
            
            stats = ProtocolStats(
                total_volume=total_volume * 10,  # Simulated historical volume
                tvl=total_tvl,
                total_swappers=len(unique_wallets),
                volume_24h=total_volume,
                transactions_24h=len(transactions),
                active_pools=len(pools)
            )
            
            await db.stats.insert_one(stats.model_dump())
        else:
            # Update pool count
            pools_count = await db.pools.count_documents({})
            stats["active_pools"] = pools_count
            stats = ProtocolStats(**stats)
        
        return stats
    except Exception as e:
        logger.error(f"Error fetching stats: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch stats")


@router.post("/refresh")
async def refresh_stats():
    """Refresh protocol statistics"""
    try:
        pools = await db.pools.find().to_list(1000)
        transactions = await db.transactions.find().to_list(10000)
        
        total_tvl = sum(pool.get("tvl", 0) for pool in pools)
        total_volume_24h = sum(pool.get("volume_24h", 0) for pool in pools)
        unique_wallets = set(tx.get("wallet_address") for tx in transactions)
        
        # Calculate total historical volume from transactions
        total_volume = 0
        for tx in transactions:
            if tx.get("type") == "swap":
                token = await db.tokens.find_one({"address": tx.get("token0_address")})
                if token:
                    total_volume += tx.get("amount0", 0) * token.get("price", 1)
        
        stats = ProtocolStats(
            total_volume=total_volume if total_volume > 0 else total_volume_24h * 30,
            tvl=total_tvl,
            total_swappers=len(unique_wallets),
            volume_24h=total_volume_24h,
            transactions_24h=len([tx for tx in transactions]),
            active_pools=len(pools),
            updated_at=datetime.utcnow()
        )
        
        await db.stats.delete_many({})
        await db.stats.insert_one(stats.model_dump())
        
        return {"message": "Stats refreshed", "stats": stats}
    except Exception as e:
        logger.error(f"Error refreshing stats: {e}")
        raise HTTPException(status_code=500, detail="Failed to refresh stats")
