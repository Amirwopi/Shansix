export default function ResultPage({
  searchParams,
}: {
  searchParams: { success?: string; ref_id?: string; message?: string };
}) {
  const success = searchParams.success === 'true';
  const refId = searchParams.ref_id;
  const message = searchParams.message || (success ? 'پرداخت با موفقیت انجام شد!' : 'پرداخت ناموفق بود');

  return (
    <div style={{ direction: 'rtl', textAlign: 'center', padding: '50px', fontFamily: 'tahoma' }}>
      {success ? (
        <div
          style={{
            background: '#e8f5e9',
            padding: '40px',
            border: '2px solid #4caf50',
            borderRadius: '10px',
          }}
        >
          <h1 style={{ color: '#2e7d32' }}>پرداخت موفق!</h1>
          <p style={{ fontSize: '20px' }}>
            شماره پیگیری: <strong>{refId}</strong>
          </p>
        </div>
      ) : (
        <div
          style={{
            background: '#ffebee',
            padding: '40px',
            border: '2px solid #c62828',
            borderRadius: '10px',
          }}
        >
          <h1 style={{ color: '#b71c1c' }}>پرداخت ناموفق</h1>
          <p style={{ fontSize: '20px' }}>{message}</p>
        </div>
      )}
      <br />
      <a href="/" style={{ fontSize: '18px', color: '#4caf50' }}>
        بازگشت به صفحه اصلی
      </a>
    </div>
  );
}
