'use client';
import { createContext, useContext, useMemo, useState, useCallback } from 'react';
import { Modal, TitleBar, Button, useModal } from '@react95/core';
import { Wmsui322223 } from '@react95/icons';
import Image from 'next/image';

const SuccessCtx = createContext({ open: () => { }, close: () => { } });

export function SuccessModalProvider({ children }) {
  const modal = useModal();
  const [visible, setVisible] = useState(false);
  const [payload, setPayload] = useState(null); // { title, artist, twitter, osUrl, xText }
  const [defaultPos, setDefaultPos] = useState({ x: 0, y: 0 });
  const [showClose, setShowClose] = useState(false);

  const SUCCESS_ID = 'mint-success';

  const open = useCallback((data, opts) => {
    setPayload(data);
    setVisible(true);
    const anchor = opts?.anchor; // { x, y } of ArtDrop
    const isMobile = typeof window !== 'undefined' && window.matchMedia('(max-width: 767px)').matches;
    if(isMobile){
      setShowClose(true)
    }
    if (anchor && typeof anchor.x === 'number' && typeof anchor.y === 'number') {
      // Simple “above” placement; adjust offsets as you like
      const X_OFFSET = isMobile ? 61 : 82;      // slightly to the right of the left edge of ArtDrop
      const Y_OFFSET = isMobile ? 265 : 270;     // how far above to place the window
      const next = { x: anchor.x + X_OFFSET, y: anchor.y + Y_OFFSET };
      setDefaultPos(next);
    } else {
      setDefaultPos({ x: 0, y: 0 });
    }
    modal.restore(SUCCESS_ID);
    setTimeout(() => modal.focus(SUCCESS_ID), 0);
    }, [modal]);

  const close = useCallback(() => {
    setVisible(false);
    setTimeout(() => modal.remove(SUCCESS_ID), 0); // remove from taskbar stack
    modal.minimize(SUCCESS_ID);
    modal.focus('no-id');
    setShowClose(false)
  }, [modal]);

  const value = useMemo(() => ({ open, close }), [open, close]);

  return (
    <SuccessCtx.Provider value={value}>
      {children}

      {visible && payload && (
        <Modal
          id={SUCCESS_ID}
          title="Mint Successful"
          icon={<Wmsui322223 variant="16x16_4" />}
          dragOptions={{ defaultPosition: defaultPos, onDragStart: () => modal.focus(SUCCESS_ID) }}
          onMouseDown={() => modal.focus(SUCCESS_ID)}  // bring to front on click
          titleBarOptions={[
            <Modal.Minimize key="min" />,
            <TitleBar.Close key="x" onClick={close} />,
          ]}
        >
          <Modal.Content boxShadow="$in">
            <div className="w-[283px] flex flex-col items-center text-center mt-3 mb-1 px-2">

              <div className="flex flex-col text-sm mb-3">
                <div>Congrats! You minted</div>
                <span>{payload.amount}x <strong>{payload.title}</strong> by <strong>{payload.artist}</strong>.</span>
              </div>

              <div className="flex items-center justify-center gap-4 w-full">
                <Button
                  onClick={() => {
                    const url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(
                      payload.xText
                    )}&url=${encodeURIComponent(payload.osUrl)}`;
                    window.open(url, '_blank', 'noopener,noreferrer');
                  }}
                  className="inline-flex items-center gap-1.5"
                  style={{ cursor: 'pointer' }}
                  aria-label="Share on X"
                  title="Share on X"
                >
                  <span>Share on</span>
                  <Image src="/x.webp" alt="X" width={20} height={20} />
                </Button>

                {showClose && (
                  <Button onClick={close} style={{ cursor: 'pointer', height: 32 }}>
                    Close
                  </Button>
                )}
              </div>
            </div>
          </Modal.Content>
        </Modal>
      )}
    </SuccessCtx.Provider>
  );
}

export const useSuccessModal = () => useContext(SuccessCtx);
