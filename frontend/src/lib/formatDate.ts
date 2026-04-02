export function formatDate(dateStr: string | null | undefined): string {
  if (!dateStr) return 'Unknown';
  const d = new Date(dateStr);
  return isNaN(d.getTime()) ? 'Unknown' : d.toLocaleString();
}

export function formatTime(dateStr: string | null | undefined): string {
  if (!dateStr) return '—';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return '—';
  return d.toLocaleString('en-IN', {
    day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit',
  });
}

export function formatDateOnly(dateStr: string | null | undefined): string {
  if (!dateStr) return 'Unknown';
  const d = new Date(dateStr);
  return isNaN(d.getTime()) ? 'Unknown' : d.toLocaleDateString();
}
