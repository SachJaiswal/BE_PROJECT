// // import { ChatContext as ChatContextType, ChatMessage } from "@/types/chat"
// // import { SocketEvent } from "@/types/socket"
// // import {
// //     ReactNode,
// //     createContext,
// //     useContext,
// //     useEffect,
// //     useState,
// // } from "react"
// // import { useSocket } from "./SocketContext"

// // const ChatContext = createContext<ChatContextType | null>(null)

// // export const useChatRoom = (): ChatContextType => {
// //     const context = useContext(ChatContext)
// //     if (!context) {
// //         throw new Error("useChatRoom must be used within a ChatContextProvider")
// //     }
// //     return context
// // }

// // function ChatContextProvider({ children }: { children: ReactNode }) {
// //     const { socket } = useSocket()
// //     const [messages, setMessages] = useState<ChatMessage[]>([])
// //     const [isNewMessage, setIsNewMessage] = useState<boolean>(false)
// //     const [lastScrollHeight, setLastScrollHeight] = useState<number>(0)

// //     useEffect(() => {
// //         socket.on(
// //             SocketEvent.RECEIVE_MESSAGE,
// //             ({ message }: { message: ChatMessage }) => {
// //                 setMessages((messages) => [...messages, message])
// //                 setIsNewMessage(true)
// //             },
// //         )
// //         return () => {
// //             socket.off(SocketEvent.RECEIVE_MESSAGE)
// //         }
// //     }, [socket])

// //     return (
// //         <ChatContext.Provider
// //             value={{
// //                 messages,
// //                 setMessages,
// //                 isNewMessage,
// //                 setIsNewMessage,
// //                 lastScrollHeight,
// //                 setLastScrollHeight,
// //             }}
// //         >
// //             {children}
// //         </ChatContext.Provider>
// //     )
// // }

// // export { ChatContextProvider }
// // export default ChatContext
// import { ChatContext as ChatContextType, ChatMessage } from "@/types/chat"
// import { SocketEvent } from "@/types/socket"
// import {
//     ReactNode,
//     createContext,
//     useContext,
//     useEffect,
//     useState,
//     useCallback,
// } from "react"
// import { useSocket } from "./SocketContext"

// const ChatContext = createContext<ChatContextType | null>(null)

// export const useChatRoom = (): ChatContextType => {
//     const context = useContext(ChatContext)
//     if (!context) {
//         throw new Error("useChatRoom must be used within a ChatContextProvider")
//     }
//     return context
// }

// function ChatContextProvider({ children }: { children: ReactNode }) {
//     const { socket } = useSocket()
//     const [messages, setMessages] = useState<ChatMessage[]>([])
//     const [isNewMessage, setIsNewMessage] = useState<boolean>(false)
//     const [lastScrollHeight, setLastScrollHeight] = useState<number>(0)

//     // Clear messages function (useful when leaving rooms)
//     const clearMessages = useCallback(() => {
//         setMessages([])
//         setIsNewMessage(false)
//         setLastScrollHeight(0)
//     }, [])

//     // Listen for incoming messages from socket
//     useEffect(() => {
//         if (!socket) return

//         const handleReceiveMessage = ({ message }: { message: ChatMessage }) => {
//             console.log("📨 Received message:", message.id, message.message)
            
//             setMessages((prevMessages) => {
//                 // Prevent duplicate messages by checking if message ID already exists
//                 const messageExists = prevMessages.some(
//                     (existingMessage) => existingMessage.id === message.id
//                 )
                
//                 if (messageExists) {
//                     console.log("⚠️ Duplicate message prevented:", message.id)
//                     return prevMessages
//                 }
                
//                 return [...prevMessages, message]
//             })
//             setIsNewMessage(true)
//         }

//         // Set up the event listener
//         socket.on(SocketEvent.RECEIVE_MESSAGE, handleReceiveMessage)

//         // Cleanup: remove event listener when component unmounts or socket changes
//         return () => {
//             console.log("🧹 Cleaning up RECEIVE_MESSAGE listener")
//             socket.off(SocketEvent.RECEIVE_MESSAGE, handleReceiveMessage)
//         }
//     }, [socket]) // Re-run effect if socket instance changes

//     return (
//         <ChatContext.Provider
//             value={{
//                 messages,
//                 setMessages,
//                 isNewMessage,
//                 setIsNewMessage,
//                 lastScrollHeight,
//                 setLastScrollHeight,
//             }}
//         >
//             {children}
//         </ChatContext.Provider>
//     )
// }

// export { ChatContextProvider }
// export default ChatContext
import { ChatContext as ChatContextType, ChatMessage } from "@/types/chat"
import { SocketEvent } from "@/types/socket"
import {
    ReactNode,
    createContext,
    useContext,
    useEffect,
    useState,
} from "react"
import { useSocket } from "./SocketContext"

const ChatContext = createContext<ChatContextType | null>(null)

export const useChatRoom = (): ChatContextType => {
    const context = useContext(ChatContext)
    if (!context) {
        throw new Error("useChatRoom must be used within a ChatContextProvider")
    }
    return context
}

function ChatContextProvider({ children }: { children: ReactNode }) {
    const { socket } = useSocket()
    const [messages, setMessages] = useState<ChatMessage[]>([])
    const [isNewMessage, setIsNewMessage] = useState<boolean>(false)
    const [lastScrollHeight, setLastScrollHeight] = useState<number>(0)

    // Listen for incoming messages from socket
    useEffect(() => {
        if (!socket) return

        const handleReceiveMessage = ({ message }: { message: ChatMessage }) => {
            console.log("📨 Received message:", message.id, message.message)
            
            setMessages((prevMessages) => {
                // Prevent duplicate messages by checking if message ID already exists
                const messageExists = prevMessages.some(
                    (existingMessage) => existingMessage.id === message.id
                )
                
                if (messageExists) {
                    console.log("⚠️ Duplicate message prevented:", message.id)
                    return prevMessages
                }
                
                return [...prevMessages, message]
            })
            setIsNewMessage(true)
        }

        // Set up the event listener
        socket.on(SocketEvent.RECEIVE_MESSAGE, handleReceiveMessage)

        // Cleanup: remove event listener when component unmounts or socket changes
        return () => {
            console.log("🧹 Cleaning up RECEIVE_MESSAGE listener")
            socket.off(SocketEvent.RECEIVE_MESSAGE, handleReceiveMessage)
        }
    }, [socket])

    return (
        <ChatContext.Provider
            value={{
                messages,
                setMessages,
                isNewMessage,
                setIsNewMessage,
                lastScrollHeight,
                setLastScrollHeight,
            }}
        >
            {children}
        </ChatContext.Provider>
    )
}

export { ChatContextProvider }
export default ChatContext