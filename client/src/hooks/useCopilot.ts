import { useCopilot } from "@/context/CopilotContext"

export const useCopilotHook = () => {
    const { setInput, output, isRunning, generateCode, clearOutput } = useCopilot()
    
    return {
        setPrompt: setInput,
        generatedCode: output,
        isGenerating: isRunning,
        generate: generateCode,
        clear: clearOutput,
    }
}