import { io } from "socket.io-client"
import dotenv from "dotenv"

dotenv.config()

// This automatically picks the correct URL from your .env file
const BACKEND_URL = process.env.VITE_BACKEND_URL || "http://localhost:3000"

console.log("Attempting to connect to backend at:", BACKEND_URL)
export const socket = io(BACKEND_URL)
