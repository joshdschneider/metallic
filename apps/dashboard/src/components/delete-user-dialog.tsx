import { UserObject } from '@metallichq/types';
import { Button, Dialog, Flex, Heading, Text, VisuallyHidden } from '@radix-ui/themes';
import { useState } from 'react';
import { useToast } from '../hooks/use-toast';
import { deleteUser } from '../lib/delete-user';
import { captureException } from '../utils/error';

export type DeleteUserDialogProps = {
  open: boolean;
  setOpen: (open: boolean) => void;
  user: UserObject;
};

export function DeleteUserDialog({ open, setOpen, user }: DeleteUserDialogProps) {
  const [loading, setLoading] = useState<boolean>(false);
  const { toastError } = useToast();

  const deleteUserAccount = async () => {
    setLoading(true);
    try {
      await deleteUser(user.id);
      setOpen(false);
      window.location.reload();
    } catch (err) {
      captureException(err);
      toastError('Failed to delete user account.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog.Root open={open} onOpenChange={(open) => setOpen(open)}>
      <VisuallyHidden>
        <Dialog.Title>Are you sure?</Dialog.Title>
      </VisuallyHidden>
      <VisuallyHidden>
        <Dialog.Description>
          This action will permanently delete your account and all associated data.
        </Dialog.Description>
      </VisuallyHidden>
      <Dialog.Content width="400px">
        <Flex direction="column" justify="start" gap="4" width="100%">
          <Flex direction="column" align="start" justify="start" gap="2">
            <Heading as="h3" size="4">
              Are you sure?
            </Heading>
            <Text size="2" color="gray">
              This action will permanently delete your account and all associated data.
            </Text>
          </Flex>
          <Flex align="center" justify="end" gap="3" mt="2">
            <Button variant="outline" color="gray" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button onClick={deleteUserAccount} loading={loading} color="red">
              Delete Account
            </Button>
          </Flex>
        </Flex>
      </Dialog.Content>
    </Dialog.Root>
  );
}
