"use client"
import { useEffect } from "react"
import { SeatsCanvas } from "./canvas"
export default function Home() {
    useEffect(() => {
        const canvasBox = document.getElementById("canvas-box")
        if (canvasBox) {
            const canvas = new SeatsCanvas({
                canvasBox: canvasBox,
            })

            // canvas.draw()
        }
    }, [])
    return (
        <div>
            <h1 className="text-3xl font-bold underline">Hello world!</h1>
            <div
                className="w-[300px] h-[300px] border-2 border-red-500"
                id="canvas-box"
            ></div>
        </div>
    )
}
