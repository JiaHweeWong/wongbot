import unittest

from fastapi import HTTPException

from services.rate_limiter import RateLimiter


class RateLimiterTests(unittest.TestCase):
    def test_enforces_global_limit_across_different_ips(self) -> None:
        limiter = RateLimiter(per_ip_limit=10, global_limit=2)

        limiter.check("192.0.2.1")
        limiter.check("192.0.2.2")

        with self.assertRaisesRegex(HTTPException, "daily request budget"):
            limiter.check("192.0.2.3")

    def test_enforces_per_ip_limit_without_consuming_global_budget(self) -> None:
        limiter = RateLimiter(per_ip_limit=1, global_limit=2)

        limiter.check("192.0.2.1")
        with self.assertRaisesRegex(HTTPException, "this connection"):
            limiter.check("192.0.2.1")

        limiter.check("192.0.2.2")


if __name__ == "__main__":
    unittest.main()
