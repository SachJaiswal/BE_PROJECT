// import { useCopilot } from "@/context/CopilotContext"
// import { useFileSystem } from "@/context/FileContext"
// import { useSocket } from "@/context/SocketContext"
// import useResponsive from "@/hooks/useResponsive"
// import { SocketEvent } from "@/types/socket"
// import toast from "react-hot-toast"
// import { LuClipboardPaste, LuCopy, LuRepeat } from "react-icons/lu"
// import ReactMarkdown from "react-markdown"
// import { Prism as SyntaxHighlighter } from "react-syntax-highlighter"
// import { dracula } from "react-syntax-highlighter/dist/esm/styles/prism"

// function CopilotView() {
//     const {socket} = useSocket()
//     const { viewHeight } = useResponsive()
//     const { generateCode, output, isRunning, setInput } = useCopilot()
//     const { activeFile, updateFileContent, setActiveFile } = useFileSystem()

//     const copyOutput = async () => {
//         try {
//             const content = output.replace(/```[\w]*\n?/g, "").trim()
//             await navigator.clipboard.writeText(content)
//             toast.success("Output copied to clipboard")
//         } catch (error) {
//             toast.error("Unable to copy output to clipboard")
//             console.log(error)
//         }
//     }

//     const pasteCodeInFile = () => {
//         if (activeFile) {
//             const fileContent = activeFile.content
//                 ? `${activeFile.content}\n`
//                 : ""
//             const content = `${fileContent}${output.replace(/```[\w]*\n?/g, "").trim()}`
//             updateFileContent(activeFile.id, content)
//             // Update the content of the active file if it's the same file
//             setActiveFile({ ...activeFile, content })
//             toast.success("Code pasted successfully")
//             // Emit the FILE_UPDATED event to the server
//             socket.emit(SocketEvent.FILE_UPDATED, {
//                 fileId: activeFile.id,
//                 newContent: content,
//             })
//         }
//     }

//     const replaceCodeInFile = () => {
//         if (activeFile) {
//             const isConfirmed = confirm(
//                 `Are you sure you want to replace the code in the file?`,
//             )
//             if (!isConfirmed) return
//             const content = output.replace(/```[\w]*\n?/g, "").trim()
//             updateFileContent(activeFile.id, content)
//             // Update the content of the active file if it's the same file
//             setActiveFile({ ...activeFile, content })
//             toast.success("Code replaced successfully")
//             // Emit the FILE_UPDATED event to the server
//             socket.emit(SocketEvent.FILE_UPDATED, {
//                 fileId: activeFile.id,
//                 newContent: content,
//             })
//         }
//     }

//     return (
//         <div
//             className="flex max-h-full min-h-[400px] w-full flex-col gap-2 p-4"
//             style={{ height: viewHeight }}
//         >
//             <h1 className="view-title">Copilot</h1>
//             <textarea
//                 className="min-h-[120px] w-full rounded-md border-none bg-darkHover p-2 text-white outline-none"
//                 placeholder="What code do you want to generate?"
//                 onChange={(e) => setInput(e.target.value)}
//             />
//             <button
//                 className="mt-1 flex w-full justify-center rounded-md bg-primary p-2 font-bold text-black outline-none disabled:cursor-not-allowed disabled:opacity-50"
//                 onClick={generateCode}
//                 disabled={isRunning}
//             >
//                 {isRunning ? "Generating..." : "Generate Code"}
//             </button>
//             {output && (
//                 <div className="flex justify-end gap-4 pt-2">
//                     <button title="Copy Output" onClick={copyOutput}>
//                         <LuCopy
//                             size={18}
//                             className="cursor-pointer text-white"
//                         />
//                     </button>
//                     <button
//                         title="Replace code in file"
//                         onClick={replaceCodeInFile}
//                     >
//                         <LuRepeat
//                             size={18}
//                             className="cursor-pointer text-white"
//                         />
//                     </button>
//                     <button
//                         title="Paste code in file"
//                         onClick={pasteCodeInFile}
//                     >
//                         <LuClipboardPaste
//                             size={18}
//                             className="cursor-pointer text-white"
//                         />
//                     </button>
//                 </div>
//             )}
//             <div className="h-full rounded-lg w-full overflow-y-auto p-0">
//                 <ReactMarkdown
//                     components={{
//                         // eslint-disable-next-line @typescript-eslint/no-explicit-any
//                         code({ inline, className, children, ...props }: any) {
//                             const match = /language-(\w+)/.exec(className || "")
//                             const language = match ? match[1] : "javascript" // Default to JS

