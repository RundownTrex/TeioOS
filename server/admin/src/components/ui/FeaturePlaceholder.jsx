import React from 'react';
import { Card, CardBody } from './Card';
import { EmptyState } from './EmptyState';
import { PageHeader } from './PageHeader';
import { Construction } from 'lucide-react';

const DEFAULT_DESCRIPTION =
  'This section of the TeioOS Administration Dashboard is not implemented yet.';

/**
 * Generic placeholder rendered by routes whose feature screens have not been
 * implemented. Replaced by real pages as milestones land.
 */
export const FeaturePlaceholder = ({ title, description = DEFAULT_DESCRIPTION, icon }) => {
  return (
    <section aria-labelledby={`placeholder-${title}`}>
      <PageHeader title={title} />
      <Card>
        <CardBody>
          <EmptyState
            icon={icon ?? <Construction className="w-8 h-8 text-text-muted" />}
            title="Coming soon"
            description={description}
          />
        </CardBody>
      </Card>
    </section>
  );
};

export default FeaturePlaceholder;
