import { Flex, Link as RadixLink, Text } from '@radix-ui/themes';
import React from 'react';
import { Link } from 'react-router-dom';

export type Breadcrumb = {
  label: string;
  href?: string;
};

export type BreadcrumbsProps = {
  breadcrumbs: Breadcrumb[];
};

export const Breadcrumbs = ({ breadcrumbs }: BreadcrumbsProps) => {
  return (
    <Flex
      align="center"
      justify="start"
      gap="2"
      style={{
        flexShrink: '1',
        textOverflow: 'ellipsis',
        overflow: 'hidden',
        whiteSpace: 'nowrap'
      }}
    >
      {breadcrumbs.map((breadcrumb, i) => {
        if (breadcrumb.href) {
          return (
            <React.Fragment key={i}>
              <div
                style={{
                  flexShrink: '1',
                  textOverflow: 'ellipsis',
                  overflow: 'hidden',
                  whiteSpace: 'nowrap'
                }}
              >
                <RadixLink size="2" underline="auto" asChild>
                  <Link to={breadcrumb.href}>{breadcrumb.label}</Link>
                </RadixLink>
              </div>
              <Text size="2" style={{ userSelect: 'none', color: 'var(--gray-a7)' }}>{`/`}</Text>
            </React.Fragment>
          );
        }

        return (
          <div key={i}>
            <Text size="2" color="gray">
              {breadcrumb.label}
            </Text>
          </div>
        );
      })}
    </Flex>
  );
};
