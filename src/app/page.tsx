"use client"
import { useEffect } from "react"
import { SeatsCanvas } from "./canvas"
export default function Home() {
    useEffect(() => {
        const canvasBox = document.getElementById("canvas-box")
        if (canvasBox) {
            const seatsCanvas = new SeatsCanvas({
                canvasBox: canvasBox,
            })
            fetch("demoChartGalaDinner.json")
                .then((response) => response.json())
                .then((data) => {
                    console.log("data", data)
                    seatsCanvas.loadDataRoot(data)
                    seatsCanvas.draw()
                })
                .catch((error) => console.error("Error:", error))

            // fetch("demoChartSmallTheatre.json")
            //     .then((response) => response.json())
            //     .then((data) => {
            //         console.log("data", data)
            //         seatsCanvas.loadDataRoot(data)
            //         seatsCanvas.draw()
            //     })
            //     .catch((error) => console.error("Error:", error))

            // fetch("demoChartLargeTheatre.json")
            //     .then((response) => response.json())
            //     .then((data) => {
            //         console.log("data", data)
            //         seatsCanvas.loadDataRoot(data)
            //         seatsCanvas.draw()
            //     })
            //     .catch((error) => console.error("Error:", error))
        }
    }, [])
    return (
        <div>
            <h1 className="text-3xl font-bold underline">Hello world!</h1>
            <div
                className="w-[1000px] h-[600px] border-2 border-red-500"
                id="canvas-box"
            ></div>
        </div>
    )
}
