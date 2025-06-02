import { UserObject } from '@metallichq/types';
import {
  Badge,
  Box,
  Button,
  Card,
  Checkbox,
  Flex,
  Grid,
  Heading,
  Link as RadixLink,
  Text,
  TextField
} from '@radix-ui/themes';
import { useEffect, useState } from 'react';
import { Layout } from '../components/layout';
import { useAuth } from '../hooks/use-auth';
import { useToast } from '../hooks/use-toast';
import { updateUser } from '../lib/update-user';
import { captureException } from '../utils/error';
import { InternalErrorPage } from './internal-error-page';

export const ProfilePage: React.FC = () => {
  const { user, setUser } = useAuth();
  const [firstName, setFirstName] = useState(user?.first_name || '');
  const [lastName, setLastName] = useState(user?.last_name || '');
  const [didChange, setDidChange] = useState(false);
  const [loading, setLoading] = useState(false);
  const { toastSuccess, toastError } = useToast();

  useEffect(() => {
    if (!user) {
      return;
    }

    let didChange = false;
    if (firstName !== (user.first_name || '')) {
      didChange = true;
    }

    if (lastName !== (user.last_name || '')) {
      didChange = true;
    }

    setDidChange(didChange);
  }, [firstName, lastName, user]);

  async function update() {
    if (!user) {
      toastError();
      return;
    }

    setLoading(true);
    try {
      const updatedUser = await updateUser(user.id, {
        firstName,
        lastName
      });

      setUser(updatedUser);
      setFirstName(updatedUser.first_name || '');
      setLastName(updatedUser.last_name || '');
      toastSuccess('Profile updated');
    } catch (err) {
      captureException(err);
      toastError('Failed to update profile');
    } finally {
      setLoading(false);
    }
  }

  if (!user) {
    return <InternalErrorPage />;
  }

  return (
    <Layout>
      <Box py="9" px="5" style={{ margin: '0px auto', maxWidth: '68rem' }}>
        <Flex align="center" justify="between" mb="5" style={{ minHeight: 'var(--space-5)' }}>
          <Heading as="h2" size="6" weight="medium">
            Profile
          </Heading>
        </Flex>
        <Flex direction="column" justify="start" gap="6">
          <Card variant="surface" size="3">
            <Heading size="3" weight="medium" mb="4">
              Profile details
            </Heading>
            <Box>
              <Grid
                gap="4"
                style={{
                  maxWidth: '768px',
                  gridTemplateColumns: '180px 1fr'
                }}
              >
                <label htmlFor="first_name">
                  <Text as="span" size="2" color="gray">
                    First name
                  </Text>
                </label>
                <Flex justify="start" direction="column" gap="2">
                  <TextField.Root
                    id="first_name"
                    variant="classic"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                  />
                </Flex>
                <label htmlFor="last_name">
                  <Text as="span" size="2" color="gray">
                    Last name
                  </Text>
                </label>
                <Flex justify="start" direction="column" gap="2">
                  <TextField.Root
                    id="last_name"
                    variant="classic"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                  />
                </Flex>
                <label htmlFor="email">
                  <Text as="span" size="2" color="gray">
                    Email
                  </Text>
                </label>
                <Flex justify="start" direction="column" gap="2">
                  <TextField.Root id="email" variant="classic" value={user.email} readOnly />
                  <Text size="1">
                    {`If you'd like to change your email, please `}
                    <RadixLink href="mailto:support@metallic.dev?subject=I need to change my email">
                      contact support
                    </RadixLink>
                    {'.'}
                  </Text>
                </Flex>
              </Grid>
              <Button mt="4" disabled={!didChange} onClick={update} loading={loading}>
                Update Profile
              </Button>
            </Box>
          </Card>
          <EmailNotifications user={user} setUser={setUser} />
        </Flex>
      </Box>
    </Layout>
  );
};

interface EmailNotificationsProps {
  user: UserObject;
  setUser: (user: UserObject) => void;
}

function EmailNotifications({ user, setUser }: EmailNotificationsProps) {
  const [emailSubscriptions, setEmailSubscriptions] = useState(user.email_subscriptions);
  const [didChange, setDidChange] = useState(false);
  const [loading, setLoading] = useState(false);
  const { toastSuccess, toastError } = useToast();

  useEffect(() => {
    let didChange = false;
    if (JSON.stringify(emailSubscriptions.sort()) !== JSON.stringify(user.email_subscriptions.sort())) {
      didChange = true;
    }

    setDidChange(didChange);
  }, [emailSubscriptions, user.email_subscriptions]);

  async function update() {
    setLoading(true);
    try {
      const updatedUser = await updateUser(user.id, { emailSubscriptions });
      setUser(updatedUser);
      setEmailSubscriptions(updatedUser.email_subscriptions);
      toastSuccess('Email notifications updated');
    } catch (err) {
      captureException(err);
      toastError();
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card variant="surface" size="3">
      <Heading size="3" weight="medium" mb="2">
        Email notifications
      </Heading>
      <Box>
        <Text as="p" size="2" mb="4" color="gray">
          What types of activity notifications would you like to receive?
        </Text>
        <div className="space-y-4">
          <Flex justify="start" gap="2">
            <Checkbox
              id="product"
              checked={emailSubscriptions.includes('product')}
              onCheckedChange={(checked) => {
                setEmailSubscriptions(
                  checked ? [...emailSubscriptions, 'product'] : emailSubscriptions.filter((s) => s !== 'product')
                );
              }}
            />
            <label htmlFor="product">
              <Flex align="center" justify="start" gap="2">
                <Text as="span" size="2" weight="medium">
                  News & updates
                </Text>
              </Flex>
              <Text size="1" color="gray">
                Emails relating to new features and product updates.
              </Text>
            </label>
          </Flex>

          <Flex justify="start" gap="2">
            <Checkbox defaultChecked disabled />
            <label>
              <Flex align="center" justify="start" gap="2">
                <Text as="span" size="2" weight="medium">
                  Security notifications
                </Text>
                <Badge size="1" color="gray" radius="full">
                  Required
                </Badge>
              </Flex>
              <Text size="1" color="gray">
                Emails relating to your workspace and new team members.
              </Text>
            </label>
          </Flex>

          <Flex justify="start" gap="2">
            <Checkbox defaultChecked disabled />
            <label>
              <Flex align="center" justify="start" gap="2">
                <Text as="span" size="2" weight="medium">
                  Billing notifications
                </Text>
                <Badge size="1" color="gray" radius="full">
                  Required
                </Badge>
              </Flex>
              <Text size="1" color="gray">
                Emails relating to plan and payments.
              </Text>
            </label>
          </Flex>
        </div>
        <Button mt="4" disabled={!didChange} onClick={update} loading={loading}>
          Update Profile
        </Button>
      </Box>
    </Card>
  );
}
