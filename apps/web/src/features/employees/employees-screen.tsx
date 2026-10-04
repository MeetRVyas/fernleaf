'use client';

import { useState } from 'react';
import {
  Alert,
  Button,
  Group,
  Paper,
  Select,
  Stack,
  Switch,
  TextInput,
  Title,
} from '@mantine/core';
import { useForm } from '@mantine/form';
import { zod4Resolver } from 'mantine-form-zod-resolver';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  can,
  PERM,
  createEmployee,
  employeeBody,
  getEmployee,
  listCompanies,
  listEmployees,
  updateEmployee,
  type InputOf,
} from '@fernleaf/shared';
import { api } from '../../lib/api';
import { useSession } from '../../lib/auth';
import { readApiError, showApiError } from '../../lib/errors';
import { EmptyState, ErrorState, LoadingState } from '../../components/states';
import { ServerTable, useTableState } from '../../components/server-table';

type EmployeeBody = InputOf<typeof createEmployee>['body'];
const blank: EmployeeBody = {
  companyId: '',
  name: '',
  email: '',
  phone: null,
  canChooseAddress: false,
  canChangeDeliveryTime: false,
  canChangePackaging: false,
  allergenIds: [],
  dietaryTagIds: [],
  isActive: true,
};

function EmployeeEditor({
  id,
  close,
}: {
  id: string | null;
  close: () => void;
}) {
  const employee = useQuery({
    queryKey: ['employees', 'detail', id],
    queryFn: () => api.call(getEmployee, { params: { id: id! } }),
    enabled: !!id,
  });
  const companies = useQuery({
    queryKey: ['companies', 'options'],
    queryFn: () =>
      api.call(listCompanies, { query: { page: 1, pageSize: 100 } }),
  });
  if ((id && employee.isLoading) || companies.isLoading)
    return <LoadingState />;
  if (employee.isError || companies.isError)
    return (
      <ErrorState
        message={readApiError(employee.error ?? companies.error).message}
        retry={() => {
          void employee.refetch();
          void companies.refetch();
        }}
      />
    );
  return (
    <EmployeeForm
      key={id ?? 'new'}
      id={id}
      initial={employee.data ?? blank}
      companyOptions={
        companies.data?.items.map((company) => ({
          value: company.id,
          label: company.name,
        })) ?? []
      }
      close={close}
    />
  );
}

function EmployeeForm({
  id,
  initial,
  companyOptions,
  close,
}: {
  id: string | null;
  initial: EmployeeBody;
  companyOptions: { value: string; label: string }[];
  close: () => void;
}) {
  const form = useForm<EmployeeBody>({
    initialValues: initial,
    validate: zod4Resolver(employeeBody),
  });
  const queryClient = useQueryClient();
  const mutation = useMutation({
    mutationFn: (body: EmployeeBody) =>
      id
        ? api.call(updateEmployee, { params: { id }, body })
        : api.call(createEmployee, { body }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['employees'] });
      close();
    },
    onError: (error) => showApiError(error, form.setFieldError),
  });
  return (
    <Paper withBorder p="md">
      <form onSubmit={form.onSubmit((values) => mutation.mutate(values))}>
        <Stack>
          <Group justify="space-between">
            <Title order={2}>{id ? 'Edit employee' : 'New employee'}</Title>
            <Button variant="subtle" onClick={close}>
              Close
            </Button>
          </Group>
          <Select
            label="Company"
            required
            data={companyOptions}
            value={form.values.companyId || null}
            onChange={(value) => form.setFieldValue('companyId', value ?? '')}
            error={form.errors.companyId}
            searchable
          />
          <TextInput label="Name" required {...form.getInputProps('name')} />
          <TextInput
            label="Email"
            type="email"
            required
            {...form.getInputProps('email')}
          />
          <TextInput
            label="Phone"
            value={form.values.phone ?? ''}
            onChange={(event) =>
              form.setFieldValue('phone', event.currentTarget.value || null)
            }
          />
          <Switch
            label="Can choose delivery address"
            checked={form.values.canChooseAddress}
            onChange={(event) =>
              form.setFieldValue(
                'canChooseAddress',
                event.currentTarget.checked,
              )
            }
          />
          <Switch
            label="Can change delivery time"
            checked={form.values.canChangeDeliveryTime}
            onChange={(event) =>
              form.setFieldValue(
                'canChangeDeliveryTime',
                event.currentTarget.checked,
              )
            }
          />
          <Switch
            label="Can change packaging"
            checked={form.values.canChangePackaging}
            onChange={(event) =>
              form.setFieldValue(
                'canChangePackaging',
                event.currentTarget.checked,
              )
            }
          />
          <Switch
            label="Active"
            checked={form.values.isActive}
            onChange={(event) =>
              form.setFieldValue('isActive', event.currentTarget.checked)
            }
          />
          <Button type="submit" loading={mutation.isPending}>
            Save employee
          </Button>
        </Stack>
      </form>
    </Paper>
  );
}

export function EmployeesScreen() {
  const session = useSession();
  const allowed = session.data && can(session.data, PERM.employees.read);
  const manage = session.data && can(session.data, PERM.employees.manage);
  const state = useTableState(['q', 'companyId']);
  const [editing, setEditing] = useState<string | null | undefined>(undefined);
  const employees = useQuery({
    queryKey: ['employees', 'list', state],
    queryFn: () =>
      api.call(listEmployees, {
        query: {
          page: state.page,
          pageSize: state.pageSize,
          sort: state.sort,
          q: state.filters.q || undefined,
          companyId: state.filters.companyId || undefined,
        },
      }),
    enabled: !!allowed,
  });
  if (session.isLoading) return <LoadingState />;
  if (!session.data) return <ErrorState message="Sign in to view employees." />;
  if (!allowed)
    return (
      <Alert color="yellow">
        You do not have permission to view employees.
      </Alert>
    );
  return (
    <Stack>
      <Group justify="space-between">
        <Title order={1}>Employees</Title>
        {manage && (
          <Button onClick={() => setEditing(null)}>New employee</Button>
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
          { key: 'email', label: 'Email', render: (row) => row.email },
          {
            key: 'active',
            label: 'Status',
            render: (row) => (row.isActive ? 'Active' : 'Inactive'),
          },
          {
            key: 'action',
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
        items={employees.data?.items ?? []}
        total={employees.data?.total ?? 0}
        rowKey={(row) => row.id}
        filterKeys={['q', 'companyId']}
        loading={employees.isLoading}
        error={employees.isError}
        retry={() => void employees.refetch()}
      />
      {editing !== undefined &&
        (manage ? (
          <EmployeeEditor id={editing} close={() => setEditing(undefined)} />
        ) : editing ? (
          <EmployeeReadOnly id={editing} />
        ) : (
          <EmptyState />
        ))}
    </Stack>
  );
}

function EmployeeReadOnly({ id }: { id: string }) {
  const employee = useQuery({
    queryKey: ['employees', 'detail', id],
    queryFn: () => api.call(getEmployee, { params: { id } }),
  });
  if (employee.isLoading) return <LoadingState />;
  if (employee.isError)
    return <ErrorState retry={() => void employee.refetch()} />;
  return (
    <Paper withBorder p="md">
      <Title order={2}>{employee.data?.name}</Title>
      <div>{employee.data?.email}</div>
    </Paper>
  );
}
