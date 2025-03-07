export interface Point {
    x: number
    y: number
}

export interface Circle {
    x: number
    y: number
    radius: number
    strokeColor: string
    fillColor: string
    lineWidth?: number
}

export interface Polygon {
    points: Point[]
    strokeColor: string
    fillColor: string
    lineWidth?: number
}

export interface Text {
    x
    y
    text
    fontSize?: number
    fontFamily?: string
    fillColor?: string
    textAlign?: CanvasTextAlign
    textBaseline?: CanvasTextBaseline
    rotate?: number
    offsetX?: number
    offsetY?: number
}
