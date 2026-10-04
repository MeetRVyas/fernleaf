'use client';

import { useState } from 'react';
import {
  Alert,
  Button,
  Group,
  Paper,
  Stack,
  Switch,
  Text,
  TextInput,
  Title,
} from '@mantine/core';
import { useForm } from '@mantine/form';
import { zod4Resolver } from 'mantine-form-zod-resolver';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  can,
  PERM,
  companyBody,
  createCompany,
  createCompanyAddress,
  createCompanyHoliday,
  deleteCompanyHoliday,
  getCompany,
  listCompanies,
  listCompanyHolidays,
  updateCompany,
  updateCompanyAddress,
  type InputOf,
} from '@fernleaf/shared';
import { api } from '../../lib/api';
import { useSession } from '../../lib/auth';
import { readApiError, showApiError } from '../../lib/errors';
import { EmptyState, ErrorState, LoadingState } from '../../components/states';
import { ServerTable, useTableState } from '../../components/server-table';

type CompanyBody = InputOf<typeof createCompany>['body'];
const blank: CompanyBody = {
  name: '',
  tierId: null,
  defaultDeliveryTime: '12:00',
  deliveryLeadMinutes: 60,
  defaultPackaging: 'STANDARD',
  driverInstructions: '',
  defaultDriverId: null,
  billingName: '',
  billingEmail: '',
  billingPhone: '',
  billingAddress: '',
  ownerEmployeeId: null,
  workingDays: [1, 2, 3, 4, 5],
  domains: [],
  isActive: true,
  addresses: [
    {
      label: 'Main',
      line1: '',
      line2: null,
      city: '',
      region: '',
      postalCode: '',
      country: 'US',
      isDefault: true,
    },
  ],
};

function CompanyForm({ id, close }: { id: string | null; close: () => void }) {
  const details = useQuery({
    queryKey: ['companies', 'detail', id],
    queryFn: () => api.call(getCompany, { params: { id: id! } }),
    enabled: !!id,
  });
  if (id && details.isLoading) return <LoadingState />;
  if (id && details.isError)
    return (
      <ErrorState
        message={readApiError(details.error).message}
        retry={() => void details.refetch()}
      />
    );
  const source = details.data;
  const initial: CompanyBody = source
    ? {
        ...source,
        addresses: source.addresses.map(
          ({
            label,
            line1,
            line2,
            city,
            region,
            postalCode,
            country,
            isDefault,
          }) => ({
            label,
            line1,
            line2,
            city,
            region,
            postalCode,
            country,
            isDefault,
          }),
        ),
      }
    : blank;
  return (
    <CompanyEditor key={id ?? 'new'} id={id} initial={initial} close={close} />
  );
}

function CompanyEditor({
  id,
  initial,
  close,
}: {
  id: string | null;
  initial: CompanyBody;
  close: () => void;
}) {
  const queryClient = useQueryClient();
  const form = useForm<CompanyBody>({
    initialValues: initial,
    validate: zod4Resolver(companyBody),
  });
  const mutation = useMutation({
    mutationFn: (body: CompanyBody) => {
      if (!id) return api.call(createCompany, { body });
      const { addresses: _addresses, ...changes } = body;
      void _addresses;
      return api.call(updateCompany, { params: { id }, body: changes });
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['companies'] });
      close();
    },
    onError: (error) => showApiError(error, form.setFieldError),
  });
  return (
    <Paper withBorder p="md">
      <form onSubmit={form.onSubmit((values) => mutation.mutate(values))}>
        <Stack>
          <Group justify="space-between">
            <Title order={2}>{id ? 'Edit company' : 'New company'}</Title>
            <Button variant="subtle" onClick={close}>
              Close
            </Button>
          </Group>
          <TextInput label="Name" required {...form.getInputProps('name')} />
          <Group grow>
            <TextInput
              label="Default delivery time"
              type="time"
              {...form.getInputProps('defaultDeliveryTime')}
            />
            <TextInput
              label="Lead minutes"
              type="number"
              value={form.values.deliveryLeadMinutes}
              onChange={(event) =>
                form.setFieldValue(
                  'deliveryLeadMinutes',
                  Number(event.currentTarget.value),
                )
              }
            />
          </Group>
          <TextInput
            label="Domains (comma separated)"
            value={form.values.domains.join(', ')}
            onChange={(event) =>
              form.setFieldValue(
                'domains',
                event.currentTarget.value
                  .split(',')
                  .map((value) => value.trim())
                  .filter(Boolean),
              )
            }
            error={form.errors.domains}
          />
          <TextInput
            label="Working days (1=Mon, 7=Sun)"
            value={form.values.workingDays.join(', ')}
            onChange={(event) =>
              form.setFieldValue(
                'workingDays',
                event.currentTarget.value
                  .split(',')
                  .map((value) => Number(value.trim())),
              )
            }
            error={form.errors.workingDays}
          />
          <Group grow>
            <TextInput
              label="Billing name"
              {...form.getInputProps('billingName')}
            />
            <TextInput
              label="Billing email"
              type="email"
              {...form.getInputProps('billingEmail')}
            />
          </Group>
          <Group grow>
            <TextInput
              label="Billing phone"
              {...form.getInputProps('billingPhone')}
            />
            <TextInput
              label="Billing address"
              {...form.getInputProps('billingAddress')}
            />
          </Group>
          <TextInput
            label="Driver instructions"
            {...form.getInputProps('driverInstructions')}
          />
          {!id && (
            <Paper withBorder p="sm">
              <Text fw={600}>First delivery address</Text>
              <Stack mt="sm">
                <TextInput
                  label="Label"
                  {...form.getInputProps('addresses.0.label')}
                />
                <TextInput
                  label="Line 1"
                  {...form.getInputProps('addresses.0.line1')}
                />
                <Group grow>
                  <TextInput
                    label="City"
                    {...form.getInputProps('addresses.0.city')}
                  />
                  <TextInput
                    label="Region"
                    {...form.getInputProps('addresses.0.region')}
                  />
                </Group>
                <Group grow>
                  <TextInput
                    label="Postal code"
                    {...form.getInputProps('addresses.0.postalCode')}
                  />
                  <TextInput
                    label="Country"
                    {...form.getInputProps('addresses.0.country')}
                  />
                </Group>
              </Stack>
            </Paper>
          )}
          <Switch
            label="Active"
            checked={form.values.isActive}
            onChange={(event) =>
              form.setFieldValue('isActive', event.currentTarget.checked)
            }
          />
          <Button type="submit" loading={mutation.isPending}>
            Save company
          </Button>
        </Stack>
      </form>
    </Paper>
  );
}

