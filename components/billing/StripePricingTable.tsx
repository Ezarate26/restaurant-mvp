'use client';

import Script from 'next/script';
import { useEffect, useRef, useState } from 'react';

type StripePricingTableProps = {
  customerEmail?: string | null;
  /** Formato: userId o userId:conversationId — llega al webhook como client_reference_id */
  clientReferenceId?: string | null;
  className?: string;
};

const STRIPE_PRICING_SCRIPT = 'https://js.stripe.com/v3/pricing-table.js';

export function isStripePricingTableConfigured(): boolean {
  return Boolean(
    process.env.NEXT_PUBLIC_STRIPE_PRICING_TABLE_ID &&
      process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
  );
}

function mountPricingTableElement(
  container: HTMLElement,
  options: {
    pricingTableId: string;
    publishableKey: string;
    customerEmail?: string | null;
    clientReferenceId?: string | null;
  }
) {
  container.replaceChildren();
  const table = document.createElement('stripe-pricing-table');
  table.setAttribute('pricing-table-id', options.pricingTableId);
  table.setAttribute('publishable-key', options.publishableKey);
  if (options.customerEmail?.trim()) {
    table.setAttribute('customer-email', options.customerEmail.trim());
  }
  if (options.clientReferenceId?.trim()) {
    table.setAttribute('client-reference-id', options.clientReferenceId.trim());
  }
  container.appendChild(table);
}

export function StripePricingTable({
  customerEmail,
  clientReferenceId,
  className = '',
}: StripePricingTableProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [scriptReady, setScriptReady] = useState(false);
  const [remountKey, setRemountKey] = useState(0);

  const pricingTableId = process.env.NEXT_PUBLIC_STRIPE_PRICING_TABLE_ID;
  const publishableKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;

  useEffect(() => {
    const onPageShow = (event: PageTransitionEvent) => {
      if (event.persisted) {
        setRemountKey((key) => key + 1);
      }
    };

    window.addEventListener('pageshow', onPageShow);
    return () => window.removeEventListener('pageshow', onPageShow);
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined' || !pricingTableId || !publishableKey) {
      return;
    }

    const customElements = window.customElements;
    if (customElements?.get('stripe-pricing-table')) {
      setScriptReady(true);
      return;
    }

    const existing = document.querySelector(
      `script[src="${STRIPE_PRICING_SCRIPT}"]`
    );
    if (existing) {
      existing.addEventListener('load', () => setScriptReady(true), {
        once: true,
      });
      return;
    }
  }, [pricingTableId, publishableKey]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container || !scriptReady || !pricingTableId || !publishableKey) {
      return;
    }

    mountPricingTableElement(container, {
      pricingTableId,
      publishableKey,
      customerEmail,
      clientReferenceId,
    });
  }, [
    scriptReady,
    pricingTableId,
    publishableKey,
    customerEmail,
    clientReferenceId,
    remountKey,
  ]);

  if (!pricingTableId || !publishableKey) return null;

  return (
    <div className={className}>
      <Script
        src={STRIPE_PRICING_SCRIPT}
        strategy="afterInteractive"
        onLoad={() => setScriptReady(true)}
      />
      <div ref={containerRef} className="min-h-[280px] w-full" />
    </div>
  );
}
