declare module 'zarinpal-checkout' {
  type Currency = 'IRR' | 'IRT';

  export interface PaymentRequestInput {
    Amount: string;
    CallbackURL: string;
    Description?: string;
    Email?: string;
    Mobile?: string;
  }

  export interface PaymentRequestResponse {
    status: number;
    authority: string;
    url: string;
  }

  export interface PaymentVerificationInput {
    Amount: string;
    Authority: string;
  }

  export interface PaymentVerificationResponse {
    status: number;
    RefID?: string | number | bigint;
  }

  export interface ZarinPalInstance {
    PaymentRequest(input: PaymentRequestInput): Promise<PaymentRequestResponse>;
    PaymentVerification(input: PaymentVerificationInput): Promise<PaymentVerificationResponse>;
  }

  const ZarinPalCheckout: {
    create(merchantId: string, sandbox: boolean, currency?: Currency): ZarinPalInstance;
  };

  export default ZarinPalCheckout;
}
