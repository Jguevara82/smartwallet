import { render, screen } from '@testing-library/react';

// Mock the api module before importing App
jest.mock('../services/api', () => ({
  authAPI: {
    getMe: jest.fn().mockRejectedValue(new Error('Not authenticated')),
    login: jest.fn(),
    register: jest.fn(),
  },
  categoriesAPI: {
    getAll: jest.fn().mockResolvedValue({ data: [] }),
    seed: jest.fn().mockResolvedValue({}),
  },
  transactionsAPI: {
    getAll: jest.fn().mockResolvedValue({ data: [] }),
    getSummary: jest.fn().mockResolvedValue({ data: {} }),
  },
  budgetsAPI: {
    getAll: jest.fn().mockResolvedValue({ data: [] }),
  },
  recurringAPI: {
    getUpcoming: jest.fn().mockResolvedValue({ data: [] }),
  },
}));

import App from '../App';

describe('App', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  test('renders login screen by default', async () => {
    render(<App />);
    const heading = await screen.findByText(/welcome back/i);
    expect(heading).toBeInTheDocument();
  });
});