function CompanyExtras({ id }: { id: string }) {
  const queryClient = useQueryClient();
  const details = useQuery({
    queryKey: ['companies', 'detail', id],
    queryFn: () => api.call(getCompany, { params: { id } }),
  });
  const holidays = useQuery({
    queryKey: ['companies', id, 'holidays'],
    queryFn: () => api.call(listCompanyHolidays, { params: { id } }),
  });
  const [date, setDate] = useState('');
  const [name, setName] = useState('');
  const [label, setLabel] = useState('');
  const [line1, setLine1] = useState('');
  const [city, setCity] = useState('');
  const [region, setRegion] = useState('');
  const [postalCode, setPostalCode] = useState('');
  const holidayMutation = useMutation({
    mutationFn: () =>
      api.call(createCompanyHoliday, { params: { id }, body: { date, name } }),
    onSuccess: () => {
      setDate('');
      setName('');
      void queryClient.invalidateQueries({
        queryKey: ['companies', id, 'holidays'],
      });
    },
    onError: (error) => showApiError(error),
  });
  const deleteHolidayMutation = useMutation({
    mutationFn: (holidayId: string) =>
      api.call(deleteCompanyHoliday, { params: { id: holidayId } }),
    onSuccess: () =>
      void queryClient.invalidateQueries({
        queryKey: ['companies', id, 'holidays'],
      }),
    onError: (error) => showApiError(error),
  });
  const addressMutation = useMutation({
    mutationFn: () =>
      api.call(createCompanyAddress, {
        params: { id },
        body: {
          label,
          line1,
          line2: null,
          city,
          region,
          postalCode,
          country: 'US',
          isDefault: false,
        },
      }),
    onSuccess: () => {
      setLabel('');
      setLine1('');
      setCity('');
      setRegion('');
      setPostalCode('');
      void queryClient.invalidateQueries({
        queryKey: ['companies', 'detail', id],
      });
    },
    onError: (error) => showApiError(error),
  });
  const setDefault = useMutation({
    mutationFn: (addressId: string) =>
      api.call(updateCompanyAddress, {
        params: { id: addressId },
        body: { isDefault: true },
      }),
    onSuccess: () =>
      void queryClient.invalidateQueries({
        queryKey: ['companies', 'detail', id],
      }),
    onError: (error) => showApiError(error),
  });
  return (
    <Stack>
      <Paper withBorder p="md">
        <Title order={3}>Addresses</Title>
        {details.isLoading ? (
          <LoadingState />
        ) : details.isError ? (
          <ErrorState retry={() => void details.refetch()} />
        ) : details.data?.addresses.length ? (
          details.data.addresses.map((address) => (
            <Group key={address.id} justify="space-between" py="xs">
              <Text>
                {address.label}: {address.line1}, {address.city}{' '}
                {address.postalCode}
                {address.isDefault ? ' (default)' : ''}
              </Text>
              {!address.isDefault && (
                <Button size="xs" onClick={() => setDefault.mutate(address.id)}>
                  Make default
                </Button>
              )}
            </Group>
          ))
        ) : (
          <EmptyState />
        )}
        <Group mt="md" align="end">
          <TextInput
            label="Label"
            value={label}
            onChange={(event) => setLabel(event.currentTarget.value)}
          />
          <TextInput
            label="Line 1"
            value={line1}
            onChange={(event) => setLine1(event.currentTarget.value)}
          />
          <TextInput
            label="City"
            value={city}
            onChange={(event) => setCity(event.currentTarget.value)}
          />
          <TextInput
            label="Region"
            value={region}
            onChange={(event) => setRegion(event.currentTarget.value)}
          />
          <TextInput
            label="Postal code"
            value={postalCode}
            onChange={(event) => setPostalCode(event.currentTarget.value)}
          />
          <Button
            disabled={!label || !line1 || !city || !region || !postalCode}
            loading={addressMutation.isPending}
            onClick={() => addressMutation.mutate()}
          >
            Add address
          </Button>
        </Group>
      </Paper>
      <Paper withBorder p="md">
        <Title order={3}>Company holidays</Title>
        {holidays.isLoading ? (
          <LoadingState />
        ) : holidays.isError ? (
          <ErrorState retry={() => void holidays.refetch()} />
        ) : holidays.data?.length ? (
          holidays.data.map((holiday) => (
            <Group key={holiday.id} justify="space-between" py="xs">
              <Text>
                {holiday.date}: {holiday.name}
              </Text>
              <Button
                size="xs"
                color="red"
                variant="subtle"
                onClick={() => deleteHolidayMutation.mutate(holiday.id)}
              >
                Delete
              </Button>
            </Group>
          ))
        ) : (
          <EmptyState message="No holidays." />
        )}
        <Group mt="md" align="end">
          <TextInput
            type="date"
            label="Date"
            value={date}
            onChange={(event) => setDate(event.currentTarget.value)}
          />
          <TextInput
            label="Name"
            value={name}
            onChange={(event) => setName(event.currentTarget.value)}
          />
          <Button
            disabled={!date || !name}
            loading={holidayMutation.isPending}
            onClick={() => holidayMutation.mutate()}
          >
            Add holiday
          </Button>
        </Group>
      </Paper>
    </Stack>
  );
}

