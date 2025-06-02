import { Button, Card, Flex, Separator, Text, TextField } from '@radix-ui/themes';
import { FormEventHandler, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/use-auth';
import { useToast } from '../hooks/use-toast';
import { captureException } from '../utils/error';

export const SignInPage: React.FC = () => {
  const { getOauthUrl, sendCode } = useAuth();
  const { toastError } = useToast();
  const navigate = useNavigate();
  const [emailLoading, setEmailLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [googleLoading, setGoogleLoading] = useState(false);

  const handleEmailAuth: FormEventHandler<HTMLFormElement> = async (e) => {
    e.preventDefault();
    if (!email) {
      toastError('Please enter an email address');
      return;
    }

    setEmailLoading(true);
    try {
      await sendCode(email);
      const encodedEmail = encodeURIComponent(email);
      navigate('/verify-code?email=' + encodedEmail);
    } catch (err) {
      toastError();
      captureException(err);
    } finally {
      setEmailLoading(false);
    }
  };

  const handleGoogleOauth = async () => {
    setGoogleLoading(true);
    try {
      const url = await getOauthUrl('google');
      window.location.href = url;
    } catch (err) {
      toastError();
      captureException(err);
      setGoogleLoading(false);
    }
  };

  return (
    <Flex direction="column" justify="center" align="center" width="100vw" height="100vh">
      <Flex justify="center" align="center" gap="2" mb="5">
        <img src="/logo.png" alt="Logo" style={{ width: '32px', height: '32px' }} />
      </Flex>
      <Card style={{ width: '100%', maxWidth: '325px', padding: 'var(--space-4)' }}>
        <Flex direction="column" gap="3" asChild>
          <form onSubmit={handleEmailAuth}>
            <Flex direction="column" asChild gap="2">
              <label>
                <Text size="2" color="gray" highContrast>
                  Email address
                </Text>
                <TextField.Root
                  name="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </label>
            </Flex>
            <Button
              type="submit"
              color="gray"
              variant="surface"
              loading={emailLoading}
              style={{ width: '100%' }}
              highContrast
            >
              Continue with Email
            </Button>
          </form>
        </Flex>
        <Separator my="4" size="4" />
        <Button
          onClick={handleGoogleOauth}
          loading={googleLoading}
          variant="surface"
          color="gray"
          highContrast
          style={{ width: '100%', marginBottom: 'var(--space-1)' }}
        >
          <Flex align="center" justify="start" width="100%">
            <img src="/google.svg" alt="Google" style={{ width: '16px', height: '16px' }} />
            <Flex align="center" justify="center" style={{ paddingRight: '16px' }} width="100%">
              <span>Sign in with Google</span>
            </Flex>
          </Flex>
        </Button>
      </Card>
    </Flex>
  );
};
