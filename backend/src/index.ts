import express from "express"
import dotenv from "dotenv"
import { connectDB } from "./db/db.js"
dotenv.config({
    path: ".env"
})

const app = express()

connectDB();

app.use(express.json())

app.listen(process.env.PORT, () => {
    console.log(`Server is running on port ${process.env.PORT}`)
})