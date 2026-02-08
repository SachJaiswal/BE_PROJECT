import { io } from "socket.io-client"

// This automatically picks the correct URL from your .env file
const BACKEND_URL = (import.meta as any).env.VITE_BACKEND_URL

export const socket = io(BACKEND_URL)
