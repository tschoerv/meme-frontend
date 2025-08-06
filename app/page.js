'use client';

import { useState } from 'react';
import {
  TaskBar,
  List,
  Tooltip,
  Modal,
  TitleBar,
  Button,
  Cursor,
  useModal,
} from '@react95/core';
import {
  Optional3000,
  Drvspace1,
  InfoBubble,
  Mshtml32540,
  Wordpad,
  Sysmon1000,
  Shell3242,
} from '@react95/icons';
import Image from 'next/image';

/* ─── your components ─── */
import Airdrop     from './components/Airdrop';
import Presale     from './components/PresaleModal';
import MemeInfo    from './components/MemeInfo';
import MemeDAO     from './components/MemeDAO';
import Socials     from './components/Socials';
import RecycleBin  from './components/RecycleBin';
import { DesktopProvider, useDesktop } from './contexts/DesktopContext';
import { useIsTouchDevice }           from './hooks/useIsTouchDevice';
/* ─────────────────────── */

const slogan = 'First Meme on ETH';

/* ─── Start-menu helper ───────────────────────────────────────────── */
function StartMenu({ open }) {
  return (
    <div style={{ position: 'absolute', top: '100%', left: 0, zIndex: 99_999, paddingTop: 29 }}>
      <List width={200}>
        <List.Item icon={<Optional3000 variant="32x32_4" />} onClick={() => open('airdrop')}   style={{ cursor: 'pointer' }}>
          Airdrop
        </List.Item>
        <List.Item icon={<Sysmon1000 variant="32x32_4" />} onClick={() => open('presale')} style={{ cursor: 'pointer' }}>
          Presale
        </List.Item>
        <List.Item icon={<Drvspace1   variant="32x32_4" />} onClick={() => open('tokenomics')} style={{ cursor: 'pointer' }}>
          Tokenomics
        </List.Item>
        <List.Item icon={<Shell3242  variant="32x32_4" />} onClick={() => open('info')} style={{ cursor: 'pointer' }}>
          Lore
        </List.Item>
        <List.Item icon={<InfoBubble variant="32x32_4" />} onClick={() => open('dao')}  style={{ cursor: 'pointer' }}>
          MemeDAO
        </List.Item>
      </List>
    </div>
  );
}

/* ─── main desktop page ───────────────────────────────────────────── */
function MemeHomepage() {
  const isTouch            = useIsTouchDevice();
  const { desktopItems }   = useDesktop();
  const modal              = useModal();     

  const [show, setShow] = useState({
    logo      : false,
    airdrop   : false,
    presale   : false,
    tokenomics: false,
    info      : false,
    dao       : false,
  });
  const [openCount, setOpenCount] = useState(0);

  /* helpers -------------------------------------------------------- */

  const open  = (id) => {
    // ensure the element is mounted before focusing
    setShow((s) => ({ ...s, [id]: true }));
    setOpenCount((c) => c + 1); // Track how many modals have been opened
    modal.restore(id);
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
  const baseY = typeof window !== 'undefined' && window.innerWidth < 640 ? 0 : 10;

  return {
    x: baseX + indexOffset * 20,
    y: baseY + indexOffset * 20,
  };
};

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
          onClick={ isTouch  ? () => open('logo') : undefined }
          onDoubleClick={ !isTouch ? () => open('logo') : undefined }
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
        <p className="mt-4 text-lg">{slogan}</p>
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

      {show.presale && (
        <Modal
          id="presale"
          title="Presale.exe"
          icon={<Optional3000 variant="16x16_4" />}
          dragOptions={{ defaultPosition: getDragPos(openCount) }}
          titleBarOptions={[
            <Modal.Minimize key="min" />,
            <TitleBar.Close key="x" onClick={() => close('presale')} />
          ]}
        >
          <Modal.Content width={400} height={210} boxShadow="$in">
            <Presale/>
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
    </div>
  );
}

/* ─── wrap with DesktopProvider ──────────────────────────────────── */
export default function MemeHomepageWrapper() {
  return (
    <DesktopProvider>
      <MemeHomepage />
    </DesktopProvider>
  );
}
