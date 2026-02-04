from database import db
import asyncio
import logging

logger = logging.getLogger(__name__)

# Initial token data for PIOGOLD network
INITIAL_TOKENS = [
    {
        "id": "pio",
        "symbol": "PIO",
        "name": "PIOGOLD",
        "address": "0x0000000000000000000000000000000000000000",
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
        "address": "0x1111111111111111111111111111111111111111",
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
        "address": "0x2222222222222222222222222222222222222222",
        "decimals": 6,
        "logo": "https://api.dicebear.com/7.x/shapes/svg?seed=usdt&backgroundColor=26A17B",
        "price": 1.00,
        "price_change_24h": 0.01,
        "is_native": False
    },
    {
        "id": "usdc",
        "symbol": "USDC",
        "name": "USD Coin",
        "address": "0x3333333333333333333333333333333333333333",
        "decimals": 6,
        "logo": "https://api.dicebear.com/7.x/shapes/svg?seed=usdc&backgroundColor=2775CA",
        "price": 1.00,
        "price_change_24h": 0.00,
        "is_native": False
    },
    {
        "id": "pgold",
        "symbol": "PGOLD",
        "name": "Pio Gold Token",
        "address": "0x4444444444444444444444444444444444444444",
        "decimals": 18,
        "logo": "https://api.dicebear.com/7.x/shapes/svg?seed=pgold&backgroundColor=B8860B",
        "price": 156.78,
        "price_change_24h": -1.23,
        "is_native": False
    },
    {
        "id": "peth",
        "symbol": "PETH",
        "name": "Pio Ethereum",
        "address": "0x5555555555555555555555555555555555555555",
        "decimals": 18,
        "logo": "https://api.dicebear.com/7.x/shapes/svg?seed=peth&backgroundColor=627EEA",
        "price": 2320.50,
        "price_change_24h": 0.58,
        "is_native": False
    },
    {
        "id": "pbtc",
        "symbol": "PBTC",
        "name": "Pio Bitcoin",
        "address": "0x6666666666666666666666666666666666666666",
        "decimals": 8,
        "logo": "https://api.dicebear.com/7.x/shapes/svg?seed=pbtc&backgroundColor=F7931A",
        "price": 67234.00,
        "price_change_24h": 1.85,
        "is_native": False
    },
    {
        "id": "pdai",
        "symbol": "PDAI",
        "name": "Pio DAI",
        "address": "0x7777777777777777777777777777777777777777",
        "decimals": 18,
        "logo": "https://api.dicebear.com/7.x/shapes/svg?seed=pdai&backgroundColor=F4B731",
        "price": 1.00,
        "price_change_24h": 0.06,
        "is_native": False
    }
]

# Initial pool data
INITIAL_POOLS = [
    {
        "id": "pool1",
        "token0_address": "0x0000000000000000000000000000000000000000",
        "token1_address": "0x2222222222222222222222222222222222222222",
        "fee": 0.3,
        "tvl": 2456789.45,
        "volume_24h": 345678.90,
        "apr": 24.5,
        "token0_reserve": 500000,
        "token1_reserve": 1225000
    },
    {
        "id": "pool2",
        "token0_address": "0x0000000000000000000000000000000000000000",
        "token1_address": "0x3333333333333333333333333333333333333333",
        "fee": 0.3,
        "tvl": 1876543.21,
        "volume_24h": 234567.80,
        "apr": 18.7,
        "token0_reserve": 380000,
        "token1_reserve": 931000
    },
    {
        "id": "pool3",
        "token0_address": "0x5555555555555555555555555555555555555555",
        "token1_address": "0x2222222222222222222222222222222222222222",
        "fee": 0.3,
        "tvl": 5678901.23,
        "volume_24h": 567890.12,
        "apr": 32.1,
        "token0_reserve": 1200,
        "token1_reserve": 2784600
    },
    {
        "id": "pool4",
        "token0_address": "0x6666666666666666666666666666666666666666",
        "token1_address": "0x2222222222222222222222222222222222222222",
        "fee": 0.05,
        "tvl": 8765432.10,
        "volume_24h": 876543.21,
        "apr": 15.8,
        "token0_reserve": 65,
        "token1_reserve": 4370210
    },
    {
        "id": "pool5",
        "token0_address": "0x4444444444444444444444444444444444444444",
        "token1_address": "0x0000000000000000000000000000000000000000",
        "fee": 1.0,
        "tvl": 987654.32,
        "volume_24h": 98765.43,
        "apr": 45.2,
        "token0_reserve": 3000,
        "token1_reserve": 192000
    }
]

# Initial stats
INITIAL_STATS = {
    "total_volume": 4800000000000,  # 4.8T
    "tvl": 2700000000,  # 2.7B
    "total_swappers": 120500000,  # 120.5M
    "volume_24h": 4100000000,  # 4.1B
    "transactions_24h": 15400,
    "active_pools": 5
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


if __name__ == "__main__":
    asyncio.run(seed_database())
