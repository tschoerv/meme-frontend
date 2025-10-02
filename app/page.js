'use client';

import { useState, useRef, useEffect } from 'react';
import {
  TaskBar,
  List,
  Modal,
  TitleBar,
  Button,
  useModal,
} from '@react95/core';
import {
  Optional3000,
  Drvspace1,
  InfoBubble,
  Mshtml32540,
  Wordpad,
  Shell3242,
  Wangimg128,
  Brush
} from '@react95/icons';
import Image from 'next/image';
import { useSearchParams, usePathname, useRouter } from 'next/navigation';
import { SuccessModalProvider } from './contexts/SuccessModalContext';

/* ─── your components ─── */
import Airdrop from './components/Airdrop';
import MemeInfo from './components/MemeInfo';
import MemeDAO from './components/MemeDAO';
import Socials from './components/Socials';
import RecycleBin from './components/RecycleBin';
import ArtDrop from './components/ArtDrop';
import ArtGallery from './components/ArtGallery';
import { DesktopProvider, useDesktop } from './contexts/DesktopContext';
import { useIsTouchDevice } from './hooks/useIsTouchDevice';
/* ─────────────────────── */

const slogan = 'First Meme on ETH';

const VALID = new Set(['logo', 'airdrop', 'tokenomics', 'info', 'dao', 'artDrop', 'gallery']);
const ALIAS = { mint: 'artDrop', lore: 'info', artdrop: 'artDrop' };

/* ─── Start-menu helper ───────────────────────────────────────────── */
function StartMenu({ open }) {
  return (
    <div style={{ position: 'absolute', top: '100%', left: 0, zIndex: 99_999, paddingTop: 29 }}>
      <List width={200}>
        <List.Item icon={<Optional3000 variant="32x32_4" />} onClick={() => open('airdrop')} style={{ cursor: 'pointer' }}>
          Airdrop
        </List.Item>
        <List.Item icon={<Drvspace1 variant="32x32_4" />} onClick={() => open('tokenomics')} style={{ cursor: 'pointer' }}>
          Tokenomics
        </List.Item>
        <List.Item icon={<Shell3242 variant="32x32_4" />} onClick={() => open('info')} style={{ cursor: 'pointer' }}>
          Lore
        </List.Item>
        <List.Item icon={<InfoBubble variant="32x32_4" />} onClick={() => open('dao')} style={{ cursor: 'pointer' }}>
          MemeDAO
        </List.Item>
        <List.Item icon={<Wangimg128 variant="32x32_4" />} onClick={() => open('gallery')} style={{ cursor: 'pointer' }}>
          Gallery
        </List.Item>
        <List.Item icon={<Brush variant="32x32_4" />} onClick={() => open('artDrop')} style={{ cursor: 'pointer' }}>
          Art Drop
        </List.Item>
      </List>
    </div>
  );
}

