import express, { Response, Request } from "express"
import dotenv from "dotenv"
import http from "http"
import cors from "cors"
import fetch from "node-fetch"
import { SocketEvent, SocketId } from "./types/socket"
import { USER_CONNECTION_STATUS, User } from "./types/user"
import { Server } from "socket.io"

dotenv.config()

const app = express()

const CLIENT_URL = process.env.CLIENT_URL || "http://localhost:5173"

app.use(cors({
  origin: CLIENT_URL,
  methods: ["GET", "POST", "OPTIONS"],
  credentials: true,
}))

app.use(express.json())

// Update this function in your server.ts
const getExtension = (language: string) => {
  const map: Record<string, string> = {
    java: "java",
    python: "py",
    javascript: "js",
    cpp: "cpp",
    "c++": "cpp",      // Add this
    c: "c",
    typescript: "ts",
    go: "go",
    rust: "rs",
    php: "php",
    ruby: "rb",
    swift: "swift",
    kotlin: "kt",
  }
  return map[language.toLowerCase()] || "txt"
}
// app.post("/run", async (req: Request, res: Response) => {
//   try {
//     const { language, files, stdin } = req.body
//     const code = files?.[0]?.content || ""

//     if (!code) {
//       return res.status(400).json({ error: "No code provided" })
//     }

//     const response = await fetch("https://api.onecompiler.com/api/v1/run", {
//       method: "POST",
//       headers: {
//         "Content-Type": "application/json",
//         "X-API-Key": process.env.ONECOMPILER_API_KEY as string,
//       },
//       body: JSON.stringify({
//         language: language,
//         stdin: stdin || "",
//         files: [
//           {
//             name: `Main.${getExtension(language)}`,
//             content: code,
//           },
//         ],
//       }),
//     })

//     const data = (await response.json()) as any
//     res.json({
//       run: {
//         stdout: data.stdout,
//         stderr: data.stderr,
//         output: data.stdout || data.stderr || data.error || "No output",
//       },
//     })
//   } catch (error) {
//     console.error("Execution error:", error)
//     res.status(500).json({ error: "Execution failed" })
//   }
// })

