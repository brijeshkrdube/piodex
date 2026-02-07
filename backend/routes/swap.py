from fastapi import APIRouter, HTTPException
from typing import List, Optional
from pydantic import BaseModel
from models import SwapQuoteRequest, SwapQuoteResponse, SwapExecuteRequest, Transaction
from database import db
import logging
import uuid
from datetime import datetime, timezone

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/swap", tags=["swap"])


class TradeHistoryItem(BaseModel):
    id: str
    type: str  # 'swap', 'add_liquidity', 'remove_liquidity'
    token0_symbol: str
    token1_symbol: str
    token0_amount: float
    token1_amount: float
    tx_hash: Optional[str] = None
    wallet_address: str
    timestamp: datetime
    price: float  # token0 price in terms of token1


@router.get("/trades/{token0_address}/{token1_address}", response_model=List[TradeHistoryItem])
async def get_trade_history(token0_address: str, token1_address: str, limit: int = 50):
    """Get real trade history for a token pair"""
    try:
        token0_addr = token0_address.lower()
        token1_addr = token1_address.lower()
        
        # Get token info for symbols
        token0 = await db.tokens.find_one({"address": token0_addr})
        token1 = await db.tokens.find_one({"address": token1_addr})
        
        if not token0 or not token1:
            return []
        
        # Find transactions for this pair (both directions)
        transactions = await db.transactions.find({
            "$or": [
                {"token0_address": token0_addr, "token1_address": token1_addr},
                {"token0_address": token1_addr, "token1_address": token0_addr}
            ]
        }).sort("timestamp", -1).limit(limit).to_list(limit)
        
        trades = []
        for tx in transactions:
            # Determine if this is token0->token1 or token1->token0
            if tx["token0_address"] == token0_addr:
                price = tx["amount1"] / tx["amount0"] if tx["amount0"] > 0 else 0
                trades.append(TradeHistoryItem(
                    id=tx["id"],
                    type=tx["type"],
                    token0_symbol=token0["symbol"],
                    token1_symbol=token1["symbol"],
                    token0_amount=tx["amount0"],
                    token1_amount=tx["amount1"],
                    tx_hash=tx.get("tx_hash"),
                    wallet_address=tx["wallet_address"],
                    timestamp=tx.get("timestamp", datetime.now(timezone.utc)),
                    price=price
                ))
            else:
                # Swap direction - token1 was sold for token0
                price = tx["amount0"] / tx["amount1"] if tx["amount1"] > 0 else 0
                trades.append(TradeHistoryItem(
                    id=tx["id"],
                    type=tx["type"],
                    token0_symbol=token0["symbol"],
                    token1_symbol=token1["symbol"],
                    token0_amount=tx["amount1"],  # Swapped
                    token1_amount=tx["amount0"],  # Swapped
                    tx_hash=tx.get("tx_hash"),
                    wallet_address=tx["wallet_address"],
                    timestamp=tx.get("timestamp", datetime.now(timezone.utc)),
                    price=1/price if price > 0 else 0
                ))
        
        return trades
    except Exception as e:
        logger.error(f"Error fetching trade history: {e}")
        return []


@router.get("/price-history/{token0_address}/{token1_address}")
async def get_price_history(token0_address: str, token1_address: str, days: int = 30):
    """Get price history for charting - derived from actual trades"""
    try:
        token0_addr = token0_address.lower()
        token1_addr = token1_address.lower()
        
        # Get token info
        token0 = await db.tokens.find_one({"address": token0_addr})
        token1 = await db.tokens.find_one({"address": token1_addr})
        
        if not token0 or not token1:
            return {"candles": [], "basePrice": 1}
        
        # Get current price ratio
        base_price = token0.get("price", 1) / token1.get("price", 1) if token1.get("price", 1) > 0 else 1
        
        # Find transactions for this pair
        transactions = await db.transactions.find({
            "$or": [
                {"token0_address": token0_addr, "token1_address": token1_addr},
                {"token0_address": token1_addr, "token1_address": token0_addr}
            ]
        }).sort("timestamp", -1).limit(500).to_list(500)
        
        if not transactions:
            # No real trades yet - return base price info
            return {
                "candles": [],
                "basePrice": base_price,
                "token0Symbol": token0["symbol"],
                "token1Symbol": token1["symbol"],
                "hasRealData": False
            }
        
        # Group trades by day and create OHLC candles
        from collections import defaultdict
        daily_prices = defaultdict(list)
        
        for tx in transactions:
            if tx["token0_address"] == token0_addr:
                price = tx["amount1"] / tx["amount0"] if tx["amount0"] > 0 else base_price
            else:
                price = tx["amount0"] / tx["amount1"] if tx["amount1"] > 0 else base_price
            
            timestamp = tx.get("timestamp", datetime.now(timezone.utc))
            day_key = timestamp.strftime("%Y-%m-%d")
            daily_prices[day_key].append(price)
        
        # Create candles
        candles = []
        for day, prices in sorted(daily_prices.items()):
            candles.append({
                "time": day,
                "open": prices[0],
                "high": max(prices),
                "low": min(prices),
                "close": prices[-1],
                "volume": len(prices)
            })
        
        return {
            "candles": candles,
            "basePrice": base_price,
            "token0Symbol": token0["symbol"],
            "token1Symbol": token1["symbol"],
            "hasRealData": len(candles) > 0
        }
    except Exception as e:
        logger.error(f"Error fetching price history: {e}")
        return {"candles": [], "basePrice": 1, "hasRealData": False}


