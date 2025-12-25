import { useState, type ReactNode } from 'react';
import './Module.css';

interface ModuleProps {
  title: string;
  children: ReactNode;
  defaultExpanded?: boolean;
}

export function Module({ title, children, defaultExpanded = true }: ModuleProps) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);

  return (
    <div className={`module ${isExpanded ? 'expanded' : 'collapsed'}`}>
      <div className="module-header" onClick={() => setIsExpanded(!isExpanded)}>
        <div className="module-title">
          <span className="module-chevron">{isExpanded ? '▼' : '▶'}</span>
          {title}
        </div>
      </div>
      {isExpanded && <div className="module-content">{children}</div>}
    </div>
  );
}
