import { InvoiceObject, PaymentMethodObject, SubscriptionObject } from '@metallichq/types';
import { DownloadIcon, ExclamationTriangleIcon, FileTextIcon, RocketIcon } from '@radix-ui/react-icons';
import {
  Badge,
  Box,
  Button,
  Card,
  Dialog,
  Flex,
  Grid,
  Heading,
  IconButton,
  Skeleton,
  Table,
  Text,
  VisuallyHidden
} from '@radix-ui/themes';
import { Elements, PaymentElement, useElements, useStripe } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import { useTheme } from 'next-themes';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CreditCardIcon } from '../components/custom-icons';
import { Layout } from '../components/layout';
import { useOrganizations } from '../hooks/use-organizations';
import { useToast } from '../hooks/use-toast';
import { addPaymentMethod } from '../lib/add-payment-method';
import { listInvoices } from '../lib/list-invoices';
import { listPaymentMethods } from '../lib/list-payment-methods';
import { listSubscriptions } from '../lib/list-subscriptions';
import { setupPaymentMethod } from '../lib/setup-payment-method';
import { captureException } from '../utils/error';

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY);

export default function BillingPage() {
  const { selectedOrganizationId } = useOrganizations();
  const { resolvedTheme } = useTheme();
  const navigate = useNavigate();

  const [subscriptions, setSubscriptions] = useState<SubscriptionObject[]>([]);
  const [subscriptionsLoading, setSubscriptionsLoading] = useState(false);
  const [subscriptionsError, setSubscriptionsError] = useState<string | null>(null);
  const selectedSubscription: SubscriptionObject | undefined = subscriptions.find((s) =>
    ['active', 'past_due'].includes(s.status)
  );

  const [paymentMethods, setPaymentMethods] = useState<PaymentMethodObject[]>([]);
  const [paymentMethodsLoading, setPaymentMethodsLoading] = useState(false);
  const [paymentMethodsError, setPaymentMethodsError] = useState<string | null>(null);
  const defaultPaymentMethod: PaymentMethodObject | undefined = paymentMethods.find((p) => p.is_default);

  const [invoices, setInvoices] = useState<InvoiceObject[]>([]);
  const [invoicesLoading, setInvoicesLoading] = useState(false);
  const [invoicesError, setInvoicesError] = useState<string | null>(null);

  const [showAddOrUpdatePaymentMethodDialog, setShowAddOrUpdatePaymentMethodDialog] = useState(false);
  const [addOrUpdatePaymentMethodAction, setAddOrUpdatePaymentMethodAction] = useState<'add' | 'update' | undefined>(
    undefined
  );

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

  const fetchPaymentMethods = (mountedRef?: { current: boolean }) => {
    if (!selectedOrganizationId) {
      return;
    }

    setPaymentMethodsLoading(true);
    listPaymentMethods(selectedOrganizationId)
      .then((data) => {
        if (!mountedRef || mountedRef.current) {
          setPaymentMethods(data.data);
        }
      })
      .catch((err) => {
        if (!mountedRef || mountedRef.current) {
          setPaymentMethodsError('Failed to load payment methods');
          captureException(err);
        }
      })
      .finally(() => {
        if (!mountedRef || mountedRef.current) {
          setPaymentMethodsLoading(false);
        }
      });
  };

  useEffect(() => {
    const mounted = { current: true };
    fetchPaymentMethods(mounted);

    return () => {
      mounted.current = false;
    };
  }, [selectedOrganizationId]);

  useEffect(() => {
    let mounted = true;
    if (!selectedOrganizationId) {
      return;
    }

    setInvoicesLoading(true);
    listInvoices(selectedOrganizationId)
      .then((data) => {
        if (mounted) {
          setInvoices(data.data);
        }
      })
      .catch((err) => {
        if (mounted) {
          setInvoicesError('Failed to load invoices');
          captureException(err);
        }
      })
      .finally(() => {
        if (mounted) {
          setInvoicesLoading(false);
        }
      });

    return () => {
      mounted = false;
    };
  }, [selectedOrganizationId]);

  function getPlanDisplayName() {
    if (subscriptionsLoading) {
      return (
        <Skeleton loading>
          <Text size="4" weight="bold" as="p">
            Loading...
          </Text>
        </Skeleton>
      );
    } else if (subscriptionsError) {
      return (
        <Text size="4" weight="bold" as="p">
          {`—`}
        </Text>
      );
    } else if (!selectedSubscription) {
      return (
        <Text size="4" weight="bold" as="p">
          Free
        </Text>
      );
    }

    const plan = selectedSubscription.plan;
    const status = selectedSubscription.status;
    const planDisplayName = plan.charAt(0).toUpperCase() + plan.slice(1);
    const statusDisplayName = status.charAt(0).toUpperCase() + status.slice(1);

    return (
      <Flex align="center" justify="start" gap="2">
        <Text size="4" weight="bold" as="p">
          {planDisplayName}
        </Text>
        <Badge size="1" color={status === 'active' ? 'green' : 'orange'}>
          {statusDisplayName}
        </Badge>
      </Flex>
    );
  }

  function getPlanUpgradeButton() {
    const status = selectedSubscription?.status;
    if (status === 'past_due') {
      return null;
    }

    const plan = selectedSubscription?.plan;
    if (plan === 'enterprise') {
      return null;
    } else if (plan === 'team') {
      return (
        <Button
          variant="ghost"
          onClick={() => {
            const subject = `Upgrade to Enterprise plan`;
            window.location.href = `mailto:team@metallic.dev?subject=${encodeURIComponent(subject)}`;
          }}
        >
          <RocketIcon />
          Upgrade to enterprise
        </Button>
      );
    } else {
      return (
        <Button
          variant="ghost"
          onClick={() => {
            navigate('/billing/plans');
          }}
        >
          <RocketIcon />
          Upgrade your plan
        </Button>
      );
    }
  }

  function getPlanCancelButton() {
    if (!selectedSubscription || selectedSubscription.plan === 'free') {
      return null;
    }

    if (selectedSubscription.plan === 'enterprise') {
      return null;
    }

    return (
      <Button
        variant="ghost"
        color="gray"
        onClick={() => {
          navigate('/billing/plans');
        }}
      >
        Change or cancel plan
      </Button>
    );
  }

  function getPaymentMethodText() {
    if (paymentMethodsLoading) {
      return (
        <Skeleton loading>
          <Text size="4" weight="bold" as="p">
            Loading...
          </Text>
        </Skeleton>
      );
    } else if (paymentMethodsError || !defaultPaymentMethod) {
      return (
        <Text size="4" weight="bold" as="p">
          {`—`}
        </Text>
      );
    } else {
      return (
        <Text size="4" weight="bold" as="p">
          {getPaymentMethodDisplayName(defaultPaymentMethod)}
        </Text>
      );
    }
  }

  function getPaymentMethodButton() {
    if (paymentMethodsLoading || paymentMethodsError) {
      return null;
    }

    if (!defaultPaymentMethod) {
      return (
        <Button variant="ghost" onClick={() => addOrUpdatePaymentMethod('add')}>
          <CreditCardIcon />
          Add payment method
        </Button>
      );
    } else if (defaultPaymentMethod) {
      return (
        <Button variant="ghost" onClick={() => addOrUpdatePaymentMethod('update')}>
          <CreditCardIcon />
          Update payment method
        </Button>
      );
    }
  }

  function getPaymentMethodDisplayName(paymentMethod: PaymentMethodObject) {
    if (paymentMethod.type === 'card' && paymentMethod.card_last4) {
      return `•••• ${paymentMethod.card_last4}`;
    } else if (paymentMethod.type === 'link') {
      if (paymentMethod.card_last4) {
        return `•••• ${paymentMethod.card_last4}`;
      } else {
        return 'Link';
      }
    }

    return '—';
  }

  function addOrUpdatePaymentMethod(action: 'add' | 'update') {
    setAddOrUpdatePaymentMethodAction(action);
    setShowAddOrUpdatePaymentMethodDialog(true);
  }

  function formatCurrency(amount: number) {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount / 100);
  }

  function getInvoiceStatusBadge(status: string | null) {
    if (!status) {
      return null;
    }

    const capitalizedStatus = status.charAt(0).toUpperCase() + status.slice(1);
    if (status === 'paid') {
      return (
        <Badge color="green" size="1">
          {capitalizedStatus}
        </Badge>
      );
    } else {
      return <Badge color="gray">{capitalizedStatus}</Badge>;
    }
  }

  function formatDate(dateA: string, dateB: string) {
    const dateAObj = new Date(dateA);
    const dateBObj = new Date(dateB);
    const monthA = dateAObj.toLocaleString('en-US', { month: 'long' });
    const dayA = dateAObj.getDate();
    const monthB = dateBObj.toLocaleString('en-US', { month: 'long' });
    const dayB = dateBObj.getDate();
    return `${monthA} ${dayA} - ${monthB} ${dayB}`;
  }

  function getInvoicesTable() {
    if (invoicesLoading) {
      return (
        <Card>
          <Flex justify="center" align="center" py="9">
            <Flex direction="column" justify="center" align="center" py="9">
              <Text size="3" weight="medium" color="gray">
                Loading...
              </Text>
            </Flex>
          </Flex>
        </Card>
      );
    }

    if (invoicesError) {
      return (
        <Card>
          <Flex justify="center" align="center" py="9">
            <Flex direction="column" justify="center" align="center" py="9">
              <ExclamationTriangleIcon
                color="var(--gray-a9)"
                width="22px"
                height="22px"
                style={{ marginBottom: 'var(--space-3)' }}
              />
              <Text size="3" weight="medium" color="gray" highContrast>
                Oops! Something went wrong.
              </Text>
            </Flex>
          </Flex>
        </Card>
      );
    }

    if (invoices.length === 0) {
      return (
        <Card>
          <Flex justify="center" align="center" py="9">
            <Flex direction="column" justify="center" align="center" py="9" gap="4">
              <FileTextIcon color="var(--gray-a9)" width="22px" height="22px" />
              <Text size="3" weight="medium" color="gray" highContrast>
                No invoices yet
              </Text>
            </Flex>
          </Flex>
        </Card>
      );
    }

    return (
      <Table.Root variant="surface">
        <Table.Body>
          {invoices.map((invoice) => (
            <Table.Row key={invoice.download_url} className={`row-va-middle`}>
              <Table.Cell p="4">
                <Flex align="center" justify="start" gap="4">
                  <Text as="span" color="gray">
                    {formatDate(invoice.period_start, invoice.period_end)}
                  </Text>
                  {getInvoiceStatusBadge(invoice.status)}
                </Flex>
              </Table.Cell>
              <Table.Cell>
                <Flex align="center" justify="end" gap="4">
                  <Text size="2" weight="medium">
                    {formatCurrency(invoice.total)}
                  </Text>
                  {invoice.hosted_url && (
                    <Button
                      variant="soft"
                      color="gray"
                      size="1"
                      onClick={() => {
                        if (invoice.hosted_url) {
                          window.open(invoice.hosted_url, '_blank');
                        }
                      }}
                    >
                      View
                    </Button>
                  )}
                  {invoice.download_url && (
                    <IconButton
                      variant="ghost"
                      color="gray"
                      onClick={() => {
                        if (invoice.download_url) {
                          window.open(invoice.download_url, '_blank');
                        }
                      }}
                      mr="1"
                    >
                      <DownloadIcon />
                    </IconButton>
                  )}
                </Flex>
              </Table.Cell>
            </Table.Row>
          ))}
        </Table.Body>
      </Table.Root>
    );
  }

  return (
    <Layout>
      <Box py="9" px="5" style={{ margin: '0px auto', maxWidth: '68rem' }}>
        <Flex align="center" justify="between" mb="5" style={{ minHeight: 'var(--space-5)' }}>
          <Heading as="h2" size="6" weight="medium">
            Billing
          </Heading>
        </Flex>
        <Flex direction="column" justify="start" mb="5">
          <Grid gap="4" columns={{ xs: '1', md: '2' }} minHeight={{ xs: '475px', md: '160px' }}>
            <Card variant="surface" size="3">
              <Flex direction="column" justify="between" height="100%">
                <Box>
                  <Text size="2" color="gray" as="p" mb="2">
                    Current plan
                  </Text>
                  {getPlanDisplayName()}
                </Box>
                <Flex align="center" justify="between" gap="4">
                  {getPlanUpgradeButton()}
                  {getPlanCancelButton()}
                </Flex>
              </Flex>
            </Card>
            <Card variant="surface" size="3">
              <Flex direction="column" justify="between" height="100%">
                <Box>
                  <Text size="2" color="gray" as="p" mb="2">
                    Payment method
                  </Text>
                  {getPaymentMethodText()}
                </Box>
                <Flex align="center">{getPaymentMethodButton()}</Flex>
              </Flex>
            </Card>
          </Grid>
        </Flex>
        <Flex align="center" justify="between" pt="5" mb="5" style={{ minHeight: 'var(--space-5)' }}>
          <Heading as="h2" size="4" weight="medium">
            Invoices
          </Heading>
        </Flex>
        {getInvoicesTable()}
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
        {selectedOrganizationId && addOrUpdatePaymentMethodAction && (
          <AddOrUpdatePaymentMethodDialog
            show={showAddOrUpdatePaymentMethodDialog}
            setShow={setShowAddOrUpdatePaymentMethodDialog}
            action={addOrUpdatePaymentMethodAction}
            organizationId={selectedOrganizationId}
            onSuccess={() => {
              fetchPaymentMethods();
            }}
          />
        )}
      </Elements>
    </Layout>
  );
}

