"use client"

import { Row, Section, Table } from "./element"
import { createStore } from "zustand/vanilla"
import { drawCircle, drawCircleListByWebGL } from "./shape"

function createPreciseCircles(canvas: HTMLCanvasElement) {
    const circlesData = [
        { x: 200, y: 150, radius: 50, color: [1, 0, 0, 0.8] }, // 红色
        { x: 400, y: 250, radius: 80, color: [0, 1, 0, 0.8] }, // 绿色
        { x: 600, y: 100, radius: 60, color: [0, 0, 1, 0.8] }, // 蓝色
        { x: 300, y: 450, radius: 70, color: [1, 1, 0, 0.8] }, // 黄色
        { x: 700, y: 500, radius: 40, color: [1, 0, 1, 0.8] }, // 品红
    ]

    const gl = canvas.getContext("webgl2")

    if (!gl) {
        // console.error("WebGL 2.0 not supported")
        return
    }

    // 顶点着色器
    const vertexShaderSource = `#version 300 es
    in vec2 a_position;  // 基础顶点
    in vec2 a_offset;    // 圆心偏移
    in float a_radius;   // 圆半径
    in vec4 a_color;     // 圆颜色

    uniform vec2 u_resolution;

    out vec2 v_position;
    out vec4 v_color;

    void main() {
        vec2 position = (a_position * a_radius + a_offset) / u_resolution * 2.0 - 1.0;
        gl_Position = vec4(position.x, -position.y, 0, 1);
        
        v_position = a_position;
        v_color = a_color;
    }
`

    // 片元着色器
    const fragmentShaderSource = `#version 300 es
    precision highp float;

    in vec2 v_position;
    in vec4 v_color;

    out vec4 outColor;

    void main() {
        // 精确圆形判断
        float dist = length(v_position);
        if (dist > 1.0) {
            discard;  // 超出单位圆范围直接丢弃
        }
        
        outColor = v_color;
    }
`

    // 着色器编译函数
    function createShader(gl, type, source) {
        const shader = gl.createShader(type)
        gl.shaderSource(shader, source)
        gl.compileShader(shader)
        if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
            console.error(
                "Shader compilation error:",
                gl.getShaderInfoLog(shader)
            )
            gl.deleteShader(shader)
            return null
        }
        return shader
    }

    const vertexShader = createShader(gl, gl.VERTEX_SHADER, vertexShaderSource)
    const fragmentShader = createShader(
        gl,
        gl.FRAGMENT_SHADER,
        fragmentShaderSource
    )

    // 创建程序
    const program = gl.createProgram()
    gl.attachShader(program, vertexShader)
    gl.attachShader(program, fragmentShader)
    gl.linkProgram(program)

    // 创建单位圆顶点数据（精确圆形）
    const resolution = 64 // 圆的精度
    const vertices = new Float32Array((resolution + 2) * 2)

    // 圆心
    vertices[0] = 0
    vertices[1] = 0

    // 圆周点
    for (let i = 0; i <= resolution; i++) {
        const angle = (i / resolution) * Math.PI * 2
        vertices[(i + 1) * 2] = Math.cos(angle)
        vertices[(i + 1) * 2 + 1] = Math.sin(angle)
    }

    const numInstances = circlesData.length

    // 准备实例数据
    const offsetData = new Float32Array(numInstances * 2)
    const radiusData = new Float32Array(numInstances)
    const colorData = new Float32Array(numInstances * 4)

    // 填充实例数据
    circlesData.forEach((circle, index) => {
        offsetData[index * 2] = circle.x
        offsetData[index * 2 + 1] = circle.y
        radiusData[index] = circle.radius
        colorData[index * 4] = circle.color[0]
        colorData[index * 4 + 1] = circle.color[1]
        colorData[index * 4 + 2] = circle.color[2]
        colorData[index * 4 + 3] = circle.color[3]
    })

    // 创建缓冲区
    const vertexBuffer = gl.createBuffer()
    gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer)
    gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW)

    const offsetBuffer = gl.createBuffer()
    gl.bindBuffer(gl.ARRAY_BUFFER, offsetBuffer)
    gl.bufferData(gl.ARRAY_BUFFER, offsetData, gl.STATIC_DRAW)

    const radiusBuffer = gl.createBuffer()
    gl.bindBuffer(gl.ARRAY_BUFFER, radiusBuffer)
    gl.bufferData(gl.ARRAY_BUFFER, radiusData, gl.STATIC_DRAW)

    const colorBuffer = gl.createBuffer()
    gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer)
    gl.bufferData(gl.ARRAY_BUFFER, colorData, gl.STATIC_DRAW)

    // 使用程序
    gl.useProgram(program)

    // 设置属性
    const positionAttributeLocation = gl.getAttribLocation(
        program,
        "a_position"
    )
    gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer)
    gl.enableVertexAttribArray(positionAttributeLocation)
    gl.vertexAttribPointer(positionAttributeLocation, 2, gl.FLOAT, false, 0, 0)

    const offsetAttributeLocation = gl.getAttribLocation(program, "a_offset")
    gl.bindBuffer(gl.ARRAY_BUFFER, offsetBuffer)
    gl.enableVertexAttribArray(offsetAttributeLocation)
    gl.vertexAttribPointer(offsetAttributeLocation, 2, gl.FLOAT, false, 0, 0)
    gl.vertexAttribDivisor(offsetAttributeLocation, 1)

    const radiusAttributeLocation = gl.getAttribLocation(program, "a_radius")
    gl.bindBuffer(gl.ARRAY_BUFFER, radiusBuffer)
    gl.enableVertexAttribArray(radiusAttributeLocation)
    gl.vertexAttribPointer(radiusAttributeLocation, 1, gl.FLOAT, false, 0, 0)
    gl.vertexAttribDivisor(radiusAttributeLocation, 1)

    const colorAttributeLocation = gl.getAttribLocation(program, "a_color")
    gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer)
    gl.enableVertexAttribArray(colorAttributeLocation)
    gl.vertexAttribPointer(colorAttributeLocation, 4, gl.FLOAT, false, 0, 0)
    gl.vertexAttribDivisor(colorAttributeLocation, 1)

    // 设置分辨率
    const resolutionUniformLocation = gl.getUniformLocation(
        program,
        "u_resolution"
    )
    gl.uniform2f(resolutionUniformLocation, canvas.width, canvas.height)

    // 启用混合
    gl.enable(gl.BLEND)
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA)

    // 清除画布
    gl.clearColor(0, 0, 0, 1)
    gl.clear(gl.COLOR_BUFFER_BIT)

    // 绘制实例化圆形
    gl.drawArraysInstanced(gl.TRIANGLE_FAN, 0, resolution + 2, numInstances)
}

