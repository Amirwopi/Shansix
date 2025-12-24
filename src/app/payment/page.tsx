'use client';

import { useState } from 'react';

export default function PaymentPage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const amount = 10000;
  const description = 'پرداخت تست محصول نمونه';

  const handlePayment = async () => {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/zarinpal/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount, description }),
      });

      const data = await res.json();

      if (data.success && data.url) {
        window.location.href = data.url;
      } else {
        setError(data.message || 'خطا در ایجاد درخواست پرداخت');
      }
    } catch {
      setError('خطای ارتباط با سرور');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ direction: 'rtl', textAlign: 'center', padding: '50px', fontFamily: 'tahoma' }}>
      <h1>صفحه پرداخت</h1>
      <p>مبلغ قابل پرداخت: {amount.toLocaleString()} تومان</p>
      <p>توضیحات: {description}</p>
      <br />
      <button
        onClick={handlePayment}
        disabled={loading}
        style={{
          padding: '15px 40px',
          fontSize: '20px',
          background: loading ? '#ccc' : '#4caf50',
          color: 'white',
          border: 'none',
          borderRadius: '8px',
          cursor: loading ? 'not-allowed' : 'pointer',
        }}
      >
        {loading ? 'در حال پردازش...' : 'پرداخت با زرینپال'}
      </button>
      {error && <p style={{ color: 'red', marginTop: '20px' }}>{error}</p>}
    </div>
  );
}
