import { Link } from 'react-router-dom';
import { useState } from 'react';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import {
  countUrgentActions,
  getActionInboxForRole,
  getActionInboxForUser,
  type ActionInboxItem,
  type ActionInboxRole,
} from '@/lib/actionInbox';
import {
  ProfessionalPanel,
  type ProfessionalPanelVariant,
} from '@/components/ui/ProfessionalPanel';

const ROLE_TITLES: Record<ActionInboxRole, string> = {
  hr: 'Inbox HR — excepții & validări finale',
  mentor: 'Coada mea — mentor instruire',
  supervisor: 'Coada mea — supervizor',
  employee: 'Ce am de făcut',
};

const ROLE_HINTS: Record<ActionInboxRole, string> = {
  hr: 'Doar situații care necesită intervenția HR. Operațiunile zilnice sunt la mentor și supervizor.',
  mentor: 'Validări zile cheie și feedback — acțiunile tale ca antrenor.',
  supervisor: 'Evaluări, re-instruire și urmărirea subordonaților.',
  employee: 'Instruire și auto-evaluare tri-lunară.',
};

interface ActionInboxPanelProps {
  userId: string;
  roles: ActionInboxRole[];
  maxItems?: number;
  compact?: boolean;
  /** Header acordeon — buton restrânge lângă badge-uri */
  collapsible?: boolean;
  defaultExpanded?: boolean;
}

const ROLE_VARIANTS: Record<ActionInboxRole, ProfessionalPanelVariant> = {
  hr: 'neutral',
  mentor: 'training',
  supervisor: 'evaluation',
  employee: 'evaluation',
};

export function ActionInboxPanel({
  userId,
  roles,
  maxItems = 6,
  compact,
  collapsible = false,
  defaultExpanded = true,
}: ActionInboxPanelProps) {
  const [expanded, setExpanded] = useState(defaultExpanded);
  const items =
    roles.length === 1
      ? getActionInboxForRole(userId, roles[0]!)
      : getActionInboxForUser(userId, roles);

  const visible = items.slice(0, maxItems);
  const urgent = countUrgentActions(items);
  const title = roles.length === 1 ? ROLE_TITLES[roles[0]!] : 'Acțiunile mele';
  const hint = roles.length === 1 ? ROLE_HINTS[roles[0]!] : undefined;

  const panelVariant =
    roles.length === 1 ? ROLE_VARIANTS[roles[0]!] : ('inbox' as ProfessionalPanelVariant);

  const panelProps = {
    compact,
    collapsible,
    expanded,
    onToggle: collapsible ? () => setExpanded((v) => !v) : undefined,
    toggleLabels: collapsible
      ? { expanded: 'Restrânge inbox-ul', collapsed: 'Deschide inbox-ul' }
      : undefined,
  };

  if (!items.length) {
    if (compact) return null;
    return (
      <ProfessionalPanel
        variant="training-success"
        icon="inbox"
        eyebrow="Acțiuni"
        title="Totul la zi"
        subtitle="Nicio acțiune pending în acest moment"
        {...panelProps}
      />
    );
  }

  return (
    <ProfessionalPanel
      variant={panelVariant}
      icon="inbox"
      eyebrow={roles.length === 1 && roles[0] === 'employee' ? 'Evaluare & instruire' : 'Acțiuni'}
      title={title}
      subtitle={hint}
      badge={
        <>
          {urgent > 0 && <Badge variant="warning">{urgent} urgent</Badge>}
          <Badge variant="default">{items.length}</Badge>
        </>
      }
      {...panelProps}
    >
      <ul className="space-y-2">
        {visible.map((item) => (
          <InboxRow key={item.id} item={item} />
        ))}
      </ul>

      {items.length > maxItems && (
        <p className="text-xs text-corporate-muted">
          +{items.length - maxItems} acțiuni suplimentare — rezolvați pe rând, de sus în jos.
        </p>
      )}
    </ProfessionalPanel>
  );
}

function InboxRow({ item }: { item: ActionInboxItem }) {
  return (
    <li
      className={[
        'flex flex-wrap items-center justify-between gap-2 rounded-lg border px-3 py-2.5 text-sm',
        item.severity === 'urgent'
          ? 'border-amber-200 bg-amber-50/70'
          : 'border-corporate-border bg-corporate-surface/50',
      ].join(' ')}
    >
      <div className="min-w-0 flex-1">
        <p className="font-medium text-corporate-dark">{item.title}</p>
        <p className="text-xs text-corporate-muted mt-0.5">{item.message}</p>
      </div>
      <Link to={item.link}>
        <Button type="button" variant={item.severity === 'urgent' ? 'primary' : 'secondary'} size="sm">
          {item.actionLabel}
        </Button>
      </Link>
    </li>
  );
}
