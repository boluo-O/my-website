"use client"
import { useEffect } from "react"
import { SeatsCanvas } from "./canvas"
export default function Home() {
    useEffect(() => {
        // const seatsCanvas1 = new SeatsCanvas({
        //     canvasBox: document.getElementById("canvas-box1") as HTMLElement,
        // })

        // const seatsCanvas2 = new SeatsCanvas({
        //     canvasBox: document.getElementById("canvas-box2") as HTMLElement,
        // })

        const seatsCanvas3 = new SeatsCanvas({
            canvasBox: document.getElementById("canvas-box3") as HTMLElement,
        })
        // fetch("demoChartGalaDinner.json")
        //     .then((response) => response.json())
        //     .then((data) => {
        //         console.log("data", data)
        //         seatsCanvas1.loadDataRoot(data)
        //         seatsCanvas1.draw()
        //     })
        //     .catch((error) => console.error("Error:", error))

        // fetch("demoChartSmallTheatre.json")
        //     .then((response) => response.json())
        //     .then((data) => {
        //         console.log("data", data)
        //         seatsCanvas2.loadDataRoot(data)
        //         seatsCanvas2.draw()
        //     })
        //     .catch((error) => console.error("Error:", error))

        fetch("demoChartLargeTheatre.json")
            .then((response) => response.json())
            .then((data) => {
                console.log("data", data)
                seatsCanvas3.loadDataRoot(data)
                seatsCanvas3.draw()
            })
            .catch((error) => console.error("Error:", error))

        const seatsCanvas4 = new SeatsCanvas({
            canvasBox: document.getElementById("canvas-box4") as HTMLElement,
            type: "webgl",
        })
        fetch("demoChartLargeTheatre.json")
            .then((response) => response.json())
            .then((data) => {
                console.log("data", data)
                seatsCanvas4.loadDataRoot(data)
                seatsCanvas4.draw()
            })
            .catch((error) => console.error("Error:", error))
    }, [])
    return (
        <div>
            <h1 className="text-3xl font-bold underline">Hello world!</h1>
            {/* <div
                className="w-[1000px] h-[600px] border-2 border-red-500"
                id="canvas-box1"
            ></div>
            <div
                className="w-[1000px] h-[600px] border-2 border-red-500"
                id="canvas-box2"
            ></div> */}
            <div
                className="w-[1000px] h-[600px] border-2 border-red-500"
                id="canvas-box3"
            ></div>
            <div
                className="w-[1000px] h-[600px] border-2 border-red-500"
                id="canvas-box4"
            ></div>
        </div>
    )
}
