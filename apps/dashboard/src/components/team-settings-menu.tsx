import { TabNav as RadixTabNav } from '@radix-ui/themes';
import { Link } from 'react-router-dom';

export interface TeamSettingsMenuProps {
  active?: 'general' | 'members' | 'billing';
}

export const TeamSettingsMenu: React.FC<TeamSettingsMenuProps> = ({ active }) => {
  return (
    <RadixTabNav.Root
      style={{
        position: 'sticky',
        top: '0px',
        background: 'var(--color-background)',
        zIndex: 100
      }}
    >
      <RadixTabNav.Link asChild active={active === 'general'}>
        <Link to="/team/settings">General</Link>
      </RadixTabNav.Link>
      <RadixTabNav.Link asChild active={active === 'members'}>
        <Link to="/team/members">Members</Link>
      </RadixTabNav.Link>
      <RadixTabNav.Link asChild active={active === 'billing'}>
        <Link to="/team/billing">Billing</Link>
      </RadixTabNav.Link>
    </RadixTabNav.Root>
  );
};
