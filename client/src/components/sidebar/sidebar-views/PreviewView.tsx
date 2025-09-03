import { useEffect, useMemo, useRef } from "react"
import { useFileSystem } from "@/context/FileContext"
import useResponsive from "@/hooks/useResponsive"

function PreviewView() {
    const { activeFile } = useFileSystem()
    const { viewHeight } = useResponsive()
    const iframeRef = useRef<HTMLIFrameElement | null>(null)

    const isHtml = useMemo(() => {
        const name = activeFile?.name || ""
        return name.toLowerCase().endsWith(".html")
    }, [activeFile?.name])

    useEffect(() => {
        if (!iframeRef.current || !isHtml) return
        const doc = iframeRef.current.contentDocument
        if (!doc) return
        doc.open()
        doc.write(activeFile?.content || "")
        doc.close()
    }, [activeFile?.content, isHtml])

    return (
        <div className="flex w-full flex-col gap-2 p-4" style={{ height: viewHeight }}>
            <h1 className="view-title">HTML Preview</h1>
            {!isHtml ? (
                <div className="flex items-center justify-center rounded-md bg-darkHover p-4 text-center text-white">
                    Open an .html file to see a live preview here.
                </div>
            ) : (
                <iframe
                    ref={iframeRef}
                    title="HTML Preview"
                    className="h-full w-full rounded-md border-0 bg-white"
                    sandbox="allow-scripts allow-same-origin"
                />
            )}
        </div>
    )
}

export default PreviewView


