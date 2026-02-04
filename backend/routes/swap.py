from fastapi import APIRouter, HTTPException
from models import SwapQuoteRequest, SwapQuoteResponse, SwapExecuteRequest, Transaction
from database import db
import logging
import uuid

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/swap", tags=["swap"])


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
        
        # Create transaction record
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
        
        await db.transactions.insert_one(tx.model_dump())
        
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
        
        return tx
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error executing swap: {e}")
        raise HTTPException(status_code=500, detail="Failed to execute swap")
