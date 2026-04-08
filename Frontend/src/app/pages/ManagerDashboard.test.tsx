import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../../services/api', () => ({
  api: {
    get: vi.fn(),
    patch: vi.fn(),
  },
}));

vi.mock('sonner', () => ({
  toast: {
    error: vi.fn(),
    success: vi.fn(),
  },
}));

// Import AFTER mocks are set up
import ManagerDashboard from './ManagerDashboard';
import { api } from '../../services/api';
import { toast } from 'sonner';

const makeComplaint = (overrides = {}) => ({
  id: 'c1',
  text: 'Water leak in block A',
  category: 'water',
  status: 'assigned',
  created_at: new Date().toISOString(),
  anonymous: false,
  created_by: 'user-1',
  assigned_to: 'manager-1',
  approved_by: 'committee-1',
  resolved_at: null,
  ...overrides,
});

const makePaginatedResponse = (results: unknown[]) => ({
  count: results.length,
  next: null,
  previous: null,
  results,
});

// TopNav also calls api.get('/api/notifications/') on mount, consuming one
// mockResolvedValueOnce before the dashboard's own tasks fetch. Each helper
// queues the notifications response first, then the tasks response.
const mockNotifications = () =>
  vi.mocked(api.get).mockResolvedValueOnce([]);

describe('ManagerDashboard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('fetches tasks on mount and renders complaint cards', async () => {
    mockNotifications();
    vi.mocked(api.get).mockResolvedValueOnce(
      makePaginatedResponse([makeComplaint()])
    );

    render(<ManagerDashboard />);

    await waitFor(() => {
      expect(screen.getByText('Water leak in block A')).toBeInTheDocument();
    });

    expect(api.get).toHaveBeenCalledWith('/api/manager/tasks/');
  });

  it('shows empty state when no tasks are assigned', async () => {
    mockNotifications();
    vi.mocked(api.get).mockResolvedValueOnce(makePaginatedResponse([]));

    render(<ManagerDashboard />);

    await waitFor(() => {
      expect(screen.getByText(/No tasks assigned to you yet/)).toBeInTheDocument();
    });
  });

  it('shows error state when fetch fails', async () => {
    // notifications call succeeds; tasks call rejects
    mockNotifications();
    vi.mocked(api.get).mockRejectedValueOnce(new Error('Network error'));

    render(<ManagerDashboard />);

    await waitFor(() => {
      expect(screen.getByText('Network error')).toBeInTheDocument();
    });
  });

  it('renders Start button for assigned complaints', async () => {
    mockNotifications();
    vi.mocked(api.get).mockResolvedValueOnce(
      makePaginatedResponse([makeComplaint({ status: 'assigned' })])
    );

    render(<ManagerDashboard />);

    await waitFor(() => {
      expect(screen.getByText('Start')).toBeInTheDocument();
    });
  });

  it('renders Resolve button for in_progress complaints', async () => {
    mockNotifications();
    vi.mocked(api.get).mockResolvedValueOnce(
      makePaginatedResponse([makeComplaint({ status: 'in_progress' })])
    );

    render(<ManagerDashboard />);

    await waitFor(() => {
      expect(screen.getByText('Resolve')).toBeInTheDocument();
    });
  });

  it('optimistically updates status to in_progress when Start is clicked', async () => {
    mockNotifications();
    vi.mocked(api.get).mockResolvedValueOnce(
      makePaginatedResponse([makeComplaint({ id: 'c1', status: 'assigned' })])
    );
    vi.mocked(api.patch).mockResolvedValueOnce({});

    render(<ManagerDashboard />);

    await waitFor(() => {
      expect(screen.getByText('Start')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('Start'));

    // After optimistic update, the status badge should show In Progress
    // (the filter button also renders "In Progress", so we expect at least one match)
    await waitFor(() => {
      expect(screen.getAllByText('In Progress').length).toBeGreaterThanOrEqual(1);
    });

    expect(api.patch).toHaveBeenCalledWith('/api/complaints/c1/status/', { status: 'in_progress' });
  });

  it('rolls back status on PATCH error', async () => {
    mockNotifications();
    vi.mocked(api.get).mockResolvedValueOnce(
      makePaginatedResponse([makeComplaint({ id: 'c1', status: 'assigned' })])
    );
    vi.mocked(api.patch).mockRejectedValueOnce(new Error('Server error'));

    render(<ManagerDashboard />);

    await waitFor(() => {
      expect(screen.getByText('Start')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('Start'));

    // After rollback, status should revert to Assigned
    await waitFor(() => {
      expect(screen.getByText('Assigned')).toBeInTheDocument();
    });

    expect(toast.error).toHaveBeenCalled();
  });
});
