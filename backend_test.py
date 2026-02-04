#!/usr/bin/env python3
"""
PioSwap DEX Backend API Test Suite
Tests all backend endpoints for the DEX application
"""

import requests
import json
import sys
from datetime import datetime

# Backend URL from frontend .env
BACKEND_URL = "https://pionetswap.preview.emergentagent.com/api"

class Colors:
    GREEN = '\033[92m'
    RED = '\033[91m'
    YELLOW = '\033[93m'
    BLUE = '\033[94m'
    ENDC = '\033[0m'
    BOLD = '\033[1m'

def print_test_header(test_name):
    print(f"\n{Colors.BLUE}{Colors.BOLD}{'='*60}{Colors.ENDC}")
    print(f"{Colors.BLUE}{Colors.BOLD}Testing: {test_name}{Colors.ENDC}")
    print(f"{Colors.BLUE}{Colors.BOLD}{'='*60}{Colors.ENDC}")

def print_success(message):
    print(f"{Colors.GREEN}✅ {message}{Colors.ENDC}")

def print_error(message):
    print(f"{Colors.RED}❌ {message}{Colors.ENDC}")

def print_warning(message):
    print(f"{Colors.YELLOW}⚠️  {message}{Colors.ENDC}")

def print_info(message):
    print(f"{Colors.BLUE}ℹ️  {message}{Colors.ENDC}")

def test_api_endpoint(method, endpoint, data=None, expected_status=200, test_name=""):
    """Generic API test function"""
    url = f"{BACKEND_URL}{endpoint}"
    
    try:
        if method.upper() == "GET":
            response = requests.get(url, timeout=30)
        elif method.upper() == "POST":
            response = requests.post(url, json=data, timeout=30)
        else:
            print_error(f"Unsupported method: {method}")
            return None
        
        print_info(f"{method} {endpoint} -> Status: {response.status_code}")
        
        if response.status_code == expected_status:
            print_success(f"{test_name} - Status code correct ({response.status_code})")
            try:
                json_response = response.json()
                print_info(f"Response preview: {str(json_response)[:200]}...")
                return json_response
            except json.JSONDecodeError:
                print_warning(f"Response is not valid JSON: {response.text[:100]}")
                return response.text
        else:
            print_error(f"{test_name} - Expected {expected_status}, got {response.status_code}")
            print_error(f"Response: {response.text[:200]}")
            return None
            
    except requests.exceptions.RequestException as e:
        print_error(f"{test_name} - Request failed: {str(e)}")
        return None

def test_tokens_api():
    """Test GET /api/tokens endpoint"""
    print_test_header("GET /api/tokens - List all tokens")
    
    response = test_api_endpoint("GET", "/tokens", test_name="Get tokens list")
    
    if response:
        if isinstance(response, list):
            print_success(f"Received {len(response)} tokens")
            
            if len(response) >= 8:
                print_success("Expected minimum 8 tokens found")
            else:
                print_warning(f"Expected at least 8 tokens, got {len(response)}")
            
            # Check token structure
            if response:
                token = response[0]
                required_fields = ['symbol', 'name', 'address', 'price']
                missing_fields = [field for field in required_fields if field not in token]
                
                if not missing_fields:
                    print_success("Token structure is correct")
                    print_info(f"Sample token: {token['symbol']} - {token['name']} @ ${token.get('price', 0)}")
                else:
                    print_error(f"Missing fields in token: {missing_fields}")
        else:
            print_error("Response is not a list")
    
    return response

