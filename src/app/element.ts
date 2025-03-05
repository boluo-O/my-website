import { seatsCanvasStore } from "./canvas"
import { SeatsCanvas } from "./canvas"
import { drawCircle } from "./shape"
import { convertColorToRGBA } from "./util"

interface Point {
    x: number
    y: number
}
export class Section {
    points: Point[] = []
    fillColor: string
    strokeColor: string
    rows: Row[] = []
    topLeft: Point

    constructor(private sectionData: any, private canvas: SeatsCanvas) {
        this.points = sectionData.points
        const { colorMap } = seatsCanvasStore.getState()
        this.strokeColor = colorMap[sectionData.categoryKey]?.color || "#ED303D"
        this.fillColor = this.strokeColor + "80"
        this.topLeft = sectionData.topLeft
        this.rows = (sectionData?.subChart?.rows || []).map(
            (row: any) =>
                new Row(
                    {
                        ...row,
                        color: this.strokeColor,
                        origionPoint: this.topLeft,
                    },
                    this.canvas
                )
        )

        // addCircles
    }

    drawSelf(ctx: CanvasRenderingContext2D) {
        ctx.save()
        ctx.lineWidth = 10
        ctx.beginPath()
        ctx.moveTo(this.points[0].x, this.points[0].y)
        for (let i = 1; i < this.points.length; i++) {
            ctx.lineTo(this.points[i].x, this.points[i].y)
        }
        ctx.closePath()
        ctx.fillStyle = this.fillColor
        ctx.fill()
        ctx.strokeStyle = this.strokeColor
        ctx.stroke()
        ctx.restore()
    }

    draw(ctx: CanvasRenderingContext2D) {
        this.drawSelf(ctx)
        this.rows.forEach((row) => row.draw(ctx))

        ctx.save()
        ctx.lineWidth = 10
        ctx.beginPath()
        ctx.arc(this.topLeft.x, this.topLeft.y, 5, 0, Math.PI * 2) // 画一个半径为5的圆
        ctx.closePath()
        ctx.fillStyle = "red"
        ctx.fill()
        ctx.restore()
    }
}
export class Table {
    seats: Seat[] = []
    color: string = "gray"
    origionPoint: Point
    x: number
    y: number
    radius: number

    constructor(private tableData: any, private seatsCanvas: SeatsCanvas) {
        this.origionPoint = tableData.origionPoint || { x: 0, y: 0 }
        this.x = tableData.center.x
        this.y = tableData.center.y
        this.radius = tableData.radius
        this.seats = tableData.seats.map(
            (seat: any) =>
                new Seat(
                    {
                        ...seat,

                        origionPoint: this.origionPoint,
                    },
                    this.seatsCanvas
                )
        )
    }

    drawSelf(ctx: CanvasRenderingContext2D) {
        ctx.save()
        ctx.lineWidth = 10
        ctx.beginPath()
        ctx.arc(
            this.x + this.origionPoint.x,
            this.y + this.origionPoint.y,
            this.radius,
            0,
            Math.PI * 2
        )
        ctx.closePath()
        ctx.fillStyle = this.color
        ctx.fill()
        ctx.restore()
    }

    draw(ctx: CanvasRenderingContext2D) {
        this.drawSelf(ctx)
        this.seats.forEach((seat) => seat.draw(ctx))
    }
}

export class Row {
    seats: Seat[] = []
    color: string
    origionPoint: Point

    constructor(private rowData: any, private canvas: SeatsCanvas) {
        this.color = rowData.color
        this.origionPoint = rowData.origionPoint || { x: 0, y: 0 }
        this.seats = rowData.seats.map(
            (seat: any) =>
                new Seat(
                    {
                        ...seat,
                        color: this.color,
                        origionPoint: this.origionPoint,
                    },
                    this.canvas
                )
        )
    }

    drawSelf(ctx: CanvasRenderingContext2D) {
        //can be used for instead of draw seats, when zoom 0
    }

    draw(ctx: CanvasRenderingContext2D) {
        this.drawSelf(ctx)
        this.seats.forEach((seat) => seat.draw(ctx))
    }
}

export class Seat {
    x: number
    y: number
    radius: number = 5
    color: string
    origionPoint: Point

    constructor(private seatData: any, private seatsCanvas: SeatsCanvas) {
        this.x = seatData.x
        this.y = seatData.y
        const { colorMap } = seatsCanvasStore.getState()
        this.color =
            seatData.color || colorMap[seatData.categoryKey]?.color || "#ED303D"
        this.origionPoint = seatData?.origionPoint || { x: 0, y: 0 }
        seatsCanvas.shapeListMap.circle.push({
            x: this.x + this.origionPoint.x,
            y: this.y + this.origionPoint.y,
            radius: this.radius,
            strokeColor: convertColorToRGBA(this.color),
            fillColor: convertColorToRGBA(this.color),
        })
    }

    drawText(ctx: CanvasRenderingContext2D) {
        // ctx.save()
        ctx.font = `${this.radius}px sans-serif`
        ctx.fillStyle = "black"
        const textWidth = ctx.measureText(this.seatData.label).width // 计算文本宽度
        const textHeight = this.radius
        ctx.fillText(
            this.seatData.label,
            this.x + this.origionPoint.x - textWidth / 2, // 使文本居中
            this.y + this.origionPoint.y + textHeight / 2 // 调整Y坐标使文本居中
        )
        // ctx.restore()
    }

    draw(ctx: CanvasRenderingContext2D) {
        drawCircle(ctx, {
            x: this.x + this.origionPoint.x,
            y: this.y + this.origionPoint.y,
            radius: this.radius,
            strokeColor: this.color,
            fillColor: this.color,
        })
        // this.drawText(ctx)
    }
}
