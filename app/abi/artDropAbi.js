export const ART_DROP_ABI = [
  { type: 'function', stateMutability: 'view', name: 'paused', inputs: [], outputs: [{ type: 'bool' }] },
  {
    type: 'function',
    stateMutability: 'view',
    name: 'sale',
    inputs: [{ name: 'id', type: 'uint256' }],
    outputs: [
      { name: 'priceWei',  type: 'uint64'  },
      { name: 'startTime', type: 'uint64'  },
      { name: 'maxPerTx',  type: 'uint8'   },
      { name: 'artist',    type: 'address' },
    ],
  },
  {
    type: 'function',
    stateMutability: 'view',
    name: 'unitPriceFor',
    inputs: [{ name: 'account', type: 'address' }, { name: 'id', type: 'uint256' }],
    outputs: [{ type: 'uint256' }],
  },
  {
    type: 'function',
    stateMutability: 'payable',
    name: 'buyTo',
    inputs: [
      { name: 'id',       type: 'uint256' },
      { name: 'amount',   type: 'uint256' },
      { name: 'recipient',type: 'address' },
    ],
    outputs: [],
  },
];
