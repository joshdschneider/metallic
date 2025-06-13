import { InvitationObject } from '@metallichq/types';
import { Button, Dialog, Flex, Heading, RadioGroup, Text, TextField, VisuallyHidden } from '@radix-ui/themes';
import { AxiosError } from 'axios';
import { Dispatch, SetStateAction, useState } from 'react';
import { useOrganizations } from '../hooks/use-organizations';
import { useToast } from '../hooks/use-toast';
import { sendInvitation } from '../lib/send-invitation';
import { captureException } from '../utils/error';
import { getRoleDescription } from '../utils/helpers';

export type InviteMemberDialogProps = {
  open: boolean;
  setOpen: Dispatch<SetStateAction<boolean>>;
  addInvitation: (invitation: InvitationObject) => void;
};

export const InviteMemberDialog: React.FC<InviteMemberDialogProps> = ({ open, setOpen, addInvitation }) => {
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<string>('owner');
  const [loading, setLoading] = useState(false);
  const { selectedOrganizationId } = useOrganizations();
  const { toastError, toastSuccess } = useToast();

  const inviteMember = async () => {
    if (!selectedOrganizationId) {
      toastError('Team selection required.');
      return;
    }

    setLoading(true);
    try {
      const invitation = await sendInvitation(selectedOrganizationId, { email, role });
      addInvitation(invitation);
      setOpen(false);
      toastSuccess('Invitation sent.');
    } catch (err) {
      if (err instanceof AxiosError && err.response?.status === 402) {
        toastError('Please upgrade your plan to add team members.');
        return;
      }

      captureException(err);
      toastError('Failed to send invite.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog.Root open={open} onOpenChange={(open) => setOpen(open)}>
      <VisuallyHidden>
        <Dialog.Title>Invite team member</Dialog.Title>
      </VisuallyHidden>
      <VisuallyHidden>
        <Dialog.Description>
          The invited team member will receive an email with an invitation to join the team.
        </Dialog.Description>
      </VisuallyHidden>
      <Dialog.Content width="450px">
        <Flex direction="column" justify="start" gap="4" width="100%">
          <Flex direction="column" gap="2">
            <Heading as="h3" size="4">
              Invite team member
            </Heading>
            <Text size="2" color="gray">
              The invited team member will receive an email with an invitation to join the team.
            </Text>
          </Flex>
          <label style={{ width: '100%' }}>
            <Flex direction="column" justify="start" gap="1">
              <Text as="span" size="2" color="gray">
                Email
              </Text>
              <TextField.Root value={email} onChange={(e) => setEmail(e.target.value)} />
            </Flex>
          </label>
          <label style={{ width: '100%' }}>
            <Flex direction="column" justify="start" gap="2">
              <Text as="span" size="2" color="gray">
                Role
              </Text>
              <Flex>
                <RadioGroup.Root value={role} onValueChange={(val) => setRole(val)} name="example">
                  <RadioGroup.Item value="owner">Owner</RadioGroup.Item>
                  <RadioGroup.Item value="admin">Admin</RadioGroup.Item>
                  <RadioGroup.Item value="member">Member</RadioGroup.Item>
                </RadioGroup.Root>
              </Flex>
              <Text size="1" color="gray">
                {getRoleDescription(role)}
              </Text>
            </Flex>
          </label>
          <Flex align="center" justify="end" gap="3" mt="2">
            <Button variant="outline" color="gray" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button onClick={inviteMember} loading={loading}>
              Invite Member
            </Button>
          </Flex>
        </Flex>
      </Dialog.Content>
    </Dialog.Root>
  );
};
