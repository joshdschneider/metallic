import { ComputerObject } from '@metallichq/types';
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  CubeIcon,
  ExclamationTriangleIcon,
  ExternalLinkIcon,
  MagnifyingGlassIcon,
  PlusIcon
} from '@radix-ui/react-icons';
import {
  Box,
  Button,
  Card,
  Code,
  Dialog,
  Flex,
  Heading,
  Link,
  Table,
  Text,
  TextField,
  VisuallyHidden
} from '@radix-ui/themes';
import { ChangeEvent, Fragment, useEffect, useState } from 'react';
import { useDebounce } from 'use-debounce';
import { MultiCodeBlock } from '../components/code-block/multi-code-block';
import { Layout } from '../components/layout';
import { useProjects } from '../hooks/use-projects';
import { listComputers } from '../lib/list-computers';
import { captureException } from '../utils/error';

export default function ComputersPage() {
  const { selectedProject } = useProjects();
  const [computers, setComputers] = useState<ComputerObject[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastId, setLastId] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [startingAfter, setStartingAfter] = useState<string | undefined>(undefined);
  const [startingAfterHistory, setStartingAfterHistory] = useState<string[]>([]);
  const [debouncedSearchQuery] = useDebounce(searchQuery, 500);
  const [showCreateComputerDialog, setShowCreateComputerDialog] = useState(false);

  useEffect(() => {
    let mounted = true;
    if (!selectedProject) {
      return;
    }

    setLoading(true);
    listComputers(selectedProject.id, {
      limit: 20,
      after: startingAfter,
      query: debouncedSearchQuery
    })
      .then((data) => {
        if (mounted) {
          setComputers(data.data);
          setLastId(data.last);
          setHasMore(data.has_more);
        }
      })
      .catch((err) => {
        if (mounted) {
          setError('Failed to load computers');
          captureException(err);
        }
      })
      .finally(() => {
        if (mounted) {
          setLoading(false);
        }
      });

    return () => {
      mounted = false;
    };
  }, [selectedProject, debouncedSearchQuery, startingAfter]);

  function handleSearch(event: ChangeEvent<HTMLInputElement>) {
    setStartingAfterHistory([]);
    setStartingAfter(undefined);
    setSearchQuery(event.target.value);
  }

  function nextPage() {
    setStartingAfter(lastId || undefined);
    setStartingAfterHistory((history) => [...history, startingAfter ? startingAfter : '']);
  }

  function prevPage() {
    setStartingAfterHistory((history) => {
      const newHistory = [...history];
      const previousStartingAfter = newHistory.pop() || undefined;
      setStartingAfter(previousStartingAfter);
      return newHistory;
    });
  }

  const addComputer = () => {
    setShowCreateComputerDialog(true);
  };

  const getStateColor = (
    state: 'created' | 'starting' | 'started' | 'stopping' | 'stopped' | 'destroying' | 'destroyed' | 'unknown'
  ) => {
    switch (state) {
      case 'created':
        return 'gray';
      case 'starting':
        return 'yellow';
      case 'started':
        return 'green';
      case 'stopping':
        return 'orange';
      case 'stopped':
        return 'gray';
      case 'destroying':
        return 'red';
      case 'destroyed':
        return 'red';
      case 'unknown':
        return 'gray';
      default:
        return 'gray';
    }
  };

  const getComputersTable = () => {
    if (loading) {
      return (
        <Card>
          <Flex justify="center" align="center" py="9">
            <Flex direction="column" justify="center" align="center" py="9">
              <Text size="3" weight="medium" color="gray">
                Loading...
              </Text>
            </Flex>
          </Flex>
        </Card>
      );
    }

    if (error) {
      return (
        <Card>
          <Flex justify="center" align="center" py="9">
            <Flex direction="column" justify="center" align="center" py="9">
              <ExclamationTriangleIcon
                color="var(--gray-a9)"
                width="22px"
                height="22px"
                style={{ marginBottom: 'var(--space-3)' }}
              />
              <Text size="3" weight="medium" color="gray" highContrast>
                Oops! Something went wrong.
              </Text>
            </Flex>
          </Flex>
        </Card>
      );
    }

    if (computers.length === 0) {
      return (
        <Card>
          <Flex justify="center" align="center" py="9">
            <Flex direction="column" justify="center" align="center" py="9" gap="4">
              <CubeIcon color="var(--gray-a9)" width="22px" height="22px" />
              <Text size="3" weight="medium" color="gray" highContrast>
                No computers yet
              </Text>
            </Flex>
          </Flex>
        </Card>
      );
    }

    return (
      <Fragment>
        <Table.Root variant="surface">
          <Table.Header>
            <Table.Row>
              <Table.ColumnHeaderCell>Computer</Table.ColumnHeaderCell>
              <Table.ColumnHeaderCell>State</Table.ColumnHeaderCell>
              <Table.ColumnHeaderCell>Template</Table.ColumnHeaderCell>
              <Table.ColumnHeaderCell>Region</Table.ColumnHeaderCell>
              <Table.ColumnHeaderCell>Created At</Table.ColumnHeaderCell>
            </Table.Row>
          </Table.Header>

          <Table.Body>
            {computers.map((computer) => {
              return (
                <Table.Row className="row-va-middle" key={computer.id}>
                  <Table.Cell>
                    <Code variant="ghost" color="gray" highContrast>
                      <span>{computer.id}</span>
                    </Code>
                  </Table.Cell>
                  <Table.Cell>
                    <Code color={getStateColor(computer.state)}>{computer.state}</Code>
                  </Table.Cell>
                  <Table.Cell>
                    <Code variant="ghost" color="gray">
                      {computer.template}
                    </Code>
                  </Table.Cell>
                  <Table.Cell>
                    <Code variant="ghost" color="gray">
                      {computer.region}
                    </Code>
                  </Table.Cell>
                  <Table.Cell>
                    <Code variant="ghost" color="gray">
                      {new Date(computer.created_at).toLocaleString()}
                    </Code>
                  </Table.Cell>
                </Table.Row>
              );
            })}
          </Table.Body>
        </Table.Root>
        <Flex align="center" justify="end" gap="3" mt="5">
          {startingAfterHistory.length > 0 && (
            <Button variant="soft" color="gray" radius="large" highContrast onClick={prevPage}>
              <ChevronLeftIcon /> Previous
            </Button>
          )}
          {hasMore && (
            <Button variant="soft" color="gray" radius="large" highContrast onClick={nextPage}>
              Next <ChevronRightIcon />
            </Button>
          )}
        </Flex>
      </Fragment>
    );
  };

  return (
    <Layout>
      <Box py="9" px="5" style={{ margin: '0px auto', maxWidth: '68rem' }}>
        <Flex align="center" justify="between" mb="5" style={{ minHeight: 'var(--space-5)' }}>
          <Heading as="h2" size="6" weight="medium">
            Computers
          </Heading>
        </Flex>
        <Flex direction="column" justify="start">
          <Flex gap="3">
            <Box flexGrow="1">
              <TextField.Root
                mb="5"
                variant="surface"
                placeholder="Search computers..."
                radius="large"
                value={searchQuery}
                onChange={handleSearch}
                disabled={!!error || computers.length === 0}
              >
                <TextField.Slot>
                  <MagnifyingGlassIcon height="16" width="16" />
                </TextField.Slot>
              </TextField.Root>
            </Box>
            <Button variant="solid" size="2" radius="large" onClick={addComputer}>
              <PlusIcon /> New computer
            </Button>
          </Flex>
        </Flex>
        <Box>{getComputersTable()}</Box>
      </Box>
      <CreateComputerDialog show={showCreateComputerDialog} setShow={setShowCreateComputerDialog} />
    </Layout>
  );
}