type AddOrUpdatePaymentMethodDialogProps = {
  show: boolean;
  setShow: (show: boolean) => void;
  organizationId: string;
  action: 'add' | 'update';
  onSuccess: () => void;
};

export function AddOrUpdatePaymentMethodDialog({
  show,
  setShow,
  organizationId,
  action,
  onSuccess
}: AddOrUpdatePaymentMethodDialogProps) {
  const stripe = useStripe();
  const elements = useElements();
  const { toastError, toastSuccess } = useToast();
  const [loading, setLoading] = useState(false);

  async function addOrUpdatePaymentMethod() {
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

      await addPaymentMethod(organizationId, {
        stripe_payment_method_id: pm,
        make_default: true
      });

      toastSuccess('Payment method updated successfully');
      setShow(false);
      onSuccess();
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
        <Dialog.Title>{action === 'add' ? 'Add' : 'Update'} payment method</Dialog.Title>
        <Dialog.Description>{action === 'add' ? 'Add' : 'Update'} your payment method.</Dialog.Description>
      </VisuallyHidden>
      <Dialog.Content width="450px">
        <Flex direction="column" justify="start" gap="4" width="100%">
          <Box>
            <Heading as="h3" size="4" mb="1">
              {action === 'add' ? 'Add' : 'Update'} payment method
            </Heading>
            <Text color="gray" size="2">
              Enter your payment details below to {action === 'add' ? 'add' : 'update'} your payment method.
            </Text>
          </Box>
          <PaymentElement />
          <Flex align="center" justify="start" gap="3" mt="2">
            <Button variant="solid" onClick={addOrUpdatePaymentMethod} loading={loading}>
              {action === 'add' ? 'Add' : 'Update'} payment method
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
