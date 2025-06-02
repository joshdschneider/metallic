import {
  InvitationObject,
  OrganizationMemberObject,
  OrganizationMembershipRole,
  OrganizationMembershipStatus
} from '@metallichq/types';
import { ExclamationTriangleIcon, PlusIcon } from '@radix-ui/react-icons';
import { Box, Button, Callout, Flex, Heading, Skeleton, Table, Text } from '@radix-ui/themes';
import { useEffect, useState } from 'react';
import { useOrganizations } from '../hooks/use-organizations';
import { listOrganizationMembers } from '../lib/list-organization-members';
import { captureException } from '../utils/error';
import { getUserName, toTitleCase } from '../utils/helpers';
import { InviteMemberDialog } from './invite-member-dialog';
import { TeamMemberPopover } from './team-member-popover';

type TeamMembersTableProps = {
  addInvitation: (invitation: InvitationObject) => void;
};

export const TeamMembersTable: React.FC<TeamMembersTableProps> = ({ addInvitation }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [members, setMembers] = useState<OrganizationMemberObject[]>([]);
  const [showInviteDialog, setShowInviteDialog] = useState(false);
  const { selectedOrganizationId } = useOrganizations();

  function onMemberRemoved(userId: string) {
    setMembers((members) => members.filter((m) => m.user_id !== userId));
  }

  function onMemberRoleChanged(userId: string, role: OrganizationMembershipRole) {
    setMembers((members) => members.map((m) => (m.user_id === userId ? { ...m, role } : m)));
  }

  useEffect(() => {
    let mounted = true;
    if (!selectedOrganizationId) {
      return;
    }

    setLoading(true);
    listOrganizationMembers(selectedOrganizationId)
      .then((data) => {
        if (mounted) {
          setMembers(data.data.filter((m) => m.status === OrganizationMembershipStatus.Active));
        }
      })
      .catch((err) => {
        if (mounted) {
          setError('Failed to load team members.');
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
  }, [selectedOrganizationId]);

  const getTableContent = () => {
    if (error) {
      return (
        <Callout.Root color="gray" role="alert" style={{ width: '100%' }}>
          <Callout.Icon>
            <ExclamationTriangleIcon />
          </Callout.Icon>
          <Callout.Text>Failed to load team members.</Callout.Text>
        </Callout.Root>
      );
    }

    if (loading) {
      return (
        <Skeleton loading>
          <Table.Root variant="surface">
            <Table.Body>
              {Array.from({ length: 1 }).map((_, index) => (
                <Table.Row key={index} className="row-va-middle">
                  <Table.Cell>
                    <Text color="gray">Loading...</Text>
                  </Table.Cell>
                </Table.Row>
              ))}
            </Table.Body>
          </Table.Root>
        </Skeleton>
      );
    }

    if (members.length === 0) {
      return (
        <Table.Root variant="surface">
          <Table.Body>
            <Table.Row className="row-va-middle">
              <Table.Cell>
                <Text color="gray">There are no members on this team.</Text>
              </Table.Cell>
            </Table.Row>
          </Table.Body>
        </Table.Root>
      );
    }

    return (
      <Table.Root variant="surface">
        <Table.Header>
          <Table.Row>
            <Table.ColumnHeaderCell>Name</Table.ColumnHeaderCell>
            <Table.ColumnHeaderCell>Email</Table.ColumnHeaderCell>
            <Table.ColumnHeaderCell>Role</Table.ColumnHeaderCell>
            <Table.ColumnHeaderCell align="right"></Table.ColumnHeaderCell>
          </Table.Row>
        </Table.Header>

        <Table.Body>
          {members.map((member) => {
            return (
              <Table.Row key={member.organization_membership_id} className="row-va-middle">
                <Table.Cell>
                  {getUserName(member) || (
                    <Text color="gray">
                      <i>No name</i>
                    </Text>
                  )}
                </Table.Cell>
                <Table.Cell>{member.email}</Table.Cell>
                <Table.Cell>{toTitleCase(member.role)}</Table.Cell>
                <Table.Cell align="right">
                  <Flex align="center" justify="end">
                    <TeamMemberPopover
                      member={member}
                      onMemberRemoved={onMemberRemoved}
                      onMemberRoleChanged={onMemberRoleChanged}
                    />
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
    <Box width="100%">
      <Flex align="center" justify="between" mt="7" mb="4">
        <Heading size="4" weight="medium">
          Team members
        </Heading>
        <Button onClick={() => setShowInviteDialog(true)} color="blue" radius="large">
          <PlusIcon /> Invite team member
        </Button>
      </Flex>
      {getTableContent()}
      <InviteMemberDialog open={showInviteDialog} setOpen={setShowInviteDialog} addInvitation={addInvitation} />
    </Box>
  );
};
