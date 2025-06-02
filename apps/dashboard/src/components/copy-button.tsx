import { CheckIcon, CopyIcon } from '@radix-ui/react-icons';
import { IconButton, Tooltip } from '@radix-ui/themes';
import copy from 'copy-to-clipboard';
import * as React from 'react';

export type CopyButtonProps = {
  content: string;
} & React.ComponentProps<typeof IconButton>;

export const CopyButton = ({ content, ...props }: CopyButtonProps) => {
  const [hasCopied, setHasCopied] = React.useState(false);

  React.useEffect(() => {
    if (hasCopied) {
      setTimeout(() => setHasCopied(false), 1500);
    }
  }, [hasCopied]);

  return (
    <Tooltip content={'Copy'} side="top">
      <IconButton
        aria-label="Copy code to clipboard"
        onClick={() => {
          copy(content);
          setHasCopied(true);
        }}
        {...props}
        color="gray"
        variant="ghost"
      >
        {hasCopied ? <CheckIcon /> : <CopyIcon />}
      </IconButton>
    </Tooltip>
  );
};
