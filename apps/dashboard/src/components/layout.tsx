import { Box, Flex, ScrollArea } from '@radix-ui/themes';
import { ReactNode, useState } from 'react';
import { Header } from './header';
import { Sidebar } from './sidebar';

interface LayoutProps {
  children: ReactNode;
}

export function Layout({ children }: LayoutProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);

  return (
    <Flex direction="row" align="start" style={{ width: '100%' }}>
      <Box className={isCollapsed ? 'sidebar-box-collapsed' : 'sidebar-box'}>
        <Sidebar isCollapsed={isCollapsed} setIsCollapsed={setIsCollapsed} />
      </Box>
      <Flex direction="column" align="start" flexGrow="1" className="main-content" style={{ height: '100vh' }}>
        <Header isCollapsed={isCollapsed} setIsCollapsed={setIsCollapsed} />
        <ScrollArea style={{ width: '100%' }}>
          <main>{children}</main>
        </ScrollArea>
      </Flex>
    </Flex>
  );
}
