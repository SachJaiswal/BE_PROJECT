import axios from "axios"
import {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from "react"
import toast from "react-hot-toast"
import { useFileSystem } from "./FileContext"

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:3000"
type Language = {
  language: string
  version: string
}

type RunContextType = {
  setInput: (val: string) => void
  output: string
  isRunning: boolean
  supportedLanguages: Language[]
  selectedLanguage: Language | null
  setSelectedLanguage: (lang: Language) => void
  runCode: () => void
}

const RunCodeContext = createContext<RunContextType | null>(null)

export const useRunCode = () => {
  const ctx = useContext(RunCodeContext)
  if (!ctx) throw new Error("useRunCode must be used inside provider")
  return ctx
}

export const RunCodeContextProvider = ({
  children,
}: {
  children: ReactNode
}) => {
  const { activeFile } = useFileSystem()

  const [input, setInput] = useState("")
  const [output, setOutput] = useState("")
  const [isRunning, setIsRunning] = useState(false)
  const [supportedLanguages, setSupportedLanguages] = useState<Language[]>([])
  const [selectedLanguage, setSelectedLanguage] = useState<Language | null>(null)

  // ✅ Fetch languages from Piston
  useEffect(() => {
    const fetchLanguages = async () => {
      try {
        const res = await axios.get("https://emkc.org/api/v2/piston/runtimes")

        const langs = res.data.map((l: any) => ({
          language: l.language,
          version: l.version,
        }))

        setSupportedLanguages(langs)

        if (langs.length > 0) {
          setSelectedLanguage(langs[0]) // default language
        }
      } catch (err) {
        console.error(err)
        toast.error("Failed to load languages")
      }
    }

    fetchLanguages()
  }, [])

  // ✅ File name resolver (important for Java, etc.)
  const getFileName = (language: string, fileName?: string) => {
    if (fileName) return fileName

    const map: Record<string, string> = {
      java: "Main.java",
      python: "main.py",
      javascript: "main.js",
      cpp: "main.cpp",
      c: "main.c",
    }

    return map[language] || "main"
  }

  // ✅ Run code (FINAL)
  // const runCode = async () => {
  //   try {
  //     if (!selectedLanguage) return toast.error("Select language")
  //     if (!activeFile?.content) return toast.error("No code to run")

  //     setIsRunning(true)
  //     setOutput("")
  //     toast.loading("Running...")

  //     const response = await axios.post("http://localhost:3000/run", {
  //       language: selectedLanguage.language,
  //       version: selectedLanguage.version,
  //       files: [
  //         {
  //           name: getFileName(
  //             selectedLanguage.language,
  //             activeFile.name
  //           ),
  //           content: activeFile.content,
  //         },
  //       ],
  //       stdin: input || "",
  //     })

  //     console.log("Backend Response:", response.data)

  //     const result = response.data.run

  //     if (result.stderr) {
  //       setOutput(result.stderr)
  //     } else if (result.stdout) {
  //       setOutput(result.stdout)
  //     } else {
  //       setOutput(result.output)
  //     }

  //     toast.dismiss()
  //   } catch (error: any) {
  //     console.error("Execution error:", error)

  //     if (error.response) {
  //       setOutput(JSON.stringify(error.response.data, null, 2))
  //     } else {
  //       setOutput(error.message)
  //     }

  //     toast.dismiss()
  //     toast.error("Execution failed")
  //   } finally {
  //     setIsRunning(false)
  //   }
  // }

  const runCode = async () => {
  try {
    if (!selectedLanguage) return toast.error("Select language")
    if (!activeFile?.content) return toast.error("No code to run")

    setIsRunning(true)
    setOutput("")
    toast.loading("Running...")

    // ✅ FIXED: Use BACKEND_URL instead of hardcoded localhost
    const response = await axios.post(`${BACKEND_URL}/run`, {
      language: selectedLanguage.language,
      version: selectedLanguage.version,
      files: [
        {
          name: getFileName(
            selectedLanguage.language,
            activeFile.name
          ),
          content: activeFile.content,
        },
      ],
      stdin: input || "",
    })

    console.log("Backend Response:", response.data)

    const result = response.data.run

    if (result.stderr) {
      setOutput(result.stderr)
    } else if (result.stdout) {
      setOutput(result.stdout)
    } else {
      setOutput(result.output)
    }

    toast.dismiss()
  } catch (error: any) {
    console.error("Execution error:", error)

    if (error.response) {
      setOutput(JSON.stringify(error.response.data, null, 2))
    } else {
      setOutput(error.message)
    }

    toast.dismiss()
    toast.error("Execution failed")
  } finally {
    setIsRunning(false)
  }
}
  return (
    <RunCodeContext.Provider
      value={{
        setInput,
        output,
        isRunning,
        supportedLanguages,
        selectedLanguage,
        setSelectedLanguage,
        runCode,
      }}
    >
      {children}
    </RunCodeContext.Provider>
  )
}