export const isEthAddress = (s = '') =>
  /^0x[a-fA-F0-9]{40}$/.test(s);