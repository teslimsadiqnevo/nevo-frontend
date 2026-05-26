import { proxyInternalGet } from "../../_proxy";

export async function GET() {
  return proxyInternalGet("/internal/ai/esl", "Could not load AI ESL metrics.");
}