app.post("/run", async (req: Request, res: Response) => {
  try {
    const { language, files, stdin } = req.body
    const code = files?.[0]?.content || ""

    if (!code) {
      return res.status(400).json({ error: "No code provided" })
    }

    // Normalize language name
    let normalizedLang = language.toLowerCase()
    if (normalizedLang === "c++" || normalizedLang === "cpp") {
      normalizedLang = "cpp"
    }

    const response = await fetch("https://api.onecompiler.com/api/v1/run", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-API-Key": process.env.ONECOMPILER_API_KEY as string,
      },
      body: JSON.stringify({
        language: normalizedLang,
        stdin: stdin || "",
        files: [
          {
            name: `Main.${getExtension(normalizedLang)}`,
            content: code,
          },
        ],
      }),
    })

    const data = (await response.json()) as any
    
    // Better error handling
    if (data.error) {
      return res.status(400).json({ 
        run: { 
          stdout: "", 
          stderr: data.error,
          output: data.error 
        } 
      })
    }
    
    res.json({
      run: {
        stdout: data.stdout || "",
        stderr: data.stderr || "",
        output: (data.stdout || data.stderr || data.error || "No output").trim(),
      },
    })
  } catch (error) {
    console.error("Execution error:", error)
    res.status(500).json({ error: "Execution failed" })
  }
})
// ✅ CORRECTED: Hugging Face Code Generation
app.post("/api/generate-code", async (req: Request, res: Response) => {
  try {
    const { prompt } = req.body

    if (!prompt || prompt.trim().length === 0) {
      return res.status(400).json({ 
        success: false, 
        error: "Prompt is required" 
      })
    }

    console.log("🎨 Generating code for prompt:", prompt.substring(0, 100))

    const HUGGING_FACE_API_KEY = process.env.HUGGING_FACE_API_KEY || ""
    
    if (!HUGGING_FACE_API_KEY) {
      console.error("❌ HUGGING_FACE_API_KEY not set in .env file")
      return res.status(500).json({ 
        success: false, 
        error: "API key not configured. Please add HUGGING_FACE_API_KEY to .env file"
      })
    }

    // Updated: Correct Hugging Face API endpoint format
    const models = [
      "microsoft/CodeGPT-small-py",
      "bigcode/starcoder2-3b",
      "codellama/CodeLlama-7b-Python-hf"
    ]
    
    let lastError = null
    
    for (const model of models) {
      try {
        console.log(`Trying model: ${model}`)
        
        // CORRECT API endpoint URL
        const apiUrl = `https://api-inference.huggingface.co/models/${model}`
        
        const response = await fetch(apiUrl, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${HUGGING_FACE_API_KEY}`
          },
          body: JSON.stringify({
            inputs: `Generate only Java code for: ${prompt}. Return ONLY the code, no explanations.`,
            parameters: {
              max_new_tokens: 500,
              temperature: 0.7,
              do_sample: true
            }
          })
        })
        
        if (response.ok) {
          const data = await response.json() as any
          let generatedCode = ""
          
          // Handle different response formats
          if (Array.isArray(data) && data[0]?.generated_text) {
            generatedCode = data[0].generated_text
          } else if (data.generated_text) {
            generatedCode = data.generated_text
          } else if (typeof data === 'string') {
            generatedCode = data
          } else {
            generatedCode = JSON.stringify(data)
          }
          
          // Clean up the response
          generatedCode = generatedCode
            .replace(prompt, "")
            .replace(/^generate only java code for:.*$/i, "")
            .trim()
          
          // Format as Java code block
          const formattedCode = `\`\`\`java\n${generatedCode}\n\`\`\``
          
          console.log(`✅ Code generated successfully using ${model}`)
          
          return res.json({ 
            success: true, 
            code: formattedCode,
            prompt: prompt,
            model: model
          })
        } else {
          const errorText = await response.text()
          console.log(`Model ${model} failed with status ${response.status}:`, errorText.substring(0, 200))
          lastError = `Model ${model} failed: ${response.status}`
        }
      } catch (err: any) {
        console.log(`Model ${model} error:`, err.message)
        lastError = err.message
      }
    }
    
    throw new Error(lastError || "All models failed")

  } catch (error: any) {
    console.error("❌ Code generation error:", error)
    res.status(500).json({ 
      success: false, 
      error: error.message || "Failed to generate code"
    })
  }
})

// ✅ Alternative: Use OpenRouter (Free, no API key needed for some models)
app.post("/api/generate-code-free", async (req: Request, res: Response) => {
  try {
    const { prompt } = req.body

    if (!prompt || prompt.trim().length === 0) {
      return res.status(400).json({ success: false, error: "Prompt is required" })
    }

    console.log("🎨 Using free OpenRouter API for:", prompt.substring(0, 100))

    // OpenRouter free endpoint (no API key required for some models)
    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "HTTP-Referer": "http://localhost:5173",
        "X-Title": "Code Collab"
      },
      body: JSON.stringify({
        model: "mistralai/mistral-7b-instruct:free",
        messages: [
          {
            role: "system",
            content: "You are a code generator. Return ONLY the code, no explanations. Format with markdown code blocks."
          },
          {
            role: "user",
            content: `Generate Java code for: ${prompt}`
          }
        ],
        max_tokens: 500
      })
    })

    const data = await response.json() as any
    
    if (data.choices && data.choices[0]?.message?.content) {
      let code = data.choices[0].message.content
      
      // If code doesn't have markdown formatting, add it
      if (!code.includes('```')) {
        code = `\`\`\`java\n${code}\n\`\`\``
      }
      
      return res.json({ 
        success: true, 
        code: code,
        prompt: prompt
      })
    } else {
      throw new Error(data.error?.message || "Failed to generate code")
    }
  } catch (error: any) {
    console.error("Free API error:", error)
    res.status(500).json({ success: false, error: error.message })
  }
})

