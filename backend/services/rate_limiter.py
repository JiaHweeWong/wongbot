from datetime import date

from fastapi import HTTPException, Request


class RateLimiter:
    def __init__(self, limit: int) -> None:
        self.limit = limit
        self._counts: dict[str, tuple[int, date]] = {}

    def check(self, ip: str) -> None:
        today = date.today()
        count, reset_date = self._counts.get(ip, (0, today))

        if reset_date < today:
            count = 0

        if count >= self.limit:
            raise HTTPException(
                status_code=429,
                detail=(
                    f"Wah, you very kancheong sia! Daily limit of {self.limit} messages reached."
                    " Come back tomorrow lah!"
                ),
            )

        self._counts[ip] = (count + 1, today)


def get_client_ip(request: Request) -> str:
    forwarded_for = request.headers.get("X-Forwarded-For")
    if forwarded_for:
        return forwarded_for.split(",")[0].strip()
    return request.client.host