def test_pools_api():
    """Test GET /api/pools endpoint"""
    print_test_header("GET /api/pools - List all pools")
    
    response = test_api_endpoint("GET", "/pools", test_name="Get pools list")
    
    if response:
        if isinstance(response, list):
            print_success(f"Received {len(response)} pools")
            
            if len(response) >= 5:
                print_success("Expected minimum 5 pools found")
            else:
                print_warning(f"Expected at least 5 pools, got {len(response)}")
            
            # Check pool structure
            if response:
                pool = response[0]
                required_fields = ['id', 'token0', 'token1', 'fee', 'tvl', 'apr', 'volume_24h']
                missing_fields = [field for field in required_fields if field not in pool]
                
                if not missing_fields:
                    print_success("Pool structure is correct")
                    print_info(f"Sample pool: {pool['token0']['symbol']}/{pool['token1']['symbol']} - Fee: {pool['fee']}% - TVL: ${pool['tvl']}")
                else:
                    print_error(f"Missing fields in pool: {missing_fields}")
        else:
            print_error("Response is not a list")
    
    return response

def test_pool_detail_api():
    """Test GET /api/pool/{pool_id} endpoint"""
    print_test_header("GET /api/pools/pool1 - Get pool details")
    
    response = test_api_endpoint("GET", "/pools/pool1", test_name="Get pool1 details")
    
    if response:
        if isinstance(response, dict):
            required_fields = ['id', 'token0', 'token1', 'fee', 'tvl', 'apr', 'volume_24h']
            missing_fields = [field for field in required_fields if field not in response]
            
            if not missing_fields:
                print_success("Pool detail structure is correct")
                print_info(f"Pool: {response['token0']['symbol']}/{response['token1']['symbol']}")
                print_info(f"TVL: ${response['tvl']}, Volume 24h: ${response['volume_24h']}")
            else:
                print_error(f"Missing fields in pool detail: {missing_fields}")
        else:
            print_error("Response is not a dictionary")
    
    return response

def test_swap_quote_api():
    """Test POST /api/swap/quote endpoint"""
    print_test_header("POST /api/swap/quote - Get swap quote")
    
    quote_data = {
        "token_in": "0x0000000000000000000000000000000000000000",
        "token_out": "0x2222222222222222222222222222222222222222",
        "amount_in": 100
    }
    
    response = test_api_endpoint("POST", "/swap/quote", data=quote_data, test_name="Get swap quote")
    
    if response:
        if isinstance(response, dict):
            required_fields = ['amount_out', 'price_impact', 'exchange_rate', 'fee', 'minimum_received']
            missing_fields = [field for field in required_fields if field not in response]
            
            if not missing_fields:
                print_success("Swap quote structure is correct")
                print_info(f"Amount out: {response['amount_out']}")
                print_info(f"Price impact: {response['price_impact']}%")
                print_info(f"Exchange rate: {response['exchange_rate']}")
                print_info(f"Fee: {response['fee']}")
            else:
                print_error(f"Missing fields in swap quote: {missing_fields}")
        else:
            print_error("Response is not a dictionary")
    
    return response

def test_create_pool_api():
    """Test POST /api/pools - Create new pool"""
    print_test_header("POST /api/pools - Create new pool")
    
    pool_data = {
        "token0_address": "0x5555555555555555555555555555555555555555",
        "token1_address": "0x3333333333333333333333333333333333333333",
        "fee": 0.3
    }
    
    response = test_api_endpoint("POST", "/pools", data=pool_data, test_name="Create new pool")
    
    if response:
        if isinstance(response, dict):
            required_fields = ['id', 'token0', 'token1', 'fee', 'tvl']
            missing_fields = [field for field in required_fields if field not in response]
            
            if not missing_fields:
                print_success("Pool creation response structure is correct")
                print_info(f"Created pool ID: {response['id']}")
                print_info(f"Pool: {response['token0']['symbol']}/{response['token1']['symbol']}")
            else:
                print_error(f"Missing fields in pool creation response: {missing_fields}")
        else:
            print_error("Response is not a dictionary")
    
    return response

