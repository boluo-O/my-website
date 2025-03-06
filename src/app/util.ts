import { TinyColor } from "@ctrl/tinycolor"

export const convertColorToRGBA = (
    color: string
): [number, number, number, number] => {
    const rgba = new TinyColor(color).toRgb()

    return [rgba.r / 255, rgba.g / 255, rgba.b / 255, rgba.a]
}
