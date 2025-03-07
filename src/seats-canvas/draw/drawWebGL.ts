import { Circle, Polygon } from "../shapeType"
import { convertColorToRGBA } from "../../util"

export const drawCircleListByWebGL = (
    gl: WebGL2RenderingContext,
    circlesData: Circle[],
    offsetX: number,
    offsetY: number,
    scale: number = 1.0
) => {
    if (!gl || circlesData.length === 0) {
        return
    }
    const _circlesData = circlesData.map((circle) => {
        return {
            ...circle,
            fillColor: convertColorToRGBA(circle.fillColor),
            strokeColor: convertColorToRGBA(circle.strokeColor),
        }
    })

    // 保存当前WebGL状态
    const currentProgram = gl.getParameter(gl.CURRENT_PROGRAM)
    const blendEnabled = gl.getParameter(gl.BLEND)
    const blendSrcRGB = gl.getParameter(gl.BLEND_SRC_RGB)
    const blendDstRGB = gl.getParameter(gl.BLEND_DST_RGB)

    // 清除所有缓冲区
    gl.bindBuffer(gl.ARRAY_BUFFER, null)
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, null)

    // 顶点着色器 - 使用实例化属性
    const vsSource = `#version 300 es
    // 顶点位置 - 所有实例共享的几何数据
    in vec2 aVertexPosition;

    // 每个实例的属性
    in vec2 aInstancePosition;  // 实例中心位置
    in float aInstanceRadius;   // 实例半径/大小
    in vec4 aInstanceColor;     // 实例颜色
    in float aInstanceType;     // 实例类型(0=圆形, 1=多边形)

    uniform vec2 u_resolution;
    uniform vec2 u_offset;
    uniform float u_scale;

    // 传递给片段着色器的数据
    out vec4 vColor;
    out vec2 vPosition;
    out float vType;

    void main() {
        // 应用缩放和平移
        vec2 scaledPosition = aVertexPosition * aInstanceRadius * u_scale;
        vec2 instancePos = (aInstancePosition * u_scale + u_offset) / u_resolution;
        vec2 position = scaledPosition / u_resolution + instancePos;
        
        // 转换到裁剪空间
        position = position * 2.0 - 1.0;
        gl_Position = vec4(position.x, -position.y, 0.0, 1.0);
        
        vColor = aInstanceColor;
        vPosition = aVertexPosition;
        vType = aInstanceType;
    }
    `

    // 片段着色器 - 处理圆形和多边形渲染
    const fsSource = `#version 300 es
    precision mediump float;

    in vec4 vColor;
    in vec2 vPosition;
    in float vType;

    out vec4 fragColor;

    void main() {
        if (vType < 0.5) {
            // 圆形
            float distance = length(vPosition);
            if (distance > 1.0) {
                discard;
            }
            float alpha = 1.0 - smoothstep(0.9, 1.0, distance);
            fragColor = vec4(vColor.rgb, vColor.a * alpha);
        } else {
            // 多边形
            fragColor = vColor;
        }
    }
    `

    // 初始化着色器程序
    const shaderInfo = createShaderProgram(gl, vsSource, fsSource)
    if (!shaderInfo) return

    const { program, vertexShader, fragmentShader } = shaderInfo

    // 创建圆形顶点数据
    const numSides = 32 // 用于近似圆形的边数
    const vertices = new Float32Array((numSides + 2) * 2)

    // 中心点
    vertices[0] = 0.0
    vertices[1] = 0.0

    // 计算周围的点 - 使用单位圆
    for (let i = 0; i <= numSides; i++) {
        const angle = (i / numSides) * Math.PI * 2
        vertices[(i + 1) * 2] = Math.cos(angle)
        vertices[(i + 1) * 2 + 1] = Math.sin(angle)
    }

    const numInstances = _circlesData.length

    // 准备实例数据
    const instancePositions = new Float32Array(numInstances * 2)
    const instanceRadii = new Float32Array(numInstances)
    const instanceColors = new Float32Array(numInstances * 4)
    const instanceTypes = new Float32Array(numInstances)

    _circlesData.forEach((circle, i) => {
        instancePositions[i * 2] = circle.x
        instancePositions[i * 2 + 1] = circle.y
        instanceRadii[i] = circle.radius
        instanceColors[i * 4] = circle.fillColor[0]
        instanceColors[i * 4 + 1] = circle.fillColor[1]
        instanceColors[i * 4 + 2] = circle.fillColor[2]
        instanceColors[i * 4 + 3] = circle.fillColor[3]
        instanceTypes[i] = 0.0 // 0表示圆形
    })

    // 创建并绑定缓冲区
    const vertexBuffer = gl.createBuffer()
    gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer)
    gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW)

    const positionBuffer = gl.createBuffer()
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer)
    gl.bufferData(gl.ARRAY_BUFFER, instancePositions, gl.STATIC_DRAW)

    const radiusBuffer = gl.createBuffer()
    gl.bindBuffer(gl.ARRAY_BUFFER, radiusBuffer)
    gl.bufferData(gl.ARRAY_BUFFER, instanceRadii, gl.STATIC_DRAW)

    const colorBuffer = gl.createBuffer()
    gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer)
    gl.bufferData(gl.ARRAY_BUFFER, instanceColors, gl.STATIC_DRAW)

    const typeBuffer = gl.createBuffer()
    gl.bindBuffer(gl.ARRAY_BUFFER, typeBuffer)
    gl.bufferData(gl.ARRAY_BUFFER, instanceTypes, gl.STATIC_DRAW)

    // 使用着色器程序
    gl.useProgram(program)

    // 设置顶点属性
    const vertexPosition = gl.getAttribLocation(program, "aVertexPosition")
    gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer)
    gl.enableVertexAttribArray(vertexPosition)
    gl.vertexAttribPointer(vertexPosition, 2, gl.FLOAT, false, 0, 0)

    const instancePosition = gl.getAttribLocation(program, "aInstancePosition")
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer)
    gl.enableVertexAttribArray(instancePosition)
    gl.vertexAttribPointer(instancePosition, 2, gl.FLOAT, false, 0, 0)
    gl.vertexAttribDivisor(instancePosition, 1)

    const instanceRadius = gl.getAttribLocation(program, "aInstanceRadius")
    gl.bindBuffer(gl.ARRAY_BUFFER, radiusBuffer)
    gl.enableVertexAttribArray(instanceRadius)
    gl.vertexAttribPointer(instanceRadius, 1, gl.FLOAT, false, 0, 0)
    gl.vertexAttribDivisor(instanceRadius, 1)

    const instanceColor = gl.getAttribLocation(program, "aInstanceColor")
    gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer)
    gl.enableVertexAttribArray(instanceColor)
    gl.vertexAttribPointer(instanceColor, 4, gl.FLOAT, false, 0, 0)
    gl.vertexAttribDivisor(instanceColor, 1)

    const instanceType = gl.getAttribLocation(program, "aInstanceType")
    gl.bindBuffer(gl.ARRAY_BUFFER, typeBuffer)
    gl.enableVertexAttribArray(instanceType)
    gl.vertexAttribPointer(instanceType, 1, gl.FLOAT, false, 0, 0)
    gl.vertexAttribDivisor(instanceType, 1)

    // 设置uniform变量
    const resolutionLocation = gl.getUniformLocation(program, "u_resolution")
    gl.uniform2f(resolutionLocation, gl.canvas.width, gl.canvas.height)

    const offsetLocation = gl.getUniformLocation(program, "u_offset")
    gl.uniform2f(offsetLocation, offsetX, offsetY)

    const scaleLocation = gl.getUniformLocation(program, "u_scale")
    gl.uniform1f(scaleLocation, scale)

    // 启用混合
    gl.enable(gl.BLEND)
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA)

    // 绘制实例
    gl.drawArraysInstanced(gl.TRIANGLE_FAN, 0, numSides + 2, numInstances)

    // 禁用所有顶点属性数组
    gl.disableVertexAttribArray(vertexPosition)
    gl.disableVertexAttribArray(instancePosition)
    gl.disableVertexAttribArray(instanceRadius)
    gl.disableVertexAttribArray(instanceColor)
    gl.disableVertexAttribArray(instanceType)

    // 重置所有的 vertex attribute divisor
    gl.vertexAttribDivisor(vertexPosition, 0)
    gl.vertexAttribDivisor(instancePosition, 0)
    gl.vertexAttribDivisor(instanceRadius, 0)
    gl.vertexAttribDivisor(instanceColor, 0)
    gl.vertexAttribDivisor(instanceType, 0)

    // 恢复WebGL状态
    gl.useProgram(currentProgram)
    if (blendEnabled) {
        gl.enable(gl.BLEND)
    } else {
        gl.disable(gl.BLEND)
    }
    gl.blendFunc(blendSrcRGB, blendDstRGB)

    // 清理资源
    gl.deleteBuffer(vertexBuffer)
    gl.deleteBuffer(positionBuffer)
    gl.deleteBuffer(radiusBuffer)
    gl.deleteBuffer(colorBuffer)
    gl.deleteBuffer(typeBuffer)
    gl.deleteProgram(program)
    gl.deleteShader(vertexShader)
    gl.deleteShader(fragmentShader)
}

