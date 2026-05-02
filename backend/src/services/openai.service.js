import OpenAI from "openai";
import { config } from "../config/config.js";

// Initialise OpenAI client with API key from env
const openai = new OpenAI({ apiKey: config.OPENAI_API_KEY });

/**
 * getAISuggestion — sends an error's stack trace + message to GPT-4o-mini
 * and returns a concise, actionable fix suggestion.
 * Result is stored in ErrorModel.aiSuggestion field.
 *
 * @param {string} message   — human-readable error message
 * @param {string} stack     — full stack trace string
 * @param {string} service   — service/microservice name
 * @returns {string}         — AI-generated suggestion text
 */
export const getAISuggestion = async (message, stack, service) => {
  // Skip if API key not configured
  if (!config.OPENAI_API_KEY) {
    console.warn("⚠️  OpenAI API key not configured — skipping AI suggestion");
    return "AI suggestion unavailable — API key not configured.";
  }

  // System prompt shapes the AI's response style
  const systemPrompt = `You are a senior software engineer specialising in debugging production incidents.
Given an error message and stack trace, provide:
1. A short root cause analysis (1-2 sentences)
2. A step-by-step fix (numbered list, max 5 steps)
3. Prevention advice (1 sentence)
Be concise, technical, and actionable. Format the response in plain text, no markdown headers.`;

  // User prompt includes all available context
  const userPrompt = `Service: ${service}
Error Message: ${message}
Stack Trace:
${stack || "No stack trace available"}`;

  // Call OpenAI Chat Completions API
  const completion = await openai.chat.completions.create({
    model: "gpt-4o-mini",            // Cost-effective model suitable for analysis
    max_tokens: 400,                  // Keep responses concise
    temperature: 0.3,                 // Lower temperature → more deterministic output
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt },
    ],
  });

  // Extract the text from the first choice
  const suggestion = completion.choices[0]?.message?.content?.trim();
  console.log(`🤖 AI suggestion generated for service: ${service}`);
  return suggestion || "No suggestion returned by AI.";
};
