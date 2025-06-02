import { Flex, Spinner } from '@radix-ui/themes';

export const Loading: React.FC = () => {
  return (
    <Flex direction="column" justify="center" align="center" width="100%" height="100vh">
      <Spinner size="3" />
    </Flex>
  );
};
