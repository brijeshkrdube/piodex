from database import db
import asyncio
import logging

logger = logging.getLogger(__name__)

# Real contract addresses on PIOGOLD Mainnet
CONTRACT_ADDRESSES = {
    "WPIO": "0x9Da12b8CF8B94f2E0eedD9841E268631aF03aDb1",
    "FACTORY": "0x3EE7ad0FD1C17A4d62a1a214d88dcf2C04ae43E5",
    "ROUTER": "0xE2E593258a0012Af79221C518Fa058eB4fF3700A",
    "USDT": "0x75C681D7d00b6cDa3778535Bba87E433cA369C96"
}

# Initial token data for PIOGOLD network with REAL addresses
INITIAL_TOKENS = [
    {
        "id": "pio",
        "symbol": "PIO",
        "name": "PIOGOLD",
        "address": "0x0000000000000000000000000000000000000000",  # Native token
        "decimals": 18,
        "logo": "https://api.dicebear.com/7.x/shapes/svg?seed=pio&backgroundColor=FFD700",
        "price": 2.45,
        "price_change_24h": 3.24,
        "is_native": True
    },
    {
        "id": "wpio",
        "symbol": "WPIO",
        "name": "Wrapped PIO",
        "address": "0x9da12b8cf8b94f2e0eedd9841e268631af03adb1",  # Real WPIO address (lowercase)
        "decimals": 18,
        "logo": "https://api.dicebear.com/7.x/shapes/svg?seed=wpio&backgroundColor=DAA520",
        "price": 2.45,
        "price_change_24h": 3.24,
        "is_native": False
    },
    {
        "id": "usdt",
        "symbol": "USDT",
        "name": "Tether USD",
        "address": "0x75c681d7d00b6cda3778535bba87e433ca369c96",  # Real USDT address (lowercase)
        "decimals": 18,
        "logo": "https://api.dicebear.com/7.x/shapes/svg?seed=usdt&backgroundColor=26A17B",
        "price": 1.00,
        "price_change_24h": 0.01,
        "is_native": False
    }
]

# Initial pool data - WPIO/USDT pool
INITIAL_POOLS = [
    {
        "id": "pool1",
        "token0_address": "0x9da12b8cf8b94f2e0eedd9841e268631af03adb1",  # WPIO
        "token1_address": "0x75c681d7d00b6cda3778535bba87e433ca369c96",  # USDT
        "fee": 0.3,
        "tvl": 0,
        "volume_24h": 0,
        "apr": 0,
        "token0_reserve": 0,
        "token1_reserve": 0
    }
]

# Initial stats
INITIAL_STATS = {
    "total_volume": 0,
    "tvl": 0,
    "total_swappers": 0,
    "volume_24h": 0,
    "transactions_24h": 0,
    "active_pools": 1
}


async def seed_database():
    """Seed the database with initial data"""
    try:
        # Check if already seeded
        existing_tokens = await db.tokens.count_documents({})
        if existing_tokens > 0:
            logger.info("Database already seeded, skipping...")
            return
        
        logger.info("Seeding database with initial data...")
        
        # Insert tokens
        await db.tokens.insert_many(INITIAL_TOKENS)
        logger.info(f"Inserted {len(INITIAL_TOKENS)} tokens")
        
        # Insert pools
        await db.pools.insert_many(INITIAL_POOLS)
        logger.info(f"Inserted {len(INITIAL_POOLS)} pools")
        
        # Insert stats
        await db.stats.insert_one(INITIAL_STATS)
        logger.info("Inserted initial stats")
        
        # Create indexes
        await db.tokens.create_index("address", unique=True)
        await db.tokens.create_index("symbol")
        await db.pools.create_index("id", unique=True)
        await db.pools.create_index([("token0_address", 1), ("token1_address", 1)])
        await db.positions.create_index("wallet_address")
        await db.positions.create_index("pool_id")
        await db.transactions.create_index("wallet_address")
        await db.transactions.create_index("timestamp")
        
        logger.info("Database seeding complete!")
        
    except Exception as e:
        logger.error(f"Error seeding database: {e}")
        raise


async def reset_and_seed():
    """Drop existing data and reseed with real addresses"""
    try:
        logger.info("Resetting database with real contract addresses...")
        
        # Drop existing collections
        await db.tokens.drop()
        await db.pools.drop()
        await db.stats.drop()
        
        # Insert new data
        await db.tokens.insert_many(INITIAL_TOKENS)
        logger.info(f"Inserted {len(INITIAL_TOKENS)} tokens with real addresses")
        
        await db.pools.insert_many(INITIAL_POOLS)
        logger.info(f"Inserted {len(INITIAL_POOLS)} pools")
        
        await db.stats.insert_one(INITIAL_STATS)
        logger.info("Inserted initial stats")
        
        # Recreate indexes
        await db.tokens.create_index("address", unique=True)
        await db.tokens.create_index("symbol")
        await db.pools.create_index("id", unique=True)
        await db.pools.create_index([("token0_address", 1), ("token1_address", 1)])
        
        logger.info("Database reset complete with real contract addresses!")
        
    except Exception as e:
        logger.error(f"Error resetting database: {e}")
        raise


if __name__ == "__main__":
    import sys
    if len(sys.argv) > 1 and sys.argv[1] == "--reset":
        asyncio.run(reset_and_seed())
    else:
        asyncio.run(seed_database())
