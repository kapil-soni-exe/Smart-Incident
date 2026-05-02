import dotenv from "dotenv"
dotenv.config()

if(!process.env.MONGO_URI){
    throw new Error("MONGO_URI is not defined")
}

export const config = {
    MONGO_URI: process.env.MONGO_URI,
    REDIS_URL: process.env.REDIS_URL || "redis://localhost:6379",
    SLACK_WEBHOOK_URL: process.env.SLACK_WEBHOOK_URL || "",
    OPENAI_API_KEY: process.env.OPENAI_API_KEY || "",
}