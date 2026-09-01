import { NextResponse } from 'next/server';

export type ErrorType = 'QUOTA_EXHAUSTED' | 'RATE_LIMIT_TEMPORARY' | 'SERVICE_UNAVAILABLE' | 'INVALID_CONFIG' | 'UNEXPECTED';

export function handleGeminiError(response: Response | undefined | null, errorData: any) {
  let errorType: ErrorType = 'UNEXPECTED';
  let safeErrorMsg = "Something went wrong. Please try again.";
  let statusCode = response?.status || 500;

  if (statusCode === 429) {
    // Check if it's actually project quota exhaustion
    const msg = errorData?.error?.message?.toLowerCase() || '';
    if (msg.includes('quota exceeded') || msg.includes('quota metric') || msg.includes('limit') || msg.includes('project')) {
      errorType = 'QUOTA_EXHAUSTED';
      safeErrorMsg = "Today's AI limit has been reached. Please try again later.";
    } else {
      errorType = 'RATE_LIMIT_TEMPORARY';
      safeErrorMsg = "RankUp AI is temporarily busy. Please try again in a moment.";
    }
  } else if (statusCode === 503 || statusCode === 502 || statusCode === 504) {
    errorType = 'SERVICE_UNAVAILABLE';
    safeErrorMsg = "RankUp AI is temporarily unavailable. Please try again shortly.";
  } else if (statusCode === 400 || statusCode === 403 || statusCode === 404) {
    errorType = 'INVALID_CONFIG';
    safeErrorMsg = "RankUp AI is having trouble connecting to its AI service.";
  }

  return NextResponse.json({ error: safeErrorMsg, errorType }, { status: statusCode });
}
