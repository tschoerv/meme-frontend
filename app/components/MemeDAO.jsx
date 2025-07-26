// components/MemeDAO.jsx
import Image from "next/image";

export default function MemeDAO() {
    const people = [
        {
            name: "tschoerv",
            role: "Signer",
            img: "/pfp/tschoerv.webp",
            twitter: "https://x.com/tschoerv",
        },
        {
            name: "spiderwars",
            role: "Signer",
            img: "/pfp/spiderwars.webp",
            twitter: "https://x.com/ethSpiderwars",
        },
        {
            name: "Diogo",
            role: "Signer",
            img: "/pfp/diogo.webp",
            twitter: "https://x.com/DiogoAndrea1",
        },
        {
            name: "Zacks.eth",
            role: "Meme Manager",
            img: "/pfp/zacks.webp",
            twitter: "https://x.com/0xzxch",
        },
        {
            name: "MJdata",
            role: "Advisor",
            img: "/pfp/mjdata.webp",
            twitter: "https://x.com/ChampagneMan",
        }
    ];

    return (
        <section className="max-w-3xl mx-auto px-4 text-sm sm:text-base leading-relaxed">
            <h2 className="text-3xl sm:text-4xl font-bold mb-6">The MemeDAO</h2>

            <p className="mb-4">
                <strong>MemeDAO</strong> stewards <strong>15 %</strong> of the fixed
                supply — fuel for marketing, partnerships, and community
                growth. The DAO also oversees the <strong>20 % airdrop</strong>,
                ensuring tokens reach genuine meme believers.
            </p>

            <h3 className="text-xl font-semibold mt-4 mb-2">How Governance Works</h3>
            <ul className="list-disc list-inside space-y-0 mb-6">
                <li>
                    <strong>Open proposals:</strong> Anyone can suggest a marketing idea, campaign, or meme-related initiative directly in the community Telegram.
                </li>
                <li>
                    <strong>Community discussion:</strong> Ideas are openly debated, refined, and gauged for interest and meme potential.
                </li>
                <li>
                    <strong>Voting:</strong> Final decisions on grants and funding are made by MemeDAO based on consensus from the signer group.
                </li>
                <li>
                    <strong>Transparent execution:</strong> All treasury movements are on-chain, and summaries are shared with the community.
                </li>
            </ul>

            <h3 className="text-xl font-semibold mt-6 mb-2">Got a Meme-Worthy Idea?</h3>
            <p>
                Bring your boldest meme ideas to our Telegram — MemeDAO funds the fun.
            </p>

            <h3 className="text-xl font-semibold mb-2">Core Roles</h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5">
                {people.map(({ name, role, img, twitter }) => (
                    <div
                        key={name}
                        className="flex flex-col items-center text-center mt-2"
                    >
                        <a
                            href={twitter}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="w-20 h-20 relative rounded-full overflow-hidden border-2 border-neutral-700 hover:scale-105 transition-transform"
                        >
                            <Image src={img} alt={name} layout="fill" objectFit="cover" />
                        </a>
                        <div>
                            <p className="font-medium mt-1.5 mb-0">{name}</p>
                            <p className="text-xs text-neutral-500 m-0">{role}</p>
                        </div>
                    </div>
                ))}
            </div>

            <h3 className="text-xl font-semibold mt-6 mb-2">Treasury</h3>
            <ul className="list-disc list-inside space-y-2 mb-6">
                <li>
                    MemeDAO Treasury: &nbsp;
                <a
                    href="https://etherscan.io/address/0x2683fF19a718F301b7D0B699686D026074eA1E08"
                    target="_blank"
                    rel="noopener noreferrer"
                >
                    meme-dao.eth
                </a>
                </li>
                <li>
                    MemeDAO Dev Wallet: &nbsp;
                <a
                    href="https://etherscan.io/address/0x19612b6EFfB332522f4d618Eb149412D3bB6069C"
                    target="_blank"
                    rel="noopener noreferrer"
                >
                    0x1961...069C
                </a>
                </li>
            </ul>
        </section>
    );
}
