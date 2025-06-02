import { Box, Code, Flex, Heading, Link as RadixLink } from '@radix-ui/themes';
import { Link } from 'react-router-dom';
import { SUPPORT_EMAIL } from '../utils/constants';

export const InternalErrorPage: React.FC = () => {
  return (
    <Flex direction="column" justify="center" align="center" height="100vh">
      <main>
        <Flex direction="column" justify="center" align="center" gap="2">
          <Box>
            <Code color="red">500</Code>
          </Box>
          <Heading as="h1" size="7" weight="regular">
            Internal Server Error
          </Heading>
          <Box>
            <RadixLink underline="hover" color="gray" asChild>
              <Link
                to="#"
                onClick={() => {
                  window.location.replace(SUPPORT_EMAIL);
                }}
              >
                Contact support →
              </Link>
            </RadixLink>
          </Box>
        </Flex>
      </main>
    </Flex>
  );
};
