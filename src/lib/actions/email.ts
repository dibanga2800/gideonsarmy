import { toast } from 'sonner';

export async function sendDuesStatusEmail(memberId: string) {
  try {
    const response = await fetch('/api/email/dues-status', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ memberId }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Failed to send dues status email');
    }

    toast.success('Dues status email sent successfully');
    return data;
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to send dues status email';
    toast.error(message);
    throw error;
  }
}

export async function sendBulkDuesStatusEmails(memberIds: string[]) {
  const results = await Promise.allSettled(
    memberIds.map(id => sendDuesStatusEmail(id))
  );

  const successful = results.filter(result => result.status === 'fulfilled').length;
  const failed = results.filter(result => result.status === 'rejected').length;

  if (failed > 0) {
    toast.error(`Failed to send ${failed} email${failed === 1 ? '' : 's'}`);
  }

  if (successful > 0) {
    toast.success(`Successfully sent ${successful} email${successful === 1 ? '' : 's'}`);
  }

  return { successful, failed };
} 