// class Circle {
//     x: number
//     y: number
//     radius: number
//     strokeColor: string
//     fillColor: string

//     constructor(
//         x: number,
//         y: number,
//         radius: number,
//         strokeColor: string,
//         fillColor: string
//     ) {
//         this.x = x
//         this.y = y
//         this.radius = radius
//         this.strokeColor = strokeColor
//         this.fillColor = fillColor
//     }

//     draw(ctx: CanvasRenderingContext2D) {
//         ctx.beginPath()
//         ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2)
//         ctx.strokeStyle = this.strokeColor
//         ctx.fillStyle = this.fillColor
//         ctx.fill()
//     }
// }
interface CircleProps {
    x: number
    y: number
    radius: number
    strokeColor: string
    fillColor: string
    lineWidth?: number
}

const drawCircleByCanvas = (
    ctx: CanvasRenderingContext2D,
    { x, y, radius, strokeColor, fillColor, lineWidth = 10 }: CircleProps
) => {
    ctx.beginPath()
    ctx.arc(x, y, radius, 0, Math.PI * 2)
    ctx.strokeStyle = strokeColor
    ctx.fillStyle = fillColor
    ctx.lineWidth = lineWidth
    ctx.fill()
}

interface CircleData {
    x: number
    y: number
    radius: number
    strokeColor: [number, number, number, number]
    fillColor: [number, number, number, number]
    lineWidth?: number
}

export const drawCircleListByWebGL = (
    gl: WebGL2RenderingContext,
    circlesData: CircleData[]
) => {
    console.log("gl", gl)
    if (!gl) {
        console.error("WebGL 2.0 not supported")
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

    console.log("circlesData", circlesData)
    // 填充实例数据
    circlesData.forEach((circle, index) => {
        offsetData[index * 2] = circle.x
        offsetData[index * 2 + 1] = circle.y
        radiusData[index] = circle.radius
        colorData[index * 4] = circle.fillColor[0]
        colorData[index * 4 + 1] = circle.fillColor[1]
        colorData[index * 4 + 2] = circle.fillColor[2]
        colorData[index * 4 + 3] = circle.fillColor[3]
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
    // gl.uniform2f(resolutionUniformLocation, canvas.width, canvas.height)
    gl.uniform2f(resolutionUniformLocation, 2000, 1200)

    // 启用混合
    gl.enable(gl.BLEND)
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA)

    // 清除画布
    gl.clearColor(0, 0, 0, 1)
    gl.clear(gl.COLOR_BUFFER_BIT)

    // 绘制实例化圆形
    gl.drawArraysInstanced(gl.TRIANGLE_FAN, 0, resolution + 2, numInstances)
}

export const drawCircle = (
    ctx: CanvasRenderingContext2D | WebGL2RenderingContext,
    { x, y, radius, strokeColor, fillColor, lineWidth }: CircleProps
) => {
    if (ctx instanceof CanvasRenderingContext2D) {
        drawCircleByCanvas(ctx, {
            x,
            y,
            radius,
            strokeColor,
            fillColor,
            lineWidth,
        })
    } else {
        // 这里可以调用 drawCircleListByWebGL
    }
}
