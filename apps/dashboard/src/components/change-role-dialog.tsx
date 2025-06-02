import { OrganizationMemberObject, OrganizationMembershipRole } from '@metallichq/types';
import { Button, Dialog, Flex, Heading, RadioGroup, Text, VisuallyHidden } from '@radix-ui/themes';
import { Dispatch, SetStateAction, useState } from 'react';
import { useOrganizations } from '../hooks/use-organizations';
import { useToast } from '../hooks/use-toast';
import { updateOrganizationMember } from '../lib/update-organization-member';
import { captureException } from '../utils/error';

export type ChangeRoleDialogProps = {
  open: boolean;
  setOpen: Dispatch<SetStateAction<boolean>>;
  member: OrganizationMemberObject;
  onMemberRoleChanged: (userId: string, role: OrganizationMembershipRole) => void;
};

export const ChangeRoleDialog: React.FC<ChangeRoleDialogProps> = ({ open, setOpen, member, onMemberRoleChanged }) => {
  const [role, setRole] = useState<OrganizationMembershipRole>(member.role);
  const [loading, setLoading] = useState(false);
  const { toastSuccess, toastError } = useToast();
  const { selectedOrganizationId } = useOrganizations();

  const changeRole = async () => {
    if (!selectedOrganizationId) {
      toastError();
      return;
    }

    try {
      setLoading(true);
      await updateOrganizationMember({
        organizationId: selectedOrganizationId,
        membershipId: member.organization_membership_id,
        role: role
      });
      toastSuccess('Role updated');
      setLoading(false);
      setOpen(false);
      onMemberRoleChanged(member.user_id, role);
    } catch (err) {
      captureException(err);
      toastError();
    }
  };

  return (
    <Dialog.Root open={open} onOpenChange={(open) => setOpen(open)}>
      <VisuallyHidden>
        <Dialog.Title>Change role</Dialog.Title>
      </VisuallyHidden>
      <VisuallyHidden>
        <Dialog.Description>Select the role you'd like to assign to John Doe.</Dialog.Description>
      </VisuallyHidden>
      <Dialog.Content width="400px">
        <Flex direction="column" justify="start" gap="4" width="100%">
          <Flex direction="column" gap="2">
            <Heading as="h3" size="4">
              Change role
            </Heading>
            <Text size="2" color="gray">
              Select the role you'd like to assign to John Doe.
            </Text>
          </Flex>
          <Flex>
            <RadioGroup.Root
              value={role}
              onValueChange={(value) => setRole(value as OrganizationMembershipRole)}
              name="example"
            >
              <RadioGroup.Item value={OrganizationMembershipRole.Owner}>Owner</RadioGroup.Item>
              <RadioGroup.Item value={OrganizationMembershipRole.Admin}>Admin</RadioGroup.Item>
              <RadioGroup.Item value={OrganizationMembershipRole.Member}>Member</RadioGroup.Item>
            </RadioGroup.Root>
          </Flex>
          <Flex align="center" justify="end" gap="3" mt="2">
            <Button variant="outline" color="gray" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button onClick={changeRole} loading={loading} disabled={loading || role === member.role}>
              Change Role
            </Button>
          </Flex>
        </Flex>
      </Dialog.Content>
    </Dialog.Root>
  );
};
