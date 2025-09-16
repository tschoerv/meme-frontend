export const ERC1155_ABI = [
  {
    type: 'function', name: 'balanceOf', stateMutability: 'view', inputs: [
      { name: 'account', type: 'address' },
      { name: 'id', type: 'uint256' }
    ], outputs: [{ type: 'uint256' }]
  }
];