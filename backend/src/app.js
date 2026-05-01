import express from "express"
import morgan from "morgan"
const app = express()

app.use(morgan("dev"))
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

import errorRoutes from "./routes/error.routes.js"

app.use("/api/v1/errors", errorRoutes)

export default app;
