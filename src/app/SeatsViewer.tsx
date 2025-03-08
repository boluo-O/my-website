"use client"
import { useEffect, useState, useRef, useMemo } from "react"
import { SeatsCanvas, CanvasType } from "../seats-canvas/canvas"
import Image from "next/image"
const seatsRenderTemplates = [
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
        image: "large-theatre-webgl.png",
        type: "webgl",
    },
    {
        id: 2,
        name: "WebGL big data test for 200 section",
        dataFile: "testLargeTheatre.json",
        image: "many-seats.png",
        type: "webgl",
    },
    {
        id: 3,
        name: "Small Theatre",
        dataFile: "demoChartSmallTheatre.json",
        image: "small-theatre@2x.png",
        type: "2d",
    },
    {
        id: 4,
        name: "Gala Dinner",
        dataFile: "demoChartGalaDinner.json",
        image: "gala-dinner@2x.png",
        type: "2d",
    },
]

function generateFakeData(originalData: any, sectionNumber: number) {
    const templateSection = originalData.subChart.sections[0]
    const templateSectionWidth = templateSection.subChart.width
    const templateSectionHeight = templateSection.subChart.height
    const rowSectionNumber = Math.floor(Math.sqrt(sectionNumber)) // draw as square
    const borderGap = 50
    const centerGapX = templateSectionWidth + borderGap
    const centerGapY = templateSectionHeight + borderGap

    const sections: any[] = []
    for (let i = 0; i < sectionNumber; i++) {
        const offsetX = ((i + rowSectionNumber) % rowSectionNumber) * centerGapX
        const offsetY = Math.floor(i / rowSectionNumber) * centerGapY

        sections.push({
            ...templateSection,
            height: templateSectionHeight,
            width: templateSectionWidth,
            topLeft: {
                x: templateSection.topLeft.x + offsetX,
                y: templateSection.topLeft.y + offsetY,
            },
            points: templateSection.points.map((v: any) => {
                return {
                    x: v.x + offsetX,
                    y: v.y + offsetY,
                }
            }),
        })
    }
    originalData.subChart.sections = sections
    originalData.subChart.width =
        rowSectionNumber * templateSectionWidth +
        (rowSectionNumber - 1) * borderGap
    originalData.subChart.height =
        rowSectionNumber * templateSectionHeight +
        (rowSectionNumber - 1) * borderGap
    return originalData
}

export default function SeatsViewer() {
    const [activeCanvas, setActiveCanvas] = useState<number>(0)
    const mainCanvasBoxRef = useRef<HTMLDivElement | null>(null)
    const canvasInstanceRef = useRef<SeatsCanvas | null>(null)
    const [sectionNumber, setSectionNumber] = useState<number>(200)

    const activeTemplate = useMemo(() => {
        return seatsRenderTemplates.find((v) => v.id === activeCanvas)
    }, [activeCanvas])

    useEffect(() => {
        const mainCanvasBox = mainCanvasBoxRef.current

        const mainCanvas = new SeatsCanvas({
            canvasBox: mainCanvasBox as HTMLElement,
            type: activeTemplate?.type as CanvasType,
        })

        canvasInstanceRef.current = mainCanvas

        fetch(activeTemplate?.dataFile as string)
            .then((response) => response.json())
            .then((data) => {
                console.log("data", data)
                if (activeCanvas === 2) {
                    data = generateFakeData(data, sectionNumber)
                    console.log("data--fake", data)
                }

                mainCanvas.loadDataRoot(data)
                mainCanvas.draw()
            })
            .catch((error) => console.error("Error:", error))

        return () => {
            canvasInstanceRef.current = null
        }
    }, [activeCanvas, sectionNumber])

    const handleThumbnailClick = (id: number) => {
        setActiveCanvas(id)
    }

    return (
        <div className="flex flex-1 gap-6 h-full">
            {/* Left sidebar with thumbnails */}
            <div className="w-60 flex flex-col gap-4 overflow-y-auto pr-2 mx-4">
                {seatsRenderTemplates.map((canvas) => (
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
                    <span className="font-medium">{activeTemplate?.name}</span>
                </div>
                {activeCanvas === 2 && (
                    <div className="absolute top-3 left-[50%] translate-x-[-50%] z-10 px-3 py-1  ">
                        <div className="flex items-center gap-3 bg-white/90 backdrop-blur-sm px-4 py-2 rounded-lg shadow-sm border border-gray-200">
                            <span className="text-sm text-gray-700">
                                Section Number
                            </span>
                            <div className="relative">
                                <input
                                    value={sectionNumber}
                                    type="number"
                                    className="w-50 px-1 py-1 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-center [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                    onChange={(e) =>
                                        setSectionNumber(Number(e.target.value))
                                    }
                                />
                            </div>
                            <span className="text-sm text-gray-700">
                                × 422 = {sectionNumber * 422} seats
                            </span>
                        </div>
                    </div>
                )}
                <div
                    ref={mainCanvasBoxRef}
                    id="main-canvas-box"
                    className="w-full h-full"
                ></div>
            </div>
        </div>
    )
}
