import { Circle, Polygon, Text } from "../shapeType"

export const drawCircle = (
    ctx: CanvasRenderingContext2D,
    { x, y, radius, strokeColor, fillColor, lineWidth = 10 }: Circle
) => {
    ctx.beginPath()
    ctx.arc(x, y, radius, 0, Math.PI * 2)
    ctx.strokeStyle = strokeColor
    ctx.fillStyle = fillColor
    ctx.lineWidth = lineWidth
    ctx.fill()
}

export const drawPolygon = (
    ctx: CanvasRenderingContext2D,
    { points, strokeColor, fillColor, lineWidth = 10 }: Polygon
) => {
    ctx.save()
    ctx.lineWidth = lineWidth
    ctx.beginPath()
    ctx.moveTo(points[0].x, points[0].y)
    for (let i = 1; i < points.length; i++) {
        ctx.lineTo(points[i].x, points[i].y)
    }
    ctx.closePath()
    ctx.fillStyle = fillColor
    ctx.fill()
    ctx.strokeStyle = strokeColor
    ctx.stroke()
    ctx.restore()
}

export const drawText = (
    ctx: CanvasRenderingContext2D,
    {
        x,
        y,
        text,
        fontSize = 10,
        fontFamily = "sans-serif",
        fillColor = "black",
        textAlign = "center",
        textBaseline = "middle",
        rotate = 0,
        offsetX = 0,
        offsetY = 0,
    }: Text
) => {
    ctx.save()
    ctx.font = `${fontSize}px ${fontFamily}`
    ctx.fillStyle = fillColor
    ctx.textAlign = textAlign
    ctx.textBaseline = textBaseline

    ctx.translate(x, y)
    if (rotate) {
        ctx.rotate((rotate * Math.PI) / 180)
    }
    ctx.fillText(text, offsetX, offsetY)
    ctx.restore()
}
