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
            <div className="flex gap-1 mt-13">
                {renderIcon('discord', 'Discord', '/discord.webp', 'https://discord.gg/628ymEU8')}
                {renderIcon('x', 'X', '/x.png', 'https://x.com/Memecoin2016')}
                {desktopItems.dexscreener && (
                    <Button
                        draggable
                        style={{
                            width: 78,
                            background: 'transparent',
                            boxShadow: 'none',
                            cursor: 'pointer',
                        }}
                        className="flex flex-col items-center space-y-1"
                        onDragStart={(e) => e.dataTransfer.setData('text/plain', 'dexscreener')}
                        onClick={isTouch ? () => alert('soon!') : undefined}
                        onDoubleClick={!isTouch ? () => alert('soon!') : undefined}
                    >
                        <Image src="/dexscreener.png" alt="Dexscreener" width={48} height={48} />
                        <span className="text-xs text-center">Dexscreener</span>
                    </Button>
                )}
                {renderIcon('github', 'GitHub', '/github.png', 'https://github.com/tschoerv/meme-frontend')}
            </div>
        </div>

    );
}



