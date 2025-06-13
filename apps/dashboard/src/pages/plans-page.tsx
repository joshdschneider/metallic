import { PaymentMethodObject, SubscriptionObject } from '@metallichq/types';
import { CheckIcon } from '@radix-ui/react-icons';
import {
  Box,
  Button,
  Card,
  Code,
  Dialog,
  Flex,
  Grid,
  Heading,
  Link as RadixLink,
  Skeleton,
  Text,
  VisuallyHidden
} from '@radix-ui/themes';
import { Elements, PaymentElement, useElements, useStripe } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import { useTheme } from 'next-themes';
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Layout } from '../components/layout';
import { useOrganizations } from '../hooks/use-organizations';
import { useToast } from '../hooks/use-toast';
import { addPaymentMethod } from '../lib/add-payment-method';
import { createSubscription } from '../lib/create-subscription';
import { downgradeSubscription } from '../lib/downgrade-subscription';
import { listPaymentMethods } from '../lib/list-payment-methods';
import { listSubscriptions } from '../lib/list-subscriptions';
import { setupPaymentMethod } from '../lib/setup-payment-method';
import { upgradeSubscription } from '../lib/upgrade-subscription';
import { captureException } from '../utils/error';

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY);

export default function PlansPage() {
  const { selectedOrganizationId } = useOrganizations();
  const { resolvedTheme } = useTheme();

  const [subscriptions, setSubscriptions] = useState<SubscriptionObject[]>([]);
  const [subscriptionsLoading, setSubscriptionsLoading] = useState(false);
  const [subscriptionsError, setSubscriptionsError] = useState<string | null>(null);
  const activeSubscription: SubscriptionObject | undefined = subscriptions.find((s) =>
    ['active', 'past_due'].includes(s.status)
  );

  const [paymentMethods, setPaymentMethods] = useState<PaymentMethodObject[]>([]);
  const [paymentMethodsLoading, setPaymentMethodsLoading] = useState(false);
  const [paymentMethodsError, setPaymentMethodsError] = useState<string | null>(null);
  const defaultPaymentMethod: PaymentMethodObject | undefined = paymentMethods.find((p) => p.is_default);

  const [showStartPlanDialog, setShowStartPlanDialog] = useState(false);
  const [startPlan, setStartPlan] = useState<'developer' | 'team' | undefined>(undefined);
  const [showUpgradePlanDialog, setShowUpgradePlanDialog] = useState(false);
  const [upgradePlan, setUpgradePlan] = useState<'developer' | 'team' | undefined>(undefined);
  const [showDowngradePlanDialog, setShowDowngradePlanDialog] = useState(false);
  const [downgradePlan, setDowngradePlan] = useState<'free' | 'developer' | undefined>(undefined);

  useEffect(() => {
    let mounted = true;
    if (!selectedOrganizationId) {
      return;
    }

    setSubscriptionsLoading(true);
    listSubscriptions(selectedOrganizationId)
      .then((data) => {
        if (mounted) {
          setSubscriptions(data.data);
        }
      })
      .catch((err) => {
        if (mounted) {
          setSubscriptionsError('Failed to load templates');
          captureException(err);
        }
      })
      .finally(() => {
        if (mounted) {
          setSubscriptionsLoading(false);
        }
      });

    return () => {
      mounted = false;
    };
  }, [selectedOrganizationId]);

  useEffect(() => {
    let mounted = true;
    if (!selectedOrganizationId) {
      return;
    }

    setPaymentMethodsLoading(true);
    listPaymentMethods(selectedOrganizationId)
      .then((data) => {
        if (mounted) {
          setPaymentMethods(data.data);
        }
      })
      .catch((err) => {
        if (mounted) {
          setPaymentMethodsError('Failed to load payment methods');
          captureException(err);
        }
      })
      .finally(() => {
        if (mounted) {
          setPaymentMethodsLoading(false);
        }
      });

    return () => {
      mounted = false;
    };
  }, [selectedOrganizationId]);

  const loadingButton = (
    <Skeleton loading>
      <Button variant="soft" color="gray" highContrast style={{ width: '100%', height: '36px' }}>
        Loading...
      </Button>
    </Skeleton>
  );

  const currentPlanButton = (
    <Button variant="solid" color="gray" style={{ width: '100%', height: '36px', cursor: 'not-allowed' }} disabled>
      Your current plan
    </Button>
  );

  function getFreePlanButton() {
    if (subscriptionsLoading) {
      return loadingButton;
    } else if (subscriptionsError) {
      return null;
    }

    if (!activeSubscription || activeSubscription?.plan === 'free') {
      return currentPlanButton;
    }

    if (activeSubscription.plan === 'enterprise') {
      return null;
    }

    return (
      <Button
        variant="soft"
        color="gray"
        highContrast
        style={{ width: '100%', height: '36px' }}
        onClick={() => downgradeToPlan('free')}
      >
        Downgrade to free
      </Button>
    );
  }

  function getDeveloperPlanButton() {
    if (subscriptionsLoading || paymentMethodsLoading) {
      return loadingButton;
    } else if (subscriptionsError || paymentMethodsError) {
      return null;
    }

    if (!activeSubscription || activeSubscription?.plan === 'free') {
      return (
        <Button variant="solid" style={{ width: '100%', height: '36px' }} onClick={() => upgradeToPlan('developer')}>
          Upgrade to developer
        </Button>
      );
    }

    if (activeSubscription.plan === 'enterprise') {
      return null;
    }

    if (activeSubscription.plan === 'developer') {
      return currentPlanButton;
    }

    return (
      <Button
        variant="soft"
        color="gray"
        highContrast
        style={{ width: '100%', height: '36px' }}
        onClick={() => downgradeToPlan('developer')}
      >
        Downgrade to developer
      </Button>
    );
  }

  function getTeamPlanButton() {
    if (subscriptionsLoading || paymentMethodsLoading) {
      return loadingButton;
    } else if (subscriptionsError || paymentMethodsError) {
      return null;
    }

    if (activeSubscription?.plan === 'team') {
      return currentPlanButton;
    }

    if (activeSubscription?.plan === 'enterprise') {
      return null;
    }

    return (
      <Button variant="solid" style={{ width: '100%', height: '36px' }} onClick={() => upgradeToPlan('team')}>
        Upgrade to team
      </Button>
    );
  }

  function upgradeToPlan(plan: 'developer' | 'team') {
    if (!defaultPaymentMethod) {
      setStartPlan(plan);
      setShowStartPlanDialog(true);
    } else {
      setUpgradePlan(plan);
      setShowUpgradePlanDialog(true);
    }
  }

  function downgradeToPlan(plan: 'free' | 'developer') {
    setDowngradePlan(plan);
    setShowDowngradePlanDialog(true);
  }

  return (
    <Layout>
      <Box py="7" px="5" style={{ margin: '0px auto', maxWidth: '68rem' }}>
        <Flex direction="column" align="start" justify="start" mb="7" style={{ minHeight: 'var(--space-5)' }} gap="2">
          <RadixLink asChild color="gray" underline="none" size="2">
            <Link to="/billing">← Back to billing</Link>
          </RadixLink>
          <Heading as="h2" size="6" weight="medium">
            Plans
          </Heading>
        </Flex>
        <Flex direction="column" justify="start" mb="5">
          <Grid gap="4" columns={{ xs: '1', md: '3' }} minHeight={{ md: '450px' }}>
            <Card variant="surface" size="3">
              <Flex direction="column" justify="between" height="100%">
                <Flex direction="column" align="start" justify="between" p="1" gap="3">
                  <Code variant="ghost" size="2" weight="medium" color="gray" highContrast>
                    Starter
                  </Code>
                  <Heading as="h3" weight="medium">
                    Free
                  </Heading>
                  <Text size="2" color="gray">
                    {`Everything you need to build and test for free.`}
                  </Text>
                  <Flex direction="column" align="start" gap="2">
                    <Flex align="start" gap="2" justify="start">
                      <CheckIcon color="var(--jade-10)" style={{ marginTop: '2px' }} />
                      <Text size="2" color="gray">
                        100 compute hours included
                      </Text>
                    </Flex>
                    <Flex align="start" gap="2" justify="start">
                      <CheckIcon color="var(--jade-10)" style={{ marginTop: '2px' }} />
                      <Text size="2" color="gray">
                        Up to 10 concurrently running computers
                      </Text>
                    </Flex>
                    <Flex align="start" gap="2" justify="start">
                      <CheckIcon color="var(--jade-10)" style={{ marginTop: '2px' }} />
                      <Text size="2" color="gray">
                        No credit card required
                      </Text>
                    </Flex>
                  </Flex>
                </Flex>
                <Flex style={{ marginTop: '14px' }} width="100%">
                  {getFreePlanButton()}
                </Flex>
              </Flex>
            </Card>
            <Card variant="surface" size="3">
              <Flex direction="column" justify="between" height="100%">
                <Flex direction="column" align="start" justify="between" p="1" gap="3">
                  <Code variant="ghost" size="2" weight="medium" color="gray" highContrast>
                    Developer
                  </Code>
                  <Heading as="h3" weight="medium">
                    $20/mo.
                  </Heading>
                  <Code color="gray" size="2">
                    + Compute costs
                  </Code>
                  <Text size="2" color="gray">
                    {`Perfect for solo devs, side-projects, and experiments.`}
                  </Text>
                  <Flex direction="column" align="start" gap="2">
                    <Flex align="start" gap="2" justify="start">
                      <CheckIcon color="var(--jade-10)" style={{ marginTop: '2px' }} />
                      <Text size="2" color="gray">
                        Unlimited compute hours
                      </Text>
                    </Flex>
                    <Flex align="start" gap="2" justify="start">
                      <CheckIcon color="var(--jade-10)" style={{ marginTop: '2px' }} />
                      <Text size="2" color="gray">
                        Up to 100 concurrently running computers
                      </Text>
                    </Flex>
                    <Flex align="start" gap="2" justify="start">
                      <CheckIcon color="var(--jade-10)" style={{ marginTop: '2px' }} />
                      <Text size="2" color="gray">
                        GPU-accelerated computers
                      </Text>
                    </Flex>
                    <Flex align="start" gap="2" justify="start">
                      <CheckIcon color="var(--jade-10)" style={{ marginTop: '2px' }} />
                      <Text size="2" color="gray">
                        Custom templates
                      </Text>
                    </Flex>
                  </Flex>
                </Flex>
                <Flex style={{ marginTop: '14px' }} width="100%">
                  {getDeveloperPlanButton()}
                </Flex>
              </Flex>
            </Card>
            <Card variant="surface" size="3">
              <Flex direction="column" justify="between" height="100%">
                <Flex direction="column" align="start" justify="between" p="1" gap="3">
                  <Code variant="ghost" size="2" weight="medium" color="gray" highContrast>
                    Team
                  </Code>
                  <Heading as="h3" weight="medium">
                    $200/mo.
                  </Heading>
                  <Code color="gray" size="2">
                    + Compute costs
                  </Code>
                  <Text size="2" color="gray">
                    {`For teams building production applications.`}
                  </Text>
                  <Flex direction="column" align="start" gap="2">
                    <Flex align="start" gap="2" justify="start">
                      <CheckIcon color="var(--jade-10)" style={{ marginTop: '2px' }} />
                      <Text size="2" color="gray">
                        Unlimited compute hours
                      </Text>
                    </Flex>
                    <Flex align="start" gap="2" justify="start">
                      <CheckIcon color="var(--jade-10)" style={{ marginTop: '2px' }} />
                      <Text size="2" color="gray">
                        Unlimited concurrently running computers
                      </Text>
                    </Flex>
                    <Flex align="start" gap="2" justify="start">
                      <CheckIcon color="var(--jade-10)" style={{ marginTop: '2px' }} />
                      <Text size="2" color="gray">
                        GPU-accelerated computers
                      </Text>
                    </Flex>
                    <Flex align="start" gap="2" justify="start">
                      <CheckIcon color="var(--jade-10)" style={{ marginTop: '2px' }} />
                      <Text size="2" color="gray">
                        Custom templates
                      </Text>
                    </Flex>
                    <Flex align="start" gap="2" justify="start">
                      <CheckIcon color="var(--jade-10)" style={{ marginTop: '2px' }} />
                      <Text size="2" color="gray">
                        Unlimited users
                      </Text>
                    </Flex>
                  </Flex>
                </Flex>
                <Flex style={{ marginTop: '14px' }} width="100%">
                  {getTeamPlanButton()}
                </Flex>
              </Flex>
            </Card>
          </Grid>
        </Flex>
        <Flex direction="column" justify="start" my="5">
          <Card size="3" className="enterprise-card">
            <Grid columns={{ xs: '1', md: '2' }} py={{ xs: '2', md: '4' }} px={{ xs: '0', md: '4' }} gap="5">
              <Flex direction="column" justify="start" align="start" gap="2">
                <Heading as="h3" weight="medium">
                  Enterprise
                </Heading>
                <Text size="2" color="gray">
                  {`Flexible contract-based plans tailored to your needs.`}
                </Text>
                <Button
                  mt="2"
                  variant="soft"
                  color="gray"
                  highContrast
                  onClick={() => {
                    const subject = `Upgrade to Enterprise plan`;
                    window.location.href = `mailto:team@metallic.dev?subject=${encodeURIComponent(subject)}`;
                  }}
                >
                  Contact us
                </Button>
              </Flex>
              <Flex direction="column" align="start" gap="2">
                <Flex align="start" gap="2" justify="start">
                  <CheckIcon color="var(--jade-10)" style={{ marginTop: '2px' }} />
                  <Text size="2" color="gray">
                    On-premise/VPC deployment
                  </Text>
                </Flex>
                <Flex align="start" gap="2" justify="start">
                  <CheckIcon color="var(--jade-10)" style={{ marginTop: '2px' }} />
                  <Text size="2" color="gray">
                    SSO with SAML, SCIM
                  </Text>
                </Flex>
                <Flex align="start" gap="2" justify="start">
                  <CheckIcon color="var(--jade-10)" style={{ marginTop: '2px' }} />
                  <Text size="2" color="gray">
                    Audit logging
                  </Text>
                </Flex>
                <Flex align="start" gap="2" justify="start">
                  <CheckIcon color="var(--jade-10)" style={{ marginTop: '2px' }} />
                  <Text size="2" color="gray">
                    Dedicated Slack channel
                  </Text>
                </Flex>
                <Flex align="start" gap="2" justify="start">
                  <CheckIcon color="var(--jade-10)" style={{ marginTop: '2px' }} />
                  <Text size="2" color="gray">
                    Hands-on integration support
                  </Text>
                </Flex>
              </Flex>
            </Grid>
          </Card>
        </Flex>
      </Box>
      <Elements
        stripe={stripePromise}
        options={{
          currency: 'usd',
          mode: 'setup',
          payment_method_types: ['card'],
          appearance: {
            theme: resolvedTheme === 'light' ? 'stripe' : 'night',
            variables: {
              colorBackground: resolvedTheme === 'light' ? '#ffffff' : '#262626',
              fontSizeBase: '14px'
            }
          }
        }}
      >
        {selectedOrganizationId && startPlan && (
          <StartPlanDialog
            show={showStartPlanDialog}
            setShow={setShowStartPlanDialog}
            plan={startPlan}
            organizationId={selectedOrganizationId}
            onSuccess={(subscription, paymentMethod) => {
              setSubscriptions([subscription]);
              setPaymentMethods([paymentMethod]);
            }}
          />
        )}
      </Elements>
      {selectedOrganizationId && upgradePlan && (
        <UpgradePlanDialog
          show={showUpgradePlanDialog}
          setShow={setShowUpgradePlanDialog}
          plan={upgradePlan}
          organizationId={selectedOrganizationId}
          onSuccess={(subscription) => {
            setSubscriptions([subscription]);
          }}
        />
      )}
      {selectedOrganizationId && downgradePlan && (
        <DowngradePlanDialog
          show={showDowngradePlanDialog}
          setShow={setShowDowngradePlanDialog}
          plan={downgradePlan}
          organizationId={selectedOrganizationId}
          onSuccess={(subscription) => {
            setSubscriptions([subscription]);
          }}
        />
      )}
    </Layout>
  );
}

