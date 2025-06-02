import { Box, Code, Flex, Heading, Link as RadixLink } from '@radix-ui/themes';
import { Link } from 'react-router-dom';

export const NotFoundPage: React.FC = () => {
  return (
    <Flex direction="column" justify="center" align="center" height="100vh">
      <main>
        <Flex direction="column" justify="center" align="center" gap="2">
          <Box>
            <Code color="orange">404</Code>
          </Box>
          <Heading as="h1" size="7" weight="regular">
            Page not found
          </Heading>
          <Box>
            <RadixLink underline="hover" color="gray" asChild>
              <Link to="/">← Back to home</Link>
            </RadixLink>
          </Box>
        </Flex>
      </main>
    </Flex>
  );
};
