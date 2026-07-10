import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { Share2, Link, X, Copy, Check, Loader2, Trash2 } from 'lucide-react';

interface ShareToken {
  id: string;
  token: string;
  label: string;
  is_active: boolean;
  created_at: string;
  last_accessed_at: string | null;
}

export default function ShareSettings() {
  const [tokens, setTokens] = useState<ShareToken[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [open, setOpen] = useState(false);

  const fetchTokens = async () => {
    const { data } = await supabase
      .from('share_tokens')
      .select('*')
      .order('created_at', { ascending: false });

    if (data) setTokens(data);
    setLoading(false);
  };

  useEffect(() => {
    if (open) fetchTokens();
  }, [open]);

  const createToken = async () => {
    setCreating(true);
    const { data, error } = await supabase
      .from('share_tokens')
      .insert({ label: `Link ${tokens.length + 1}` })
      .select()
      .single();

    if (data && !error) {
      setTokens(prev => [data, ...prev]);
    }
    setCreating(false);
  };

  const revokeToken = async (id: string) => {
    await supabase
      .from('share_tokens')
      .update({ is_active: false })
      .eq('id', id);

    setTokens(prev => prev.map(t => t.id === id ? { ...t, is_active: false } : t));
  };

  const copyLink = (token: string, id: string) => {
    const url = `${window.location.origin}${window.location.pathname}?token=${token}`;
    navigator.clipboard.writeText(url);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="w-full flex items-center px-3 py-2.5 text-sm font-medium rounded-lg text-gray-300 hover:bg-navy-light/50 hover:text-white transition-colors"
      >
        <Share2 className="mr-3 h-5 w-5 text-gray-400" />
        Bagikan (Read-only)
      </button>
    );
  }

  return (
    <div className="border-t border-navy-light pt-4 mt-4 px-2">
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Bagikan Akses</span>
        <button
          onClick={() => setOpen(false)}
          className="p-1 rounded hover:bg-navy-light text-gray-400 hover:text-white transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <button
        onClick={createToken}
        disabled={creating}
        className="w-full flex items-center justify-center gap-2 px-3 py-2 text-xs font-medium rounded-lg bg-gold/20 text-gold hover:bg-gold/30 transition-colors disabled:opacity-50 mb-3"
      >
        {creating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Link className="w-3.5 h-3.5" />}
        Buat Link Baru
      </button>

      {loading ? (
        <div className="flex justify-center py-2">
          <Loader2 className="w-4 h-4 animate-spin text-gray-400" />
        </div>
      ) : tokens.length === 0 ? (
        <p className="text-xs text-gray-500 text-center py-2">Belum ada link share</p>
      ) : (
        <div className="space-y-2 max-h-48 overflow-y-auto">
          {tokens.map(t => (
            <div key={t.id} className={`p-2 rounded-lg text-xs ${t.is_active ? 'bg-navy-light/50' : 'bg-navy-light/20 opacity-50'}`}>
              <div className="flex items-center justify-between gap-1 mb-1">
                <span className="text-gray-300 truncate font-medium">{t.label}</span>
                {t.is_active && (
                  <div className="flex gap-1 shrink-0">
                    <button
                      onClick={() => copyLink(t.token, t.id)}
                      className="p-1 rounded hover:bg-navy text-gray-400 hover:text-white transition-colors"
                      title="Salin link"
                    >
                      {copiedId === t.id ? <Check className="w-3 h-3 text-green-400" /> : <Copy className="w-3 h-3" />}
                    </button>
                    <button
                      onClick={() => revokeToken(t.id)}
                      className="p-1 rounded hover:bg-navy text-gray-400 hover:text-red-400 transition-colors"
                      title="Nonaktifkan"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                )}
              </div>
              {t.last_accessed_at && (
                <p className="text-gray-500">Terakhir diakses: {new Date(t.last_accessed_at).toLocaleDateString('id-ID')}</p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