type StartPlanDialogProps = {
  show: boolean;
  setShow: (show: boolean) => void;
  plan: 'developer' | 'team';
  organizationId: string;
  onSuccess: (subscription: SubscriptionObject, paymentMethod: PaymentMethodObject) => void;
};

function StartPlanDialog({ show, setShow, plan, organizationId, onSuccess }: StartPlanDialogProps) {
  const stripe = useStripe();
  const elements = useElements();
  const { toastError, toastSuccess } = useToast();
  const [loading, setLoading] = useState(false);
  const planDisplayName = plan.charAt(0).toUpperCase() + plan.slice(1);

  async function startSubscription() {
    if (!stripe || !elements) {
      toastError();
      return;
    }

    const { error } = await elements.submit();
    if (error) {
      toastError(error.message);
      return;
    }

    setLoading(true);
    try {
      const { client_secret: clientSecret } = await setupPaymentMethod(organizationId);
      const response = await stripe.confirmSetup({
        clientSecret,
        elements,
        redirect: 'if_required'
      });

      if (response.error) {
        toastError(response.error.message);
        setLoading(false);
        return;
      }

      const pm = response.setupIntent.payment_method;
      if (typeof pm !== 'string') {
        throw new Error('Type of setup intent not string');
      }

      const paymentMethod = await addPaymentMethod(organizationId, {
        stripe_payment_method_id: pm,
        make_default: true
      });

      const subscription = await createSubscription(organizationId, { plan });
      if (subscription.confirmation_secret) {
        const { error: piError } = await stripe.confirmCardPayment(subscription.confirmation_secret);
        if (piError) {
          throw piError;
        }
      }

      toastSuccess(`Upgrade successful!`);
      setShow(false);
      onSuccess(subscription, paymentMethod);
    } catch (err) {
      captureException(err);
      toastError();
    } finally {
      setLoading(false);
    }
  }

  function cancel() {
    setShow(false);
  }

  function handleOpenChange(open: boolean) {
    if (!open) {
      cancel();
    } else {
      setShow(true);
    }
  }

  return (
    <Dialog.Root open={show} onOpenChange={handleOpenChange}>
      <VisuallyHidden>
        <Dialog.Title>Upgrade</Dialog.Title>
        <Dialog.Description>Upgrade to {planDisplayName} plan.</Dialog.Description>
      </VisuallyHidden>
      <Dialog.Content width="450px">
        <Flex direction="column" justify="start" gap="4" width="100%">
          <Box>
            <Heading as="h3" size="4" mb="1">
              Upgrade to {planDisplayName} plan
            </Heading>
            <Text color="gray" size="2">
              Enter your payment details below to upgrade to the {planDisplayName} plan.
            </Text>
          </Box>
          <PaymentElement />
          <Flex align="center" justify="start" gap="3" mt="2">
            <Button variant="solid" onClick={startSubscription} loading={loading}>
              Upgrade to {planDisplayName} plan
            </Button>
            <Button variant="soft" color="gray" onClick={cancel}>
              Cancel
            </Button>
          </Flex>
        </Flex>
      </Dialog.Content>
    </Dialog.Root>
  );
}

