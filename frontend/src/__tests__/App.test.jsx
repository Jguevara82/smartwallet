import { render, screen } from '@testing-library/react';
import App from '../App';

describe('App', () => {
  test('renders login screen by default', async () => {
    localStorage.clear();
    render(<App />);
    const heading = await screen.findByText(/welcome back/i);
    expect(heading).toBeInTheDocument();
  });
});
