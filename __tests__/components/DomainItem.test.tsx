import { fireEvent, render } from '@testing-library/react';
import DomainItem from '../../components/domains/DomainItem';
import { dummyDomain } from '../../__mocks__/data';

const updateThumbMock = jest.fn();
const domainItemProps = {
   domain: dummyDomain,
   selected: false,
   isConsoleIntegrated: false,
   thumb: '',
   updateThumb: updateThumbMock,
};

describe('DomainItem Component', () => {
   it('renders without crashing', async () => {
      const { container } = render(<DomainItem {...domainItemProps} />);
      expect(container.querySelector('.domItem')).toBeInTheDocument();
   });
   it('renders keywords count', async () => {
      const { container } = render(<DomainItem {...domainItemProps} />);
      const domStatskeywords = container.querySelector('.dom_stats div:nth-child(1)');
      expect(domStatskeywords?.textContent).toBe('Keywords10');
   });
   it('renders avg position', async () => {
      const { container } = render(<DomainItem {...domainItemProps} />);
      const domStatsAvg = container.querySelector('.dom_stats div:nth-child(2)');
      expect(domStatsAvg?.textContent).toBe('Avg position24');
   });
   it('updates domain thumbnail on relevant button click', async () => {
      const { container } = render(<DomainItem {...domainItemProps} />);
      const reloadThumbbBtn = container.querySelector('.domain_thumb button');
      if (reloadThumbbBtn) fireEvent.click(reloadThumbbBtn);
      expect(updateThumbMock).toHaveBeenCalledWith(dummyDomain.domain);
   });
});
