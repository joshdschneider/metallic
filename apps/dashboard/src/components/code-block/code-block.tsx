import { toHtml } from 'hast-util-to-html';
import rangeParser from 'parse-numeric-range';
import React from 'react';
import { refractor } from 'refractor';
import bash from 'refractor/lang/bash';
import css from 'refractor/lang/css';
import diff from 'refractor/lang/diff';
import js from 'refractor/lang/javascript';
import jsx from 'refractor/lang/jsx';
import python from 'refractor/lang/python';
import highlightLine from '../../lib/highlight-line';
import highlightWord from '../../lib/highlight-word';
import { CopyCodeButton } from './copy-code-button';
import { Pre } from './pre';

import styles from './code-block.module.css';

refractor.register(js);
refractor.register(jsx);
refractor.register(python);
refractor.register(bash);
refractor.register(css);
refractor.register(diff);

type PreProps = Omit<React.ComponentProps<typeof Pre>, 'css'>;

type CodeBlockProps = PreProps & {
  language: 'js' | 'jsx' | 'bash' | 'css' | 'python' | 'diff';
  value: string;
  line?: string;
  isInteractive?: boolean;
  showLineNumbers?: boolean;
  showCopyCodeButton?: boolean;
};

export const CodeBlock = React.forwardRef<HTMLPreElement, CodeBlockProps>((_props, forwardedRef) => {
  const {
    language,
    value,
    line = '0',
    className = '',
    style,
    showLineNumbers = true,
    showCopyCodeButton = true,
    isInteractive,
    ...props
  } = _props;

  let result: any;
  result = refractor.highlight(value, language);
  result = highlightLine(result, rangeParser(line));
  result = highlightWord(result);

  const resultString = toHtml(result);
  const classes = `language-${language} ${className}`;

  return (
    <>
      <Pre
        ref={forwardedRef}
        className={`${styles.Container} ${classes}`}
        style={style}
        data-line-numbers={showLineNumbers}
        {...props}
      >
        <code
          className={classes}
          dangerouslySetInnerHTML={{ __html: resultString }}
          style={
            isInteractive
              ? {
                  willChange: 'transform',
                  transition: 'transform 200ms ease-in-out'
                }
              : {}
          }
        />
      </Pre>
      {showCopyCodeButton && <CopyCodeButton code={value} className={styles.CopyButton} />}
    </>
  );
});

CodeBlock.displayName = 'CodeBlock';
