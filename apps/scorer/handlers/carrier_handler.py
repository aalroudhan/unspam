from .base_handler import BaseHandler, ScoreContext

HIGH_RISK_CARRIERS = {'nonFixedVoip', 'prepaid'}


class CarrierHandler(BaseHandler):
    def _evaluate(self, ctx: ScoreContext) -> ScoreContext:
        if ctx.carrier_type in HIGH_RISK_CARRIERS:
            ctx.score += 0.2
            ctx.reasons.append(f'high_risk_carrier_{ctx.carrier_type}')
        return ctx