// ✅ Simple test endpoint
app.get("/api/test", (req: Request, res: Response) => {
  res.json({ 
    success: true, 
    message: "Server is working!",
    timestamp: new Date().toISOString()
  })
})

app.get("/api/health", (req: Request, res: Response) => {
  res.json({ 
    status: "ok", 
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  })
})

// ================= SOCKET SERVER =================
const server = http.createServer(app)

const io = new Server(server, {
  cors: {
    origin: CLIENT_URL,
    methods: ["GET", "POST"],
  },
  maxHttpBufferSize: 1e8,
  pingTimeout: 60000,
})

let userSocketMap: User[] = []

function getUsersInRoom(roomId: string): User[] {
  return userSocketMap.filter((user) => user.roomId == roomId)
}

function getRoomId(socketId: SocketId): string | null {
  const roomId = userSocketMap.find((user) => user.socketId === socketId)?.roomId
  if (!roomId) return null
  return roomId
}

function getUserBySocketId(socketId: SocketId): User | null {
  return userSocketMap.find((user) => user.socketId === socketId) || null
}

io.on("connection", (socket) => {
  console.log("🟢 New client connected:", socket.id)

  socket.on(SocketEvent.JOIN_REQUEST, ({ roomId, username }) => {
    const isUsernameExist = getUsersInRoom(roomId).filter(
      (u) => u.username === username
    )

    if (isUsernameExist.length > 0) {
      io.to(socket.id).emit(SocketEvent.USERNAME_EXISTS)
      return
    }

    const user = {
      username,
      roomId,
      status: USER_CONNECTION_STATUS.ONLINE,
      cursorPosition: 0,
      typing: false,
      socketId: socket.id,
      currentFile: null,
    }

    userSocketMap.push(user)
    socket.join(roomId)

    socket.broadcast.to(roomId).emit(SocketEvent.USER_JOINED, { user })

    const users = getUsersInRoom(roomId)
    io.to(socket.id).emit(SocketEvent.JOIN_ACCEPTED, { user, users })
  })

  socket.on("disconnecting", () => {
    const user = getUserBySocketId(socket.id)
    if (!user) return

    const roomId = user.roomId
    socket.broadcast.to(roomId).emit(SocketEvent.USER_DISCONNECTED, { user })
    userSocketMap = userSocketMap.filter((u) => u.socketId !== socket.id)
    socket.leave(roomId)
  })

  // File update events
  socket.on(SocketEvent.SYNC_FILE_STRUCTURE, ({ fileStructure, openFiles, activeFile, socketId }) => {
    io.to(socketId).emit(SocketEvent.SYNC_FILE_STRUCTURE, { fileStructure, openFiles, activeFile })
  })

  socket.on(SocketEvent.FILE_UPDATED, ({ fileId, newContent }) => {
    const roomId = getRoomId(socket.id)
    if (roomId) {
      socket.broadcast.to(roomId).emit(SocketEvent.FILE_UPDATED, { fileId, newContent })
    }
  })

  socket.on(SocketEvent.SEND_MESSAGE, ({ message }) => {
    const roomId = getRoomId(socket.id)
    if (roomId) {
      io.to(roomId).emit(SocketEvent.RECEIVE_MESSAGE, { message })
    }
  })

  socket.on(SocketEvent.USER_ONLINE, ({ socketId }) => {
    const roomId = getRoomId(socket.id)
    if (roomId) {
      socket.broadcast.to(roomId).emit(SocketEvent.USER_ONLINE, { socketId })
    }
  })

  socket.on(SocketEvent.USER_OFFLINE, ({ socketId }) => {
    const roomId = getRoomId(socket.id)
    if (roomId) {
      socket.broadcast.to(roomId).emit(SocketEvent.USER_OFFLINE, { socketId })
    }
  })
})

const PORT = process.env.PORT || 3000

server.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`)
  console.log(`✅ CORS enabled for: ${CLIENT_URL}`)
  console.log(`✅ Test endpoint: http://localhost:${PORT}/api/test`)
  console.log(`✅ Hugging Face endpoint: /api/generate-code`)
  console.log(`✅ Free API endpoint: /api/generate-code-free`)
})