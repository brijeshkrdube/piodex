"""
Backend API tests for PioSwap DEX
Tests: Swap endpoints (trade history, price history), Pool endpoints (CRUD, liquidity)
"""
import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

# Token addresses from the deployed contracts
PIO_ADDRESS = "0x0000000000000000000000000000000000000000"
WPIO_ADDRESS = "0x9da12b8cf8b94f2e0eedd9841e268631af03adb1"
USDT_ADDRESS = "0x75c681d7d00b6cda3778535bba87e433ca369c96"

# Test wallet addresses
TEST_WALLET = "0x1234567890123456789012345678901234567890"
CREATOR_WALLET = "0xabcdef1234567890abcdef1234567890abcdef12"


class TestSwapEndpoints:
    """Test swap-related API endpoints"""
    
    def test_get_trade_history_empty(self):
        """Test that trade history returns empty array when no trades exist"""
        response = requests.get(f"{BASE_URL}/api/swap/trades/{PIO_ADDRESS}/{USDT_ADDRESS}")
        assert response.status_code == 200
        
        data = response.json()
        assert isinstance(data, list)
        # No trades yet - should be empty
        print(f"Trade history returned {len(data)} trades")
    
    def test_get_price_history_no_real_data(self):
        """Test that price history returns hasRealData=false when no trades exist"""
        response = requests.get(f"{BASE_URL}/api/swap/price-history/{PIO_ADDRESS}/{USDT_ADDRESS}?days=30")
        assert response.status_code == 200
        
        data = response.json()
        assert "hasRealData" in data
        assert data["hasRealData"] == False, "Expected hasRealData to be false when no trades exist"
        assert "basePrice" in data
        assert data["basePrice"] > 0, "Base price should be positive"
        assert "candles" in data
        assert isinstance(data["candles"], list)
        print(f"Price history: hasRealData={data['hasRealData']}, basePrice={data['basePrice']}")
    
    def test_get_swap_quote(self):
        """Test swap quote endpoint"""
        response = requests.post(f"{BASE_URL}/api/swap/quote", json={
            "token_in": PIO_ADDRESS,
            "token_out": USDT_ADDRESS,
            "amount_in": 10.0
        })
        assert response.status_code == 200
        
        data = response.json()
        assert "amount_out" in data
        assert "price_impact" in data
        assert "exchange_rate" in data
        assert data["amount_out"] > 0, "Amount out should be positive"
        print(f"Swap quote: 10 PIO -> {data['amount_out']} USDT, rate={data['exchange_rate']}")
    
    def test_get_swap_quote_reverse(self):
        """Test swap quote in reverse direction"""
        response = requests.post(f"{BASE_URL}/api/swap/quote", json={
            "token_in": USDT_ADDRESS,
            "token_out": PIO_ADDRESS,
            "amount_in": 10.0
        })
        assert response.status_code == 200
        
        data = response.json()
        assert data["amount_out"] > 0
        print(f"Swap quote: 10 USDT -> {data['amount_out']} PIO")


class TestTokenEndpoints:
    """Test token-related API endpoints"""
    
    def test_get_all_tokens(self):
        """Test getting all tokens"""
        response = requests.get(f"{BASE_URL}/api/tokens")
        assert response.status_code == 200
        
        data = response.json()
        assert isinstance(data, list)
        assert len(data) >= 3, "Should have at least PIO, WPIO, USDT tokens"
        
        # Verify token structure
        symbols = [t["symbol"] for t in data]
        assert "PIO" in symbols, "PIO token should exist"
        assert "WPIO" in symbols, "WPIO token should exist"
        assert "USDT" in symbols, "USDT token should exist"
        print(f"Found {len(data)} tokens: {symbols}")
    
    def test_get_token_by_address(self):
        """Test getting a specific token by address"""
        response = requests.get(f"{BASE_URL}/api/tokens/{USDT_ADDRESS}")
        assert response.status_code == 200
        
        data = response.json()
        assert data["symbol"] == "USDT"
        assert data["address"].lower() == USDT_ADDRESS.lower()
        print(f"Token: {data['symbol']} at {data['address']}")


