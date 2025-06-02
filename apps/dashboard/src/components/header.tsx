import { QuestionMarkCircledIcon, ReaderIcon } from '@radix-ui/react-icons';
import { Button, Flex, Link as RadixLink, Separator } from '@radix-ui/themes';
import { useEffect, useState } from 'react';
import { AvatarPopover } from './avatar-popover';
import { SidePanelIcon } from './custom-icons';
import { ProjectPopover } from './project-popover';
import { TeamPopover } from './team-popover';
import { ThemeToggle } from './theme-toggle';

interface HeaderProps {
  isCollapsed: boolean;
  setIsCollapsed: (isCollapsed: boolean) => void;
}

export function Header({ isCollapsed, setIsCollapsed }: HeaderProps) {
  const [shouldRender, setShouldRender] = useState(isCollapsed);

  useEffect(() => {
    if (isCollapsed) {
      setShouldRender(true);
    }
  }, [isCollapsed]);

  const handleAnimationEnd = () => {
    if (!isCollapsed) {
      setShouldRender(false);
    }
  };

  return (
    <header className="navbar">
      <Flex justify="between" align="center" pr="4" height="100%" gap="1">
        <Flex justify="start" pl="4" width="100%">
          {shouldRender && (
            <Flex
              className={`sidebar-button ${!isCollapsed ? 'sidebar-button-hidden' : 'sidebar-button-visible'}`}
              onAnimationEnd={handleAnimationEnd}
              style={{ animation: `${!isCollapsed ? 'slideOut' : 'slideIn'} 0.3s forwards` }}
            >
              <Flex align="center" justify="start" gap="2">
                <Button variant="ghost" color="gray" size="1" onClick={() => setIsCollapsed(false)}>
                  <SidePanelIcon />
                </Button>
              </Flex>
              <Flex align="center" justify="start" px="4">
                <Separator orientation="vertical" size="4" />
              </Flex>
            </Flex>
          )}
          <Flex align="center" justify="start" gap="2">
            <Flex align="center" justify="start" gap="1">
              <TeamPopover />
            </Flex>
          </Flex>
          <Flex align="center" justify="start" px="4">
            <Separator orientation="vertical" size="4" />
          </Flex>
          <Flex align="center" justify="start" gap="2">
            <Flex align="center" justify="start" gap="1">
              <ProjectPopover />
            </Flex>
          </Flex>
        </Flex>
        <Flex width="100%" justify="end" height="100%" gap="4" align="center">
          <Flex>
            <RadixLink size="2" color="gray" href="mailto:support@metallic.dev">
              <Flex align="center" gap="1">
                <QuestionMarkCircledIcon width="15" height="15" />
                {'Support'}
              </Flex>
            </RadixLink>
          </Flex>
          <Flex>
            <RadixLink size="2" color="gray" href="https://metallic.dev/docs" target="_blank">
              <Flex align="center" gap="1">
                <ReaderIcon width="15" height="15" />
                {'Docs'}
              </Flex>
            </RadixLink>
          </Flex>
          <Flex>
            <ThemeToggle />
          </Flex>
          <Flex>
            <AvatarPopover />
          </Flex>
        </Flex>
      </Flex>
    </header>
  );
}
