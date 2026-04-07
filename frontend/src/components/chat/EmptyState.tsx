import { LOGO_MARK_SVG } from '../../theme/brand';

interface EmptyStateProps {
  variant: 'no-conversation' | 'new-conversation';
  onNewConversation?: () => void;
}

export function EmptyState({ variant, onNewConversation }: EmptyStateProps) {
  if (variant === 'no-conversation') {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-6 px-4">
        {/* Full logo with AKIS text built-in */}
        <img
          src={LOGO_MARK_SVG}
          alt="AKIS"
          className="h-24 w-24 object-contain"
          loading="eager"
        />

        <div className="text-center">
          <h2 className="text-xl font-semibold text-ak-text-primary">
            <span className="text-2xl font-extrabold text-ak-primary">AKIS</span>&apos;e Hoş Geldiniz
          </h2>
          <p className="mt-1 max-w-sm text-sm text-ak-text-tertiary">
            Bir sohbet başlatın veya mevcut sohbetinize devam edin.
          </p>
        </div>

        {onNewConversation && (
          <button
            onClick={onNewConversation}
            className="rounded-xl bg-ak-primary px-6 py-2.5 text-sm font-semibold text-[color:var(--ak-on-primary,#fff)] shadow-ak-elevation-1 hover:brightness-110 active:brightness-95 transition-all duration-150 hover:scale-[1.02]"
          >
            + Yeni Sohbet Başlat
          </button>
        )}
      </div>
    );
  }

  // new-conversation variant — guide the user to type their first message
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-5 px-4">
      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-ak-primary/10">
        <svg className="h-5 w-5 text-ak-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.129.166 2.27.293 3.423.379.35.026.67.21.865.501L12 21l2.755-4.133a1.14 1.14 0 01.865-.501 48.172 48.172 0 003.423-.379c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0012 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018z" />
        </svg>
      </div>
      <div className="max-w-md text-center">
        <h3 className="text-sm font-semibold text-ak-text-primary">Projenizi Anlatın</h3>
        <p className="mt-1 text-xs text-ak-text-tertiary">
          AKIS sizin için plan oluşturacak, kodu yazacak ve testleri hazırlayacak. Aşağıdaki alana fikrinizi yazın.
        </p>
      </div>
      <div className="flex items-center gap-2 text-[10px] text-ak-text-tertiary">
        <span className="rounded-full bg-ak-scribe/10 px-2 py-0.5 text-ak-scribe">Scribe</span>
        <span>→</span>
        <span className="rounded-full bg-ak-proto/10 px-2 py-0.5 text-ak-proto">Proto</span>
        <span>→</span>
        <span className="rounded-full bg-ak-trace/10 px-2 py-0.5 text-ak-trace">Trace</span>
      </div>
    </div>
  );
}
