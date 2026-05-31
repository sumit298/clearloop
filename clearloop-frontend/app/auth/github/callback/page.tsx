'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

export default function GitHubCallbackPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('Connecting to GitHub...');

  useEffect(() => {
    let successTimerId: NodeJS.Timeout | null = null;
    let errorTimerId: NodeJS.Timeout | null = null;

    const cleanup = () => {
      if (successTimerId) clearTimeout(successTimerId);
      if (errorTimerId) clearTimeout(errorTimerId);
    };

    handleCallback(cleanup, (id) => { successTimerId = id; }, (id) => { errorTimerId = id; });

    return cleanup;
  }, []);

  const handleCallback = async (cleanup: () => void, setSuccessTimer: (id: NodeJS.Timeout) => void, setErrorTimer: (id: NodeJS.Timeout) => void) => {
    try {
      const installationId = searchParams.get('installation_id');
      const setupAction = searchParams.get('setup_action');

      if (!installationId) {
        throw new Error('Missing installation ID');
      }

      // Send to backend
      const token = localStorage.getItem('clearloop_token');
      if (!token) {
        throw new Error('Authentication required. Please sign in first.');
      }

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/github/installation`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ installationId, setupAction }),
      });

      if (!response.ok) {
        throw new Error('Failed to save GitHub installation');
      }

      setStatus('success');
      setMessage('Successfully connected to GitHub!');

      cleanup();
      const timerId = setTimeout(() => {
        router.push('/dashboard/settings?github=connected');
      }, 1500);
      setSuccessTimer(timerId);

    } catch (error: any) {
      console.error('GitHub callback error:', error);
      setStatus('error');
      setMessage(error.message || 'Failed to connect GitHub');

      cleanup();
      const timerId = setTimeout(() => {
        router.push('/dashboard/settings?github=error');
      }, 3000);
      setErrorTimer(timerId);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background text-foreground">
      <div className="w-full max-w-md rounded-xl border border-border bg-surface p-8 text-center">
        {status === 'loading' && (
          <>
            <div className="mx-auto h-12 w-12 animate-spin rounded-full border-4 border-border border-t-primary" />
            <h2 className="mt-6 text-xl font-semibold">{message}</h2>
            <p className="mt-2 text-[14px] text-text-muted">
              Please wait while we complete the setup...
            </p>
          </>
        )}

        {status === 'success' && (
          <>
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-success/10">
              <svg className="h-6 w-6 text-success" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="mt-6 text-xl font-semibold text-success">{message}</h2>
            <p className="mt-2 text-[14px] text-text-muted">
              Redirecting to settings...
            </p>
          </>
        )}

        {status === 'error' && (
          <>
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-danger/10">
              <svg className="h-6 w-6 text-danger" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <h2 className="mt-6 text-xl font-semibold text-danger">Connection Failed</h2>
            <p className="mt-2 text-[14px] text-text-muted">{message}</p>
            <p className="mt-4 text-[13px] text-text-muted">
              Redirecting back to settings...
            </p>
          </>
        )}
      </div>
    </div>
  );
}
