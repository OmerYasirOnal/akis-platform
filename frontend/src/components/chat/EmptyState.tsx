import { LOGO_MARK_SVG } from '../../theme/brand';

interface EmptyStateProps {
  variant: 'no-conversation' | 'new-conversation';
  onNewConversation?: () => void;
}

export function EmptyState({ variant, onNewConversation }: EmptyStateProps) {
  if (variant === 'no-conversation') {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-5 px-4">
        <img
          src={LOGO_MARK_SVG}
          alt="AKIS"
          className="h-20 w-20 object-contain"
          loading="eager"
        />

        <div className="text-center max-w-md">
          <h2 className="text-2xl font-bold text-ak-text-primary">
            Merhaba! Ben <span className="text-ak-primary">AKIS</span>.
          </h2>
          <p className="mt-2 text-sm text-ak-text-tertiary leading-relaxed">
            Yazılım fikrinizi anlatın, birlikte hayata geçirelim.
            Spec yazacağım, onaylayın, kodu ve testleri otomatik oluşturayım.
          </p>
        </div>

        {onNewConversation && (
          <button
            onClick={onNewConversation}
            className="rounded-xl bg-ak-primary px-6 py-2.5 text-sm font-semibold text-[color:var(--ak-on-primary,#fff)] shadow-ak-elevation-1 hover:brightness-110 active:brightness-95 transition-all duration-150"
          >
            + Yeni Sohbet Başlat
          </button>
        )}

        <div className="flex items-center gap-2 text-[10px] text-ak-text-tertiary mt-2">
          <span className="rounded-full bg-ak-scribe/10 px-2 py-0.5 text-ak-scribe">Scribe</span>
          <span>→</span>
          <span className="rounded-full bg-ak-proto/10 px-2 py-0.5 text-ak-proto">Proto</span>
          <span>→</span>
          <span className="rounded-full bg-ak-trace/10 px-2 py-0.5 text-ak-trace">Trace</span>
        </div>
      </div>
    );
  }

  // new-conversation variant — user started a new chat, guide them to type
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-5 px-4">
      <img
        src={LOGO_MARK_SVG}
        alt="AKIS"
        className="h-16 w-16 object-contain opacity-60"
        loading="eager"
      />
      <div className="max-w-md text-center">
        <h3 className="text-lg font-semibold text-ak-text-primary">
          Merhaba! Ben <span className="text-ak-primary">AKIS</span>.
        </h3>
        <p className="mt-1.5 text-sm text-ak-text-tertiary leading-relaxed">
          Yazılım fikrinizi anlatın, birlikte hayata geçirelim.
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
