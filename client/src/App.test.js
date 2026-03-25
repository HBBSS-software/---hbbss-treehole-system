import { render } from '@testing-library/react';
import App from './App';

test('App renders without crashing', () => {
  Storage.prototype.getItem = jest.fn(() => null);
  const { container } = render(<App />);
  expect(container).toBeTruthy();
});
