export const ART_DROP_ABI = [
  { type: 'function', stateMutability: 'view', name: 'paused', inputs: [], outputs: [{ type: 'bool' }] },
  { type: 'function', stateMutability: 'view', name: 'collection', inputs: [], outputs: [{ type: 'address' }] },
  { type: 'function', stateMutability: 'view', name: 'unitPriceFor', inputs: [{ type: 'address' }, { type: 'uint256' }], outputs: [{ type: 'uint256' }] },
  {
    type: 'function', stateMutability: 'view', name: 'sale', inputs: [{ type: 'uint256' }], outputs: [
      { name: 'startTime', type: 'uint64' },
      { name: 'maxPerTx', type: 'uint64' },
      { name: 'discountBps', type: 'uint16' },
      { name: 'priceWei', type: 'uint128' },
      { name: 'artist', type: 'address' },
    ]
  },
  {
    type: 'function', stateMutability: 'payable', name: 'buyTo', inputs: [
      { name: 'id', type: 'uint256' },
      { name: 'amount', type: 'uint256' },
      { name: 'recipient', type: 'address' },
    ], outputs: []
  },
];