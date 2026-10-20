'use client';

import React, { useState } from 'react';
import SyntaxHighlightedJson from '@/components/webhooks/SyntaxHighlightedJson';
import { WEBHOOK_EVENT_GROUPS, WebhookEventType } from '@/types/webhooks';

// Example payloads for each event group
const EXAMPLE_PAYLOADS: Record<string, object> = {
  'payment.created': {
    id: 'evt_01HXYZ123456',
    type: 'payment.created',
    created_at: '2024-01-15T10:30:00Z',
    data: {
      payment_id: 'pay_01HXYZ789',
      amount: '100.00',
      asset: 'USDC',
      status: 'pending',
      payment_link_id: 'pl_01HXYZ456',
      merchant_id: 'mer_01HXYZ321',
    },
  },
  'payment.completed': {
    id: 'evt_01HXYZ123457',
    type: 'payment.completed',
    created_at: '2024-01-15T10:31:00Z',
    data: {
      payment_id: 'pay_01HXYZ789',
      amount: '100.00',
      asset: 'USDC',
      status: 'completed',
      stellar_tx_hash: 'a3d5f...c9e2b',
      settled_at: '2024-01-15T10:31:00Z',
    },
  },
  'payment.failed': {
    id: 'evt_01HXYZ123458',
    type: 'payment.failed',
    created_at: '2024-01-15T10:32:00Z',
    data: {
      payment_id: 'pay_01HXYZ790',
      reason: 'insufficient_balance',
      failed_at: '2024-01-15T10:32:00Z',
    },
  },
  'payment.expired': {
    id: 'evt_01HXYZ123459',
    type: 'payment.expired',
    created_at: '2024-01-15T10:45:00Z',
    data: {
      payment_id: 'pay_01HXYZ791',
      expired_at: '2024-01-15T10:45:00Z',
    },
  },
  'refund.created': {
    id: 'evt_01HXYZ123460',
    type: 'refund.created',
    created_at: '2024-01-15T11:00:00Z',
    data: {
      refund_id: 'ref_01HXYZ001',
      payment_id: 'pay_01HXYZ789',
      amount: '50.00',
      asset: 'USDC',
      reason: 'Customer request',
      status: 'pending',
    },
  },
  'refund.completed': {
    id: 'evt_01HXYZ123461',
    type: 'refund.completed',
    created_at: '2024-01-15T11:01:00Z',
    data: {
      refund_id: 'ref_01HXYZ001',
      payment_id: 'pay_01HXYZ789',
      amount: '50.00',
      asset: 'USDC',
      stellar_tx_hash: 'b4e6g...d0f3c',
      completed_at: '2024-01-15T11:01:00Z',
    },
  },
  'refund.failed': {
    id: 'evt_01HXYZ123462',
    type: 'refund.failed',
    created_at: '2024-01-15T11:02:00Z',
    data: {
      refund_id: 'ref_01HXYZ002',
      payment_id: 'pay_01HXYZ789',
      reason: 'contract_error',
      failed_at: '2024-01-15T11:02:00Z',
    },
  },
  'escrow.funded': {
    id: 'evt_01HXYZ123463',
    type: 'escrow.funded',
    created_at: '2024-01-15T12:00:00Z',
    data: {
      escrow_id: 'esc_01HXYZ010',
      amount: '500.00',
      asset: 'USDC',
      contract_id: 'CCXYZ...',
      funded_at: '2024-01-15T12:00:00Z',
    },
  },
  'escrow.released': {
    id: 'evt_01HXYZ123464',
    type: 'escrow.released',
    created_at: '2024-01-15T12:30:00Z',
    data: {
      escrow_id: 'esc_01HXYZ010',
      amount: '500.00',
      asset: 'USDC',
      stellar_tx_hash: 'c5h7i...e1j4d',
      released_at: '2024-01-15T12:30:00Z',
    },
  },
  'escrow.disputed': {
    id: 'evt_01HXYZ123465',
    type: 'escrow.disputed',
    created_at: '2024-01-15T13:00:00Z',
    data: {
      escrow_id: 'esc_01HXYZ011',
      disputed_by: 'buyer',
      reason: 'Item not received',
      disputed_at: '2024-01-15T13:00:00Z',
    },
  },
  'payout.completed': {
    id: 'evt_01HXYZ123466',
    type: 'payout.completed',
    created_at: '2024-01-15T18:00:00Z',
    data: {
      payout_id: 'pay_out_01HXYZ100',
      amount: '1250.00',
      asset: 'USDC',
      destination: 'GBXXX...YYYY',
      stellar_tx_hash: 'd6i8j...f2k5e',
      completed_at: '2024-01-15T18:00:00Z',
    },
  },
};

