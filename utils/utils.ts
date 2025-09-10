export function toTwoSignificantFigures(num: number) {
	return Number(num.toPrecision(2));
}