def test_add_liquidity_api():
    """Test POST /api/positions/add - Add liquidity"""
    print_test_header("POST /api/positions/add - Add liquidity")
    
    liquidity_data = {
        "pool_id": "pool1",
        "wallet_address": "0xtest123",
        "token0_amount": 100,
        "token1_amount": 245,
        "min_price": 2.0,
        "max_price": 3.0
    }
    
    response = test_api_endpoint("POST", "/positions/add", data=liquidity_data, test_name="Add liquidity")
    
    if response:
        if isinstance(response, dict):
            required_fields = ['id', 'pool_id', 'wallet_address', 'token0_amount', 'token1_amount', 'liquidity']
            missing_fields = [field for field in required_fields if field not in response]
            
            if not missing_fields:
                print_success("Add liquidity response structure is correct")
                print_info(f"Position ID: {response['id']}")
                print_info(f"Liquidity: {response['liquidity']}")
                print_info(f"Token amounts: {response['token0_amount']}, {response['token1_amount']}")
            else:
                print_error(f"Missing fields in add liquidity response: {missing_fields}")
        else:
            print_error("Response is not a dictionary")
    
    return response

def test_stats_api():
    """Test GET /api/stats - Protocol statistics"""
    print_test_header("GET /api/stats - Protocol statistics")
    
    response = test_api_endpoint("GET", "/stats", test_name="Get protocol stats")
    
    if response:
        if isinstance(response, dict):
            required_fields = ['total_volume', 'tvl', 'total_swappers', 'volume_24h', 'transactions_24h', 'active_pools']
            missing_fields = [field for field in required_fields if field not in response]
            
            if not missing_fields:
                print_success("Protocol stats structure is correct")
                print_info(f"Total Volume: ${response['total_volume']}")
                print_info(f"TVL: ${response['tvl']}")
                print_info(f"Total Swappers: {response['total_swappers']}")
                print_info(f"Active Pools: {response['active_pools']}")
            else:
                print_error(f"Missing fields in protocol stats: {missing_fields}")
        else:
            print_error("Response is not a dictionary")
    
    return response

def test_health_check():
    """Test basic API health"""
    print_test_header("GET /api/ - Health check")
    
    response = test_api_endpoint("GET", "/", test_name="API Health check")
    
    if response:
        if isinstance(response, dict) and "message" in response:
            print_success("API is responding correctly")
            print_info(f"Message: {response['message']}")
        else:
            print_warning("API responded but format unexpected")
    
    return response

def main():
    """Run all backend API tests"""
    print(f"{Colors.BOLD}{Colors.BLUE}")
    print("=" * 80)
    print("           PIOSWAP DEX BACKEND API TEST SUITE")
    print("=" * 80)
    print(f"{Colors.ENDC}")
    
    print_info(f"Testing backend at: {BACKEND_URL}")
    print_info(f"Test started at: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    
    # Track test results
    test_results = {}
    
    # Run all tests
    test_results['health'] = test_health_check()
    test_results['tokens'] = test_tokens_api()
    test_results['pools'] = test_pools_api()
    test_results['pool_detail'] = test_pool_detail_api()
    test_results['swap_quote'] = test_swap_quote_api()
    test_results['create_pool'] = test_create_pool_api()
    test_results['add_liquidity'] = test_add_liquidity_api()
    test_results['stats'] = test_stats_api()
    
    # Summary
    print(f"\n{Colors.BOLD}{Colors.BLUE}")
    print("=" * 80)
    print("                        TEST SUMMARY")
    print("=" * 80)
    print(f"{Colors.ENDC}")
    
    passed = sum(1 for result in test_results.values() if result is not None)
    total = len(test_results)
    
    for test_name, result in test_results.items():
        status = "✅ PASS" if result is not None else "❌ FAIL"
        print(f"{test_name.replace('_', ' ').title()}: {status}")
    
    print(f"\n{Colors.BOLD}Overall: {passed}/{total} tests passed{Colors.ENDC}")
    
    if passed == total:
        print(f"{Colors.GREEN}{Colors.BOLD}🎉 All backend API tests passed!{Colors.ENDC}")
        return 0
    else:
        print(f"{Colors.RED}{Colors.BOLD}⚠️  Some tests failed. Check logs above.{Colors.ENDC}")
        return 1

if __name__ == "__main__":
    sys.exit(main())