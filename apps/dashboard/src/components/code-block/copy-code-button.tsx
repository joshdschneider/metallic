import { CheckIcon, ClipboardIcon } from '@radix-ui/react-icons';
import { IconButton } from '@radix-ui/themes';
import copy from 'copy-to-clipboard';
import * as React from 'react';

type CopyCodeButtonProps = {
  code: string;
} & React.ComponentProps<typeof IconButton>;

export const CopyCodeButton = ({ code, ...props }: CopyCodeButtonProps) => {
  const [hasCopied, setHasCopied] = React.useState(false);

  React.useEffect(() => {
    if (hasCopied) setTimeout(() => setHasCopied(false), 1500);
  }, [hasCopied]);

  return (
    <IconButton
      aria-label="Copy code to clipboard"
      onClick={() => {
        copy(code);
        setHasCopied(true);
      }}
      radius="large"
      {...props}
      mt="3"
      mr="3"
      color="gray"
      variant="soft"
      style={{
        position: 'absolute',
        top: '0',
        right: '0'
      }}
    >
      {hasCopied ? <CheckIcon /> : <ClipboardIcon />}
    </IconButton>
  );
};
