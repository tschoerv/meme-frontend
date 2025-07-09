export const AIRDROP_ABI = [
  {
    type: 'function', name: 'rounds', stateMutability: 'view',
    inputs: [{ type: 'uint256' }],
    outputs: [
      { type: 'uint64' }, // regEnds
      { type: 'bytes32' },
      { type: 'uint256' },
      { type: 'uint256' }, // sharePerWallet
      { type: 'uint64' },
      { type: 'bool' }, // closed
    ]
  },
  {
    type: 'function', name: 'roundsCount', stateMutability: 'view',
    inputs: [], outputs: [{ type: 'uint256' }]
  },
  {
    type: 'function', name: 'registered', stateMutability: 'view',
    inputs: [{ type: 'uint256' }, { type: 'address' }], outputs: [{ type: 'bool' }]
  },
  {
    type: 'function', name: 'claimed', stateMutability: 'view',
    inputs: [{ type: 'uint256' }, { type: 'address' }], outputs: [{ type: 'bool' }]
  },
  {
    type: 'function', name: 'register', stateMutability: 'nonpayable',
    inputs: [{ type: 'uint256' }, { type: 'bytes32[]' }], outputs: []
  },
  {
    type: 'function', name: 'claim', stateMutability: 'nonpayable',
    inputs: [{ type: 'uint256' }], outputs: []
  },
];
