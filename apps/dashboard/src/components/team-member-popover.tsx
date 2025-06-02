import { OrganizationMemberObject, OrganizationMembershipRole } from '@metallichq/types';
import { DotsHorizontalIcon } from '@radix-ui/react-icons';
import { Button, Flex, IconButton, Popover } from '@radix-ui/themes';
import { useState } from 'react';
import { Fragment } from 'react/jsx-runtime';
import { ChangeRoleDialog } from './change-role-dialog';
import { RemoveMemberDialog } from './remove-member-dialog';

export type TeamMemberPopoverProps = {
  member: OrganizationMemberObject;
  onMemberRemoved: (userId: string) => void;
  onMemberRoleChanged: (userId: string, role: OrganizationMembershipRole) => void;
};

export const TeamMemberPopover: React.FC<TeamMemberPopoverProps> = ({
  member,
  onMemberRemoved,
  onMemberRoleChanged
}) => {
  const [openChangeRoleDialog, setOpenChangeRoleDialog] = useState(false);
  const [openRemoveMemberDialog, setOpenRemoveMemberDialog] = useState(false);

  return (
    <Fragment>
      <Popover.Root>
        <Popover.Trigger>
          <IconButton variant="ghost" color="gray">
            <DotsHorizontalIcon />
          </IconButton>
        </Popover.Trigger>
        <Popover.Content
          side="bottom"
          size="1"
          style={{
            padding: 0,
            minWidth: '100px',
            borderRadius: 'var(--radius-2)'
          }}
        >
          <Flex direction="column" gap="1" p={'2'} justify="start">
            <Button
              size="2"
              variant="ghost"
              color="gray"
              mx="1"
              style={{ justifyContent: 'flex-start' }}
              onClick={() => setOpenChangeRoleDialog(true)}
            >
              Change Role
            </Button>
          </Flex>
          <Flex direction="column" gap="1" p={'2'} pt={'0'} justify="start">
            <Button
              size="2"
              variant="ghost"
              color="gray"
              mx="1"
              style={{ justifyContent: 'flex-start' }}
              onClick={() => setOpenRemoveMemberDialog(true)}
            >
              Remove member
            </Button>
          </Flex>
        </Popover.Content>
      </Popover.Root>
      <ChangeRoleDialog
        open={openChangeRoleDialog}
        setOpen={setOpenChangeRoleDialog}
        member={member}
        onMemberRoleChanged={onMemberRoleChanged}
      />
      <RemoveMemberDialog
        open={openRemoveMemberDialog}
        setOpen={setOpenRemoveMemberDialog}
        member={member}
        onMemberRemoved={onMemberRemoved}
      />
    </Fragment>
  );
};
