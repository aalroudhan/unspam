from .base_handler import BaseHandler, ScoreContext


class VoipHandler(BaseHandler):
    def _evaluate(self, ctx: ScoreContext) -> ScoreContext:
        if ctx.is_voip:
            ctx.score += 0.4
            ctx.reasons.append('voip_number')
        if ctx.is_spoofed:
            ctx.score += 0.5
            ctx.reasons.append('spoofed_number')
        return ctx
