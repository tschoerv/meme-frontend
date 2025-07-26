export default function MemeLore() {
  return (
    <section className="max-w-3xl mx-auto px-4 text-sm sm:text-base leading-relaxed">
      <h2 className="text-3xl sm:text-4xl font-bold mb-6">The Lore of Meme</h2>

      <p className="mb-4">
        <strong>Meme</strong>, a forgotten 2016 puzzle-token, rediscovered and hard-capped at <strong>690 420 MEME</strong>.
      </p>

      <p className="mb-0">
        In the early ERC-20 days of 2016, an anonymous dev dropped a tiny token contract called Meme. It’s a minimal, 0-decimal ERC-20 — not even a ticker symbol! The twist? Minting was gated behind the on-chain riddle <code>rewardMathGeniuses()</code>, which only hands out one token when you supply the exact cube root of the current challenge.
      </p>

      <p className='mb-4 mt-0'>
        The deployer quietly minted <strong>257 MEME</strong> and vanished. To honor the creator, MemeDAO has locked 2.5% of the supply to be <a
          href="https://etherscan.io/address/0x575c2466325d21ccd1b830d567015ea5ad270ab9"
          target="_blank"
          rel="noopener noreferrer"
        >claimed</a> by the deployer address.
      </p>

      <div className="flex flex-row items-center">
        <p className='mb-1 mt-1'>Original contract from 2016:</p>
        <span className="text-sm sm:text-base ml-1"><a
          href="https://etherscan.io/token/0x84965cf265d75478abd7c6aa45e1b80b5d5e38cf"
          target="_blank"
          rel="noopener noreferrer"
        >0x8496…38cf</a></span>
      </div>

      <div className="bg-neutral-900 text-neutral-100 text-sm px-4 py-3 rounded-md overflow-x-auto mb- border border-neutral-700">
        <pre className="whitespace-pre-wrap">
          {`def rewardMathGeniuses(uint256 _answerToCurrentReward, uint256 _nextChallenge) payable: 
  require _answerToCurrentReward^3 == stor5
  balanceOf[caller]++
  stor5 = _nextChallenge`}
        </pre>
      </div>

      <p className="mb-2 mt-6">
        Nine years later, <a
          href="https://x.com/tschoerv"
          target="_blank"
          rel="noopener noreferrer"
        >tschoerv</a> unearthed the contract. Using a purpose-built grab script, he:
      </p>

      <ol className="list-decimal list-inside mb-2 mt-0 space-y-1">
        <li>Swept <strong>690 162 MEME</strong> from the contract.</li>
        <li>Submitted a non-perfect cube as nextChallenge on the last call, which minted a final <strong>1 MEME</strong> and locked the supply forever.</li>
      </ol>

      <p className="mb-6 mt-0">
        Add in the OG’s 257 tokens and the supply crystallised at the meme-perfect <strong>690 420 MEME</strong>.
      </p>

      <p className="mb-6">
        To make Meme tradeable on modern infrastructure and fill in the missing ticker symbol, a wrapper contract has been deployed at a meme-grade vanity address: &nbsp;
        <a
          href="https://etherscan.io/address/0x69420bb3b07cd7cDa30d589E0f6563cEd3669420"
          target="_blank"
          rel="noopener noreferrer"
        >
          0x6942…69420
        </a>
      </p>

      <h3 className="text-xl sm:text-2xl font-semibold mb-2">What’s next?</h3>
      <ul className="list-disc list-inside space-y-1 mb-6">
        <li>Airdrop Season</li>
        <li>Presale to fund the LP</li>
        <li>Liquidity Pool Launch</li>
        <li>Community proposals, campaigns & fun</li>
        <li>Stay tuned for more!</li>
      </ul>
    </section>
  );
}
