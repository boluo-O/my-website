"use client"
import { useEffect, useState, useRef } from "react"
import { SeatsCanvas, CanvasType } from "../seats-canvas/canvas"
import Image from "next/image"
const canvasTypes = [
    {
        id: 0,
        name: "Large Theatre",
        dataFile: "demoChartLargeTheatre.json",
        image: "large-theatre@2x.png",
        type: "2d",
    },
    {
        id: 1,
        name: "Theatre - Render By WebGL",
        dataFile: "demoChartLargeTheatre.json",
        image: "large-theatre@2x.png",
        type: "webgl",
    },
    {
        id: 2,
        name: "Small Theatre",
        dataFile: "demoChartSmallTheatre.json",
        image: "small-theatre@2x.png",
        type: "2d",
    },
    {
        id: 3,
        name: "Gala Dinner",
        dataFile: "demoChartGalaDinner.json",
        image: "gala-dinner@2x.png",
        type: "2d",
    },
]

export default function SeatsViewer() {
    const [activeCanvas, setActiveCanvas] = useState<number>(0)
    const mainCanvasBoxRef = useRef<HTMLDivElement | null>(null)
    const canvasInstanceRef = useRef<SeatsCanvas | null>(null)

    useEffect(() => {
        // Use the ref directly instead of getElementById
        const mainCanvasBox = mainCanvasBoxRef.current

        // Create main canvas using the ref
        const mainCanvas = new SeatsCanvas({
            canvasBox: mainCanvasBox as HTMLElement,
            type: canvasTypes[activeCanvas].type as CanvasType,
        })

        canvasInstanceRef.current = mainCanvas

        fetch(canvasTypes[activeCanvas].dataFile)
            .then((response) => response.json())
            .then((data) => {
                console.log("data", data)
                mainCanvas.loadDataRoot(data)
                mainCanvas.draw()
            })
            .catch((error) => console.error("Error:", error))

        return () => {
            canvasInstanceRef.current = null
        }
    }, [activeCanvas])

    const handleThumbnailClick = (id: number) => {
        setActiveCanvas(id)
    }

    return (
        <div className="flex flex-1 gap-6 h-full">
            {/* Left sidebar with thumbnails */}
            <div className="w-60 flex flex-col gap-4 overflow-y-auto pr-2 mx-4">
                {canvasTypes.map((canvas) => (
                    <div
                        key={canvas.id}
                        className={`p-3 border-2 flex flex-col items-center  rounded-lg cursor-pointer  ${
                            activeCanvas === canvas.id
                                ? "border-blue-500 shadow-md"
                                : "border-gray-300 hover:border-gray-400"
                        }`}
                        onClick={() => handleThumbnailClick(canvas.id)}
                    >
                        <div className="flex items-center gap-2 mb-2">
                            <p className="font-medium">{canvas.name}</p>
                        </div>

                        <Image
                            src={`/images/${canvas.image}`}
                            className="rounded "
                            alt={canvas.name}
                            width={144}
                            height={144}
                        />
                    </div>
                ))}
            </div>

            {/* Main canvas display */}
            <div className="flex-1 border-2 border-gray-300 rounded-lg overflow-hidden relative">
                <div className="absolute top-3 left-3 z-10 px-3 py-1  ">
                    <span className="text-lg mr-2"></span>
                    <span className="font-medium">
                        {canvasTypes[activeCanvas].name}
                    </span>
                </div>
                <div
                    ref={mainCanvasBoxRef}
                    id="main-canvas-box"
                    className="w-full h-full"
                ></div>
            </div>
        </div>
    )
}
