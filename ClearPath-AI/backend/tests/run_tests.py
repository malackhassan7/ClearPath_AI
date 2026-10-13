"""
Phase 1 Test Runner for ClearPathAI
Executes tests using Python's standard library asyncio and unittest.
"""
import asyncio
import os
import sys

# Ensure backend root is in sys.path
backend_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)

from tests.test_rule_engine import (
    test_classify_milk_parlour,
    test_classify_processing_unit,
    test_get_fssai_rule_registration_tier,
    test_get_fssai_rule_state_tier,
    test_calculate_cost,
    test_get_district_suitability,
    test_validate_document_tier1_format,
    test_validate_document_tier2_consistency,
)
from tests.test_rag import (
    test_language_detection,
    test_hybrid_search,
    test_chat_english_grounded,
    test_chat_tamil_grounded,
)
from tests.test_auth import (
    test_password_hashing,
    test_jwt_access_token_creation_and_decode,
    test_jwt_refresh_token,
)


def run_all_phase1_tests():
    print("=" * 60)
    print("RUNNING CLEARPATHAI PHASE 1 VERIFICATION TESTS")
    print("=" * 60)

    total_passed = 0
    total_tests = 0

    sync_tests = [
        ("test_password_hashing", test_password_hashing),
        ("test_jwt_access_token_creation_and_decode", test_jwt_access_token_creation_and_decode),
        ("test_jwt_refresh_token", test_jwt_refresh_token),
        ("test_validate_document_tier1_format", test_validate_document_tier1_format),
        ("test_validate_document_tier2_consistency", test_validate_document_tier2_consistency),
        ("test_language_detection", test_language_detection),
        ("test_hybrid_search", test_hybrid_search),
    ]

    for name, test_func in sync_tests:
        total_tests += 1
        try:
            test_func()
            print(f"[PASS] {name}")
            total_passed += 1
        except Exception as e:
            print(f"[FAIL] {name}: {e}")

    async_tests = [
        ("test_classify_milk_parlour", test_classify_milk_parlour),
        ("test_classify_processing_unit", test_classify_processing_unit),
        ("test_get_fssai_rule_registration_tier", test_get_fssai_rule_registration_tier),
        ("test_get_fssai_rule_state_tier", test_get_fssai_rule_state_tier),
        ("test_calculate_cost", test_calculate_cost),
        ("test_get_district_suitability", test_get_district_suitability),
        ("test_chat_english_grounded", test_chat_english_grounded),
        ("test_chat_tamil_grounded", test_chat_tamil_grounded),
    ]

    for name, test_func in async_tests:
        total_tests += 1
        try:
            asyncio.run(test_func())
            print(f"[PASS] {name}")
            total_passed += 1
        except Exception as e:
            print(f"[FAIL] {name}: {e}")

    print("=" * 60)
    print(f"RESULTS: {total_passed}/{total_tests} tests passed.")
    print("=" * 60)

    if total_passed == total_tests:
        print("ALL PHASE 1 BACKEND TESTS PASSED SUCCESSFULLY!")
        return 0
    else:
        print("SOME TESTS FAILED.")
        return 1


if __name__ == "__main__":
    sys.exit(run_all_phase1_tests())
