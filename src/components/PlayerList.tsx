import React from 'react';
import { useGameStore } from '../store/useGameStore';
import { stringToColor } from '../utils/stringToColor';

interface PlayerListProps {
  onPlayerClick?: (playerId: number) => void;
}

export const PlayerList: React.FC<PlayerListProps> = ({ onPlayerClick }) => {
  const players = useGameStore((s) => s.players);
  const localPlayerIds = useGameStore((s) => s.localPlayerIds);
  const currentTurnPlayerId = useGameStore((s) => s.currentPlayerId);
  const fieldStates = useGameStore((s) => s.fieldStates);

  return (
    <div className="overflow-y-auto max-h-[300px] border rounded text-sm font-mono">
      <table className="w-full table-fixed">
      <colgroup>
        {['1.5rem', 'auto', '4.5rem', '2.5rem', '4.5rem', '2rem'].map((width, i) => (
          <col key={i} style={{ width }} />
        ))}
      </colgroup>
        <tbody>
          {players.map((player) => {
            const isLocal = localPlayerIds.find(p => p === player.id);
            const isCurrent = player.id === currentTurnPlayerId;
            const ownedFields = fieldStates.filter(f => f.ownerId === player.id);
            const firmCount = ownedFields.length;
            const totalCost = ownedFields.reduce((sum, f) => sum + (f.totalInvestment ?? 0), 0);
            const textColor = stringToColor(player.name);

            return (
              <tr
                key={player.id}
                className={`cursor-pointer ${player.isBankrupt ? 'text-gray-400' : ''}`}
                onClick={() => onPlayerClick?.(player.id)}
              >
                {/* Индикатор хода */}
                <td className="px-1 py-1 w-4 text-center" title="Ход">
                  {isCurrent ? '➡' : ''}
                </td>

                {/* Имя */}
                <td
                  className="px-2 py-1 truncate"
                  title="Имя игрока"
                >
                  <span style={{ color: textColor, fontWeight: isLocal ? 'bold' : 'normal' }}>
                    {player.name}
                  </span>
                </td>

                {/* Баланс */}
                <td
                  className="px-2 py-1 text-right"
                  title="Баланс"
                >
                  {player.balance.toFixed(1)}
                </td>

                {/* Кол-во фирм */}
                <td
                  className="px-2 py-1 text-center"
                  title="Количество фирм"
                >
                  {firmCount}
                </td>

                {/* Общая стоимость */}
                <td
                  className="px-2 py-1 text-right"
                  title="Общая стоимость фирм"
                >
                  {totalCost.toFixed(1)}
                </td>

                {/* Статусы */}
                <td
                  className="px-2 py-1 text-center"
                  title="Статусы"
                >
                  {player.inJail && '🚔'}
                  {player.backwardsTurns > 0 && '↩'}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};
