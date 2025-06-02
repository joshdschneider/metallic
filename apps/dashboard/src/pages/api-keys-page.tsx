import { ApiKeyObject } from '@metallichq/types';
import {
  ExclamationTriangleIcon,
  EyeOpenIcon,
  InfoCircledIcon,
  Pencil1Icon,
  PlusIcon,
  TrashIcon
} from '@radix-ui/react-icons';
import {
  Box,
  Button,
  Callout,
  Card,
  Code,
  Dialog,
  Flex,
  Heading,
  IconButton,
  Skeleton,
  Table,
  Text,
  TextField,
  VisuallyHidden
} from '@radix-ui/themes';
import { Dispatch, SetStateAction, useEffect, useState } from 'react';
import { CopyButton } from '../components/copy-button';
import { KeyIcon } from '../components/custom-icons';
import { Layout } from '../components/layout';
import { useApiKeys } from '../hooks/use-api-keys';
import { useProjects } from '../hooks/use-projects';
import { useToast } from '../hooks/use-toast';
import { createApiKey } from '../lib/create-api-key';
import { deleteApiKey } from '../lib/delete-api-key';
import { updateApiKey } from '../lib/update-api-key';
import { captureException } from '../utils/error';

export default function APIKeysPage() {
  const { selectedProject } = useProjects();
  const { loading, apiKeys, setApiKeys, error } = useApiKeys();
  const [showCreateKeyDialog, setShowCreateKeyDialog] = useState(false);
  const [showViewKeyDialog, setShowViewKeyDialog] = useState(false);
  const [showUpdateKeyDialog, setShowUpdateKeyDialog] = useState(false);
  const [showDeleteKeyDialog, setShowDeleteKeyDialog] = useState(false);
  const [keyToView, setKeyToView] = useState<ApiKeyObject | null>(null);
  const [keyIdToUpdate, setKeyIdToUpdate] = useState<string | null>(null);
  const [keyIdToDelete, setKeyIdToDelete] = useState<string | null>(null);

  function viewKey(key: ApiKeyObject) {
    setKeyToView(key);
    setShowViewKeyDialog(true);
  }

  function updateKey(id: string) {
    setKeyIdToUpdate(id);
    setShowUpdateKeyDialog(true);
  }

  function deleteKey(id: string) {
    setKeyIdToDelete(id);
    setShowDeleteKeyDialog(true);
  }

  useEffect(() => {
    if (!showUpdateKeyDialog) {
      setKeyIdToUpdate(null);
    }
  }, [showUpdateKeyDialog]);

  useEffect(() => {
    if (!showDeleteKeyDialog) {
      setKeyIdToDelete(null);
    }
  }, [showDeleteKeyDialog]);

  useEffect(() => {
    if (!showViewKeyDialog) {
      setKeyToView(null);
    }
  }, [showViewKeyDialog]);

  const prefixKey = (key: string) => {
    return `${key.slice(0, 7)}...${key.slice(-4)}`;
  };

  const getTable = () => {
    if (loading) {
      return (
        <Skeleton>
          <Table.Root variant="surface">
            <Table.Header>
              <Table.Row>
                <Table.ColumnHeaderCell>Loading</Table.ColumnHeaderCell>
              </Table.Row>
            </Table.Header>
            <Table.Body>
              <Table.Row className="row-va-middle">
                <Table.Cell>Loading</Table.Cell>
              </Table.Row>
            </Table.Body>
          </Table.Root>
        </Skeleton>
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

    if (apiKeys.length === 0) {
      return (
        <Card>
          <Flex justify="center" align="center" py="9">
            <Flex direction="column" justify="center" align="center" py="9" gap="4">
              <KeyIcon color="var(--gray-a9)" width="22px" height="22px" />
              <Text size="3" weight="medium" color="gray" highContrast>
                No API keys
              </Text>
            </Flex>
          </Flex>
        </Card>
      );
    }

    return (
      <Table.Root variant="surface">
        <Table.Header>
          <Table.Row>
            <Table.ColumnHeaderCell>Name</Table.ColumnHeaderCell>
            <Table.ColumnHeaderCell>Secret Key</Table.ColumnHeaderCell>
            <Table.ColumnHeaderCell>Created At</Table.ColumnHeaderCell>
            <Table.ColumnHeaderCell></Table.ColumnHeaderCell>
          </Table.Row>
        </Table.Header>
        <Table.Body>
          {apiKeys.map((key) => {
            return (
              <Table.Row key={key.id} className="row-va-middle">
                <Table.Cell>{key.name || 'Unnamed Key'}</Table.Cell>
                <Table.Cell>
                  <button className="reset-button Chip blue" onClick={() => viewKey(key)}>
                    <EyeOpenIcon style={{ marginRight: '2px' }} />
                    <Code size="1" color="blue" variant="ghost" weight="medium">
                      {prefixKey(key.key)}
                    </Code>
                  </button>
                </Table.Cell>
                <Table.Cell>
                  <Code variant="ghost" color="gray">
                    {new Date(key.created_at).toLocaleString()}
                  </Code>
                </Table.Cell>
                <Table.Cell align="right" valign="middle">
                  <Flex gap="4" align="center" justify="end">
                    <IconButton variant="ghost" color="gray" radius="full" onClick={() => updateKey(key.id)}>
                      <Pencil1Icon />
                    </IconButton>
                    <IconButton variant="ghost" color="gray" radius="full" onClick={() => deleteKey(key.id)}>
                      <TrashIcon />
                    </IconButton>
                  </Flex>
                </Table.Cell>
              </Table.Row>
            );
          })}
        </Table.Body>
      </Table.Root>
    );
  };

  return (
    <Layout>
      <Box py="9" px="5" style={{ margin: '0px auto', maxWidth: '68rem' }}>
        <Flex mb="5" align="center" justify="between">
          <Heading as="h2" size="6" weight="medium">
            API Keys
          </Heading>
          <Button color="blue" variant="solid" size="2" radius="large" onClick={() => setShowCreateKeyDialog(true)}>
            <PlusIcon /> Create API key
          </Button>
        </Flex>
        <Box>{getTable()}</Box>
      </Box>

      {selectedProject && (
        <CreateKeyDialog
          show={showCreateKeyDialog}
          setShow={setShowCreateKeyDialog}
          setKeys={setApiKeys}
          projectId={selectedProject.id}
        />
      )}
      {keyToView && selectedProject && (
        <ViewKeyDialog show={showViewKeyDialog} setShow={setShowViewKeyDialog} keyToView={keyToView} />
      )}
      {keyIdToUpdate && selectedProject && (
        <UpdateKeyDialog
          show={showUpdateKeyDialog}
          setShow={setShowUpdateKeyDialog}
          keys={apiKeys}
          setKeys={setApiKeys}
          keyId={keyIdToUpdate}
          projectId={selectedProject.id}
        />
      )}
      {keyIdToDelete && selectedProject && (
        <DeleteKeyDialog
          show={showDeleteKeyDialog}
          setShow={setShowDeleteKeyDialog}
          setKeys={setApiKeys}
          keyId={keyIdToDelete}
          projectId={selectedProject.id}
        />
      )}
    </Layout>
  );
}

type CreateKeyDialogProps = {
  show: boolean;
  setShow: (show: boolean) => void;
  setKeys: Dispatch<SetStateAction<ApiKeyObject[]>>;
  projectId: string;
};

function CreateKeyDialog({ show, setShow, setKeys, projectId }: CreateKeyDialogProps) {
  const [name, setName] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const { toastError, toastSuccess } = useToast();

  useEffect(() => {
    setName('');
  }, [show]);

  async function createKey() {
    setLoading(true);
    try {
      const result = await createApiKey(projectId, name);
      setKeys((prev) => [...prev, result]);
      setShow(false);
      toastSuccess('API key created');
    } catch (err) {
      captureException(err);
      toastError('Failed to create API key');
    } finally {
      setLoading(false);
    }
  }

  function cancel() {
    setName('');
    setShow(false);
  }

  function handleOpenChange(open: boolean) {
    if (!open) {
      cancel();
    } else {
      setShow(true);
    }
  }

  return (
    <Dialog.Root open={show} onOpenChange={handleOpenChange}>
      <VisuallyHidden>
        <Dialog.Title>Create new secret key</Dialog.Title>
        <Dialog.Description>Create a new secret key to access the API.</Dialog.Description>
      </VisuallyHidden>
      <Dialog.Content width="450px">
        <Flex direction="column" justify="start" gap="4" width="100%">
          <Box>
            <Heading as="h3" size="4">
              Create new secret key
            </Heading>
          </Box>
          <label>
            <Flex direction="column" justify="start" gap="1">
              <Text as="span" size="2" color="gray">
                Name
              </Text>
              <TextField.Root value={name} onChange={(e) => setName(e.target.value)} />
            </Flex>
          </label>
          <Flex align="center" justify="end" gap="3" mt="2">
            <Button variant="outline" color="gray" onClick={cancel}>
              Cancel
            </Button>
            <Button onClick={createKey} loading={loading}>
              Create Key
            </Button>
          </Flex>
        </Flex>
      </Dialog.Content>
    </Dialog.Root>
  );
}

type ViewKeyDialogProps = {
  show: boolean;
  setShow: (show: boolean) => void;
  keyToView: ApiKeyObject;
};

function ViewKeyDialog({ show, setShow, keyToView }: ViewKeyDialogProps) {
  return (
    <Dialog.Root open={show} onOpenChange={(open) => setShow(open)}>
      <VisuallyHidden>
        <Dialog.Title>Your API key</Dialog.Title>
        <Dialog.Description>
          Do not share your API key with others or expose it in the browser or other client-side code.
        </Dialog.Description>
      </VisuallyHidden>
      <Dialog.Content width="450px">
        <Flex direction="column" justify="start" gap="4" width="100%">
          <Box>
            <Heading as="h3" size="4" mb="1">
              Your API key
            </Heading>
          </Box>
          <Callout.Root color="yellow">
            <Callout.Icon>
              <InfoCircledIcon />
            </Callout.Icon>
            <Callout.Text>
              Do not share your API key with others or expose it in the browser or other client-side code.
            </Callout.Text>
          </Callout.Root>
          <label>
            <Flex direction="column" justify="start" gap="1">
              <Text as="span" size="2" color="gray">
                Key
              </Text>
              <TextField.Root value={keyToView.key} readOnly>
                <TextField.Slot side="right">
                  <CopyButton content={keyToView.key} />
                </TextField.Slot>
              </TextField.Root>
            </Flex>
          </label>
          <Flex align="center" justify="end" gap="3" mt="2">
            <Button variant="outline" color="gray" onClick={() => setShow(false)}>
              Close
            </Button>
          </Flex>
        </Flex>
      </Dialog.Content>
    </Dialog.Root>
  );
}

type UpdateKeyDialogProps = {
  show: boolean;
  setShow: (show: boolean) => void;
  keyId: string;
  keys: ApiKeyObject[];
  setKeys: Dispatch<SetStateAction<ApiKeyObject[]>>;
  projectId: string;
};

function UpdateKeyDialog({ show, setShow, keyId, keys, setKeys, projectId }: UpdateKeyDialogProps) {
  const [name, setName] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const { toastSuccess, toastError } = useToast();

  useEffect(() => {
    const keyToUpdate = keys.find((k) => k.id === keyId);
    setName(keyToUpdate?.name || '');
  }, [keys, keyId]);

  async function updateKey() {
    setLoading(true);
    try {
      const updatedKey = await updateApiKey({ projectId, apiKeyId: keyId, name });
      setKeys((prev) => prev.map((k) => (k.id === keyId ? updatedKey : k)));
      setShow(false);
      toastSuccess('API key updated');
    } catch (err) {
      captureException(err);
      toastError('Failed to update API key');
    } finally {
      setLoading(false);
    }
  }

  function cancel() {
    setShow(false);
  }

  function handleOpenChange(open: boolean) {
    if (!open) {
      cancel();
    } else {
      setShow(true);
    }
  }

  return (
    <Dialog.Root open={show} onOpenChange={handleOpenChange}>
      <VisuallyHidden>
        <Dialog.Title>Update secret key</Dialog.Title>
        <Dialog.Description>Update the name of the secret key.</Dialog.Description>
      </VisuallyHidden>
      <Dialog.Content width="450px">
        <Flex direction="column" justify="start" gap="4" width="100%">
          <Box>
            <Heading as="h3" size="4">
              Update secret key
            </Heading>
          </Box>
          <label>
            <Flex direction="column" justify="start" gap="1">
              <Text as="span" size="2" color="gray">
                Name
              </Text>
              <TextField.Root value={name} onChange={(e) => setName(e.target.value)} />
            </Flex>
          </label>
          <Flex align="center" justify="end" gap="3">
            <Button variant="outline" color="gray" onClick={cancel}>
              Cancel
            </Button>
            <Button onClick={updateKey} loading={loading}>
              Update Key
            </Button>
          </Flex>
        </Flex>
      </Dialog.Content>
    </Dialog.Root>
  );
}

type DeleteKeyDialogProps = {
  show: boolean;
  setShow: (show: boolean) => void;
  keyId: string;
  setKeys: Dispatch<SetStateAction<ApiKeyObject[]>>;
  projectId: string;
};

function DeleteKeyDialog({ show, setShow, keyId, setKeys, projectId }: DeleteKeyDialogProps) {
  const [loading, setLoading] = useState<boolean>(false);
  const { toastSuccess, toastError } = useToast();

  async function deleteKey() {
    setLoading(true);
    try {
      await deleteApiKey({ projectId, apiKeyId: keyId });
      setKeys((prev) => prev.filter((k) => k.id !== keyId));
      setShow(false);
      toastSuccess('API key deleted');
    } catch (err) {
      captureException(err);
      toastError('Failed to delete API key');
    } finally {
      setLoading(false);
    }
  }

  function cancel() {
    setShow(false);
  }

  function handleOpenChange(open: boolean) {
    if (!open) {
      cancel();
    } else {
      setShow(true);
    }
  }

  return (
    <Dialog.Root open={show} onOpenChange={handleOpenChange}>
      <VisuallyHidden>
        <Dialog.Title>Delete secret key</Dialog.Title>
        <Dialog.Description>Are you sure? This action can not be undone.</Dialog.Description>
      </VisuallyHidden>
      <Dialog.Content width="450px">
        <Flex direction="column" justify="start" gap="4" width="100%">
          <Box>
            <Heading as="h3" size="4" mb="1">
              Delete secret key
            </Heading>
            <Text color="gray" size="2">
              Are you sure? This action can not be undone.
            </Text>
          </Box>
          <Flex align="center" justify="start" gap="3" mt="2">
            <Button color="red" variant="surface" onClick={deleteKey} loading={loading}>
              Delete Key
            </Button>
            <Button variant="outline" color="gray" onClick={cancel}>
              Cancel
            </Button>
          </Flex>
        </Flex>
      </Dialog.Content>
    </Dialog.Root>
  );
}
