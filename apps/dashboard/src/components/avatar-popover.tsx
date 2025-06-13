import { Avatar, Button, Flex, IconButton, Popover, Separator, Skeleton, Text } from '@radix-ui/themes';
import { Fragment } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/use-auth';
import { useSubscriptions } from '../hooks/use-subscriptions';
import { getUserAvatarFallback, getUserName } from '../utils/helpers';

export const AvatarPopover: React.FC = () => {
  const { loading, user, logout } = useAuth();
  const { plan } = useSubscriptions();
  const navigate = useNavigate();

  if (loading) {
    return (
      <Skeleton>
        <IconButton size="1" variant="ghost" color="gray" radius="full">
          <Avatar variant="solid" color="blue" size="1" fallback="?" />
        </IconButton>
      </Skeleton>
    );
  }

  if (!user) {
    return (
      <IconButton size="1" variant="ghost" color="gray" radius="full">
        <Avatar variant="solid" color="blue" size="1" fallback="?" />
      </IconButton>
    );
  }

  return (
    <Popover.Root>
      <Popover.Trigger>
        <Flex position="relative">
          <IconButton size="1" variant="ghost" color="gray" radius="full">
            <Avatar
              variant="solid"
              color="blue"
              size="1"
              src={user.profile_picture_url || undefined}
              fallback={getUserAvatarFallback(user)}
            />
          </IconButton>
        </Flex>
      </Popover.Trigger>
      <Popover.Content
        side="bottom"
        size="1"
        style={{
          padding: 0,
          minWidth: '120px',
          borderRadius: 'var(--radius-2)'
        }}
      >
        <Flex direction="column" gap="1" p={'2'} mx="1">
          {(user.first_name || user.last_name) && (
            <Text size="2" weight="medium">
              {getUserName(user)}
            </Text>
          )}
          <Text size="2" color="gray">
            {user.email}
          </Text>
        </Flex>
        <Separator size="4" />
        <Flex direction="column" gap="1" p={'2'} justify="start">
          <Button
            size="2"
            variant="ghost"
            color="gray"
            mx="1"
            style={{ justifyContent: 'flex-start' }}
            onClick={() => navigate('/profile')}
          >
            Profile
          </Button>
        </Flex>
        <Flex direction="column" gap="1" p={'2'} pt={'0'} justify="start">
          <Button
            size="2"
            variant="ghost"
            color="gray"
            mx="1"
            style={{ justifyContent: 'flex-start' }}
            onClick={() => navigate('/team')}
          >
            Team
          </Button>
        </Flex>
        <Flex direction="column" gap="1" p={'2'} pt={'0'} justify="start">
          <Button
            size="2"
            variant="ghost"
            color="gray"
            mx="1"
            style={{ justifyContent: 'flex-start' }}
            onClick={() => navigate('/billing')}
          >
            Billing
          </Button>
        </Flex>
        <Separator size="4" />
        {['free', 'developer'].includes(plan) && (
          <Fragment>
            <Flex direction="column" gap="1" p={'2'} justify="center">
              <Button
                size="2"
                variant="soft"
                color="blue"
                highContrast
                style={{ justifyContent: 'center' }}
                onClick={() => navigate('/billing/plans')}
              >
                Upgrade plan
              </Button>
            </Flex>
            <Separator size="4" />
          </Fragment>
        )}
        <Flex direction="column" gap="1" p={'2'} justify="start">
          <Button
            size="2"
            variant="ghost"
            color="gray"
            mx="1"
            style={{ justifyContent: 'flex-start' }}
            onClick={logout}
          >
            Sign Out
          </Button>
        </Flex>
      </Popover.Content>
    </Popover.Root>
  );
};
