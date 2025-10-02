import { Button } from '@react95/core';
import { useDesktop } from '../contexts/DesktopContext';
import { useIsTouchDevice } from '../hooks/useIsTouchDevice';
import Image from 'next/image';

export default function Socials() {
    const { desktopItems } = useDesktop();
    const isTouch = useIsTouchDevice();

    const renderIcon = (key, label, img, href) => {
        if (!desktopItems[key]) return null;

        return (
            <Button
                draggable
                onDragStart={(e) => e.dataTransfer.setData("text/plain", key)}
                style={{ width: 78, background: 'transparent', boxShadow: 'none', cursor: 'pointer' }}
                className="flex flex-col items-center space-y-1"
                onClick={isTouch ? () => href && window.open(href, '_blank', 'noopener,noreferrer') : undefined}
                onDoubleClick={!isTouch ? () => href && window.open(href, '_blank', 'noopener,noreferrer') : undefined}
            >
                <Image src={img} alt={label} width={48} height={48} />
                <span className="text-xs text-center">{label}</span>
            </Button>
        );
    };

    return (
        <div>
            <div className="flex gap-1">
                {renderIcon('discord', 'Discord', '/discord.webp', 'https://discord.gg/v2uMwstg8q')}
                {renderIcon('x', 'X', '/x.webp', 'https://x.com/Memecoin2016')}
                {renderIcon('dexscreener', 'Dexscreener', '/dexscreener.webp', 'https://dexscreener.com/ethereum/0x69420bb3b07cd7cDa30d589E0f6563cEd3669420')}
                {renderIcon('github', 'GitHub', '/github.webp', 'https://github.com/tschoerv/meme-frontend')}
            </div>
        </div>

    );
}



