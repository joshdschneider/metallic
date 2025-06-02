import { OrganizationMemberObject } from '@metallichq/types';
import { Button, DataList, Dialog, Flex, Heading, Text, VisuallyHidden } from '@radix-ui/themes';
import { Dispatch, SetStateAction, useState } from 'react';
import { useOrganizations } from '../hooks/use-organizations';
import { useToast } from '../hooks/use-toast';
import { removeOrganizationMember } from '../lib/remove-organization-member';
import { captureException } from '../utils/error';

export type RemoveMemberDialogProps = {
  open: boolean;
  setOpen: Dispatch<SetStateAction<boolean>>;
  member: OrganizationMemberObject;
  onMemberRemoved: (userId: string) => void;
};

export const RemoveMemberDialog: React.FC<RemoveMemberDialogProps> = ({ open, setOpen, member, onMemberRemoved }) => {
  const [loading, setLoading] = useState(false);
  const { toastSuccess, toastError } = useToast();
  const { selectedOrganizationId } = useOrganizations();

  const removeMember = async () => {
    if (!selectedOrganizationId) {
      toastError();
      return;
    }

    try {
      setLoading(true);
      await removeOrganizationMember({
        organizationId: selectedOrganizationId,
        membershipId: member.organization_membership_id
      });
      toastSuccess('Member removed');
      setLoading(false);
      setOpen(false);
      onMemberRemoved(member.user_id);
    } catch (err) {
      captureException(err);
      toastError();
    }
  };

  return (
    <Dialog.Root open={open} onOpenChange={(open) => setOpen(open)}>
      <VisuallyHidden>
        <Dialog.Title>Remove team member</Dialog.Title>
      </VisuallyHidden>
      <VisuallyHidden>
        <Dialog.Description>
          Are you sure you want to remove the team member below? You will need to invite this member back if you wish to
          restore access in the future.
        </Dialog.Description>
      </VisuallyHidden>
      <Dialog.Content width="400px">
        <Flex direction="column" justify="start" gap="4" width="100%">
          <Flex direction="column" gap="2">
            <Heading as="h3" size="4">
              Remove team member
            </Heading>
            <Text size="2" color="gray">
              Are you sure you want to remove the team member below? You will need to invite this member back if you
              wish to restore access in the future.
            </Text>
          </Flex>
          <Flex>
            <DataList.Root>
              <DataList.Item align="center">
                <DataList.Label minWidth="88px">Member email</DataList.Label>
                <DataList.Value>{member.email}</DataList.Value>
              </DataList.Item>
            </DataList.Root>
          </Flex>
          <Flex align="center" justify="end" gap="3" mt="2">
            <Button variant="outline" color="gray" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button onClick={removeMember} loading={loading} color="red">
              Remove member
            </Button>
          </Flex>
        </Flex>
      </Dialog.Content>
    </Dialog.Root>
  );
};
