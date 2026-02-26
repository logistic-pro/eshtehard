declare module 'kavenegar' {
  export interface KavenegarApi {
    VerifyLookup(params: {
      receptor: string;
      token: string;
      template: string;
      type?: string;
    }, callback: (response: unknown, status: number) => void): void;

    Send(params: {
      sender?: string;
      receptor: string;
      message: string;
    }, callback: (response: unknown, status: number) => void): void;
  }

  export interface KavenegarModule {
    KavenegarFactory(config: { apikey: string }): KavenegarApi;
  }

  const mod: KavenegarModule;
  export = mod;
}
