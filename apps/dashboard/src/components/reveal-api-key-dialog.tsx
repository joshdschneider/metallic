import { ApiKeyObject } from '@metallichq/types';
import { Button, Dialog, Flex, Heading, Text, TextField, VisuallyHidden } from '@radix-ui/themes';
import { CopyButton } from './copy-button';

export type RevealApiKeyDialogProps = {
  open: boolean;
  setOpen: (open: boolean) => void;
  apiKey: ApiKeyObject;
};

export function RevealApiKeyDialog({ open, setOpen, apiKey }: RevealApiKeyDialogProps) {
  return (
    <Dialog.Root open={open} onOpenChange={(open) => setOpen(open)}>
      <VisuallyHidden>
        <Dialog.Title>{'API Key'}</Dialog.Title>
      </VisuallyHidden>
      <VisuallyHidden>
        <Dialog.Description>{`Your API key is revealed below.`}</Dialog.Description>
      </VisuallyHidden>
      <Dialog.Content width="400px">
        <Flex direction="column" justify="start" gap="4" width="100%">
          <Flex direction="column" gap="2">
            <Heading as="h3" size="4">
              {'API Key'}
            </Heading>
            <Text size="2" color="gray">
              {`Your API key should be stored securely (such as in an environment variable or credential management system) and should never be exposed publicly.`}
            </Text>
          </Flex>
          <label>
            <TextField.Root readOnly value={apiKey.key}>
              <TextField.Slot side="right">
                <CopyButton content={apiKey.key} />
              </TextField.Slot>
            </TextField.Root>
          </label>
          <Flex align="center" justify="end" gap="3" mt="2">
            <Button variant="outline" color="gray" onClick={() => setOpen(false)}>
              Close
            </Button>
          </Flex>
        </Flex>
      </Dialog.Content>
    </Dialog.Root>
  );
}