interface CircleData {
    x: number
    y: number
    radius: number
    strokeColor: [number, number, number, number]
    fillColor: [number, number, number, number]
    lineWidth?: number
}

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
    ctx: CanvasRenderingContext2D | WebGL2RenderingContext
    elements: any[] = []
    shapeListMap: {
        circle: CircleData[]
    } = {
        circle: [],
    }

    constructor({
        canvasBox,
        type = "2d",
    }: {
        width?: number
        height?: number
        canvasBox?: HTMLElement | undefined
        type?: "2d" | "webgl"
    }) {
        if (type === "2d") {
            this.initCanvas({ canvasBox })
        } else if (type === "webgl") {
            this.initCanvasWebGL({ canvasBox: canvasBox as HTMLElement })
        }
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

    initCanvasWebGL({ canvasBox }: { canvasBox: HTMLElement }) {
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

        const ctx = canvas.getContext("webgl2") as WebGL2RenderingContext
        // ctx.scale(ratio, ratio)
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

        this.addElements(sections.map((v) => new Section(v, this)))
        console.log("this.elements", this.elements)
        this.addElements(rows.map((v) => new Row(v, this)))
        // this.addElements(shapes.map((v) => new Shape(v)))
        this.addElements(tables.map((v) => new Table(v, this)))
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
        console.log("this.ctx", this.ctx)
        if (this.ctx instanceof CanvasRenderingContext2D) {
            this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height)
            this.ctx.save()
            this.ctx.translate(this.offsetX, this.offsetY)
            this.ctx.scale(this.scale, this.scale)

            for (const e of this.elements) {
                e.draw(this.ctx)
            }
            console.log("shapeListMap", this.shapeListMap)
            createPreciseCircles(this.canvas)

            this.ctx.restore()
        } else if (this.ctx instanceof WebGL2RenderingContext) {
            drawCircleListByWebGL(this.ctx, this.shapeListMap["circle"])
        }
    }
}
