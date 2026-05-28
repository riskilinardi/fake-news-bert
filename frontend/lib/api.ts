import type { ExplainResponse, PredictResponse } from "./types";

const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

export class ApiError extends Error {
  constructor(message: string, public readonly status: number) {
    super(message);
    this.name = "ApiError";
  }
}

export class NetworkError extends Error {
  constructor() {
    super("Could not reach the API. Is the backend running?");
    this.name = "NetworkError";
  }
}

async function post<T>(path: string, body: unknown): Promise<T> {
  let res: Response;
  try {
    res = await fetch(`${BASE_URL}${path}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
  } catch {
    // fetch() throws TypeError on DNS/connection failures.
    throw new NetworkError();
  }

  if (!res.ok) {
    let message = `Request failed (${res.status})`;
    try {
      const errorBody = await res.json();
      if (errorBody?.detail) message = errorBody.detail;
      else if (errorBody?.error) message = errorBody.error;
    } catch {
      // Body wasn't JSON — fall through with the default message.
    }

    if (res.status === 429) {
      message = "You're sending requests too quickly. Wait a minute and try again.";
    }
    throw new ApiError(message, res.status);
  }

  return res.json() as Promise<T>;
}

export function predict(statement: string): Promise<PredictResponse> {
  return post<PredictResponse>("/predict", { statement });
}

export function explain(statement: string): Promise<ExplainResponse> {
  return post<ExplainResponse>("/explain", { statement });
}
