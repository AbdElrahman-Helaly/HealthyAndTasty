import type { Category } from '@/types';
import { cn } from '@/lib/utils';
import { ChevronRight, FolderTree } from 'lucide-react';
import { Link } from 'react-router-dom';
import { StatusBadge } from '@/components/ui/Badge';

interface HierarchyTreeProps {
  categories: Category[];
  className?: string;
}

export function HierarchyTree({ categories, className }: HierarchyTreeProps) {
  const roots = categories.filter((c) => !c.parentId);

  function renderNode(category: Category, depth = 0) {
    const children = categories.filter((c) => c.parentId === category.id);
    return (
      <div key={category.id}>
        <Link
          to={`/categories/${category.id}`}
          className={cn(
            'flex items-center gap-2 rounded-lg px-3 py-2 text-sm hover:bg-surface-container transition-colors',
            depth > 0 && 'ms-6',
          )}
        >
          {depth > 0 && <ChevronRight className="h-3.5 w-3.5 text-on-surface-variant" />}
          <FolderTree className="h-4 w-4 text-primary shrink-0" />
          <span className="flex-1 font-medium text-on-surface">{category.name}</span>
          <StatusBadge active={category.isActive} />
        </Link>
        {children.map((child) => renderNode(child, depth + 1))}
      </div>
    );
  }

  return (
    <div className={cn('flex flex-col gap-0.5', className)}>
      {roots.map((root) => renderNode(root))}
    </div>
  );
}
