export const isMainnet = () => (process.env.IS_MAINNET as string) === 'true';

export const EXPLORER_API_URL = (isMainnet: boolean) =>
  (isMainnet
    ? (process.env.EXPLORER_MAINNET_API_URL as string)
    : (process.env.EXPLORER_TESTNET_API_URL as string)
  )?.replace(/[\\/]+$/, '');

export const NODE_API_URL = (isMainnet: boolean) =>
  (isMainnet
    ? (process.env.NODE_MAINNET_API_URL as string)
    : (process.env.NODE_TESTNET_API_URL as string)
  )?.replace(/[\\/]+$/, '');
export const UMAP_MNEMONIC = () => process.env.UMAP_MNEMONIC as string;
export const SUPABASE_ADDRESS = () => process.env.SUPABASE_ADDRESS as string;
export const SUPABASE_API_KEY = () => process.env.SUPABASE_API_KEY as string;
export const ML_API_URL = () =>
  (process.env.ML_API_URL as string)?.replace(/[\\/]+$/, '');