const SIGNATURE_SNIPPETS = {
  node: `const crypto = require('crypto');

function verifyWebhookSignature(payload, signature, secret) {
  const expectedSig = crypto
    .createHmac('sha256', secret)
    .update(payload)
    .digest('hex');
  const trusted = Buffer.from(\`sha256=\${expectedSig}\`, 'ascii');
  const received = Buffer.from(signature, 'ascii');
  return crypto.timingSafeEqual(trusted, received);
}

// In your Express handler:
app.post('/webhook', express.raw({ type: 'application/json' }), (req, res) => {
  const sig = req.headers['facilpay-signature'];
  if (!verifyWebhookSignature(req.body, sig, process.env.WEBHOOK_SECRET)) {
    return res.status(400).send('Invalid signature');
  }
  const event = JSON.parse(req.body);
  // Handle event...
  res.json({ received: true });
});`,
  python: `import hmac
import hashlib

def verify_webhook_signature(payload: bytes, signature: str, secret: str) -> bool:
    expected = hmac.new(
        secret.encode(), payload, hashlib.sha256
    ).hexdigest()
    trusted = f"sha256={expected}"
    return hmac.compare_digest(trusted, signature)

# In your Flask handler:
@app.route('/webhook', methods=['POST'])
def webhook():
    sig = request.headers.get('facilpay-signature', '')
    if not verify_webhook_signature(request.data, sig, os.environ['WEBHOOK_SECRET']):
        abort(400)
    event = request.get_json()
    # Handle event...
    return jsonify(received=True)`,
  go: `package main

import (
  "crypto/hmac"
  "crypto/sha256"
  "encoding/hex"
  "fmt"
)

func verifyWebhookSignature(payload []byte, signature, secret string) bool {
  mac := hmac.New(sha256.New, []byte(secret))
  mac.Write(payload)
  expected := "sha256=" + hex.EncodeToString(mac.Sum(nil))
  return hmac.Equal([]byte(expected), []byte(signature))
}

// In your HTTP handler:
func webhookHandler(w http.ResponseWriter, r *http.Request) {
  body, _ := io.ReadAll(r.Body)
  sig := r.Header.Get("Facilpay-Signature")
  if !verifyWebhookSignature(body, sig, os.Getenv("WEBHOOK_SECRET")) {
    http.Error(w, "Invalid signature", http.StatusBadRequest)
    return
  }
  // Handle event...
  w.Header().Set("Content-Type", "application/json")
  w.Write([]byte(\`{"received":true}\`))
}`,
};

export default function WebhookEventCatalogPage() {
  const [selectedEvent, setSelectedEvent] = useState<WebhookEventType>('payment.completed');
  const [activeSnippet, setActiveSnippet] = useState<'node' | 'python' | 'go'>('node');
  const [testSent, setTestSent] = useState(false);

  const payload = EXAMPLE_PAYLOADS[selectedEvent as string] ?? { type: selectedEvent, data: {} };

  const handleSendTestEvent = () => {
    setTestSent(true);
    setTimeout(() => setTestSent(false), 3000);
  };

  return (
    <div className="space-y-8 max-w-4xl">
      <div>
        <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">Webhook Event Catalog</h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Every event type FacilPay sends to your endpoints, with example payloads and verification guides.
        </p>
      </div>

      {/* Event Groups */}
      {WEBHOOK_EVENT_GROUPS.map((group) => (
        <section key={group.id} className="space-y-4">
          <div>
            <h2 className="text-base font-semibold text-gray-800 dark:text-gray-200">{group.name}</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">{group.description}</p>
          </div>
          <div className="divide-y divide-gray-200 dark:divide-gray-700 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
            {group.events.map((event) => (
              <button
                key={event.id}
                className={`w-full text-left px-4 py-3 flex items-start gap-3 transition-colors ${
                  selectedEvent === event.id
                    ? 'bg-indigo-50 dark:bg-indigo-900/20'
                    : 'bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-750'
                }`}
                onClick={() => setSelectedEvent(event.id as WebhookEventType)}
              >
                <code className="text-xs font-mono bg-gray-100 dark:bg-gray-700 px-2 py-0.5 rounded text-indigo-600 dark:text-indigo-400 whitespace-nowrap mt-0.5">
                  {event.label}
                </code>
                <span className="text-sm text-gray-600 dark:text-gray-300">{event.description}</span>
              </button>
            ))}
          </div>
        </section>
      ))}

      {/* Example Payload */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold text-gray-800 dark:text-gray-200">
            Example payload:{' '}
            <code className="text-sm font-mono text-indigo-600 dark:text-indigo-400">{selectedEvent}</code>
          </h2>
          <button
            onClick={handleSendTestEvent}
            className="text-sm px-3 py-1.5 rounded-md bg-indigo-600 text-white hover:bg-indigo-700 transition-colors disabled:opacity-60"
            disabled={testSent}
          >
            {testSent ? 'Test event sent!' : 'Send test event'}
          </button>
        </div>
        <SyntaxHighlightedJson data={payload} />
      </section>

      {/* Signature Verification */}
      <section className="space-y-3">
        <h2 className="text-base font-semibold text-gray-800 dark:text-gray-200">Signature verification</h2>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Every webhook request includes a{' '}
          <code className="font-mono text-xs bg-gray-100 dark:bg-gray-700 px-1 rounded">Facilpay-Signature</code>{' '}
          header. Verify it with your endpoint secret before processing the event.
        </p>
        <div className="flex gap-2">
          {(['node', 'python', 'go'] as const).map((lang) => (
            <button
              key={lang}
              onClick={() => setActiveSnippet(lang)}
              className={`text-sm px-3 py-1 rounded-md border transition-colors ${
                activeSnippet === lang
                  ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400'
                  : 'border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
              }`}
            >
              {lang === 'node' ? 'Node.js' : lang.charAt(0).toUpperCase() + lang.slice(1)}
            </button>
          ))}
        </div>
        <pre className="bg-gray-900 text-gray-100 rounded-lg p-4 text-xs overflow-x-auto whitespace-pre">
          {SIGNATURE_SNIPPETS[activeSnippet]}
        </pre>
      </section>
    </div>
  );
}
