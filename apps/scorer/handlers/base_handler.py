from abc import ABC, abstractmethod
from dataclasses import dataclass, field
from typing import Optional


@dataclass
class ScoreContext:
    caller_number: str
    is_voip: bool
    is_spoofed: bool
    carrier_type: str
    community_flags: int
    score: float = 0.0
    reasons: list[str] = field(default_factory=list)


class BaseHandler(ABC):
    def __init__(self) -> None:
        self._next: Optional["BaseHandler"] = None

    def set_next(self, handler: "BaseHandler") -> "BaseHandler":
        self._next = handler
        return handler

    def handle(self, ctx: ScoreContext) -> ScoreContext:
        ctx = self._evaluate(ctx)
        if self._next:
            return self._next.handle(ctx)
        return ctx

    @abstractmethod
    def _evaluate(self, ctx: ScoreContext) -> ScoreContext:
        ...
