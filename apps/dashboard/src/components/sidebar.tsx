import { CubeIcon, DashboardIcon, ExternalLinkIcon, LayersIcon, ReaderIcon, RocketIcon } from '@radix-ui/react-icons';
import { Button, Flex, Link as RadixLink, ScrollArea, Separator, Text } from '@radix-ui/themes';
import { Fragment } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useSubscriptions } from '../hooks/use-subscriptions';
import { CreditCardIcon, FolderIcon, GithubIcon, KeyIcon, PeopleIcon, SidePanelIcon } from './custom-icons';

interface SidebarProps {
  isCollapsed: boolean;
  setIsCollapsed: (isCollapsed: boolean) => void;
}

export function Sidebar({ isCollapsed, setIsCollapsed }: SidebarProps) {
  const location = useLocation();
  const { plan } = useSubscriptions();
  const navigate = useNavigate();

  const isActive = (href: string[]) => {
    if (href.length === 0) {
      return false;
    }

    if (href.length === 1 && href[0] === '/') {
      return location.pathname === '/';
    }

    return href.some((h) => location.pathname.startsWith(h));
  };

  return (
    <aside className={`sidebar${isCollapsed ? ' collapsed' : ''}`}>
      <Flex direction="column" height="100%">
        <Flex direction="column" justify="start" flexGrow="1" height="100%">
          <Flex
            p="4"
            gap="3"
            align="center"
            justify="between"
            style={{
              minHeight: '56px',
              maxHeight: '56px',
              borderBottom: '1px solid var(--gray-5)'
            }}
          >
            <RadixLink asChild underline="none">
              <Link to="/">
                <Flex align="center" gap="2">
                  <img src="/logo.png" alt="Metallic" width={20} height={20} />
                  <span className="logo-text">Metallic</span>
                </Flex>
              </Link>
            </RadixLink>
            <Flex gap="2" align="center" justify="start">
              <Button variant="ghost" color="gray" size="1" onClick={() => setIsCollapsed(true)}>
                <SidePanelIcon />
              </Button>
            </Flex>
          </Flex>
          <ScrollArea>
            <Flex direction="column" justify="start" gap="2" py="4" px="3">
              <nav className={`nav-menu`}>
                <Flex direction="column" justify="start" gap="1">
                  <ul>
                    <li>
                      <RadixLink asChild color="gray" className={`sidebar-link ${isActive(['/']) ? 'active' : ''}`}>
                        <Link to="/">
                          <DashboardIcon color="var(--gray-9)" />
                          {'Overview'}
                        </Link>
                      </RadixLink>
                    </li>
                    <li>
                      <RadixLink
                        asChild
                        color="gray"
                        href="/computers"
                        className={`sidebar-link ${isActive(['/computers']) ? 'active' : ''}`}
                      >
                        <Link to="/computers">
                          <CubeIcon color="var(--gray-9)" />
                          {'Computers'}
                        </Link>
                      </RadixLink>
                    </li>
                    <li>
                      <RadixLink
                        asChild
                        color="gray"
                        href="/templates"
                        className={`sidebar-link ${isActive(['/templates']) ? 'active' : ''}`}
                      >
                        <Link to="/templates">
                          <LayersIcon color="var(--gray-9)" />
                          {'Templates'}
                        </Link>
                      </RadixLink>
                    </li>
                  </ul>
                </Flex>

                <Flex direction="column" justify="start" gap="1">
                  <Text as="p" color="gray" className="sidebar-subheader">
                    {'Develop'}
                  </Text>
                  <ul>
                    <li>
                      <RadixLink
                        asChild
                        color="gray"
                        href="/api-keys"
                        className={`sidebar-link ${isActive(['/api-keys']) ? 'active' : ''}`}
                      >
                        <Link to="/api-keys">
                          <KeyIcon color="var(--gray-9)" />
                          {'API Keys'}
                        </Link>
                      </RadixLink>
                    </li>
                  </ul>
                </Flex>

                <Flex direction="column" justify="start" gap="1">
                  <Text as="p" color="gray" className="sidebar-subheader">
                    {'Manage'}
                  </Text>
                  <ul>
                    <li>
                      <RadixLink
                        asChild
                        color="gray"
                        href="/project"
                        className={`sidebar-link ${isActive(['/project']) ? 'active' : ''}`}
                      >
                        <Link to="/project">
                          <FolderIcon color="var(--gray-9)" />
                          {'Project'}
                        </Link>
                      </RadixLink>
                    </li>
                    <li>
                      <RadixLink
                        asChild
                        color="gray"
                        href="/team"
                        className={`sidebar-link ${isActive(['/team']) ? 'active' : ''}`}
                      >
                        <Link to="/team">
                          <PeopleIcon color="var(--gray-9)" />
                          {'Team'}
                        </Link>
                      </RadixLink>
                    </li>
                    <li>
                      <RadixLink
                        asChild
                        color="gray"
                        href="/billing"
                        className={`sidebar-link ${isActive(['/billing']) ? 'active' : ''}`}
                      >
                        <Link to="/billing">
                          <CreditCardIcon color="var(--gray-9)" />
                          {'Billing'}
                        </Link>
                      </RadixLink>
                    </li>
                  </ul>
                </Flex>
              </nav>
            </Flex>
          </ScrollArea>
          {['free', 'developer'].includes(plan) && (
            <Fragment>
              <Flex direction="column" gap="1" p={'3'} justify="center">
                <Button
                  size="2"
                  variant="soft"
                  color="blue"
                  highContrast
                  style={{ justifyContent: 'center', height: '36px' }}
                  onClick={() => navigate('/billing/plans')}
                >
                  <Flex justify="between" align="center" gap="2" p="1" style={{ width: '100%' }}>
                    <span>Upgrade plan</span>
                    <RocketIcon />
                  </Flex>
                </Button>
              </Flex>
              <Separator size="4" />
            </Fragment>
          )}
          <Flex direction="column" justify="start" gap="2" p="4" style={{ borderTop: '1px solid var(--gray-5)' }}>
            <RadixLink asChild color="gray" size="2" m="1" underline="none" highContrast>
              <a href="https://github.com/metallichq" target="_blank">
                <Flex justify="between" align="center" gap="2">
                  <Flex justify="start" align="center" gap="2">
                    <GithubIcon color="var(--gray-9)" />
                    {'Github'}
                  </Flex>
                  <Flex justify="end" align="center" gap="2">
                    <ExternalLinkIcon color="var(--gray-9)" />
                  </Flex>
                </Flex>
              </a>
            </RadixLink>
            <RadixLink asChild color="gray" size="2" m="1" underline="none" highContrast>
              <a href="https://metallic.dev/docs" target="_blank">
                <Flex justify="between" align="center" gap="2">
                  <Flex justify="start" align="center" gap="2">
                    <ReaderIcon color="var(--gray-9)" />
                    {'Documentation'}
                  </Flex>
                  <Flex justify="end" align="center" gap="2">
                    <ExternalLinkIcon color="var(--gray-9)" />
                  </Flex>
                </Flex>
              </a>
            </RadixLink>
          </Flex>
        </Flex>
      </Flex>
    </aside>
  );
}
