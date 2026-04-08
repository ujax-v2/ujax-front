import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

const BRIDGE_RESPONSE_TIMEOUT_MS = 1_500;
let bridgeCheckedCache = false;
let bridgeConnectedCache = false;

function normalizeBojId(value?: string | null) {
  return String(value ?? '').trim();
}

interface UseOnboardingRequirementsResult {
  hasBojId: boolean;
  extensionConnected: boolean;
  extensionChecked: boolean;
  extensionChecking: boolean;
  isComplete: boolean;
  refreshExtensionStatus: () => void;
}

export function useOnboardingRequirements(
  isLoggedIn: boolean,
  baekjoonId?: string | null,
): UseOnboardingRequirementsResult {
  const [extensionConnected, setExtensionConnected] = useState(bridgeConnectedCache);
  const [extensionChecked, setExtensionChecked] = useState(bridgeCheckedCache);
  const [extensionChecking, setExtensionChecking] = useState(false);
  const timeoutRef = useRef<number | null>(null);
  const pendingNonceRef = useRef<string | null>(null);
  const hasBojId = normalizeBojId(baekjoonId).length > 0;

  const clearPingTimeout = useCallback(() => {
    if (timeoutRef.current) {
      window.clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  }, []);

  const refreshExtensionStatus = useCallback(() => {
    if (!isLoggedIn) return;
    clearPingTimeout();
    setExtensionChecking(true);

    const nonce = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    pendingNonceRef.current = nonce;

    window.postMessage(
      { type: 'ujaxBridgePing', nonce },
      window.location.origin,
    );

    timeoutRef.current = window.setTimeout(() => {
      if (pendingNonceRef.current === nonce) {
        bridgeCheckedCache = true;
        bridgeConnectedCache = false;
        setExtensionChecked(true);
        setExtensionConnected(false);
        setExtensionChecking(false);
        pendingNonceRef.current = null;
      }
    }, BRIDGE_RESPONSE_TIMEOUT_MS);
  }, [clearPingTimeout, isLoggedIn]);

  useEffect(() => {
    if (!isLoggedIn) {
      clearPingTimeout();
      pendingNonceRef.current = null;
      bridgeCheckedCache = false;
      bridgeConnectedCache = false;
      setExtensionChecked(false);
      setExtensionConnected(false);
      setExtensionChecking(false);
      return;
    }

    const onMessage = (event: MessageEvent) => {
      if (event.source !== window) return;
      if (event.origin !== window.location.origin) return;
      if (!event.data || typeof event.data !== 'object') return;

      if (event.data.type === 'ujaxBridgeReady') {
        clearPingTimeout();
        pendingNonceRef.current = null;
        bridgeCheckedCache = true;
        bridgeConnectedCache = true;
        setExtensionChecked(true);
        setExtensionConnected(true);
        setExtensionChecking(false);
        return;
      }

      if (event.data.type === 'ujaxBridgePong') {
        const expectedNonce = pendingNonceRef.current;
        const responseNonce = String(event.data.nonce || '');
        if (expectedNonce && responseNonce && responseNonce !== expectedNonce) {
          return;
        }
        clearPingTimeout();
        pendingNonceRef.current = null;
        bridgeCheckedCache = true;
        bridgeConnectedCache = true;
        setExtensionChecked(true);
        setExtensionConnected(true);
        setExtensionChecking(false);
      }
    };

    window.addEventListener('message', onMessage);
    refreshExtensionStatus();

    return () => {
      window.removeEventListener('message', onMessage);
      clearPingTimeout();
    };
  }, [clearPingTimeout, isLoggedIn, refreshExtensionStatus]);

  const isComplete = useMemo(
    () => hasBojId && extensionConnected,
    [extensionConnected, hasBojId],
  );

  return {
    hasBojId,
    extensionConnected,
    extensionChecked,
    extensionChecking,
    isComplete,
    refreshExtensionStatus,
  };
}
