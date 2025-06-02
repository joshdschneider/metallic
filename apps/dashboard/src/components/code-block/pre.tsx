import { createContext } from '@radix-ui/react-context';
import { Box } from '@radix-ui/themes';
import * as React from 'react';
import { classnames } from '../../lib/classnames';
import styles from './pre.module.css';

const [SyntaxSchemeProvider, useSyntaxSchemeContext] = createContext<{
  scheme: 'blue';
}>('SyntaxScheme');

type PreProps = React.ComponentPropsWithoutRef<typeof Box> & React.ComponentPropsWithoutRef<'pre'>;

const Pre = React.forwardRef<HTMLPreElement, PreProps>(function Pre({ className, children, ...props }, forwardedRef) {
  const { scheme } = useSyntaxSchemeContext('Pre');

  return (
    <Box asChild {...props}>
      <pre ref={forwardedRef} className={classnames(styles.Pre, styles[scheme], className)}>
        {children}
      </pre>
    </Box>
  );
});

export { Pre, SyntaxSchemeProvider };
