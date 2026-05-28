// Mirrors the backend's Pydantic response models.

export interface PredictResponse {
  label: string;
  confidence: number;
  probabilities: Record<string, number>;
  latency_ms: number;
}

export interface TokenAttribution {
  token: string;
  score: number;
}

export interface ExplainResponse extends PredictResponse {
  attributions: TokenAttribution[];
}

export function isExplainResponse(
  r: PredictResponse | ExplainResponse,
): r is ExplainResponse {
  return "attributions" in r;
}
