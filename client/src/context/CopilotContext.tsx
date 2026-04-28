import { ICopilotContext } from "@/types/copilot"
import { createContext, ReactNode, useContext, useState, useCallback, useRef } from "react"
import toast from "react-hot-toast"
import axiosInstance from "../api/copilotApi"

const CopilotContext = createContext<ICopilotContext | null>(null)

export const useCopilot = () => {
    const context = useContext(CopilotContext)
    if (context === null) {
        throw new Error("useCopilot must be used within a CopilotContextProvider")
    }
    return context
}

const CopilotContextProvider = ({ children }: { children: ReactNode }) => {
    const [input, setInput] = useState<string>("")
    const [output, setOutput] = useState<string>("")
    const [isRunning, setIsRunning] = useState<boolean>(false)
    const toastIdRef = useRef<string | null>(null)

    const generateCode = useCallback(async () => {
        // Validate input
        if (!input.trim()) {
            toast.error("Please write a prompt", { duration: 3000 })
            return
        }

        // Show loading toast
        toastIdRef.current = toast.loading("🤖 Generating code... Please wait", {
            duration: Infinity,
        })
        
        setIsRunning(true)
        
        try {
           const response = await axiosInstance.post("/api/generate-code-free", {
    prompt: input,
})
            
            // Dismiss loading toast
            if (toastIdRef.current) {
                toast.dismiss(toastIdRef.current)
            }
            
            if (response.data.success && response.data.code) {
                setOutput(response.data.code)
                toast.success("✨ Code generated successfully!", { duration: 3000 })
            } else {
                throw new Error(response.data.error || "Failed to generate code")
            }
            
        } catch (error: any) {
            console.error("Code generation error:", error)
            
            // Dismiss loading toast
            if (toastIdRef.current) {
                toast.dismiss(toastIdRef.current)
            }
            
            // Show error message
            let errorMessage = "Failed to generate code"
            
            if (error.response?.data?.error) {
                errorMessage = error.response.data.error
            } else if (error.message === "Network Error") {
                errorMessage = "Cannot connect to server. Please make sure the backend is running."
            } else if (error.code === "ECONNABORTED") {
                errorMessage = "Request timeout. Please try again."
            } else {
                errorMessage = error.message || "Failed to generate code"
            }
            
            toast.error(`❌ ${errorMessage}`, { duration: 4000 })
            
            // Set error output
            setOutput(`// Error generating code\n// ${errorMessage}\n// Please check:\n// 1. Backend server is running on port 3000\n// 2. Your internet connection\n// 3. Try again with a different prompt`)
            
        } finally {
            setIsRunning(false)
            toastIdRef.current = null
        }
    }, [input])

    const clearOutput = useCallback(() => {
        setOutput("")
        toast.success("Output cleared", { duration: 1500 })
    }, [])

    return (
        <CopilotContext.Provider
            value={{
                setInput,
                output,
                isRunning,
                generateCode,
                clearOutput,
            }}
        >
            {children}
        </CopilotContext.Provider>
    )
}

export { CopilotContextProvider }
export default CopilotContext