@router.post("/quote", response_model=SwapQuoteResponse)
async def get_swap_quote(quote_request: SwapQuoteRequest):
    """Get a swap quote"""
    try:
        token_in_addr = quote_request.token_in.lower()
        token_out_addr = quote_request.token_out.lower()
        
        # Get tokens
        token_in = await db.tokens.find_one({"address": token_in_addr})
        token_out = await db.tokens.find_one({"address": token_out_addr})
        
        if not token_in or not token_out:
            raise HTTPException(status_code=404, detail="One or both tokens not found")
        
        # Find pool for this pair
        pool = await db.pools.find_one({
            "$or": [
                {"token0_address": token_in_addr, "token1_address": token_out_addr},
                {"token0_address": token_out_addr, "token1_address": token_in_addr}
            ]
        })
        
        # Calculate exchange rate based on token prices
        token_in_price = token_in.get("price", 1)
        token_out_price = token_out.get("price", 1)
        
        if token_out_price == 0:
            raise HTTPException(status_code=400, detail="Invalid token price")
        
        exchange_rate = token_in_price / token_out_price
        amount_out = quote_request.amount_in * exchange_rate
        
        # Calculate fee (use pool fee if exists, else default 0.3%)
        fee_percent = pool["fee"] if pool else 0.3
        fee = amount_out * (fee_percent / 100)
        amount_out_after_fee = amount_out - fee
        
        # Calculate price impact (simplified)
        price_impact = 0.1 if quote_request.amount_in < 1000 else 0.5 if quote_request.amount_in < 10000 else 1.0
        
        # Minimum received with default 0.5% slippage
        minimum_received = amount_out_after_fee * 0.995
        
        route = [pool["id"]] if pool else []
        
        return SwapQuoteResponse(
            amount_out=round(amount_out_after_fee, 6),
            price_impact=round(price_impact, 2),
            route=route,
            exchange_rate=round(exchange_rate, 6),
            minimum_received=round(minimum_received, 6),
            fee=round(fee, 6)
        )
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting swap quote: {e}")
        raise HTTPException(status_code=500, detail="Failed to get swap quote")


@router.post("/execute", response_model=Transaction)
async def execute_swap(swap_request: SwapExecuteRequest):
    """Execute a swap (record transaction)"""
    try:
        token_in_addr = swap_request.token_in.lower()
        token_out_addr = swap_request.token_out.lower()
        
        # Verify tokens exist
        token_in = await db.tokens.find_one({"address": token_in_addr})
        token_out = await db.tokens.find_one({"address": token_out_addr})
        
        if not token_in or not token_out:
            raise HTTPException(status_code=404, detail="One or both tokens not found")
        
        # Find pool and update volume
        pool = await db.pools.find_one({
            "$or": [
                {"token0_address": token_in_addr, "token1_address": token_out_addr},
                {"token0_address": token_out_addr, "token1_address": token_in_addr}
            ]
        })
        
        if pool:
            # Update pool volume
            token_in_price = token_in.get("price", 1)
            volume_usd = swap_request.amount_in * token_in_price
            await db.pools.update_one(
                {"id": pool["id"]},
                {"$inc": {"volume_24h": volume_usd}}
            )
        
        # Create transaction record with timestamp
        tx = Transaction(
            id=str(uuid.uuid4()),
            type="swap",
            wallet_address=swap_request.wallet_address.lower(),
            token0_address=token_in_addr,
            token1_address=token_out_addr,
            amount0=swap_request.amount_in,
            amount1=swap_request.amount_out,
            tx_hash=swap_request.tx_hash,
            status="confirmed"
        )
        
        tx_dict = tx.model_dump()
        tx_dict["timestamp"] = datetime.now(timezone.utc)
        
        await db.transactions.insert_one(tx_dict)
        
        # Update stats
        await db.stats.update_one(
            {},
            {
                "$inc": {
                    "total_volume": swap_request.amount_in * token_in.get("price", 1),
                    "volume_24h": swap_request.amount_in * token_in.get("price", 1),
                    "transactions_24h": 1
                }
            },
            upsert=True
        )
        
        logger.info(f"Swap executed: {token_in['symbol']} -> {token_out['symbol']}, amount: {swap_request.amount_in}, tx: {swap_request.tx_hash}")
        
        return tx
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error executing swap: {e}")
        raise HTTPException(status_code=500, detail="Failed to execute swap")
