import { InvitationObject } from '@metallichq/types';
import { Button, DataList, Dialog, Flex, Heading, Text, VisuallyHidden } from '@radix-ui/themes';
import { Dispatch, SetStateAction, useState } from 'react';
import { useOrganizations } from '../hooks/use-organizations';
import { useToast } from '../hooks/use-toast';
import { revokeInvitation } from '../lib/revoke-invitation';
import { captureException } from '../utils/error';

export type RevokeInvitationDialogProps = {
  open: boolean;
  setOpen: Dispatch<SetStateAction<boolean>>;
  invitation: InvitationObject;
  removeInvitation: (invitationId: string) => void;
};

export const RevokeInvitationDialog: React.FC<RevokeInvitationDialogProps> = ({
  open,
  setOpen,
  invitation,
  removeInvitation
}) => {
  const [loading, setLoading] = useState(false);
  const { toastSuccess, toastError } = useToast();
  const { selectedOrganizationId } = useOrganizations();

  const revoke = async () => {
    if (!selectedOrganizationId) {
      toastError();
      return;
    }

    try {
      setLoading(true);
      await revokeInvitation({
        organizationId: selectedOrganizationId,
        invitationId: invitation.id
      });
      removeInvitation(invitation.id);
      toastSuccess('Invitation revoked');
      setLoading(false);
      setOpen(false);
    } catch (err) {
      captureException(err);
      toastError();
    }
  };

  return (
    <Dialog.Root open={open} onOpenChange={(open) => setOpen(open)}>
      <VisuallyHidden>
        <Dialog.Title>Revoke Invitation</Dialog.Title>
      </VisuallyHidden>
      <VisuallyHidden>
        <Dialog.Description>{`Are you sure you want to revoke the invitation sent to the email below?`}</Dialog.Description>
      </VisuallyHidden>
      <Dialog.Content width="400px">
        <Flex direction="column" justify="start" gap="4" width="100%">
          <Flex direction="column" gap="2">
            <Heading as="h3" size="4">
              Revoke Invitation
            </Heading>
            <Text size="2" color="gray">
              {`Are you sure you want to revoke the invitation sent to the email below?`}
            </Text>
          </Flex>
          <Flex>
            <DataList.Root>
              <DataList.Item align="center">
                <DataList.Label minWidth="88px">Email</DataList.Label>
                <DataList.Value>{invitation.email}</DataList.Value>
              </DataList.Item>
            </DataList.Root>
          </Flex>
          <Flex align="center" justify="end" gap="3" mt="2">
            <Button variant="outline" color="gray" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button onClick={revoke} loading={loading} color="red">
              Revoke Invitation
            </Button>
          </Flex>
        </Flex>
      </Dialog.Content>
    </Dialog.Root>
  );
};