type UpgradePlanDialogProps = {
  show: boolean;
  setShow: (show: boolean) => void;
  plan: 'developer' | 'team';
  organizationId: string;
  onSuccess: (subscription: SubscriptionObject) => void;
};

function UpgradePlanDialog({ show, setShow, plan, organizationId, onSuccess }: UpgradePlanDialogProps) {
  const { toastError, toastSuccess } = useToast();
  const [loading, setLoading] = useState(false);
  const planDisplayName = plan.charAt(0).toUpperCase() + plan.slice(1);

  async function upgrade() {
    setLoading(true);
    try {
      const subscription = await upgradeSubscription(organizationId, { plan });
      toastSuccess(`Plan upgrade successful!`);
      setShow(false);
      onSuccess(subscription);
    } catch (err) {
      captureException(err);
      toastError(`Failed to upgrade to ${planDisplayName} plan`);
    } finally {
      setLoading(false);
    }
  }

  function cancel() {
    setShow(false);
  }

  function handleOpenChange(open: boolean) {
    if (!open) {
      cancel();
    } else {
      setShow(true);
    }
  }

  return (
    <Dialog.Root open={show} onOpenChange={handleOpenChange}>
      <VisuallyHidden>
        <Dialog.Title>Upgrade</Dialog.Title>
        <Dialog.Description>Upgrade to {planDisplayName} plan.</Dialog.Description>
      </VisuallyHidden>
      <Dialog.Content width="450px">
        <Flex direction="column" justify="start" gap="4" width="100%">
          <Box>
            <Heading as="h3" size="4" mb="1">
              Upgrade to {planDisplayName} plan
            </Heading>
            <Text color="gray" size="2">
              Are you sure you want to upgrade to the {planDisplayName} plan?
            </Text>
          </Box>
          <Flex align="center" justify="start" gap="3" mt="2">
            <Button variant="solid" onClick={upgrade} loading={loading}>
              Upgrade to {planDisplayName}
            </Button>
            <Button variant="soft" color="gray" onClick={cancel}>
              Cancel
            </Button>
          </Flex>
        </Flex>
      </Dialog.Content>
    </Dialog.Root>
  );
}