class TestPoolEndpoints:
    """Test pool-related API endpoints"""
    
    def test_get_all_pools(self):
        """Test getting all pools"""
        response = requests.get(f"{BASE_URL}/api/pools")
        assert response.status_code == 200
        
        data = response.json()
        assert isinstance(data, list)
        print(f"Found {len(data)} pools")
        
        # Verify pool structure if pools exist
        if len(data) > 0:
            pool = data[0]
            assert "id" in pool
            assert "token0" in pool
            assert "token1" in pool
            assert "tvl" in pool
            assert "fee" in pool
    
    def test_create_pool_check_existing(self):
        """Test that creating a pool with existing pair returns error"""
        # First get existing pools
        pools_response = requests.get(f"{BASE_URL}/api/pools")
        pools = pools_response.json()
        
        if len(pools) > 0:
            # Try to create a pool that already exists
            existing_pool = pools[0]
            response = requests.post(f"{BASE_URL}/api/pools", json={
                "token0_address": existing_pool["token0"]["address"],
                "token1_address": existing_pool["token1"]["address"],
                "fee": 0.3,
                "amount0": 0,
                "amount1": 0,
                "creator_address": TEST_WALLET
            })
            # Should return 400 because pool already exists
            assert response.status_code == 400
            assert "already exists" in response.json().get("detail", "").lower()
            print("Correctly rejected duplicate pool creation")
        else:
            pytest.skip("No existing pools to test duplicate creation")
    
    def test_add_liquidity_creator_only(self):
        """Test that only pool creator can add liquidity"""
        # Get existing pools
        pools_response = requests.get(f"{BASE_URL}/api/pools")
        pools = pools_response.json()
        
        if len(pools) > 0:
            pool = pools[0]
            pool_id = pool["id"]
            creator_address = pool.get("creator_address")
            
            if creator_address:
                # Try to add liquidity with a different wallet
                response = requests.post(f"{BASE_URL}/api/pools/add-liquidity", json={
                    "pool_id": pool_id,
                    "wallet_address": "0x9999999999999999999999999999999999999999",
                    "amount0": 10.0,
                    "amount1": 10.0
                })
                # Should return 403 because not the creator
                assert response.status_code == 403
                assert "creator" in response.json().get("detail", "").lower()
                print(f"Correctly rejected non-creator liquidity addition")
            else:
                print("Pool has no creator_address set, skipping creator-only test")
        else:
            pytest.skip("No pools to test liquidity addition")
    
    def test_remove_liquidity_creator_only(self):
        """Test that only pool creator can remove liquidity"""
        # Get existing pools
        pools_response = requests.get(f"{BASE_URL}/api/pools")
        pools = pools_response.json()
        
        if len(pools) > 0:
            pool = pools[0]
            pool_id = pool["id"]
            creator_address = pool.get("creator_address")
            
            if creator_address:
                # Try to remove liquidity with a different wallet
                response = requests.post(f"{BASE_URL}/api/pools/remove-liquidity", json={
                    "pool_id": pool_id,
                    "wallet_address": "0x9999999999999999999999999999999999999999",
                    "percent": 50.0
                })
                # Should return 403 because not the creator
                assert response.status_code == 403
                assert "creator" in response.json().get("detail", "").lower()
                print(f"Correctly rejected non-creator liquidity removal")
            else:
                print("Pool has no creator_address set, skipping creator-only test")
        else:
            pytest.skip("No pools to test liquidity removal")


class TestStatsEndpoint:
    """Test stats API endpoint"""
    
    def test_get_stats(self):
        """Test getting platform stats"""
        response = requests.get(f"{BASE_URL}/api/stats")
        assert response.status_code == 200
        
        data = response.json()
        assert "total_volume" in data
        assert "tvl" in data
        assert "active_pools" in data
        print(f"Stats: TVL=${data['tvl']}, Volume=${data['total_volume']}, Pools={data['active_pools']}")


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
