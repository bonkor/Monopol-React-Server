// controllers/ConfirmationController.ts

type ConfirmationButton = {
  label: string;
  action: () => void | Promise<void>;
  className?: string;
};

type ConfirmationOptions = {
  message?: string;
  content?: React.ReactNode;
  buttons: ConfirmationButton[];
};

type RequestFn = (options: ConfirmationOptions) => void;
type ConfirmFn = (message: string) => Promise<boolean>;
type ClearFn = () => void;

let requestFn: RequestFn | null = null;
let confirmFn: ConfirmFn | null = null;
let clearFn: ClearFn | null = null;

export function registerConfirmationHandlers(request: RequestFn, confirm: ConfirmFn, clear: ClearFn) {
  requestFn = request;
  confirmFn = confirm;
  clearFn = clear;
}

export function requestConfirmation(options: ConfirmationOptions) {
  if (!requestFn) {
    console.warn('requestConfirmation called before handler registered');
    return;
  }
  requestFn(options);
}

export function confirm(message: string): Promise<boolean> {
  if (!confirmFn) {
    console.warn('confirm called before handler registered');
    return Promise.resolve(false);
  }
  return confirmFn(message);
}

export function clearConfirmation() {
  if (clearFn) clearFn();
}