//                             return !inline ? (
//                                 <SyntaxHighlighter
//                                     style={dracula}
//                                     language={language}
//                                     PreTag="pre"
//                                     className="!m-0 !h-full !rounded-lg !bg-gray-900 !p-2"
//                                 >
//                                     {String(children).replace(/\n$/, "")}
//                                 </SyntaxHighlighter>
//                             ) : (
//                                 <code className={className} {...props}>
//                                     {children}
//                                 </code>
//                             )
//                         },
//                         pre({ children }) {
//                             return <pre className="h-full">{children}</pre>
//                         },
//                     }}
//                 >
//                     {output}
//                 </ReactMarkdown>
//             </div>
//         </div>
//     )
// }

// export default CopilotView
import { useCopilot } from "@/context/CopilotContext"
import { useState, useEffect, useRef } from "react"
import { LuSparkles, LuCopy, LuTrash2, LuCheck, LuAlertCircle } from "react-icons/lu"
import toast from "react-hot-toast"

function CopilotView() {
    const { setInput, output, isRunning, generateCode, clearOutput } = useCopilot()
    const [prompt, setPrompt] = useState("")
    const [copied, setCopied] = useState(false)
    const textareaRef = useRef<HTMLTextAreaElement>(null)

    const handleGenerate = () => {
        setInput(prompt)
        generateCode()
    }

    const handleClear = () => {
        setPrompt("")
        if (clearOutput) clearOutput()
        if (textareaRef.current) {
            textareaRef.current.focus()
        }
    }

    const copyToClipboard = async () => {
        if (output && output !== "// Generating code..." && !output.includes("Error")) {
            try {
                await navigator.clipboard.writeText(output)
                setCopied(true)
                toast.success("Code copied to clipboard!")
                setTimeout(() => setCopied(false), 2000)
            } catch (err) {
                toast.error("Failed to copy code")
            }
        } else if (output && output.includes("Error")) {
            toast.error("Cannot copy error message")
        }
    }

    // Auto-resize textarea
    useEffect(() => {
        if (textareaRef.current) {
            textareaRef.current.style.height = "auto"
            textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`
        }
    }, [prompt])

    // Example prompts for quick access
    const examplePrompts = [
        "Create a React component for a counter with increment/decrement buttons",
        "Write a JavaScript function to check if a string is a palindrome",
        "Create a CSS flexbox grid layout for a photo gallery",
        "Write a Python function to fetch data from an API",
        "Create a simple HTML/CSS login form",
    ]

    const setExamplePrompt = (example: string) => {
        setPrompt(example)
        if (textareaRef.current) {
            textareaRef.current.focus()
        }
    }

    return (
        <div className="flex h-full flex-col p-4">
            <h2 className="view-title flex items-center gap-2">
                <LuSparkles className="text-green-400" />
                AI Copilot
                <span className="ml-auto text-xs text-gray-500">Powered by Pollinations AI</span>
            </h2>
            
            <div className="flex-1 space-y-4 overflow-y-auto">
                {/* Input Section */}
                <div>
                    <label className="mb-2 block text-sm font-medium text-gray-300">
                        What code would you like to generate?
                    </label>
                    <textarea
                        ref={textareaRef}
                        value={prompt}
                        onChange={(e) => setPrompt(e.target.value)}
                        placeholder="Example: Create a React component for a todo list with add/delete functionality"
                        className="h-32 w-full rounded-lg border border-gray-600 bg-gray-800 p-3 text-white placeholder-gray-400 focus:border-green-500 focus:outline-none focus:ring-2 focus:ring-green-500"
                        disabled={isRunning}
                        rows={3}
                    />
                </div>

                {/* Example Prompts */}
                <div>
                    <label className="mb-2 block text-xs font-medium text-gray-400">
                        Quick examples:
                    </label>
                    <div className="flex flex-wrap gap-2">
                        {examplePrompts.slice(0, 3).map((example, index) => (
                            <button
                                key={index}
                                onClick={() => setExamplePrompt(example)}
                                className="rounded-full bg-gray-700 px-3 py-1 text-xs text-gray-300 transition hover:bg-gray-600 hover:text-white"
                                disabled={isRunning}
                            >
                                {example.substring(0, 30)}...
                            </button>
                        ))}
                    </div>
                </div>
                
                {/* Action Buttons */}
                <div className="flex gap-3">
                    <button
                        onClick={handleGenerate}
                        disabled={isRunning || !prompt.trim()}
                        className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-green-600 px-4 py-2.5 font-semibold text-white transition hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                        {isRunning ? (
                            <>
                                <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                                Generating...
                            </>
                        ) : (
                            <>
                                <LuSparkles size={18} />
                                Generate Code
                            </>
                        )}
                    </button>
                    
                    <button
                        onClick={handleClear}
                        disabled={isRunning}
                        className="flex items-center gap-2 rounded-lg bg-gray-700 px-4 py-2.5 font-semibold text-gray-300 transition hover:bg-gray-600 hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
                    >
                        <LuTrash2 size={18} />
                        Clear
                    </button>
                </div>
                
                {/* Output Section */}
                {output && (
                    <div className="mt-4">
                        <div className="mb-2 flex items-center justify-between">
                            <label className="text-sm font-medium text-gray-300">
                                Generated Code:
                            </label>
                            <div className="flex gap-2">
                                <button
                                    onClick={copyToClipboard}
                                    disabled={output.includes("Error") || output === "// Generating code..."}
                                    className="rounded p-1.5 text-gray-400 transition hover:bg-gray-700 hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
                                    title="Copy to clipboard"
                                >
                                    {copied ? <LuCheck size={18} className="text-green-500" /> : <LuCopy size={18} />}
                                </button>
                            </div>
                        </div>
                        
                        {/* Error Alert */}
                        {output.includes("Error") && (
                            <div className="mb-3 flex items-center gap-2 rounded-lg bg-red-900/30 border border-red-700 p-3 text-red-300">
                                <LuAlertCircle className="flex-shrink-0" />
                                <span className="text-sm">{output.split("\n")[1]?.replace("// ", "") || "An error occurred"}</span>
                            </div>
                        )}
                        
                        <div className="relative">
                            <pre className="max-h-96 overflow-auto rounded-lg bg-gray-900 p-4 text-sm text-gray-300">
                                <code className="whitespace-pre-wrap break-words">{output}</code>
                            </pre>
                        </div>
                    </div>
                )}

                {/* Info Message when no output */}
                {!output && !isRunning && (
                    <div className="mt-8 rounded-lg border border-dashed border-gray-700 bg-gray-800/50 p-6 text-center">
                        <LuSparkles size={32} className="mx-auto mb-2 text-gray-500" />
                        <p className="text-sm text-gray-400">
                            Enter a prompt above and click "Generate Code" to get started.
                        </p>
                        <p className="mt-1 text-xs text-gray-500">
                            You can ask for React components, JavaScript functions, Python scripts, CSS styles, and more!
                        </p>
                    </div>
                )}
            </div>
        </div>
    )
}

export default CopilotView