interface PaystackOptions {
  email: string;
  amount: number; // in kobo
  publicKey: string;
  onSuccess: (reference: string) => void;
  onClose: () => void;
}

declare global {
  interface Window {
    PaystackPop: {
      setup: (opts: Record<string, unknown>) => { openIframe: () => void };
    };
  }
}

export function payWithPaystack({ email, amount, publicKey, onSuccess, onClose }: PaystackOptions) {
  const handler = window.PaystackPop.setup({
    key: publicKey,
    email,
    amount, // kobo
    currency: 'NGN',
    callback: (response: { reference: string }) => {
      onSuccess(response.reference);
    },
    onClose,
  });
  handler.openIframe();
}
