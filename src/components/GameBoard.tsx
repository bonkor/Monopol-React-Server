export function GameBoard() {
  return (
    <div className="grid grid-cols-11 grid-rows-11 w-full h-full h-screen">
      {Array.from({ length: 121 }, (_, index) => {
        const row = Math.floor(index / 11);
        const col = index % 11;

        const isPerimeter = row === 0 || row === 10 || col === 0 || col === 10;
        const isCross = (row === 5 || col === 5) && !isPerimeter;
        const isCenter = row === 5 && col === 5;
        const isDiceZone = row >= 6 && row <= 9 && col >= 6 && col <= 9;

        let cellIndex: number | null = null;

        if (isPerimeter) {
          if (row === 0) cellIndex = col;
          else if (col === 10) cellIndex = 10 + row;
          else if (row === 10) cellIndex = 20 + (10 - col);
          else if (col === 0) cellIndex = 30 + (10 - row);
        } else if (isCross) {
          if (row === 5) cellIndex = 40 + (col - 1);
          else if (col === 5) cellIndex = 48 + (row < 5 ? row : row - 1);
        }

        return (
          <div
            key={index}
            className={`relative flex items-center justify-center text-xs font-mono ${
              isCenter
                ? 'bg-yellow-400 font-bold'
                : cellIndex !== null
                ? 'bg-green-200 border border-gray-300'
                : ''
            }`}
          >
            <span className="opacity-60">
              {isCenter ? 'СТАРТ (44)' : cellIndex !== null ? cellIndex : ''}
            </span>
          </div>
        );
      })}
    </div>
  );
}
