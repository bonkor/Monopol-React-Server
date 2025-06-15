import React from 'react';
import { useGameStore } from '../store/useGameStore';
import { stringToColor } from '../utils/stringToColor';
import { getCompanyCostByIndex } from '@shared/fields';

interface PlayerListProps {
  onPlayerClick?: (playerId: number) => void;
}

export const PlayerList: React.FC<PlayerListProps> = ({ onPlayerClick }) => {
  const players = useGameStore((s) => s.players);
  const localPlayerIds = useGameStore((s) => s.localPlayerIds);
  const currentTurnPlayerId = useGameStore((s) => s.currentPlayerId);
  const lastLocalPlayerId = useGameStore((s) => s.lastLocalPlayerId);
  const fieldStates = useGameStore((s) => s.fieldStates);

  return (
    <div className="overflow-y-auto max-h-[300px] border rounded text-sm font-mono">
      <table className="w-full table-fixed">
      <colgroup>
        {['1.5rem', '4.5rem', '4.5rem', '2.5rem', '4.5rem', 'auto'].map((width, i) => (
          <col key={i} style={{ width }} />
        ))}
      </colgroup>
        <tbody>
          {players.map((player) => {
            const isLocal = localPlayerIds.find(p => p === player.id);
            const isCurrent = player.id === currentTurnPlayerId;
            const ownedFields = fieldStates.filter(f => f.ownerId === player.id);
            const firmCount = ownedFields.length;
            const totalCost = ownedFields.reduce((sum, f) => sum + (getCompanyCostByIndex(f.index) ?? 0), 0);
            const textColor = stringToColor(player.name);

            return (
              <tr
                key={player.id}
                className={`cursor-pointer ${player.isBankrupt || player.isOffline ? 'text-gray-400' : ''} ${player.id === lastLocalPlayerId ? 'bg-gray-400' : ''}`}
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
                  className={`px-2 py-1 text-right ${player.balance < 0 ? 'text-red-900' : ''}`}
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
                  className="px-2 py-1 text-left"
                  title="Статусы"
                >
                  {player.refusalToPay > 0 && 'o'.repeat(player.refusalToPay)}
                  {player.refusalToChance > 0 && ' ' + '?'.repeat(player.refusalToChance)}
                  {player.plusStart > 0 && ' ' + '+st'.repeat(player.plusStart)}
                  {player.plusStart < 0 && ' ' + '-st'.repeat(-player.plusStart)}
                  {player.sequester > 0 && ` seq:${player.sequester}`}
                  {player.inJail && '🚔'}
                  {player.turnToStart > 0 && ' ' + '↩'.repeat(player.turnToStart)}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};
