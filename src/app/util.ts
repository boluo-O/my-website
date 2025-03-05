import { TinyColor } from "@ctrl/tinycolor"

export const convertColorToRGBA = (color: string) => {
    const rgba = new TinyColor(color).toRgb() // '#ff0000'

    return [rgba.r, rgba.g, rgba.b, rgba.a]
}