interface DowngradePlanDialogProps {
  show: boolean;
  setShow: (show: boolean) => void;
  plan: 'free' | 'developer';
  organizationId: string;
  onSuccess: (subscription: SubscriptionObject) => void;
}

function DowngradePlanDialog({ show, setShow, plan, organizationId, onSuccess }: DowngradePlanDialogProps) {
  const { toastError, toastSuccess } = useToast();
  const [loading, setLoading] = useState(false);
  const planDisplayName = plan.charAt(0).toUpperCase() + plan.slice(1);

  async function downgrade() {
    setLoading(true);
    try {
      const subscription = await downgradeSubscription(organizationId, { plan });
      toastSuccess(`Plan downgrade successful!`);
      setShow(false);
      onSuccess(subscription);
    } catch (err) {
      captureException(err);
      toastError(`Failed to downgrade to ${planDisplayName} plan`);
    } finally {
      setLoading(false);
    }
  }

  function cancel() {
    setShow(false);
  }

  function handleOpenChange(open: boolean) {
    if (!open) {
      cancel();
    } else {
      setShow(true);
    }
  }

  return (
    <Dialog.Root open={show} onOpenChange={handleOpenChange}>
      <VisuallyHidden>
        <Dialog.Title>Downgrade</Dialog.Title>
        <Dialog.Description>Downgrade to {planDisplayName} plan.</Dialog.Description>
      </VisuallyHidden>
      <Dialog.Content width="450px">
        <Flex direction="column" justify="start" gap="4" width="100%">
          <Box>
            <Heading as="h3" size="4" mb="1">
              Downgrade to {planDisplayName} plan
            </Heading>
            <Text color="gray" size="2">
              Are you sure you want to downgrade to the {planDisplayName} plan?
            </Text>
          </Box>
          <Flex align="center" justify="start" gap="3" mt="2">
            <Button variant="solid" onClick={downgrade} loading={loading}>
              Downgrade to {planDisplayName}
            </Button>
            <Button variant="soft" color="gray" onClick={cancel}>
              Cancel
            </Button>
          </Flex>
        </Flex>
      </Dialog.Content>
    </Dialog.Root>
  );
}
