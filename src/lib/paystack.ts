const PAYSTACK_PUBLIC_KEY = 'pk_test_e598295829f3d2ad28904885b46b0b94c0a754b7';

interface PaystackOptions {
  email: string;
  amount: number; // in kobo
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

export function payWithPaystack({ email, amount, onSuccess, onClose }: PaystackOptions) {
  const handler = window.PaystackPop.setup({
    key: PAYSTACK_PUBLIC_KEY,
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
