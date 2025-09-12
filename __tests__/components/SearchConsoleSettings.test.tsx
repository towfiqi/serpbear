import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import SearchConsoleSettings from '../../components/settings/SearchConsoleSettings';
import { dummySettings } from '../../__mocks__/data';
import { refreshSearchConsoleData } from '../../services/searchConsole';

jest.mock('../../services/searchConsole', () => ({
   refreshSearchConsoleData: jest.fn(),
}));

describe('SearchConsoleSettings Component', () => {
   it('renders refresh button and calls refreshSearchConsoleData', async () => {
      const settings = { ...dummySettings, search_console_client_email: '', search_console_private_key: '' } as any;
      const updateSettings = jest.fn();
      render(<SearchConsoleSettings settings={settings} settingsError={null} updateSettings={updateSettings} />);
      const button = screen.getByRole('button', { name: /refresh search console data/i });
      expect(button).toBeInTheDocument();
      fireEvent.click(button);
      await waitFor(() => expect(refreshSearchConsoleData).toHaveBeenCalled());
   });
});
