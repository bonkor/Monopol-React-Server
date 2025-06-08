import { type Player, type PaymentRequest, getPlayerById } from '../shared/types';
import { type Money, m, getPropertyTotalCost } from '../shared/fields';
import { fieldState, broadcast, makePlayerBankrupt } from './game';

export function handlePayment(payer: Player, receiver?: Player, amount: Money, reason: string) {
  if (payer.isBankrupt) return;

  if (payer.sequester > 0 || (receiver && receiver.sequester > 0)) {
    if (receiver) broadcast({ type: 'chat', text: `${receiver.name} ничего не получает от ${payer.name} ${reason}. Секвестр` });
    else broadcast({ type: 'chat', text: `${payer.name} ничего не платит ${reason}. Секвестр` });
    return;
  }

  if (payer.refusalToPay > 0) {
    if (receiver) broadcast({ type: 'chat', text: `${payer.name} должен заплатить ${receiver.name} ${amount} ${reason}` });
    else broadcast({ type: 'chat', text: `${payer.name} должен заплатить ${amount} ${reason}` });
    payer.pendingPayments.push({
      to: receiver?.id,
      amount,
      reason,
    });
    return; // ничего не делаем сразу
  }

  processPayment(payer, receiver, amount, reason);
}

export function processPayment(payer: Player, receiver?: Player, amount: Money, reason: string) {
  if (payer.sequester > 0 || (receiver && receiver.sequester > 0)) {
    if (receiver) broadcast({ type: 'chat', text: `${receiver.name} ничего не получает от ${payer.name} ${reason}. Секвестр` });
    else broadcast({ type: 'chat', text: `${payer.name} ничего не платит ${reason}. Секвестр` });
    return;
  }

  const totalAssets = payer.balance + getPropertyTotalCost({playerId: payer.id, gameState: fieldState});
  const resName = receiver ? receiver.name : '';

  if (amount <= totalAssets) {
    payer.balance -= amount;
    if (receiver) {
      receiver.balance += amount;
      broadcast({ type: 'chat', text: `${resName} получает от ${payer.name} ${amount} ${reason}` });
    } else {
      broadcast({ type: 'chat', text: `${payer.name} платит ${amount} ${reason}` });
    }
  } else {
    payer.balance = 0;
    makePlayerBankrupt(payer.id);
    if (receiver) {
      receiver.balance += payer.balance + calculateTotalPropertyValue(payer);
      broadcast({ type: 'chat', text: `${receiver.name} получает от ${payer.name} ${amount} ${reason}. Больше не может.` });
    }
  }
}