const nodeCodeBlock = `import { Computer } from '@metallichq/sdk';

async function main() {
  const computer = await Computer.create();
  console.log(computer.id);
}

main().catch(console.error);`;

const pythonCodeBlock = `from metallic_sdk import Metallic

def main():
  computer = Computer.create(api_key="your-api-key")
  print("Computer created! ID: " + computer.id)

if __name__ == "__main__":
    main()`;

type CreateComputerDialogProps = {
  show: boolean;
  setShow: (show: boolean) => void;
};

function CreateComputerDialog({ show, setShow }: CreateComputerDialogProps) {
  return (
    <Dialog.Root open={show} onOpenChange={() => setShow(false)}>
      <VisuallyHidden>
        <Dialog.Title>Create a computer</Dialog.Title>
        <Dialog.Description>Install the SDK and spin up a new computer in a few lines.</Dialog.Description>
      </VisuallyHidden>
      <Dialog.Content>
        <Flex direction="column" justify="start" gap="4" width="100%">
          <Box>
            <Heading as="h3" size="3" mb="2">
              Create a computer
            </Heading>
            <Text as="p" color="gray" size="2">
              {`Install the `}
              <Link color="gray" href="https://github.com/metallichq/metallic" target="_blank" underline="always">
                {`SDK`}
              </Link>
              {` and spin up a new computer in a few lines.`}
            </Text>
          </Box>
          <Card style={{ padding: '0px' }}>
            <MultiCodeBlock
              persistContentSelection={false}
              showSelector={false}
              style={{ height: '100%', borderRadius: '0', border: 'none' }}
              tabs={[
                {
                  id: 'node',
                  label: 'Node.js',
                  codeBlockContent: [
                    {
                      language: 'js',
                      value: nodeCodeBlock,
                      id: 'node',
                      label: 'Node.js',
                      showCopyCodeButton: true,
                      showLineNumbers: true
                    }
                  ]
                },
                {
                  id: 'python',
                  label: 'Python',
                  codeBlockContent: [
                    {
                      language: 'python',
                      value: pythonCodeBlock,
                      id: 'python',
                      label: 'Python',
                      showCopyCodeButton: true,
                      showLineNumbers: true
                    }
                  ]
                }
              ]}
            />
          </Card>
          <Flex justify="start" gap="4" mt="1">
            <Button
              variant="soft"
              color="gray"
              radius="large"
              highContrast
              onClick={() => {
                window.open('https://metallic.dev/docs/quick-start', '_blank');
              }}
            >
              {`Quick start`}
              <ExternalLinkIcon />
            </Button>
            <Button
              variant="soft"
              color="gray"
              radius="large"
              highContrast
              onClick={() => {
                window.open('https://github.com/metallichq/metallic', '_blank');
              }}
            >
              {`Github repo`}
              <ExternalLinkIcon />
            </Button>
          </Flex>
        </Flex>
      </Dialog.Content>
    </Dialog.Root>
  );
}
