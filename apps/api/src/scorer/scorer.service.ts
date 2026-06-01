import { Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';

export interface ScoreRequest {
  callerNumber: string;
  isVoip: boolean;
  isNonFixedVoip: boolean;
  isSpoofed: boolean;
  carrierType: string;
  communityFlags: number;
}

export interface ScoreResponse {
  score: number;
  reasons: string[];
}

@Injectable()
export class ScorerService {
  constructor(
    private readonly http: HttpService,
    private readonly config: ConfigService,
  ) {}

  async score(request: ScoreRequest): Promise<ScoreResponse> {
    const url = this.config.get<string>('scorer.url');
    const { data } = await firstValueFrom(
      this.http.post<ScoreResponse>(`${url}/score`, request),
    );
    return data;
  }
}
