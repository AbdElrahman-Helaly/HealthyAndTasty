import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { PageHeader } from './PageHeader';
import { useTranslation } from 'react-i18next';

interface DetailLayoutProps {
  title: string;
  subtitle?: string;
  backHref: string;
  backLabel?: string;
  actions?: ReactNode;
  sections: {
    id: string;
    label: string;
    content: ReactNode;
  }[];
}

export function DetailLayout({
  title,
  subtitle,
  backHref,
  backLabel,
  actions,
  sections,
}: DetailLayoutProps) {
  const { t, i18n } = useTranslation();
  const isRtl = i18n.dir() === 'rtl';
  const resolvedBackLabel = backLabel || t('common.back');

  return (
    <div>
      <div className="mb-4">
        <Link to={backHref}>
          <Button variant="ghost" size="sm" className="gap-1.5 -ms-2">
            {isRtl ? <ArrowRight className="h-4 w-4" /> : <ArrowLeft className="h-4 w-4" />}
            {resolvedBackLabel}
          </Button>
        </Link>
      </div>
      <PageHeader title={title} subtitle={subtitle} actions={actions} />
      <div className="flex flex-col gap-6">
        {sections.map((section) => (
          <section key={section.id} id={section.id}>
            <h2 className="mb-3 text-base font-semibold text-on-surface">{section.label}</h2>
            {section.content}
          </section>
        ))}
      </div>
    </div>
  );
}

