import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { ComplaintCard } from './ComplaintCard';

const baseProps = {
  id: 'complaint-1',
  title: 'Water leak in block A',
  category: 'water',
  status: 'pending' as const,
  timestamp: '2 hours ago',
};

describe('ComplaintCard — committee_member role', () => {
  it('shows Approve and Reject buttons when status is pending', () => {
    const onApprove = vi.fn();
    const onReject = vi.fn();
    render(
      <ComplaintCard
        {...baseProps}
        userRole="committee_member"
        onApprove={onApprove}
        onReject={onReject}
      />
    );
    expect(screen.getByText('Approve')).toBeInTheDocument();
    expect(screen.getByText('Reject')).toBeInTheDocument();
  });

  it('shows Assign button when status is approved', () => {
    const onAssign = vi.fn();
    render(
      <ComplaintCard
        {...baseProps}
        status="approved"
        userRole="committee_member"
        onAssign={onAssign}
      />
    );
    expect(screen.getByText('Assign')).toBeInTheDocument();
  });

  it('does not show Start or Resolve buttons', () => {
    render(
      <ComplaintCard
        {...baseProps}
        status="assigned"
        userRole="committee_member"
      />
    );
    expect(screen.queryByText('Start')).not.toBeInTheDocument();
    expect(screen.queryByText('Resolve')).not.toBeInTheDocument();
  });

  it('calls onApprove when Approve is clicked', () => {
    const onApprove = vi.fn();
    render(
      <ComplaintCard
        {...baseProps}
        userRole="committee_member"
        onApprove={onApprove}
      />
    );
    fireEvent.click(screen.getByText('Approve'));
    expect(onApprove).toHaveBeenCalledOnce();
  });
});

describe('ComplaintCard — manager role', () => {
  it('shows Start button when status is assigned', () => {
    const onStart = vi.fn();
    render(
      <ComplaintCard
        {...baseProps}
        status="assigned"
        userRole="manager"
        onStart={onStart}
      />
    );
    expect(screen.getByText('Start')).toBeInTheDocument();
  });

  it('shows Resolve button when status is in_progress', () => {
    const onResolve = vi.fn();
    render(
      <ComplaintCard
        {...baseProps}
        status="in_progress"
        userRole="manager"
        onResolve={onResolve}
      />
    );
    expect(screen.getByText('Resolve')).toBeInTheDocument();
  });

  it('does not show Start when status is not assigned', () => {
    render(
      <ComplaintCard
        {...baseProps}
        status="in_progress"
        userRole="manager"
      />
    );
    expect(screen.queryByText('Start')).not.toBeInTheDocument();
  });

  it('does not show Resolve when status is not in_progress', () => {
    render(
      <ComplaintCard
        {...baseProps}
        status="assigned"
        userRole="manager"
      />
    );
    expect(screen.queryByText('Resolve')).not.toBeInTheDocument();
  });

  it('does not show Approve, Reject, or Assign buttons', () => {
    render(
      <ComplaintCard
        {...baseProps}
        status="assigned"
        userRole="manager"
      />
    );
    expect(screen.queryByText('Approve')).not.toBeInTheDocument();
    expect(screen.queryByText('Reject')).not.toBeInTheDocument();
    expect(screen.queryByText('Assign')).not.toBeInTheDocument();
  });

  it('calls onStart when Start is clicked', () => {
    const onStart = vi.fn();
    render(
      <ComplaintCard
        {...baseProps}
        status="assigned"
        userRole="manager"
        onStart={onStart}
      />
    );
    fireEvent.click(screen.getByText('Start'));
    expect(onStart).toHaveBeenCalledOnce();
  });
});

describe('ComplaintCard — resident role', () => {
  it('shows no action buttons', () => {
    render(
      <ComplaintCard
        {...baseProps}
        userRole="resident"
      />
    );
    expect(screen.queryByText('Approve')).not.toBeInTheDocument();
    expect(screen.queryByText('Reject')).not.toBeInTheDocument();
    expect(screen.queryByText('Assign')).not.toBeInTheDocument();
    expect(screen.queryByText('Start')).not.toBeInTheDocument();
    expect(screen.queryByText('Resolve')).not.toBeInTheDocument();
  });
});

describe('ComplaintCard — no role', () => {
  it('shows no action buttons when userRole is not provided', () => {
    render(<ComplaintCard {...baseProps} />);
    expect(screen.queryByText('Approve')).not.toBeInTheDocument();
    expect(screen.queryByText('Start')).not.toBeInTheDocument();
  });
});

describe('ComplaintCard — assignedManager prop', () => {
  it('displays assigned manager name when provided', () => {
    render(
      <ComplaintCard
        {...baseProps}
        assignedManager="John Manager"
      />
    );
    expect(screen.getByText(/John Manager/)).toBeInTheDocument();
  });

  it('does not display assigned manager section when not provided', () => {
    render(<ComplaintCard {...baseProps} />);
    expect(screen.queryByText(/Assigned to:/)).not.toBeInTheDocument();
  });
});
