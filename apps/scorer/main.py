from fastapi import FastAPI
from pydantic import BaseModel

from handlers.base_handler import ScoreContext
from handlers.voip_handler import VoipHandler
from handlers.blocklist_handler import BlocklistHandler
from handlers.carrier_handler import CarrierHandler

app = FastAPI(title='Unspam Scorer', version='1.0')


def build_chain() -> VoipHandler:
    voip = VoipHandler()
    blocklist = BlocklistHandler()
    carrier = CarrierHandler()
    voip.set_next(blocklist).set_next(carrier)
    return voip


class ScoreRequest(BaseModel):
    callerNumber: str
    isVoip: bool
    isSpoofed: bool
    carrierType: str
    communityFlags: int


class ScoreResponse(BaseModel):
    score: float
    reasons: list[str]


@app.post('/score', response_model=ScoreResponse)
def score(req: ScoreRequest) -> ScoreResponse:
    ctx = ScoreContext(
        caller_number=req.callerNumber,
        is_voip=req.isVoip,
        is_spoofed=req.isSpoofed,
        carrier_type=req.carrierType,
        community_flags=req.communityFlags,
    )
    result = build_chain().handle(ctx)
    return ScoreResponse(score=min(result.score, 1.0), reasons=result.reasons)
