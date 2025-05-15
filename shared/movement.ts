export function calculateMovementPath(
  startIndex: number,
  steps: number
): number[] {
  // Вернёт массив индексов ячеек: [53, 54, 55, 12] — по которым движется игрок
  const end = (startIndex + steps) % 57;
  return [end];
}