export function CompaniesScreen() {
  const session = useSession();
  const allowed = session.data && can(session.data, PERM.companies.read);
  const manage = session.data && can(session.data, PERM.companies.manage);
  const state = useTableState(['q']);
  const [editing, setEditing] = useState<string | null | undefined>(undefined);
  const companies = useQuery({
    queryKey: ['companies', 'list', state],
    queryFn: () =>
      api.call(listCompanies, {
        query: {
          page: state.page,
          pageSize: state.pageSize,
          sort: state.sort,
          q: state.filters.q || undefined,
        },
      }),
    enabled: !!allowed,
  });
  if (session.isLoading) return <LoadingState />;
  if (!session.data) return <ErrorState message="Sign in to view companies." />;
  if (!allowed)
    return (
      <Alert color="yellow">
        You do not have permission to view companies.
      </Alert>
    );
  return (
    <Stack>
      <Group justify="space-between">
        <Title order={1}>Companies</Title>
        {manage && (
          <Button onClick={() => setEditing(null)}>New company</Button>
        )}
      </Group>
      <ServerTable
        columns={[
          {
            key: 'name',
            label: 'Name',
            render: (row) => row.name,
            sortKey: 'name',
          },
          {
            key: 'domains',
            label: 'Domains',
            render: (row) => row.domains.join(', '),
          },
          {
            key: 'active',
            label: 'Status',
            render: (row) => (row.isActive ? 'Active' : 'Inactive'),
          },
          {
            key: 'actions',
            label: '',
            render: (row) => (
              <Button
                size="xs"
                variant="subtle"
                onClick={() => setEditing(row.id)}
              >
                Open
              </Button>
            ),
          },
        ]}
        items={companies.data?.items ?? []}
        total={companies.data?.total ?? 0}
        rowKey={(row) => row.id}
        filterKeys={['q']}
        loading={companies.isLoading}
        error={companies.isError}
        retry={() => void companies.refetch()}
      />
      {editing !== undefined && (
        <>
          {manage ? (
            <CompanyForm id={editing} close={() => setEditing(undefined)} />
          ) : editing ? (
            <CompanyReadOnly id={editing} />
          ) : null}
          {editing && manage && <CompanyExtras id={editing} />}
        </>
      )}
    </Stack>
  );
}

function CompanyReadOnly({ id }: { id: string }) {
  const company = useQuery({
    queryKey: ['companies', 'detail', id],
    queryFn: () => api.call(getCompany, { params: { id } }),
  });
  if (company.isLoading) return <LoadingState />;
  if (company.isError)
    return <ErrorState retry={() => void company.refetch()} />;
  return (
    <Paper withBorder p="md">
      <Title order={2}>{company.data?.name}</Title>
      <Text>{company.data?.domains.join(', ')}</Text>
      <Text>Default delivery: {company.data?.defaultDeliveryTime}</Text>
      <Text>
        Addresses:{' '}
        {company.data?.addresses.map((address) => address.label).join(', ')}
      </Text>
    </Paper>
  );
}
