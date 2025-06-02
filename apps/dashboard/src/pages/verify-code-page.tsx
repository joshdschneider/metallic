import { Button, Card, Flex, Text, TextField } from '@radix-ui/themes';
import { FormEventHandler, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/use-auth';
import { useToast } from '../hooks/use-toast';
import { captureException } from '../utils/error';

export const VerifyCodePage: React.FC = () => {
  const { verifyCode } = useAuth();
  const { toastError } = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const email = new URLSearchParams(location.search).get('email');
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit: FormEventHandler<HTMLFormElement> = async (e) => {
    e.preventDefault();
    if (!email) {
      toastError();
      return;
    } else if (!code) {
      toastError('Please enter a code');
      return;
    } else if (code.length !== 6) {
      toastError('Code must be 6 digits');
      return;
    }

    setLoading(true);
    try {
      await verifyCode(email, code);
      navigate('/');
    } catch (err) {
      toastError();
      captureException(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Flex direction="column" justify="center" align="center" width="100vw" height="100vh">
      <Card style={{ width: '100%', maxWidth: '325px', padding: 'var(--space-4)' }}>
        <Flex direction="column" gap="3" asChild>
          <form onSubmit={handleSubmit}>
            <Flex direction="column" asChild gap="2">
              <label>
                <Text size="2" color="gray" highContrast>
                  Enter the 6-digit code sent to your email
                </Text>
                <TextField.Root
                  name="code"
                  type="text"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  required
                />
              </label>
            </Flex>
            <Button type="submit" loading={loading} style={{ width: '100%' }}>
              Verify code
            </Button>
          </form>
        </Flex>
      </Card>
    </Flex>
  );
};
