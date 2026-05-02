import OpenAI from "openai";
import { config } from "../config/config.js";

/**
 * OpenAI client instance — initialized lazily to avoid errors
 * when API key is not configured.
 */
let openaiClient = null;

const getClient = () => {
    if (!openaiClient && config.OPENAI_API_KEY) {
        openaiClient = new OpenAI({
            apiKey: config.OPENAI_API_KEY,
        });
    }
    return openaiClient;
};

/**
 * AI-Doctor: Analyzes a stack trace and error message using OpenAI
 * and returns a concise fix suggestion.
 *
 * @param {string} stackTrace - The error stack trace
 * @param {string} errorMessage - The error message
 * @param {string} service - The affected service name
 * @returns {Promise<string|null>} - AI suggestion text, or null if unavailable
 */
export const getAISuggestion = async (stackTrace, errorMessage, service) => {
    // Gracefully skip if OpenAI API key is not configured
    if (!config.OPENAI_API_KEY) {
        console.warn("⚠️  OpenAI API key not configured — skipping AI suggestion");
        return null;
    }

    const client = getClient();
    if (!client) {
        console.warn("⚠️  OpenAI client could not be initialized");
        return null;
    }

    try {
        const response = await client.chat.completions.create({
            model: "gpt-4o-mini",
            messages: [
                {
                    role: "system",
                    content: `You are a senior backend engineer specializing in incident response. 
Analyze the error and provide a concise, actionable fix suggestion. 
Keep your response under 300 words. Format it as:

**Root Cause:** (1-2 sentences)
**Fix Suggestion:** (step-by-step, max 5 steps)
**Prevention:** (1-2 sentences on how to prevent this in the future)`,
                },
                {
                    role: "user",
                    content: `Service: ${service}
Error Message: ${errorMessage}
Stack Trace:
${stackTrace || "No stack trace available"}

What caused this error and how should we fix it?`,
                },
            ],
            max_tokens: 500,
            temperature: 0.3, // Lower temperature for more deterministic, precise responses
        });

        const suggestion = response.choices[0]?.message?.content;

        if (suggestion) {
            console.log(`🤖 AI suggestion generated for service: ${service}`);
            return suggestion;
        }

        return null;
    } catch (error) {
        // Handle specific OpenAI errors
        if (error.status === 429) {
            console.error("❌ OpenAI rate limit exceeded — skipping AI suggestion");
        } else if (error.status === 401) {
            console.error("❌ OpenAI API key is invalid — check your OPENAI_API_KEY");
        } else {
            console.error("❌ OpenAI API error:", error.message);
        }

        return null;
    }
};
