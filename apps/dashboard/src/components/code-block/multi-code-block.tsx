import { Box, Flex, ScrollArea, Select, Tabs, Text } from '@radix-ui/themes';
import { CSSProperties, useEffect, useState } from 'react';
import { CODE_BLOCK_CONTENT_KEY } from '../../utils/constants';
import { CopyButton } from '../copy-button';
import { CodeBlock } from './code-block';

type CodeBlockTab = {
  id: string;
  label: string;
  codeBlockContent: CodeBlockContent | CodeBlockContent[];
};

type CodeBlockContent = {
  id: string;
  label: string;
  language: 'js' | 'jsx' | 'bash' | 'css' | 'python' | 'diff';
  value: string;
  showCopyCodeButton?: boolean;
  showLineNumbers?: boolean;
};

type MultiCodeBlockProps = {
  tabs: CodeBlockTab | CodeBlockTab[];
  style?: CSSProperties;
  persistContentSelection?: boolean;
  showSelector?: boolean;
};

export function MultiCodeBlock({ tabs, style, persistContentSelection, showSelector }: MultiCodeBlockProps) {
  const [selectedTab, setSelectedTab] = useState<CodeBlockTab>(() => {
    return Array.isArray(tabs) ? tabs[0] : tabs;
  });

  useEffect(() => {
    setSelectedTab(Array.isArray(tabs) ? tabs[0] : tabs);
  }, [tabs]);

  const isClient = typeof window !== 'undefined';

  const getInitialSelectedContent = (tab: CodeBlockTab) => {
    const storedContentId = persistContentSelection ? isClient && localStorage.getItem(CODE_BLOCK_CONTENT_KEY) : null;

    if (storedContentId) {
      const content = Array.isArray(tab.codeBlockContent)
        ? tab.codeBlockContent.find((c) => c.id === storedContentId)
        : tab.codeBlockContent;
      if (content) {
        return content;
      }
    }

    return Array.isArray(tab.codeBlockContent) ? tab.codeBlockContent[0] : tab.codeBlockContent;
  };

  const [selectedContent, setSelectedContent] = useState<CodeBlockContent>(() => {
    return getInitialSelectedContent(selectedTab);
  });

  useEffect(() => {
    if (persistContentSelection) {
      const storedContentId = persistContentSelection ? isClient && localStorage.getItem(CODE_BLOCK_CONTENT_KEY) : null;

      if (storedContentId) {
        const content = Array.isArray(selectedTab.codeBlockContent)
          ? selectedTab.codeBlockContent.find((c) => c.id === storedContentId)
          : selectedTab.codeBlockContent;
        if (content) {
          setSelectedContent(content);
        } else {
          setSelectedContent(
            Array.isArray(selectedTab.codeBlockContent) ? selectedTab.codeBlockContent[0] : selectedTab.codeBlockContent
          );
        }
      } else {
        setSelectedContent(
          Array.isArray(selectedTab.codeBlockContent) ? selectedTab.codeBlockContent[0] : selectedTab.codeBlockContent
        );
      }
    } else {
      setSelectedContent(
        Array.isArray(selectedTab.codeBlockContent) ? selectedTab.codeBlockContent[0] : selectedTab.codeBlockContent
      );
    }
  }, [selectedTab, persistContentSelection, isClient]);

  const resetCodeBlock: CSSProperties = {
    boxShadow: 'none',
    borderRadius: '0'
  };

  const tabsHeaderStyle: CSSProperties = {
    position: 'absolute',
    top: 0,
    right: 0,
    left: 0,
    zIndex: 1,
    backgroundColor: 'var(--gray-2)',
    boxShadow: 'inset 0 -1px 0 0 var(--gray-a5)'
  };

  function getTabSelect(tab: CodeBlockTab) {
    if (showSelector === false) {
      return null;
    }

    if (Array.isArray(tab.codeBlockContent)) {
      const contentArray = tab.codeBlockContent;
      return (
        <Select.Root
          value={selectedContent.id}
          onValueChange={(val) => {
            const newSelectedContent = contentArray.find((c) => c.id === val)!;
            setSelectedContent(newSelectedContent);
            if (persistContentSelection && isClient) {
              localStorage.setItem(CODE_BLOCK_CONTENT_KEY, newSelectedContent.id);
            }
          }}
        >
          <Select.Trigger variant="ghost" color="gray" />
          <Select.Content>
            {tab.codeBlockContent.map((content) => {
              return (
                <Select.Item value={content.id} key={content.id}>
                  {content.label}
                </Select.Item>
              );
            })}
          </Select.Content>
        </Select.Root>
      );
    } else {
      return null;
    }
  }

  function getTabCopy() {
    if (selectedContent.value && selectedContent.showCopyCodeButton) {
      return <CopyButton content={selectedContent.value} tabIndex={-1} />;
    } else {
      return null;
    }
  }

  function getBlockContent() {
    return (
      <CodeBlock
        language={selectedContent.language}
        value={selectedContent.value}
        showCopyCodeButton={false}
        showLineNumbers={selectedContent.showLineNumbers}
        style={{
          paddingTop: '40px',
          ...resetCodeBlock
        }}
      />
    );
  }

  function getTabs() {
    if (Array.isArray(tabs)) {
      return (
        <Tabs.Root
          value={selectedTab.id}
          onValueChange={(val) => {
            setSelectedTab(tabs.find((t) => t.id === val)!);
          }}
        >
          <Flex width="100%" justify="between" align="center" style={tabsHeaderStyle}>
            <Tabs.List style={{ boxShadow: 'none' }}>
              {tabs.map((tab) => {
                return (
                  <Tabs.Trigger value={tab.id} key={tab.id}>
                    {tab.label}
                  </Tabs.Trigger>
                );
              })}
            </Tabs.List>
            <Flex justify="end" align="center" mr="3" gap="4">
              {getTabSelect(selectedTab)}
              {getTabCopy()}
            </Flex>
          </Flex>
          <Box>
            {tabs.map((tab) => {
              return (
                <Tabs.Content value={tab.id} key={tab.id}>
                  {getBlockContent()}
                </Tabs.Content>
              );
            })}
          </Box>
        </Tabs.Root>
      );
    } else {
      return (
        <Tabs.Root defaultValue={selectedTab.id}>
          <Flex width="100%" justify="between" align="center" style={tabsHeaderStyle}>
            <Flex justify="start" align="center" mr="3" gap="4">
              <Text size="2" mx="4" my="3">
                {selectedTab.label}
              </Text>
            </Flex>
            <Flex justify="end" align="center" mr="3" gap="4">
              {getTabSelect(selectedTab)}
              {getTabCopy()}
            </Flex>
          </Flex>
          <Box>{getBlockContent()}</Box>
        </Tabs.Root>
      );
    }
  }

  return (
    <Flex
      direction="column"
      style={{
        borderRadius: 'var(--radius-4)',
        border: '1px solid var(--gray-a5)',
        overflow: 'hidden',
        position: 'relative',
        ...style
      }}
    >
      <ScrollArea>
        <Box height="11px" />
        {getTabs()}
      </ScrollArea>
    </Flex>
  );
}
