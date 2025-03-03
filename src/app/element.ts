import { seatsCanvasStore } from "./canvas"

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

    constructor(private sectionData: any) {
        this.points = sectionData.points
        const { colorMap } = seatsCanvasStore.getState()
        this.strokeColor = colorMap[sectionData.categoryKey]?.color || "#ED303D"
        this.fillColor = this.strokeColor + "80"
        console.log("sectionData", sectionData)
        this.topLeft = sectionData.topLeft
        console.log("sectionData.rows", sectionData.rows)
        this.rows = (sectionData?.subChart?.rows || []).map(
            (row: any) =>
                new Row({
                    ...row,
                    color: this.strokeColor,
                    origionPoint: this.topLeft,
                })
        )
        console.log("this.rows", this.rows)
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

export class Row {
    seats: Seat[] = []
    color: string
    origionPoint: Point

    constructor(private rowData: any) {
        this.color = rowData.color
        this.origionPoint = rowData.origionPoint
        this.seats = rowData.seats.map(
            (seat: any) =>
                new Seat({
                    ...seat,
                    color: this.color,
                    origionPoint: this.origionPoint,
                })
        )
    }

    drawSelf(ctx: CanvasRenderingContext2D) {}

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

    constructor(private seatData: any) {
        this.x = seatData.x
        this.y = seatData.y
        this.color = seatData.color
        this.origionPoint = seatData.origionPoint
    }

    draw(ctx: CanvasRenderingContext2D) {
        ctx.save()
        ctx.lineWidth = 10
        ctx.beginPath()
        ctx.arc(
            this.x + this.origionPoint.x,
            this.y + this.origionPoint.y,
            this.radius,
            0,
            Math.PI * 2
        ) // 画一个半径为5的圆
        ctx.closePath()
        ctx.fillStyle = this.color
        ctx.fill()
        ctx.restore()
    }
}
