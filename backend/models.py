from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import datetime
import uuid


# Token Models
class TokenBase(BaseModel):
    symbol: str
    name: str
    address: str
    decimals: int = 18
    logo: Optional[str] = None
    is_native: bool = False


class TokenCreate(TokenBase):
    pass


class Token(TokenBase):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    price: float = 0.0
    price_change_24h: float = 0.0
    created_at: datetime = Field(default_factory=datetime.utcnow)

    class Config:
        from_attributes = True


# Pool Models
class PoolBase(BaseModel):
    token0_address: str
    token1_address: str
    fee: float = 0.3


class PoolCreate(PoolBase):
    amount0: Optional[float] = 0.0
    amount1: Optional[float] = 0.0
    creator_address: Optional[str] = None  # Wallet address of pool creator
    pair_address: Optional[str] = None  # On-chain pair contract address


class Pool(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    token0_address: str
    token1_address: str
    fee: float = 0.3
    tvl: float = 0.0
    volume_24h: float = 0.0
    apr: float = 0.0
    token0_reserve: float = 0.0
    token1_reserve: float = 0.0
    creator_address: Optional[str] = None  # Only creator can add/remove liquidity
    pair_address: Optional[str] = None  # On-chain pair contract address
    created_at: datetime = Field(default_factory=datetime.utcnow)

    class Config:
        from_attributes = True


class PoolResponse(BaseModel):
    id: str
    token0: Token
    token1: Token
    fee: float
    tvl: float
    volume_24h: float
    apr: float
    token0_reserve: float
    token1_reserve: float
    creator_address: Optional[str] = None
    pair_address: Optional[str] = None


# Position Models
class PositionBase(BaseModel):
    pool_id: str
    wallet_address: str
    token0_amount: float
    token1_amount: float
    min_price: float = 0.0
    max_price: float = float('inf')


class PositionCreate(PositionBase):
    pass


class Position(PositionBase):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    liquidity: float = 0.0
    unclaimed_fees: float = 0.0
    in_range: bool = True
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

    class Config:
        from_attributes = True


class PositionRemove(BaseModel):
    position_id: str
    wallet_address: str
    percent: float = 100.0


# Swap Models
class SwapQuoteRequest(BaseModel):
    token_in: str
    token_out: str
    amount_in: float


class SwapQuoteResponse(BaseModel):
    amount_out: float
    price_impact: float
    route: List[str]
    exchange_rate: float
    minimum_received: float
    fee: float


class SwapExecuteRequest(BaseModel):
    wallet_address: str
    token_in: str
    token_out: str
    amount_in: float
    amount_out: float
    slippage: float = 0.5
    tx_hash: Optional[str] = None


# Transaction Models
class Transaction(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    type: str  # swap, add, remove
    wallet_address: str
    token0_address: str
    token1_address: str
    amount0: float
    amount1: float
    tx_hash: Optional[str] = None
    timestamp: datetime = Field(default_factory=datetime.utcnow)
    status: str = "confirmed"  # pending, confirmed, failed

    class Config:
        from_attributes = True


class TransactionResponse(BaseModel):
    id: str
    type: str
    wallet_address: str
    token0: Token
    token1: Token
    amount0: float
    amount1: float
    tx_hash: Optional[str]
    timestamp: datetime
    status: str


# Stats Models
class ProtocolStats(BaseModel):
    total_volume: float = 0.0
    tvl: float = 0.0
    total_swappers: int = 0
    volume_24h: float = 0.0
    transactions_24h: int = 0
    active_pools: int = 0
    updated_at: datetime = Field(default_factory=datetime.utcnow)
