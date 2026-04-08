import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { StatusBadge } from './StatusBadge';

const ALL_STATUSES = ['pending', 'approved', 'assigned', 'in_progress', 'resolved', 'rejected'] as const;

describe('StatusBadge', () => {
  it('renders a label for each of the six statuses', () => {
    for (const status of ALL_STATUSES) {
      const { unmount } = render(<StatusBadge status={status} />);
      const badge = screen.getByText(/.+/);
      expect(badge.textContent?.trim().length).toBeGreaterThan(0);
      unmount();
    }
  });

  it('renders distinct classNames for all six statuses', () => {
    const classNames: string[] = [];
    for (const status of ALL_STATUSES) {
      const { container, unmount } = render(<StatusBadge status={status} />);
      const span = container.querySelector('span');
      expect(span).not.toBeNull();
      classNames.push(span!.className);
      unmount();
    }
    // All classNames should be unique
    const uniqueClassNames = new Set(classNames);
    expect(uniqueClassNames.size).toBe(ALL_STATUSES.length);
  });

  it('renders "Pending" label for pending status', () => {
    render(<StatusBadge status="pending" />);
    expect(screen.getByText('Pending')).toBeInTheDocument();
  });

  it('renders "Approved" label for approved status with token-based color', () => {
    const { container } = render(<StatusBadge status="approved" />);
    expect(screen.getByText('Approved')).toBeInTheDocument();
    const span = container.querySelector('span');
    expect(span?.className).toContain('status-approved');
  });

  it('renders "Assigned" label for assigned status with token-based color', () => {
    const { container } = render(<StatusBadge status="assigned" />);
    expect(screen.getByText('Assigned')).toBeInTheDocument();
    const span = container.querySelector('span');
    expect(span?.className).toContain('status-assigned');
  });

  it('renders "In Progress" label for in_progress status', () => {
    render(<StatusBadge status="in_progress" />);
    expect(screen.getByText('In Progress')).toBeInTheDocument();
  });

  it('renders "Resolved" label for resolved status', () => {
    render(<StatusBadge status="resolved" />);
    expect(screen.getByText('Resolved')).toBeInTheDocument();
  });

  it('renders "Rejected" label for rejected status', () => {
    render(<StatusBadge status="rejected" />);
    expect(screen.getByText('Rejected')).toBeInTheDocument();
  });
});
