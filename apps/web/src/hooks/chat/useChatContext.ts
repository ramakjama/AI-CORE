import { useState, useEffect, useCallback } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import type { ContextData } from '@/types/chat';

interface UseChatContextReturn {
  context: ContextData | null;
  setContext: (context: ContextData | null) => void;
  clearContext: () => void;
}

const extractContextFromPath = (pathname: string, searchParams: URLSearchParams): ContextData | null => {
  if (pathname.includes('/clients/')) {
    const clientId = pathname.split('/clients/')[1]?.split('/')[0];
    if (clientId) {
      return {
        type: 'client',
        entityId: clientId,
        pageUrl: pathname,
      };
    }
  }

  if (pathname.includes('/policies/')) {
    const policyId = pathname.split('/policies/')[1]?.split('/')[0];
    if (policyId) {
      return {
        type: 'policy',
        entityId: policyId,
        pageUrl: pathname,
      };
    }
  }

  if (pathname.includes('/claims/')) {
    const claimId = pathname.split('/claims/')[1]?.split('/')[0];
    if (claimId) {
      return {
        type: 'claim',
        entityId: claimId,
        pageUrl: pathname,
      };
    }
  }

  if (pathname.includes('/products/')) {
    const productId = pathname.split('/products/')[1]?.split('/')[0];
    if (productId) {
      return {
        type: 'product',
        entityId: productId,
        pageUrl: pathname,
      };
    }
  }

  const clientId = searchParams.get('clientId');
  if (clientId) {
    return {
      type: 'client',
      entityId: clientId,
      pageUrl: pathname,
    };
  }

  const policyId = searchParams.get('policyId');
  if (policyId) {
    return {
      type: 'policy',
      entityId: policyId,
      pageUrl: pathname,
    };
  }

  return {
    type: 'general',
    pageUrl: pathname,
  };
};

export function useChatContext(): UseChatContextReturn {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [context, setContextState] = useState<ContextData | null>(null);
  const [manualContext, setManualContext] = useState<ContextData | null>(null);

  useEffect(() => {
    if (manualContext) {
      setContextState(manualContext);
      return;
    }

    const detectedContext = extractContextFromPath(pathname, searchParams);
    setContextState(detectedContext);
  }, [pathname, searchParams, manualContext]);

  const setContext = useCallback((newContext: ContextData | null) => {
    setManualContext(newContext);
  }, []);

  const clearContext = useCallback(() => {
    setManualContext(null);
  }, []);

  return {
    context,
    setContext,
    clearContext,
  };
}
