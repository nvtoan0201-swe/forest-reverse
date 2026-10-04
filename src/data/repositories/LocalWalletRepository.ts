import { UDKeys } from '../../core/prefs/UDKeys';
import { prefs } from '../../core/prefs/prefs';
import type { UnlockScenario } from '../types';

export type SpendResult = { ok: true } | { ok: false; reason: 'InsufficientCoins' | 'InsufficientGems' };

export interface WalletRepository {
  getBalance(): Promise<{ coin: number; gem: number }>;
  spend(scenario: UnlockScenario, amount: number, currency?: 'coin' | 'gem'): SpendResult;
  earnCoin(amount: number): void;
  earnGem(amount: number): void;
  setBalance(coin: number, gem: number): void;
}

export class LocalWalletRepository implements WalletRepository {
  getBalance(): Promise<{ coin: number; gem: number }> {
    return Promise.resolve({
      coin: prefs.get<number>(UDKeys.COIN_BALANCE, 0),
      gem: prefs.get<number>(UDKeys.GEM_BALANCE, 0),
    });
  }

  spend(_scenario: UnlockScenario, amount: number, currency: 'coin' | 'gem' = 'coin'): SpendResult {
    const balance = prefs.get<number>(
      currency === 'coin' ? UDKeys.COIN_BALANCE : UDKeys.GEM_BALANCE,
      0,
    );
    if (balance < amount) {
      return { ok: false, reason: currency === 'coin' ? 'InsufficientCoins' : 'InsufficientGems' };
    }
    prefs.set(currency === 'coin' ? UDKeys.COIN_BALANCE : UDKeys.GEM_BALANCE, balance - amount);
    return { ok: true };
  }

  earnCoin(amount: number): void {
    prefs.set(UDKeys.COIN_BALANCE, prefs.get<number>(UDKeys.COIN_BALANCE, 0) + amount);
  }

  earnGem(amount: number): void {
    prefs.set(UDKeys.GEM_BALANCE, prefs.get<number>(UDKeys.GEM_BALANCE, 0) + amount);
  }

  setBalance(coin: number, gem: number): void {
    prefs.set(UDKeys.COIN_BALANCE, Math.max(0, Math.floor(coin)));
    prefs.set(UDKeys.GEM_BALANCE, Math.max(0, Math.floor(gem)));
  }
}
