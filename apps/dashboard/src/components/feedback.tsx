import { Button, Flex, Popover, TextArea } from '@radix-ui/themes';
import { useState } from 'react';
import { useToast } from '../hooks/use-toast';
import { captureException } from '../utils/error';

export function Feedback() {
  const [open, setOpen] = useState(false);
  const [feedback, setFeedback] = useState('');
  const [loading, setLoading] = useState(false);
  const { toastError } = useToast();

  async function send() {
    setLoading(true);
    try {
      // send feedback
    } catch (err) {
      captureException(err);
      toastError('Failed to send feedback');
    } finally {
      setLoading(false);
      setFeedback('');
      setOpen(false);
    }
  }

  return (
    <Popover.Root open={open} onOpenChange={(val) => setOpen(val)}>
      <Popover.Trigger>
        <Button size="2" variant="outline" color="gray">
          Feedback
        </Button>
      </Popover.Trigger>
      <Popover.Content style={{ width: 300 }} align="center" side="bottom" size="1">
        <Flex direction="column" gap="3">
          <TextArea
            placeholder="Help us improve..."
            style={{ height: 80 }}
            size="2"
            color="blue"
            value={feedback}
            onChange={(e) => setFeedback(e.target.value)}
          />
          <Flex justify="end" gap="2">
            <Popover.Close>
              <Button size="1" variant="outline" color="gray">
                Cancel
              </Button>
            </Popover.Close>
            <Button size="1" color="blue" onClick={send} loading={loading}>
              Send
            </Button>
          </Flex>
        </Flex>
      </Popover.Content>
    </Popover.Root>
  );
}
