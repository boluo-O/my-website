"use client"

import { Section } from "./element"
import { createStore } from "zustand/vanilla"

export const seatsCanvasStore = createStore<{
    colorMap: Record<string, string>
}>(() => ({
    colorMap: {},
}))
export class SeatsCanvas {
    scale = 1
    offsetX = 0
    offsetY = 0
    isDragging = false
    startX = 0
    startY = 0
    canvas: HTMLCanvasElement
    ctx: CanvasRenderingContext2D
    elements: any[] = []

    constructor({
        canvasBox = undefined,
    }: {
        width?: number
        height?: number
        canvasBox?: HTMLElement | undefined
    }) {
        this.initCanvas({ canvasBox })
    }

    initCanvas({
        canvasBox = undefined,
    }: {
        width?: number
        height?: number
        canvasBox?: HTMLElement | undefined
    }) {
        const canvas = document.createElement("canvas")
        let width = 500
        let height = 300
        if (canvasBox) {
            width = canvasBox.clientWidth
            height = canvasBox.clientHeight
            canvasBox.appendChild(canvas)
        } else {
            // Create Canvas element
            document.body.appendChild(canvas)
        }

        // Canvas settings
        const ratio = window.devicePixelRatio * 1.5 || 1
        // Actual rendering pixels
        canvas.width = width * ratio
        canvas.height = height * ratio
        // Control display size
        canvas.style.width = `${width}px`
        canvas.style.height = `${height}px`

        const ctx = canvas.getContext("2d") as CanvasRenderingContext2D
        ctx.scale(ratio, ratio)
        this.canvas = canvas
        this.ctx = ctx

        // Add resize handler
        // window.addEventListener("resize", this.handleResize.bind(this))
        this.bindCanvasControl()

        this.draw()
    }

    private handleResize() {
        if (!this.canvas) return

        const canvasBox = this.canvas.parentElement
        if (!canvasBox) return

        const width = canvasBox.clientWidth
        const height = canvasBox.clientHeight

        // Update canvas size
        const ratio = window.devicePixelRatio * 1.5 || 1
        this.canvas.width = width * ratio
        this.canvas.height = height * ratio
        this.canvas.style.width = `${width}px`
        this.canvas.style.height = `${height}px`

        // Reset high DPI scaling
        const ctx = this.canvas.getContext("2d") as CanvasRenderingContext2D
        ctx.scale(ratio, ratio)

        // Redraw using new size
        this.autoFit()
    }

    bindCanvasControl() {
        this.canvas.addEventListener("contextmenu", function (e) {
            e.preventDefault() // Prevent default right-click menu
            return false
        })
        // Handle mouse down event to start dragging
        this.canvas.addEventListener("mousedown", (event) => {
            event.preventDefault()
            if (event.button === 0 || event.button === 2) {
                // Left button
                this.isDragging = true
                this.startX = event.clientX - this.offsetX
                this.startY = event.clientY - this.offsetY
            }
        })

        // Handle mouse move event to drag
        this.canvas.addEventListener("mousemove", (event) => {
            if (this.isDragging) {
                this.offsetX = event.clientX - this.startX // Update offset
                this.offsetY = event.clientY - this.startY // Update offset
                this.draw() // Redraw canvas
            }
        })

        // Handle mouse up event to end dragging
        this.canvas.addEventListener("mouseup", () => {
            // End dragging
            this.isDragging = false
        })

        // Handle mouse leave event to end dragging
        this.canvas.addEventListener("mouseleave", () => {
            this.isDragging = false // End dragging
        })

        // Handle mouse wheel event to zoom
        this.canvas.addEventListener("wheel", (event) => {
            event.preventDefault() // Prevent default scroll behavior
            const mouseX =
                event.clientX - this.canvas.getBoundingClientRect().left // Get mouse X coordinate relative to Canvas
            const mouseY =
                event.clientY - this.canvas.getBoundingClientRect().top // Get mouse Y coordinate relative to Canvas

            const zoom = event.deltaY > 0 ? 0.9 : 1.1 // Determine zoom factor
            const newScale = this.scale * zoom // Calculate new scale
            this.scale = newScale

            // Calculate offset difference before and after zoom
            const dx = (mouseX - this.offsetX) * (zoom - 1)
            const dy = (mouseY - this.offsetY) * (zoom - 1)

            // Update offset and scale
            this.offsetX -= dx
            this.offsetY -= dy
            // Update scale
            this.draw() // Redraw
        })
    }

    loadDataRoot(data: any) {
        const { subChart, categories } = data
        seatsCanvasStore.setState({
            colorMap: Object.fromEntries(
                categories.list.map((v: any) => [
                    v.key,
                    { color: v.color, label: v.label },
                ])
            ),
        })
        const colorMap = seatsCanvasStore.getState().colorMap
        console.log("colorMap", colorMap)
        this.loadData(subChart)
    }

    loadData(chartdata: any) {
        const { sections, rows, shapes, tables, booths } = chartdata

        this.addElements(sections.map((v) => new Section(v)))
        // this.addElements(rows.map((v) => new Row(v)))
        // this.addElements(shapes.map((v) => new Shape(v)))
        // this.addElements(tables.map((v) => new Table(v)))
        // this.addElements(booths.map((v) => new Booth(v)))
    }

    addElements(elements: any[]) {
        for (const e of elements) {
            this.addElement(e)
        }
    }

    addElement(element: any) {
        this.elements.push(element)
    }

    autoFit() {
        const paddingX = 10
        const paddingY = 10
        const bounds = this.calculateBounds()
        if (!bounds) return

        // Calculate the actual usable size of the canvas (considering device pixel ratio)
        const ratio = window.devicePixelRatio * 1.5
        const canvasWidth = this.canvas.width / ratio
        const canvasHeight = this.canvas.height / ratio

        // Calculate scale factor
        const scaleX = (canvasWidth - paddingX * 2) / bounds.width
        const scaleY = (canvasHeight - paddingY * 2) / bounds.height
        this.scale = Math.min(scaleX, scaleY)

        // Calculate centering offset
        this.offsetX =
            (canvasWidth - bounds.width * this.scale) / 2 -
            bounds.minX * this.scale
        this.offsetY =
            (canvasHeight - bounds.height * this.scale) / 2 -
            bounds.minY * this.scale

        this.draw()
    }

    firstDraw() {
        this.autoFit()
        // this.draw()
    }

    draw() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height)
        this.ctx.save()
        this.ctx.translate(this.offsetX, this.offsetY)
        this.ctx.scale(this.scale, this.scale)

        for (const e of this.elements) {
            e.draw(this.ctx)
        }

        // this.ctx.fillStyle = "red"
        // this.ctx.lineWidth = 5
        // this.ctx.strokeStyle = "red"
        // this.ctx.beginPath()
        // this.ctx.rect(
        //     this.canvas.width / 2 - 50,
        //     this.canvas.height / 2 - 50,
        //     100,
        //     100
        // )
        // this.ctx.fill()
        // this.ctx.stroke()

        this.ctx.restore()
    }
}
