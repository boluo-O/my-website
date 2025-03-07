import { TinyColor } from "@ctrl/tinycolor"
import { SeatsCanvas } from "./canvas"
import { Text } from "./shapeType"

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
    label: Text

    constructor(private sectionData: any, private seatsCanvas: SeatsCanvas) {
        this.points = sectionData.points
        this.strokeColor =
            seatsCanvas.colorMap[sectionData.categoryKey]?.color || "#ED303D"
        this.fillColor = this.strokeColor + "80"
        this.topLeft = sectionData.topLeft
        const tinyColor = new TinyColor(this.strokeColor)

        this.label = {
            text: sectionData.label,
            fontSize: sectionData.labelSize,
            fillColor: tinyColor.darken(15).toString(),
            x: sectionData.topLeft.x + sectionData.subChart.width / 2,
            y: sectionData.topLeft.y + sectionData.subChart.height / 2,
            rotate: sectionData.labelRotationAngle,
        }
        this.seatsCanvas.texts.push(this.label)
        this.rows = (sectionData?.subChart?.rows || []).map(
            (row: any) =>
                new Row(
                    {
                        ...row,
                        color: this.strokeColor,
                        origionPoint: this.topLeft,
                    },
                    this.seatsCanvas
                )
        )
        this.seatsCanvas.polygons.push({
            points: this.points,
            lineWidth: 10,
            strokeColor: this.strokeColor,
            fillColor: this.fillColor,
        })
    }
}

export class Table {
    seats: Seat[] = []
    color: string = "#D1D1D1"
    origionPoint: Point
    x: number
    y: number
    radius: number
    label: Text

    constructor(private tableData: any, private seatsCanvas: SeatsCanvas) {
        this.origionPoint = tableData.origionPoint || { x: 0, y: 0 }
        this.x = tableData.center.x
        this.y = tableData.center.y
        this.radius = tableData.radius
        this.label = {
            text: tableData.label,
            fontSize: tableData.radius,
            fillColor: "#696969",
            x: this.x + this.origionPoint.x,
            y: this.y + this.origionPoint.y,
        }
        this.seatsCanvas.texts.push(this.label)
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
        this.seatsCanvas.circles.push({
            x: this.x + this.origionPoint.x,
            y: this.y + this.origionPoint.y,
            radius: this.radius,
            strokeColor: this.color,
            fillColor: this.color,
        })
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
        this.color =
            seatData.color ||
            seatsCanvas.colorMap[seatData.categoryKey]?.color ||
            "#ED303D"
        this.origionPoint = seatData?.origionPoint || { x: 0, y: 0 }

        seatsCanvas.circles.push({
            x: this.x + this.origionPoint.x,
            y: this.y + this.origionPoint.y,
            radius: this.radius,
            strokeColor: this.color,
            fillColor: this.color,
        })
        seatsCanvas.texts.push({
            text: this.seatData.label,
            fontSize: this.radius,
            fillColor: "black",
            x: this.x + this.origionPoint.x,
            y: this.y + this.origionPoint.y,
        })
    }
}
