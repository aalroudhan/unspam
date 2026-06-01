from .base_handler import BaseHandler, ScoreContext

COMMUNITY_FLAG_THRESHOLD = 5


class BlocklistHandler(BaseHandler):
    def _evaluate(self, ctx: ScoreContext) -> ScoreContext:
        if ctx.community_flags >= COMMUNITY_FLAG_THRESHOLD:
            ctx.score += 0.3
            ctx.reasons.append(f'community_flagged_{ctx.community_flags}_times')
        return ctx
