import { signalStore, withState, withMethods, patchState, withHooks } from '@ngrx/signals';
import { Plan, OperatorDetection } from '../core/models/api.models';

export interface RechargeState {
  mobileNumber: string | null;
  operator: OperatorDetection | null;
  selectedPlan: Plan | null;
  rechargeStatus: 'IDLE' | 'PROCESSING' | 'SUCCESS' | 'FAILED' | 'AWAITING_PAYMENT';
}

const initialState: RechargeState = {
  mobileNumber: null,
  operator: null,
  selectedPlan: null,
  rechargeStatus: 'IDLE'
};

const SESSION_KEY = 'recharge_session';

export const RechargeStore = signalStore(
  { providedIn: 'root' },
  withState(initialState),
  withMethods((store) => ({
    setMobileNumber(mobile: string) {
      patchState(store, { mobileNumber: mobile });
      this.persistToSession();
    },
    setOperator(operator: OperatorDetection) {
      patchState(store, { operator });
      this.persistToSession();
    },
    setPlan(plan: Plan) {
      patchState(store, { selectedPlan: plan });
      this.persistToSession();
    },
    setStatus(status: RechargeState['rechargeStatus']) {
      patchState(store, { rechargeStatus: status });
    },
    clearFlow() {
      patchState(store, initialState);
      sessionStorage.removeItem(SESSION_KEY);
    },
    persistToSession() {
      const state = {
        mobileNumber: store.mobileNumber(),
        operator: store.operator(),
        selectedPlan: store.selectedPlan()
      };
      sessionStorage.setItem(SESSION_KEY, JSON.stringify(state));
    },
    restoreFromSession() {
      const stored = sessionStorage.getItem(SESSION_KEY);
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          patchState(store, {
            mobileNumber: parsed.mobileNumber,
            operator: parsed.operator,
            selectedPlan: parsed.selectedPlan
          });
        } catch (e) {
          sessionStorage.removeItem(SESSION_KEY);
        }
      }
    }
  })),
  withHooks({
    onInit(store) {
      // Manual trigger for restoring since this is a root store
      setTimeout(() => store.restoreFromSession());
    }
  })
);
