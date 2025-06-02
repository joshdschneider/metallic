import { InvitationObject } from '@metallichq/types';
import { DotsHorizontalIcon } from '@radix-ui/react-icons';
import { Button, Flex, IconButton, Popover } from '@radix-ui/themes';
import { useState } from 'react';
import { Fragment } from 'react/jsx-runtime';
import { RevokeInvitationDialog } from './revoke-invitation-dialog';

export type InvitationPopoverProps = {
  invitation: InvitationObject;
  removeInvitation: (invitationId: string) => void;
};

export const InvitationPopover: React.FC<InvitationPopoverProps> = ({ invitation, removeInvitation }) => {
  const [openRevokeInvitationDialog, setOpenRevokeInvitationDialog] = useState(false);

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
              onClick={() => setOpenRevokeInvitationDialog(true)}
            >
              Revoke Invitation
            </Button>
          </Flex>
        </Popover.Content>
      </Popover.Root>
      <RevokeInvitationDialog
        open={openRevokeInvitationDialog}
        setOpen={setOpenRevokeInvitationDialog}
        invitation={invitation}
        removeInvitation={removeInvitation}
      />
    </Fragment>
  );
};