/* ─── main desktop page ───────────────────────────────────────────── */
function MemeHomepage() {
  const isTouch = useIsTouchDevice();
  const { desktopItems } = useDesktop();
  const modal = useModal();
  const params = useSearchParams();
  const openedOnce = useRef(false);
  const router = useRouter();
  const pathname = usePathname();

  const [show, setShow] = useState({
    logo: false,
    airdrop: false,
    tokenomics: false,
    info: false,
    dao: false,
    artDrop: false,
    gallery: false
  });
  const [openCount, setOpenCount] = useState(0);
  const [artDropPos, setArtDropPos] = useState({ x: 0, y: 0 });

  const desktopShortcuts = [
    { key: 'airdrop', label: 'Airdrop', Icon: Optional3000 },
    { key: 'tokenomics', label: 'Tokenomics', Icon: Drvspace1 },
    { key: 'info', label: 'Lore', Icon: Shell3242 },
    { key: 'dao', label: 'MemeDAO', Icon: InfoBubble },
    { key: 'gallery', label: 'Gallery', Icon: Wangimg128 },
    { key: 'artDrop', label: 'ArtDrop', Icon: Brush },
  ];

  /* helpers -------------------------------------------------------- */

  const open = (id) => {
    // ensure the element is mounted before focusing
    setShow((s) => ({ ...s, [id]: true }));
    setOpenCount((c) => c + 1); // Track how many modals have been opened
    modal.restore(id);
    if (id === 'artDrop') {
      // seed with the initial position you'll use for defaultPosition below
      const p = getDragPos(openCount);
      setArtDropPos(p);
      console.log(p)
    }
    setTimeout(() => modal.focus(id), 0);
  };

  const close = (id) => {
    setTimeout(() => modal.remove(id), 0);  // remove from task-bar stack
    modal.minimize(id);
    modal.focus('no-id');
    setTimeout(() => setShow((s) => ({ ...s, [id]: false })), 0);
    setOpenCount((c) => Math.max(0, c - 1)); // Prevent negative values
  };

  const getDragPos = (indexOffset = 0) => {
    const baseX = typeof window !== 'undefined' && window.innerWidth < 640 ? 0 : 90;
    const baseY = typeof window !== 'undefined' && window.innerWidth < 640 ? 0 : 0;

    return {
      x: baseX + indexOffset * 20,
      y: baseY + indexOffset * 20,
    };
  };

  useEffect(() => {
    if (openedOnce.current) return;

    const raw = params.get('open'); // e.g. ?open=mint,dao
    if (!raw) return;

    const ids = Array.from(new Set(
      raw
        .split(',')
        .map(s => s.trim())
        .map(s => {
          const hit = ALIAS[s.toLowerCase()];
          return hit || s;
        })
        .filter(id => VALID.has(id))
    ));

    if (!ids.length) return;

    openedOnce.current = true;

    // open then strip ?open=... from the URL (preserve other params)
    setTimeout(() => {
      ids.forEach(id => open(id));

      const sp = new URLSearchParams(Array.from(params.entries()));
      sp.delete('open');
      const newUrl = sp.toString() ? `${pathname}?${sp.toString()}` : pathname;
      router.replace(newUrl, { scroll: false });
    }, 0);
  }, [params, pathname, router]);

  /* ---------------------------------------------------------------- */
  return (
    <div className="relative flex flex-col min-h-screen">

      {/* Task-bar with Start-menu */}
      <TaskBar className="taskbarTop" list={<StartMenu open={open} />} />

      {/* Desktop shortcut (logo) */}
      {desktopItems.logo && (
        <Button
          draggable
          onDragStart={(e) => e.dataTransfer.setData('text/plain', 'logo')}
          onClick={isTouch ? () => open('logo') : undefined}
          onDoubleClick={!isTouch ? () => open('logo') : undefined}
          style={{
            width: 78,
            background: 'transparent',
            boxShadow: 'none',
            cursor: 'pointer',
            position: 'absolute',
            left: 16,
            top: 45,
          }}
          className="flex flex-col items-center space-y-1"
        >
          <Image src="/logo_icon.webp" alt="logo" width={48} height={48} />
          <span className="text-xs text-center">logo.png</span>
        </Button>
      )}

      {/* Recycle bin (handles drag-drop removal) */}
      <RecycleBin />

      {/* Wallpaper centrepiece */}
      <div className="flex flex-col items-center justify-center h-screen select-none">
        <Image src="/logo.webp" alt="logo" width={200} height={200} className="pointer-events-none" />
        <p className="mt-4 mb-16 text-lg">{slogan}</p>
        {!isTouch && (
          <div className="hidden gap-1 mb-8 md:flex md:flex-wrap md:justify-center">
            {desktopShortcuts.map(({ key, label, Icon }) => {
              if (!desktopItems[key]) return null;

              const handleOpen = () => open(key);

              return (
                <Button
                  key={key}
                  draggable
                  onDragStart={(e) => e.dataTransfer.setData('text/plain', key)}
                  style={{ width: 78, background: 'transparent', boxShadow: 'none', cursor: 'pointer' }}
                  className="flex flex-col items-center space-y-1"
                  onClick={isTouch ? handleOpen : undefined}
                  onDoubleClick={!isTouch ? handleOpen : undefined}
                >
                  <div className="relative w-[48px] h-[48px]">
                    <Icon variant="32x32_4" className="absolute inset-0 w-full h-full object-contain" />
                  </div>
                  <span className="text-xs text-center">{label}</span>
                </Button>
              );
            })}
          </div>
        )}
        <Socials />
      </div>

      {/* ─── Modals (render when flag true) ───────────────────────── */}
      {show.logo && (
        <Modal
          id="logo"
          title="logo.png"
          icon={<Mshtml32540 variant="16x16_4" />}
          dragOptions={{ defaultPosition: getDragPos(openCount) }}
          titleBarOptions={[
            <Modal.Minimize key="min" />,
            <TitleBar.Close key="x" onClick={() => close('logo')} />,
          ]}
        >
          <Modal.Content width={300} height={300} boxShadow="$in">
            <div className="flex flex-col items-center mt-4" style={{ minWidth: 310 }}>
              <Image src="/logo.webp" alt="logo" width={200} height={200} className="pointer-events-none" />
              <p className="mt-4 text-lg">{slogan}</p>
            </div>
          </Modal.Content>
        </Modal>
      )}

      {show.airdrop && (
        <Modal
          id="airdrop"
          title="Airdrop.exe"
          icon={<Optional3000 variant="16x16_4" />}
          dragOptions={{ defaultPosition: getDragPos(openCount) }}
          titleBarOptions={[
            <Modal.Minimize key="min" />,
            <TitleBar.Close key="x" onClick={() => close('airdrop')} />
          ]}
        >
          <Modal.Content width={400} height={210} boxShadow="$in">
            <Airdrop />
          </Modal.Content>
        </Modal>
      )}

      {show.tokenomics && (
        <Modal
          id="tokenomics"
          title="Tokenomics.png"
          icon={<Drvspace1 variant="16x16_4" />}
          dragOptions={{ defaultPosition: getDragPos(openCount) }}
          titleBarOptions={[
            <Modal.Minimize key="min" />,
            <TitleBar.Close key="x" onClick={() => close('tokenomics')} />,
          ]}
        >
          <Modal.Content width={420} height={420} boxShadow="$in">
            <div className="flex flex-col items-center min-w-[400px] min-h-[380px]">
              <p className="text-sm text-center mb-6">MEME Tokenomics Overview</p>
              <Image src="/tokenomics_cropped.svg" alt="tokenomics" width={380} height={300} />
              <div className='text-left'>
                <p className='mt-4 mb-1 text-xs'>• 100% of the funds raised in the presale (6eth) went into the LP.</p>
                <p className='mt-0 mb-1 text-xs'>• Liquidity position <a
                  href={`https://etherscan.io/tx/0xd6f7845cee57a068f783096d642c611275369427521ec8acfc2caa9d3693a864`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <span>locked</span>
                </a> until Aug, 2028.</p>
                <p className='mt-0 text-xs'>• tschoerv <a
                  href={`https://etherscan.io/address/0x20aeDA288BA0B2b2A570590Ae693d3474710Bc46`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <span>locked</span>
                </a> 4.2% of the supply until Aug, 2028.</p>
              </div>
            </div>
          </Modal.Content>
        </Modal>
      )}

      {show.info && (
        <Modal
          id="info"
          title="Lore.txt"
          icon={<Wordpad variant="16x16_4" />}
          dragOptions={{ defaultPosition: getDragPos(openCount) }}
          titleBarOptions={[
            <Modal.Minimize key="min" />,
            <TitleBar.Close key="x" onClick={() => close('info')} />,
          ]}
        >
          <Modal.Content width={800} className="max-h-[80vh]" boxShadow="$in">
            <div className="overflow-auto h-full">
              <MemeInfo />
            </div>
          </Modal.Content>
        </Modal>
      )}

      {show.dao && (
        <Modal
          id="dao"
          title="MemeDAO.txt"
          icon={<Wordpad variant="16x16_4" />}
          dragOptions={{ defaultPosition: getDragPos(openCount) }}
          titleBarOptions={[
            <Modal.Minimize key="min" />,
            <TitleBar.Close key="x" onClick={() => close('dao')} />,
          ]}
        >
          <Modal.Content width={800} className="max-h-[80vh]" boxShadow="$in">
            <div className="overflow-auto h-full">
              <MemeDAO />
            </div>
          </Modal.Content>
        </Modal>
      )}
      {show.gallery && (
        <Modal
          id="gallery"
          title="Gallery.exe"
          icon={<Wangimg128 variant="16x16_4" />}
          dragOptions={{ defaultPosition: getDragPos(openCount) }}
          titleBarOptions={[
            <Modal.Minimize key="min" />,
            <TitleBar.Close key="x" onClick={() => close('gallery')} />,
          ]}
        >
          <Modal.Content width={640} className="max-h-[88vh]" boxShadow="$in">
            <div className="overflow-auto h-full">
              <ArtGallery />
            </div>
          </Modal.Content>
        </Modal>
      )}

      {show.artDrop && (
        <Modal
          id="artDrop"
          title="ArtDrop.exe"
          icon={<Brush variant="32x32_4" />}
          dragOptions={{
            defaultPosition: getDragPos(openCount),
            onDragEnd: (data) => {
              // data.x / data.y are from react-draggable
              setArtDropPos({ x: data.offsetX - 20, y: data.offsetY -20 });
              console.log(data.offsetX-20, data.offsetY-20)
            },
            onDragStart: () => modal.focus('artDrop'),
          }}
          titleBarOptions={[
            <Modal.Minimize key="min" />,
            <TitleBar.Close key="x" onClick={() => close('artDrop')} />,
          ]}
        >
          {/* Adjust size to your component’s needs */}
          <Modal.Content width={520} className="max-h-[88vh]" boxShadow="$in">
            <div className="overflow-auto h-full">
              <ArtDrop anchorPos={artDropPos} />
            </div>
          </Modal.Content>
        </Modal>
      )}
    </div>
  );
}

/* ─── wrap with DesktopProvider ──────────────────────────────────── */
export default function MemeHomepageWrapper() {
  return (
    <DesktopProvider>
      <SuccessModalProvider>
        <MemeHomepage />
      </SuccessModalProvider>
    </DesktopProvider>
  );
}



