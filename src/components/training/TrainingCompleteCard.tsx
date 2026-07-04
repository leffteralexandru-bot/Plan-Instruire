import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/Button';
import { ProfessionalPanel } from '@/components/ui/ProfessionalPanel';
import { ingineriPath } from '@/data/departments';

interface TrainingCompleteCardProps {
  totalDays: number;
  certificateIssued?: boolean;
  showPlanLink?: boolean;
  onOpenCertificate?: () => void;
}

export function TrainingCompleteCard({
  totalDays,
  certificateIssued,
  showPlanLink = true,
  onOpenCertificate,
}: TrainingCompleteCardProps) {
  return (
    <ProfessionalPanel
      variant="training-success"
      icon="certificate"
      eyebrow="Instruire inițială · finalizată"
      title={`Program de ${totalDays} zile complet`}
      subtitle={
        certificateIssued
          ? 'Certificat emis — urmează evaluarea tri-lunară de performanță'
          : 'Toate zilele sunt finalizate — așteptați certificatul de la mentor'
      }
      headerAction={
        <div className="flex flex-wrap gap-2">
          {certificateIssued && onOpenCertificate && (
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={onOpenCertificate}
            >
              Certificat
            </Button>
          )}
          {showPlanLink && (
            <Link to={ingineriPath('/plan-instruire')}>
              <Button
                type="button"
                variant="primary"
                size="sm"
                className="bg-emerald-600 hover:bg-emerald-700 border-emerald-600"
              >
                Instruire de succes ✓
              </Button>
            </Link>
          )}
        </div>
      }
    />
  );
}
