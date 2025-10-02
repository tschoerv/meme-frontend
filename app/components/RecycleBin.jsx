import { Button } from '@react95/core';
import { RecycleFull } from '@react95/icons';
import { useDesktop } from '../contexts/DesktopContext';

export default function RecycleBin() {
    const { removeItem } = useDesktop();

    const handleDrop = (e) => {
        e.preventDefault();
        const id = e.dataTransfer.getData('text/plain');
        removeItem(id);
    };

    const handleDragOver = (e) => {
        e.preventDefault();
    };
    return (
        <div>
            {/* ─────── Recycle Bin ─────── */}
            <Button
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                style={{ width: 85, position: 'absolute', right: 16, bottom: 16, cursor: 'not-allowed', background: 'transparent', boxShadow: 'none', }}
                className="flex flex-col items-center space-y-1"
            >
                <RecycleFull variant="32x32_4" />
                <span className="text-xs text-center whitespace-nowrap">
                    Recycle Bin
                </span>
            </Button>
        </div>
    );
}