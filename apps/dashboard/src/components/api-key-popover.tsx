import { ApiKeyObject } from '@metallichq/types';
import { DotsHorizontalIcon } from '@radix-ui/react-icons';
import { Button, Flex, IconButton, Popover } from '@radix-ui/themes';
import React, { Fragment, useState } from 'react';
import { RevealApiKeyDialog } from './reveal-api-key-dialog';

export type ApiKeyPopoverProps = {
  apiKey: ApiKeyObject;
};

export const ApiKeyPopover: React.FC<ApiKeyPopoverProps> = ({ apiKey }) => {
  const [openRevealDialog, setOpenRevealDialog] = useState(false);

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
              onClick={() => setOpenRevealDialog(true)}
            >
              Reveal Key
            </Button>
          </Flex>
          <Flex direction="column" gap="1" p={'2'} pt={'0'} justify="start">
            <Button size="2" variant="ghost" color="gray" mx="1" style={{ justifyContent: 'flex-start' }}>
              Roll Key
            </Button>
          </Flex>
        </Popover.Content>
      </Popover.Root>
      <RevealApiKeyDialog open={openRevealDialog} setOpen={setOpenRevealDialog} apiKey={apiKey} />
    </Fragment>
  );
};
