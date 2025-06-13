import { TemplateObject } from '@metallichq/types';
import {
  ExclamationTriangleIcon,
  EyeClosedIcon,
  EyeOpenIcon,
  LayersIcon,
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
  Table,
  Text,
  TextField,
  VisuallyHidden
} from '@radix-ui/themes';
import { ChangeEvent, Fragment, useEffect, useState } from 'react';
import { Layout } from '../components/layout';
import { useProjects } from '../hooks/use-projects';
import { listTemplates } from '../lib/list-templates';
import { captureException } from '../utils/error';

export default function TemplatesPage() {
  const { selectedProject } = useProjects();
  const [templates, setTemplates] = useState<TemplateObject[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showCreateTemplateDialog, setShowCreateTemplateDialog] = useState(false);

  useEffect(() => {
    let mounted = true;
    if (!selectedProject) {
      return;
    }

    setLoading(true);
    listTemplates(selectedProject.id)
      .then((data) => {
        if (mounted) {
          setTemplates(data.data);
        }
      })
      .catch((err) => {
        if (mounted) {
          setError('Failed to load templates');
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
  }, [selectedProject]);

  useEffect(() => {
    if (searchQuery) {
      setTemplates(
        templates.filter((template) => {
          return (
            template.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            template.slug.toLowerCase().includes(searchQuery.toLowerCase())
          );
        })
      );
    } else {
      setTemplates(templates);
    }
  }, [searchQuery, templates]);

  function handleSearch(event: ChangeEvent<HTMLInputElement>) {
    setSearchQuery(event.target.value);
  }

  const getTemplatesTable = () => {
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

    if (templates.length === 0) {
      return (
        <Card>
          <Flex justify="center" align="center" py="9">
            <Flex direction="column" justify="center" align="center" py="9" gap="4">
              <LayersIcon color="var(--gray-a9)" width="22px" height="22px" />
              <Text size="3" weight="medium" color="gray" highContrast>
                No templates yet
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
              <Table.ColumnHeaderCell>Template</Table.ColumnHeaderCell>
              <Table.ColumnHeaderCell>Name</Table.ColumnHeaderCell>
              <Table.ColumnHeaderCell>Instance Type</Table.ColumnHeaderCell>
              <Table.ColumnHeaderCell>Storage</Table.ColumnHeaderCell>
              <Table.ColumnHeaderCell>Visibility</Table.ColumnHeaderCell>
              <Table.ColumnHeaderCell>Created At</Table.ColumnHeaderCell>
            </Table.Row>
          </Table.Header>
          <Table.Body>
            {templates.map((template) => {
              return (
                <Table.Row key={template.slug} className="row-va-middle">
                  <Table.Cell>
                    <Flex align="center" justify="start" gap="2">
                      <Code variant="ghost" color="gray" highContrast>
                        <span>{template.slug}</span>
                      </Code>
                    </Flex>
                  </Table.Cell>
                  <Table.Cell>
                    <Text as="span" color="gray">
                      {template.name || 'Unnamed template'}
                    </Text>
                  </Table.Cell>
                  <Table.Cell>
                    <Code variant="ghost" color="gray">
                      {template.instance_type}
                    </Code>
                  </Table.Cell>
                  <Table.Cell>
                    <Code variant="ghost" color="gray">
                      {template.storage_gb}GB
                    </Code>
                  </Table.Cell>
                  <Table.Cell>
                    {template.is_public ? (
                      <Flex align="center" justify="start" gap="2">
                        <EyeOpenIcon color="var(--gray-11)" />
                        <Text as="span" color="gray">
                          Public
                        </Text>
                      </Flex>
                    ) : (
                      <Flex align="center" justify="start" gap="2">
                        <EyeClosedIcon color="var(--gray-11)" />
                        <Text as="span" color="gray">
                          Private
                        </Text>
                      </Flex>
                    )}
                  </Table.Cell>
                  <Table.Cell>
                    <Code variant="ghost" color="gray">
                      {new Date(template.created_at).toLocaleString()}
                    </Code>
                  </Table.Cell>
                </Table.Row>
              );
            })}
          </Table.Body>
        </Table.Root>
      </Fragment>
    );
  };

  return (
    <Layout>
      <Box py="9" px="5" style={{ margin: '0px auto', maxWidth: '68rem' }}>
        <Flex align="center" justify="between" mb="5" style={{ minHeight: 'var(--space-5)' }}>
          <Heading as="h2" size="6" weight="medium">
            Templates
          </Heading>
        </Flex>
        <Flex direction="column" justify="start">
          <Flex gap="3">
            <Box flexGrow="1">
              <TextField.Root
                mb="5"
                variant="surface"
                placeholder="Search connections..."
                radius="large"
                value={searchQuery}
                onChange={handleSearch}
              >
                <TextField.Slot>
                  <MagnifyingGlassIcon height="16" width="16" />
                </TextField.Slot>
              </TextField.Root>
            </Box>
            <Button variant="solid" size="2" radius="large" onClick={() => setShowCreateTemplateDialog(true)}>
              <PlusIcon /> Add template
            </Button>
          </Flex>
          <Box>{getTemplatesTable()}</Box>
        </Flex>
      </Box>
      <CreateTemplateDialog show={showCreateTemplateDialog} setShow={setShowCreateTemplateDialog} />
    </Layout>
  );
}

type CreateComputerDialogProps = {
  show: boolean;
  setShow: (show: boolean) => void;
};

function CreateTemplateDialog({ show, setShow }: CreateComputerDialogProps) {
  return (
    <Dialog.Root open={show} onOpenChange={() => setShow(false)}>
      <VisuallyHidden>
        <Dialog.Title>Create a computer</Dialog.Title>
        <Dialog.Description>Install the SDK and spin up a new computer in a few lines.</Dialog.Description>
      </VisuallyHidden>
      <Dialog.Content style={{ maxWidth: '400px' }}>
        <Flex direction="column" justify="start" gap="4" width="100%">
          <Box>
            <Heading as="h3" size="3" mb="2">
              Templates are coming soon
            </Heading>
            <Text as="p" color="gray" size="2">
              {`If you need a custom template now, please request it below.`}
            </Text>
          </Box>
          <Flex justify="start" gap="4" mt="1">
            <Button
              variant="solid"
              color="blue"
              radius="large"
              onClick={() => {
                const subject = `Custom template request`;
                window.location.href = `mailto:team@metallic.dev?subject=${encodeURIComponent(subject)}`;
              }}
            >
              {`Request a template`}
            </Button>
            <Button
              variant="soft"
              color="gray"
              radius="large"
              highContrast
              onClick={() => {
                setShow(false);
              }}
            >
              Cancel
            </Button>
          </Flex>
        </Flex>
      </Dialog.Content>
    </Dialog.Root>
  );
}