export const drawPolygonListByWebGL = (
    gl: WebGL2RenderingContext,
    polygonsData: Polygon[],
    offsetX: number,
    offsetY: number,
    scale: number = 1.0
) => {
    if (!gl || polygonsData.length === 0) {
        return
    }

    const _polygonsData = polygonsData.map((polygon) => {
        return {
            ...polygon,
            fillColor: convertColorToRGBA(polygon.fillColor),
            strokeColor: convertColorToRGBA(polygon.strokeColor),
        }
    })
    // 保存当前WebGL状态
    const currentProgram = gl.getParameter(gl.CURRENT_PROGRAM)
    const blendEnabled = gl.getParameter(gl.BLEND)
    const blendSrcRGB = gl.getParameter(gl.BLEND_SRC_RGB)
    const blendDstRGB = gl.getParameter(gl.BLEND_DST_RGB)

    // 清除所有缓冲区
    gl.bindBuffer(gl.ARRAY_BUFFER, null)
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, null)

    // 顶点着色器
    const vertexShaderSource = `#version 300 es
    in vec2 a_position;     // 多边形顶点
    in vec2 a_offset;       // 位置偏移
    in vec4 a_fillColor;    // 填充颜色
    in vec4 a_strokeColor;  // 描边颜色
    in float a_isStroke;    // 是否是描边顶点

    uniform vec2 u_resolution;
    uniform vec2 u_offset;
    uniform float u_scale;

    out vec4 v_color;

    void main() {
        vec2 normalizedOffset = u_offset / u_resolution;
        vec2 position = (a_position * u_scale + a_offset * u_scale) / u_resolution + normalizedOffset;
        position = position * 2.0 - 1.0;
        gl_Position = vec4(position.x, -position.y, 0, 1);
        v_color = mix(a_fillColor, a_strokeColor, a_isStroke);
    }
`

    // 片元着色器
    const fragmentShaderSource = `#version 300 es
    precision highp float;
    
    in vec4 v_color;
    out vec4 outColor;

    void main() {
        outColor = v_color;
    }
`

    // 创建和编译着色器
    function createShader(
        gl: WebGL2RenderingContext,
        type: number,
        source: string
    ) {
        const shader = gl.createShader(type)!
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
    if (!vertexShader || !fragmentShader) return

    // 创建程序
    const program = gl.createProgram()!
    gl.attachShader(program, vertexShader)
    gl.attachShader(program, fragmentShader)
    gl.linkProgram(program)

    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
        console.error("Program link error:", gl.getProgramInfoLog(program))
        return
    }

    // 使用程序
    gl.useProgram(program)

    // 修改数据准备部分
    let totalVertices = 0
    const allVertices: number[] = []
    const allFillColors: number[] = []
    const allStrokeColors: number[] = []
    const allOffsets: number[] = []
    const allIsStroke: number[] = []

    _polygonsData.forEach((polygon) => {
        const points = polygon.points
        const lineWidth = polygon.lineWidth || 1

        // 填充部分
        for (let i = 1; i < points.length - 1; i++) {
            // 添加三角形的三个顶点
            allVertices.push(points[0].x, points[0].y)
            allVertices.push(points[i].x, points[i].y)
            allVertices.push(points[i + 1].x, points[i + 1].y)

            // 为每个顶点添加填充颜色
            for (let j = 0; j < 3; j++) {
                allFillColors.push(...polygon.fillColor)
                allStrokeColors.push(...polygon.strokeColor)
                allOffsets.push(0, 0)
                allIsStroke.push(0.0) // 0表示填充
            }
        }

        // 描边部分
        for (let i = 0; i < points.length; i++) {
            const p1 = points[i]
            const p2 = points[(i + 1) % points.length]

            // 计算线段方向向量
            const dx = p2.x - p1.x
            const dy = p2.y - p1.y
            const length = Math.sqrt(dx * dx + dy * dy)

            // 计算法向量（垂直于线段）
            const nx = (-dy / length) * lineWidth * 0.5
            const ny = (dx / length) * lineWidth * 0.5

            // 生成矩形的四个顶点
            const v1x = p1.x + nx
            const v1y = p1.y + ny
            const v2x = p1.x - nx
            const v2y = p1.y - ny
            const v3x = p2.x + nx
            const v3y = p2.y + ny
            const v4x = p2.x - nx
            const v4y = p2.y - ny

            // 添加两个三角形的顶点
            allVertices.push(
                v1x,
                v1y,
                v2x,
                v2y,
                v3x,
                v3y, // 第一个三角形
                v2x,
                v2y,
                v3x,
                v3y,
                v4x,
                v4y // 第二个三角形
            )

            // 为描边的每个顶点添加颜色
            for (let j = 0; j < 6; j++) {
                allFillColors.push(...polygon.fillColor)
                allStrokeColors.push(...polygon.strokeColor)
                allOffsets.push(0, 0)
                allIsStroke.push(1.0) // 1表示描边
            }
        }

        totalVertices += (points.length - 2) * 3 + points.length * 6
    })

    // 创建并绑定缓冲区
    const vertexBuffer = gl.createBuffer()
    gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer)
    gl.bufferData(
        gl.ARRAY_BUFFER,
        new Float32Array(allVertices),
        gl.STATIC_DRAW
    )

    const fillColorBuffer = gl.createBuffer()
    gl.bindBuffer(gl.ARRAY_BUFFER, fillColorBuffer)
    gl.bufferData(
        gl.ARRAY_BUFFER,
        new Float32Array(allFillColors),
        gl.STATIC_DRAW
    )

    const strokeColorBuffer = gl.createBuffer()
    gl.bindBuffer(gl.ARRAY_BUFFER, strokeColorBuffer)
    gl.bufferData(
        gl.ARRAY_BUFFER,
        new Float32Array(allStrokeColors),
        gl.STATIC_DRAW
    )

    const offsetBuffer = gl.createBuffer()
    gl.bindBuffer(gl.ARRAY_BUFFER, offsetBuffer)
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(allOffsets), gl.STATIC_DRAW)

    const isStrokeBuffer = gl.createBuffer()
    gl.bindBuffer(gl.ARRAY_BUFFER, isStrokeBuffer)
    gl.bufferData(
        gl.ARRAY_BUFFER,
        new Float32Array(allIsStroke),
        gl.STATIC_DRAW
    )

    // 设置属性
    const positionLoc = gl.getAttribLocation(program, "a_position")
    gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer)
    gl.enableVertexAttribArray(positionLoc)
    gl.vertexAttribPointer(positionLoc, 2, gl.FLOAT, false, 0, 0)

    const fillColorLoc = gl.getAttribLocation(program, "a_fillColor")
    gl.bindBuffer(gl.ARRAY_BUFFER, fillColorBuffer)
    gl.enableVertexAttribArray(fillColorLoc)
    gl.vertexAttribPointer(fillColorLoc, 4, gl.FLOAT, false, 0, 0)

    const strokeColorLoc = gl.getAttribLocation(program, "a_strokeColor")
    gl.bindBuffer(gl.ARRAY_BUFFER, strokeColorBuffer)
    gl.enableVertexAttribArray(strokeColorLoc)
    gl.vertexAttribPointer(strokeColorLoc, 4, gl.FLOAT, false, 0, 0)

    const isStrokeLoc = gl.getAttribLocation(program, "a_isStroke")
    gl.bindBuffer(gl.ARRAY_BUFFER, isStrokeBuffer)
    gl.enableVertexAttribArray(isStrokeLoc)
    gl.vertexAttribPointer(isStrokeLoc, 1, gl.FLOAT, false, 0, 0)

    const offsetLoc = gl.getAttribLocation(program, "a_offset")
    gl.bindBuffer(gl.ARRAY_BUFFER, offsetBuffer)
    gl.enableVertexAttribArray(offsetLoc)
    gl.vertexAttribPointer(offsetLoc, 2, gl.FLOAT, false, 0, 0)

    // 设置uniform变量
    const resolutionLoc = gl.getUniformLocation(program, "u_resolution")
    gl.uniform2f(resolutionLoc, gl.canvas.width, gl.canvas.height)

    const offsetUniformLoc = gl.getUniformLocation(program, "u_offset")
    gl.uniform2f(offsetUniformLoc, offsetX, offsetY)

    const scaleLoc = gl.getUniformLocation(program, "u_scale")
    gl.uniform1f(scaleLoc, scale)

    // 启用混合
    gl.enable(gl.BLEND)
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA)

    // 绘制多边形
    gl.drawArrays(gl.TRIANGLES, 0, totalVertices)

    // 禁用所有顶点属性数组
    gl.disableVertexAttribArray(positionLoc)
    gl.disableVertexAttribArray(fillColorLoc)
    gl.disableVertexAttribArray(strokeColorLoc)
    gl.disableVertexAttribArray(isStrokeLoc)
    gl.disableVertexAttribArray(offsetLoc)

    // 重置所有的 vertex attribute divisor
    gl.vertexAttribDivisor(positionLoc, 0)
    gl.vertexAttribDivisor(fillColorLoc, 0)
    gl.vertexAttribDivisor(strokeColorLoc, 0)
    gl.vertexAttribDivisor(isStrokeLoc, 0)
    gl.vertexAttribDivisor(offsetLoc, 0)

    // 恢复WebGL状态
    gl.useProgram(currentProgram)
    if (blendEnabled) {
        gl.enable(gl.BLEND)
    } else {
        gl.disable(gl.BLEND)
    }
    gl.blendFunc(blendSrcRGB, blendDstRGB)

    // 清理资源
    gl.deleteBuffer(vertexBuffer)
    gl.deleteBuffer(fillColorBuffer)
    gl.deleteBuffer(strokeColorBuffer)
    gl.deleteBuffer(offsetBuffer)
    gl.deleteBuffer(isStrokeBuffer)
    gl.deleteProgram(program)
    gl.deleteShader(vertexShader)
    gl.deleteShader(fragmentShader)
}

// 创建着色器程序的通用函数
function createShaderProgram(
    gl: WebGL2RenderingContext,
    vsSource: string,
    fsSource: string
) {
    const vertexShader = loadShader(gl, gl.VERTEX_SHADER, vsSource)
    const fragmentShader = loadShader(gl, gl.FRAGMENT_SHADER, fsSource)

    // 创建着色器程序
    const shaderProgram = gl.createProgram()
    if (!shaderProgram || !vertexShader || !fragmentShader) return null

    gl.attachShader(shaderProgram, vertexShader)
    gl.attachShader(shaderProgram, fragmentShader)
    gl.linkProgram(shaderProgram)

    if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)) {
        console.error(
            "无法初始化着色器程序: " + gl.getProgramInfoLog(shaderProgram)
        )
        return null
    }

    return {
        program: shaderProgram,
        vertexShader,
        fragmentShader,
    }
}

// 加载着色器
function loadShader(gl: WebGL2RenderingContext, type: number, source: string) {
    const shader = gl.createShader(type)
    if (!shader) return null

    gl.shaderSource(shader, source)
    gl.compileShader(shader)

    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        console.error("着色器编译错误: " + gl.getShaderInfoLog(shader))
        gl.deleteShader(shader)
        return null
    }

    return shader
}
