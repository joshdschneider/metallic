import { InvitationObject } from '@metallichq/types';
import { ExclamationTriangleIcon } from '@radix-ui/react-icons';
import { Badge, Box, Callout, Flex, Heading, Skeleton, Table, Text } from '@radix-ui/themes';
import { toTitleCase } from '../utils/helpers';
import { InvitationPopover } from './invitation-popover';

type InvitationsTableProps = {
  invitations: InvitationObject[];
  removeInvitation: (invitationId: string) => void;
  loading: boolean;
  error: string | null;
};

export const InvitationsTable: React.FC<InvitationsTableProps> = ({
  invitations,
  removeInvitation,
  loading,
  error
}) => {
  const getTableContent = () => {
    if (error) {
      return (
        <Callout.Root color="gray" role="alert" style={{ width: '100%' }}>
          <Callout.Icon>
            <ExclamationTriangleIcon />
          </Callout.Icon>
          <Callout.Text>Failed to load invites.</Callout.Text>
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

    return (
      <Table.Root variant="surface">
        <Table.Header>
          <Table.Row>
            <Table.ColumnHeaderCell>Email</Table.ColumnHeaderCell>
            <Table.ColumnHeaderCell>State</Table.ColumnHeaderCell>
            <Table.ColumnHeaderCell align="right"></Table.ColumnHeaderCell>
          </Table.Row>
        </Table.Header>
        <Table.Body>
          {invitations.map((invitation) => {
            return (
              <Table.Row key={invitation.id} className="row-va-middle">
                <Table.Cell>{invitation.email}</Table.Cell>
                <Table.Cell>
                  <Badge>{toTitleCase(invitation.state)}</Badge>
                </Table.Cell>
                <Table.Cell align="right">
                  <Flex align="center" justify="end">
                    <InvitationPopover invitation={invitation} removeInvitation={removeInvitation} />
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
      <Flex align="center" justify="start" mt="7" mb="4">
        <Heading size="4" weight="medium">
          Invitations
        </Heading>
      </Flex>
      {getTableContent()}
    </Box>
  );
};
