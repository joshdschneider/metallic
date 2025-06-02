import { ApiKeyObject } from '@metallichq/types';
import {
  CodeIcon,
  CubeIcon,
  ExternalLinkIcon,
  LayersIcon,
  QuestionMarkCircledIcon,
  ReaderIcon
} from '@radix-ui/react-icons';
import {
  Box,
  Button,
  Card,
  Code,
  Flex,
  Grid,
  Heading,
  Link as RadixLink,
  Select,
  Separator,
  Skeleton,
  Text,
  Tooltip
} from '@radix-ui/themes';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { IconPanel } from '../components/icon-panel';
import { Layout } from '../components/layout';
import { useApiKeys } from '../hooks/use-api-keys';
import { useComputerCount } from '../hooks/use-computer-count';

export const HomePage: React.FC = () => {
  const navigate = useNavigate();
  const { loading: computerCountLoading, count } = useComputerCount();
  const { loading: apiKeysLoading, defaultApiKey } = useApiKeys();
  const [selectedLanguage, setSelectedLanguage] = useState('node');

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const prefixKey = (key: ApiKeyObject) => {
    return `${key.key.slice(0, 7)}...${key.key.slice(-4)}`;
  };

  return (
    <Layout>
      <Box py="9" px="5" style={{ margin: '0px auto', maxWidth: '68rem' }}>
        <Flex align="center" justify="between" mb="5" style={{ minHeight: 'var(--space-5)' }}>
          <Heading as="h2" size="6" weight="medium">
            {`Let's get started`}
          </Heading>
        </Flex>

        <Flex direction="column" justify="start" gap="8">
          <Flex direction="column" justify="start">
            <Flex direction="column" justify="start" gap="8">
              <Grid gap="4" columns={{ lg: '3', md: '3', initial: '1' }}>
                <Card variant="surface" size="3">
                  <Flex direction="column" justify="between" width="100%" height="100%">
                    <Text size="3" weight="medium">
                      Computers
                    </Text>
                    <Flex direction="column" justify="start" gap="1">
                      <Skeleton loading={computerCountLoading}>
                        <Text size="9">{count}</Text>
                      </Skeleton>
                    </Flex>
                  </Flex>
                </Card>

                <Card variant="surface" size="3">
                  <Flex direction="column" align="stretch" justify="start" gap="2">
                    <div className="FeatureIcon">
                      <IconPanel>
                        <CubeIcon color="var(--gray-11)" width="16px" height="16px" />
                      </IconPanel>
                    </div>
                    <Text size="3" weight="medium">
                      {`Spin up `}
                      {count > 0 ? 'a new' : 'your first'}
                      {` computer`}
                    </Text>
                    <Text color="gray" size="2" style={{ flex: '1 1 0%' }}>
                      Create a new computer in a few lines of code with our SDK.
                    </Text>
                    <Button
                      color="gray"
                      size="2"
                      variant="surface"
                      mt="2"
                      highContrast
                      onClick={() => {
                        window.open('https://metallic.dev/docs/quickstart', '_blank');
                      }}
                    >
                      Get started
                    </Button>
                  </Flex>
                </Card>

                <Card variant="surface" size="3">
                  <Flex direction="column" align="stretch" justify="start" gap="2">
                    <div className="FeatureIcon">
                      <IconPanel>
                        <LayersIcon color="var(--gray-11)" />
                      </IconPanel>
                    </div>
                    <Text size="3" weight="medium">
                      Create a template
                    </Text>
                    <Text color="gray" size="2" style={{ flex: '1 1 0%' }}>
                      Choose from a variety of pre-configured templates, or create your own.
                    </Text>
                    <Button
                      color="gray"
                      size="2"
                      variant="surface"
                      mt="2"
                      highContrast
                      onClick={() => {
                        window.open('https://metallic.dev/docs/templates', '_blank');
                      }}
                    >
                      Learn more
                    </Button>
                  </Flex>
                </Card>
              </Grid>
            </Flex>
          </Flex>

          <Flex direction="column" justify="start" gap="4">
            <Text size="4" weight="medium">
              {`Quick start`}
            </Text>
            <Card variant="surface" size="3">
              <Flex
                direction={{ lg: 'row', md: 'row', initial: 'column' }}
                align="stretch"
                justify="start"
                gap="5"
                width="100%"
              >
                <Flex direction="column" justify="start" gap="2" style={{ flex: '1 1 0%' }}>
                  <Flex justify="start" gap="2">
                    <span className="Marker">
                      <span className="MarkerCircle">
                        <span className="MarkerContent">1</span>
                      </span>
                    </span>
                    {apiKeysLoading ? (
                      <Skeleton>
                        <Flex direction="column" justify="start" gap="2" width="100%">
                          <Text size="2" weight="medium">
                            Set your environment variable
                          </Text>
                          <Grid align="baseline" gap="2" columns="1">
                            <Flex justify="start" align="center">
                              <Code size="2" variant="ghost" color="gray">
                                METALLIC_API_KEY=
                              </Code>
                              <Tooltip content={'Click to copy'}>
                                <button
                                  className="reset-button Chip gray"
                                  style={{
                                    display: 'initial',
                                    overflow: 'hidden',
                                    textOverflow: 'ellipsis'
                                  }}
                                >
                                  <Code size="1" variant="ghost" color="gray" weight="regular">
                                    abc123
                                  </Code>
                                </button>
                              </Tooltip>
                            </Flex>
                          </Grid>
                        </Flex>
                      </Skeleton>
                    ) : defaultApiKey ? (
                      <Flex direction="column" justify="start" gap="2" width="100%">
                        <Text size="2" weight="medium">
                          Set your environment variable
                        </Text>
                        <Flex justify="start" align="center" wrap="wrap">
                          <Code size="2" variant="ghost" color="gray">
                            METALLIC_API_KEY=
                          </Code>
                          <Tooltip content={'Click to copy'}>
                            <button
                              className="reset-button Chip gray"
                              style={{
                                display: 'initial',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis'
                              }}
                              onClick={() => {
                                copyToClipboard(defaultApiKey.key);
                              }}
                            >
                              <Code size="1" variant="ghost" color="gray" weight="regular">
                                {prefixKey(defaultApiKey)}
                              </Code>
                            </button>
                          </Tooltip>
                        </Flex>
                      </Flex>
                    ) : (
                      <Flex direction="column" justify="start" gap="2" width="100%">
                        <Text size="2" weight="medium">
                          Get an API key
                        </Text>
                        <Grid align="baseline" gap="2" columns="1">
                          <Button
                            variant="surface"
                            color="gray"
                            size="2"
                            highContrast
                            style={{
                              whiteSpace: 'nowrap'
                            }}
                            onClick={() => {
                              navigate('/api-keys');
                            }}
                          >
                            Create API key
                          </Button>
                        </Grid>
                      </Flex>
                    )}
                  </Flex>
                </Flex>
                <Box>
                  <div
                    data-orientation="horizontal"
                    role="none"
                    className="Separator horizontal med-vertical size-3"
                  ></div>
                </Box>
                <Flex direction="column" justify="start" gap="2" style={{ flex: '1 1 0%' }}>
                  <Flex justify="start" gap="2">
                    <span className="Marker">
                      <span className="MarkerCircle">
                        <span className="MarkerContent">2</span>
                      </span>
                    </span>
                    <Flex direction="column" justify="start" gap="2" width="100%">
                      <Text size="2" weight="medium">
                        Install the Metallic SDK
                      </Text>
                      <Box>
                        <Grid align="baseline" gap="2" rows="1">
                          <Select.Root
                            value={selectedLanguage}
                            onValueChange={(value) => setSelectedLanguage(value)}
                            size="1"
                          >
                            <Select.Trigger />
                            <Select.Content>
                              <Select.Item value="node">Node.js</Select.Item>
                              <Select.Item value="python">Python</Select.Item>
                            </Select.Content>
                          </Select.Root>
                          <Tooltip content={'Click to copy'}>
                            <button
                              className="reset-button Chip gray"
                              onClick={() => {
                                copyToClipboard(
                                  selectedLanguage === 'node' ? 'npm install metallic' : 'pip install metallic'
                                );
                              }}
                              style={{
                                display: 'initial',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis'
                              }}
                            >
                              <Code size="1" variant="ghost" color="gray" weight="regular">
                                {selectedLanguage === 'node' ? 'npm install metallic' : 'pip install metallic'}
                              </Code>
                            </button>
                          </Tooltip>
                        </Grid>
                      </Box>
                    </Flex>
                  </Flex>
                </Flex>
                <Box>
                  <div
                    data-orientation="horizontal"
                    role="none"
                    className="Separator horizontal med-vertical size-3"
                  ></div>
                </Box>
                <Flex direction="column" justify="start" gap="2" style={{ flex: '1 1 0%' }}>
                  <Flex justify="start" gap="2">
                    <span className="Marker">
                      <span className="MarkerCircle">
                        <span className="MarkerContent">3</span>
                      </span>
                    </span>
                    <Flex direction="column" justify="start" gap="2" width="100%">
                      <Text size="2" weight="medium">
                        Dive into the docs
                      </Text>
                      <Grid gap="2" columns="1">
                        <RadixLink
                          color="gray"
                          underline="auto"
                          size="2"
                          highContrast
                          className="ExternalLink"
                          href="https://metallic.dev/docs/quickstart"
                          target="_blank"
                        >
                          <span
                            style={{
                              whiteSpace: 'nowrap'
                            }}
                          >
                            Spin up a computer
                          </span>{' '}
                          <ExternalLinkIcon />
                        </RadixLink>
                        <RadixLink
                          color="gray"
                          underline="auto"
                          size="2"
                          highContrast
                          className="ExternalLink"
                          href="https://metallic.dev/docs/templates"
                          target="_blank"
                        >
                          <span
                            style={{
                              whiteSpace: 'nowrap'
                            }}
                          >
                            Create a custom template
                          </span>{' '}
                          <ExternalLinkIcon />
                        </RadixLink>
                      </Grid>
                    </Flex>
                  </Flex>
                </Flex>
              </Flex>
            </Card>
          </Flex>

          <Flex direction="column" justify="start" gap="4">
            <Text size="4" weight="medium">
              {`Explore the platform`}
            </Text>
            <Separator orientation="horizontal" size="1" style={{ width: '100%' }} />
            <Grid gap="5" columns={{ lg: '4', md: '2', initial: '1' }}>
              <Flex justify="start" gap="2">
                <Box style={{ paddingTop: '2px' }}>
                  <ReaderIcon height="17px" color="var(--gray-11)" />
                </Box>
                <Flex direction="column" justify="start">
                  <RadixLink
                    color="gray"
                    size="2"
                    highContrast
                    underline="auto"
                    weight="medium"
                    href="https://metallic.dev/docs"
                    target="_blank"
                  >
                    Documentation
                  </RadixLink>
                  <Text size="2" color="gray">
                    Start integrating your agent with Metallic computers.
                  </Text>
                </Flex>
              </Flex>

              <Flex justify="start" gap="2">
                <Box style={{ paddingTop: '2px' }}>
                  <CubeIcon height="17px" color="var(--gray-11)" />
                </Box>
                <Flex direction="column" justify="start">
                  <RadixLink
                    color="gray"
                    size="2"
                    highContrast
                    underline="auto"
                    weight="medium"
                    href="https://github.com/metallichq/metallic"
                    target="_blank"
                  >
                    SDKs
                  </RadixLink>
                  <Text size="2" color="gray">
                    Official open-source clients for Node.js and Python.
                  </Text>
                </Flex>
              </Flex>

              <Flex justify="start" gap="2">
                <Box style={{ paddingTop: '2px' }}>
                  <CodeIcon height="17px" color="var(--gray-11)" />
                </Box>
                <Flex direction="column" justify="start">
                  <RadixLink
                    color="gray"
                    size="2"
                    highContrast
                    underline="auto"
                    weight="medium"
                    href="https://metallic.dev/docs/example-apps"
                    target="_blank"
                  >
                    Example Apps
                  </RadixLink>
                  <Text size="2" color="gray">
                    Explore open-source examples and real-world use cases.
                  </Text>
                </Flex>
              </Flex>

              <Flex justify="start" gap="2">
                <Box style={{ paddingTop: '2px' }}>
                  <QuestionMarkCircledIcon height="17px" color="var(--gray-11)" />
                </Box>
                <Flex direction="column" justify="start">
                  <RadixLink
                    color="gray"
                    size="2"
                    highContrast
                    underline="auto"
                    weight="medium"
                    href="mailto:support@metallic.dev"
                    target="_blank"
                  >
                    Support
                  </RadixLink>
                  <Text size="2" color="gray">
                    Get integration support directly from our engineers.
                  </Text>
                </Flex>
              </Flex>
            </Grid>
          </Flex>
        </Flex>
      </Box>
    </Layout>
  );
};
