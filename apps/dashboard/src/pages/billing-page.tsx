import { ClockIcon, InfoCircledIcon, RocketIcon } from '@radix-ui/react-icons';
import { Box, Button, Card, Flex, Grid, Heading, Tooltip as RadixTooltip, Text } from '@radix-ui/themes';
import { useState } from 'react';
import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { CreditCardIcon } from '../components/custom-icons';
import { Layout } from '../components/layout';

const data = [
  { name: 'Page A', uv: 400, pv: 2400, amt: 2400 },
  { name: 'Page B', uv: 300, pv: 1398, amt: 2210 },
  { name: 'Page C', uv: 200, pv: 9800, amt: 2290 },
  { name: 'Page D', uv: 278, pv: 3908, amt: 2000 },
  { name: 'Page E', uv: 189, pv: 4800, amt: 2181 },
  { name: 'Page F', uv: 239, pv: 3800, amt: 2500 }
];

export interface PaymentMethodObject {
  object: 'payment_method';
  id: string;
  organization_id: string;
  stripe_id: string;
  type: string;
  card_brand: string | null;
  card_last4: string | null;
  card_exp_month: number | null;
  card_exp_year: number | null;
  created_at: number;
  updated_at: number;
}

export default function BillingPage() {
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethodObject | null>(null);
  const [showPaymentMethodDialog, setShowPaymentMethodDialog] = useState(false);

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

  return (
    <Layout>
      <Box py="9" px="5" style={{ margin: '0px auto', maxWidth: '68rem' }}>
        <Flex align="center" justify="between" mb="5" style={{ minHeight: 'var(--space-5)' }}>
          <Heading as="h2" size="6" weight="medium">
            Billing
          </Heading>
        </Flex>
        <Flex direction="column" justify="start" mb="5">
          <Grid gap="4" columns={{ xs: '1', md: '3' }} minHeight={{ xs: '475px', md: '160px' }}>
            <Card variant="surface" size="3">
              <Flex direction="column" justify="between" height="100%">
                <Box>
                  <Text size="2" color="gray" as="p" mb="2">
                    Current plan
                  </Text>
                  <Text size="4" weight="bold" as="p">
                    {'—'}
                  </Text>
                </Box>
                <Flex align="center">
                  <Button
                    variant="ghost"
                    onClick={() => {
                      const subject = `I'd like to upgrade my plan`;
                      window.location.href = `mailto:billing@useembed.com?subject=${encodeURIComponent(subject)}`;
                    }}
                  >
                    <RocketIcon />
                    Upgrade your plan
                  </Button>
                </Flex>
              </Flex>
            </Card>
            <Card variant="surface" size="3">
              <Flex direction="column" justify="between" height="100%">
                <Box>
                  <Text size="2" color="gray" as="p" mb="2">
                    Next payment due
                  </Text>
                  <Text size="4" weight="bold" as="p">
                    {'-'}
                  </Text>
                </Box>
                <Flex align="center">
                  <Button
                    variant="ghost"
                    // onClick={() => push('/workspace/billing/payment-history')}
                  >
                    <ClockIcon />
                    View payment history
                  </Button>
                </Flex>
              </Flex>
            </Card>
            <Card variant="surface" size="3">
              <Flex direction="column" justify="between" height="100%">
                <Box>
                  <Text size="2" color="gray" as="p" mb="2">
                    Payment method
                  </Text>
                  <Text size="4" weight="bold" as="p">
                    {paymentMethod ? getPaymentMethodDisplayName(paymentMethod) : '—'}
                  </Text>
                </Box>
                <Flex align="center">
                  <Button variant="ghost" onClick={() => setShowPaymentMethodDialog(true)}>
                    <CreditCardIcon />
                    {paymentMethod ? 'Update' : 'Add'} payment method
                  </Button>
                </Flex>
              </Flex>
              {/* <PaymentMethodDialog
                organizationId={props.selectedEnvironment.organization_id}
                show={showPaymentMethodDialog}
                setShow={setShowPaymentMethodDialog}
                action={paymentMethod ? 'update' : 'add'}
                setPaymentMethod={setPaymentMethod}
              /> */}
            </Card>
          </Grid>
        </Flex>
        <Flex align="center" justify="between" pt="5" mb="5" style={{ minHeight: 'var(--space-5)' }}>
          <Heading as="h2" size="4" weight="medium">
            Current usage
          </Heading>
        </Flex>
        <Grid gap="4" columns={{ lg: '1', md: '1', initial: '1' }}>
          <Card variant="surface" size="3">
            <Flex direction="column" justify="between" width="100%" height="100%" gap="2">
              <Flex align="center" justify="start" gap="2">
                <Text size="3" weight="medium">
                  Cost
                </Text>
                <RadixTooltip content="Test">
                  <InfoCircledIcon color="var(--gray-9)" />
                </RadixTooltip>
              </Flex>
              <Flex justify="start" align="baseline" gap="2" pb="3">
                <Text size="8">$123.45</Text>
                <Text color="gray" size="2">
                  this month
                </Text>
              </Flex>
              <Flex direction="column" justify="start" gap="1" width="100%" height="200px" ml="-5">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={data}>
                    <XAxis dataKey="name" fontSize="12px" fontFamily="var(--code-font-family)" tick={{ dy: 10 }} />
                    <YAxis
                      tickFormatter={(value) => `$${value}`}
                      fontSize="12px"
                      fontFamily="var(--code-font-family)"
                    />
                    <Tooltip
                      formatter={(value: number) => [`$${value.toFixed(2)}`, 'Cost']}
                      contentStyle={{
                        backgroundColor: 'var(--gray-3)',
                        borderColor: 'var(--gray-6)',
                        borderRadius: 'var(--radius-4)',
                        color: 'var(--gray-12)',
                        fontSize: '14px'
                      }}
                    />
                    <Line type="monotone" dataKey="uv" stroke="var(--gray-12)" strokeWidth={2} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </Flex>
            </Flex>
          </Card>
        </Grid>
      </Box>
    </Layout>
  );
}
