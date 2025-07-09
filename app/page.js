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
} from '@react95/core';
import {
  Optional3000,
  Drvspace1,
  InfoBubble,
  Mshtml32540,
  Wordpad,
  Sysmon1000,
  Shell3242
} from '@react95/icons';
import Image from 'next/image';

/* ─── your components ─── */
import Airdrop from './components/Airdrop';
import MemeInfo from './components/MemeInfo';
import MemeDAO from './components/MemeDAO';
import Socials from './components/Socials';
import RecycleBin from './components/RecycleBin';
import { DesktopProvider } from './contexts/DesktopContext';
import { useIsTouchDevice } from './hooks/useIsTouchDevice';
import { useDesktop } from './contexts/DesktopContext';



/* ─────────────────────── */

const slogan = 'First Meme on ETH';

/* ------------------------------------------------------------------ */
/* little helper components                                           */
/* ------------------------------------------------------------------ */

function StartMenu({ open }) {
  return (

    <div style={{ position: 'absolute', top: '100%', left: 0, zIndex: 99999, paddingTop: 29 }}
    >
      <List width={200}>
        <List.Item icon={<Optional3000 variant="32x32_4" />} onClick={() => open('airdrop')} style={{ cursor: 'pointer' }}>
          Airdrop
        </List.Item>
        <List.Item icon={<Drvspace1 variant="32x32_4" />} onClick={() => open('tokenomics')} style={{ cursor: 'pointer' }}>
          Tokenomics
        </List.Item>
        <Tooltip text="soon!" delay={300}>
          <List.Item icon={<Sysmon1000 variant="32x32_4" />} onClick={() => alert("soon!")} style={{ cursor: `url(${Cursor.NotAllowed}), not-allowed` }}>Presale</List.Item>
        </Tooltip>
        <List.Item icon={<Shell3242 variant="32x32_4" />} onClick={() => open('info')} style={{ cursor: 'pointer' }}>
          Lore
        </List.Item>
        <List.Item icon={<InfoBubble variant="32x32_4" />} onClick={() => open('dao')} style={{ cursor: 'pointer' }}>
          MemeDAO
        </List.Item>
      </List>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*                               page                                 */
/* ------------------------------------------------------------------ */
function MemeHomepage() {
    const isTouch = useIsTouchDevice();
    const { desktopItems } = useDesktop();


    /* each window has its own “show” flag -------------------- */
    const [show, setShow] = useState({
      logo: false,
      airdrop: false,
      tokenomics: false,
      info: false,
      dao: false,
    });

    /* open / close helpers (no re-ordering needed) ----------- */
    const open = (id) => {
      // close all first
      setShow({
        logo: false,
        airdrop: false,
        tokenomics: false,
        info: false,
        dao: false,
      });
      setShow((s) => ({ ...s, [id]: true }));
    };
    const close = (id) => setShow((s) => ({ ...s, [id]: false }));

    return (
      <div className="relative flex flex-col min-h-screen">
        {/* task-bar + menu */}
        <TaskBar
          className="taskbarTop"
          list={<StartMenu open={open} />}
        />

         {desktopItems.logo && (
            <Button
            draggable
            onDragStart={(e) => e.dataTransfer.setData("text/plain", "logo")}
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
            <Image src="/logo.png" alt="logo" width={48} height={48} />
            <span className="text-xs text-center">logo.png</span>
        </Button>
        )}

        <RecycleBin />

        {/* wallpaper centrepiece */}
        <div className="flex flex-col items-center justify-center h-screen select-none">
          <Image src="/logo.png" alt="logo" width={200} height={200} className='pointer-events-none' />
          <p className='mt-4 text-lg'>{slogan}</p>
          <Socials />
        </div>

        {/* ----- render modals  (order in JSX == z-order) ------ */}
        {show.logo && (
          <Modal
            title="logo.png"
            icon={<Mshtml32540 variant="16x16_4" />}
            dragOptions={{ defaultPosition: { x: window.innerWidth < 640 ? 5 : 40 + 20, y: window.innerWidth < 640 ? 0 : 10, } }}
            titleBarOptions={[
              <Modal.Minimize key="min" />,
              <TitleBar.Close key="x" onClick={() => close('logo')} />,
            ]}
            active="true"
          >
            <Modal.Content width={300} height={300} boxShadow="$in">
              <div className="flex flex-col items-center mt-4" style={{ minWidth: 310 }}>
                <Image src="/logo.png" alt="logo" width={200} height={200} className='pointer-events-none' />
                <p className='mt-4 text-lg'>{slogan}</p>
              </div>
            </Modal.Content>
          </Modal>
        )}

        {show.airdrop && (
          <Modal
            title="Airdrop.exe"
            icon={<Optional3000 variant="16x16_4" />}
            dragOptions={{ defaultPosition: { x: window.innerWidth < 640 ? 5 : 40 + 20, y: window.innerWidth < 640 ? 0 : 10, } }}
            titleBarOptions={[
              <Modal.Minimize key="min" />,
              <TitleBar.Close key="x" onClick={() => close('airdrop')} />,
            ]}
            active="true"
          >
            <Modal.Content width={400} height={210} boxShadow="$in">
              <Airdrop />
            </Modal.Content>
          </Modal>
        )}

        {show.tokenomics && (
          <Modal
            title="Tokenomics.png"
            icon={<Drvspace1 variant="16x16_4" />}
            dragOptions={{ defaultPosition: { x: window.innerWidth < 640 ? 5 : 40 + 20, y: window.innerWidth < 640 ? 0 : 10, } }}
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
            title="Info.txt"
            icon={<Wordpad variant="16x16_4" />}
            dragOptions={{ defaultPosition: { x: window.innerWidth < 640 ? 5 : 40 + 20, y: window.innerWidth < 640 ? 0 : 10, } }}
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
            title="MemeDAO.txt"
            icon={<Wordpad variant="16x16_4" />}
            dragOptions={{ defaultPosition: { x: window.innerWidth < 640 ? 5 : 40 + 20, y: window.innerWidth < 640 ? 0 : 10, } }}
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

  export default function MemeHomepageWrapper() {
    return (
      <DesktopProvider>
        <MemeHomepage />
      </DesktopProvider>
    );
  }
