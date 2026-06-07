from datetime import date

from fastapi import HTTPException, Request


class RateLimiter:
    def __init__(self, per_ip_limit: int, global_limit: int) -> None:
        self.per_ip_limit = per_ip_limit
        self.global_limit = global_limit
        self._counts: dict[str, tuple[int, date]] = {}
        self._global_count = 0
        self._global_reset_date = date.today()

    def check(self, ip: str) -> None:
        today = date.today()
        self._reset_global_count_if_needed(today)

        count, reset_date = self._counts.get(ip, (0, today))
        if reset_date < today:
            count = 0

        if count >= self.per_ip_limit:
            raise HTTPException(
                status_code=429,
                detail=(
                    f"Daily limit of {self.per_ip_limit} messages reached for this connection."
                    " Come back tomorrow."
                ),
            )

        if self._global_count >= self.global_limit:
            raise HTTPException(
                status_code=429,
                detail="Wongbot has reached its daily request budget. Come back tomorrow.",
            )

        self._counts[ip] = (count + 1, today)
        self._global_count += 1

    def _reset_global_count_if_needed(self, today: date) -> None:
        if self._global_reset_date < today:
            self._global_count = 0
            self._global_reset_date = today


def get_client_ip(request: Request) -> str:
    forwarded_for = request.headers.get("X-Forwarded-For")
    if forwarded_for:
        return forwarded_for.split(",")[0].strip()
    return request.client.host
