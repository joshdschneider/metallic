import { InvitationObject } from '@metallichq/types';
import { Box, Button, Card, Code, Flex, Heading, Link as RadixLink, Text, TextField } from '@radix-ui/themes';
import { FormEventHandler, useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Loading } from '../components/loading';
import { useToast } from '../hooks/use-toast';
import { acceptInvitation } from '../lib/accept-invitation';
import { getInvitationByToken } from '../lib/get-invitation-by-token';
import { captureException } from '../utils/error';

export const AcceptInvitePage: React.FC = () => {
  const { toastError } = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const invitationToken = new URLSearchParams(location.search).get('invitation_token');
  const [invitation, setInvitation] = useState<InvitationObject | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [acceptLoading, setAcceptLoading] = useState(false);

  useEffect(() => {
    let mounted = true;
    if (!invitationToken) {
      setError('No invitation token found');
      setLoading(false);
      return;
    }

    getInvitationByToken(invitationToken)
      .then((invitation) => {
        if (mounted) {
          setInvitation(invitation);
        }
      })
      .catch((err) => {
        if (mounted) {
          captureException(err);
          setError('Failed to get invitation');
        }
      })
      .finally(() => {
        if (mounted) {
          setLoading(false);
        }
      });

    return () => {
      mounted = false;
    };
  }, [invitationToken, navigate]);

  const handleSubmit: FormEventHandler<HTMLFormElement> = async (e) => {
    e.preventDefault();
    if (!invitation) {
      toastError();
      return;
    }

    setAcceptLoading(true);
    try {
      await acceptInvitation(invitation.id);
      const encodedEmail = encodeURIComponent(invitation.email);
      navigate('/verify-code?email=' + encodedEmail);
    } catch (err) {
      toastError();
      captureException(err);
    } finally {
      setAcceptLoading(false);
    }
  };

  if (loading) {
    return <Loading />;
  }

  if (error || !invitation) {
    return (
      <Flex direction="column" justify="center" align="center" height="100vh">
        <main>
          <Flex direction="column" justify="center" align="center" gap="2">
            <Box>
              <Code color="orange">400</Code>
            </Box>
            <Heading as="h1" size="7" weight="regular">
              Invalid invitation
            </Heading>
            <Box>
              <RadixLink underline="hover" color="gray" asChild>
                <Link to="/">← Back to login</Link>
              </RadixLink>
            </Box>
          </Flex>
        </main>
      </Flex>
    );
  }

  return (
    <Flex direction="column" justify="center" align="center" width="100vw" height="100vh">
      <Flex justify="center" align="center" gap="2" mb="5">
        <img src="/logo.png" alt="Logo" style={{ width: '32px', height: '32px' }} />
      </Flex>
      <Card style={{ width: '100%', maxWidth: '325px', padding: 'var(--space-4)' }}>
        <Flex direction="column" gap="3" asChild>
          <form onSubmit={handleSubmit}>
            <Flex direction="column" asChild gap="2">
              <label>
                <Text size="2" color="gray" highContrast>
                  Email address
                </Text>
                <TextField.Root name="email" type="email" value={invitation.email} disabled />
              </label>
            </Flex>
            <Button
              type="submit"
              color="gray"
              variant="surface"
              style={{ width: '100%' }}
              highContrast
              loading={acceptLoading}
            >
              Accept invitation
            </Button>
          </form>
        </Flex>
      </Card>
    </Flex>
  );
};
