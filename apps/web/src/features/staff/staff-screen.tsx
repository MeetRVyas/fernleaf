'use client';

import { can, changeRole, createStaff, deactivateStaff, listStaff, PERM, resetStaffPassword, ROLES, staffPublic, type Role } from '@fernleaf/shared';
import { Button, Group, Modal, Paper, PasswordInput, Select, Stack, Text, TextInput, Title } from '@mantine/core';
import { useForm } from '@mantine/form';
import { notifications } from '@mantine/notifications';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { zod4Resolver } from 'mantine-form-zod-resolver';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { ProtectedShell } from '../../components/app-shell';
import { ServerTable, useTableState, type TableColumn } from '../../components/server-table';
import { ErrorState, LoadingState } from '../../components/states';
import { api } from '../../lib/api';
import { useSession } from '../../lib/auth';
import { readApiError, showApiError } from '../../lib/errors';

type Staff = ReturnType<typeof staffPublic.parse>;

export function StaffScreen() {
  const session = useSession();
  const router = useRouter();
  const state = useTableState([]);
  const queryClient = useQueryClient();
  const [creating, setCreating] = useState(false);
  const [resetTarget, setResetTarget] = useState<Staff | null>(null);
  const list = useQuery({
    queryKey: ['staff', 'list', state.page, state.pageSize],
    queryFn: () => api.call(listStaff, { query: { page: state.page, pageSize: state.pageSize } }),
    enabled: session.isSuccess && can(session.data, PERM.staff.list),
  });
  const refresh = () => queryClient.invalidateQueries({ queryKey: ['staff', 'list'] });
  const create = useMutation({ mutationFn: (body: typeof createStaff.body._output) => api.call(createStaff, { body }), onSuccess: refresh });
  const role = useMutation({ mutationFn: ({ id, next }: { id: string; next: Role }) => api.call(changeRole, { params: { id }, body: { role: next } }), onSuccess: refresh });
  const deactivate = useMutation({ mutationFn: (id: string) => api.call(deactivateStaff, { params: { id } }), onSuccess: refresh });
  const reset = useMutation({ mutationFn: ({ id, password }: { id: string; password: string }) => api.call(resetStaffPassword, { params: { id }, body: { password } }) });
  const createForm = useForm({
    initialValues: { name: '', email: '', role: 'KITCHEN' as Role, password: '' },
    validate: zod4Resolver(createStaff.body),
  });
  const resetForm = useForm({ initialValues: { password: '' }, validate: zod4Resolver(resetStaffPassword.body) });

  useEffect(() => {
    if (session.isError && readApiError(session.error).code === 'UNAUTHENTICATED') router.replace('/login');
  }, [router, session.isError, session.error]);

  if (session.isPending) return <LoadingState />;
  if (session.isError) return readApiError(session.error).code === 'UNAUTHENTICATED' ? <LoadingState /> : <ErrorState retry={() => { void session.refetch(); }} />;
  if (!can(session.data, PERM.staff.list)) return <ProtectedShell><Text>Access denied.</Text></ProtectedShell>;

  const columns: TableColumn<Staff>[] = [
    { key: 'name', label: 'Name', render: staff => staff.name },
    { key: 'email', label: 'Email', render: staff => staff.email },
    { key: 'role', label: 'Role', render: staff => <Select aria-label={`Role for ${staff.name}`} w={145} data={[...ROLES]} value={staff.role} disabled={!staff.isActive || role.isPending || !can(session.data, PERM.staff.role)} onChange={next => {
      if (next && next !== staff.role) role.mutate({ id: staff.id, next: next as Role }, { onError: error => showApiError(error) });
    }} /> },
    { key: 'status', label: 'Status', render: staff => staff.isActive ? 'Active' : 'Inactive' },
    { key: 'actions', label: 'Actions', render: staff => <Group gap="xs">
      <Button size="xs" variant="light" disabled={!staff.isActive || !can(session.data, PERM.staff.resetPassword)} onClick={() => { resetForm.reset(); setResetTarget(staff); }}>Reset password</Button>
      <Button size="xs" variant="light" color="red" disabled={!staff.isActive || deactivate.isPending || !can(session.data, PERM.staff.deactivate)} onClick={() => {
        if (globalThis.confirm(`Deactivate ${staff.name}?`)) deactivate.mutate(staff.id, { onError: error => showApiError(error) });
      }}>Deactivate</Button>
    </Group> },
  ];

  return <ProtectedShell>
    <Group justify="space-between" mb="lg"><Title order={2}>Staff</Title>
      {can(session.data, PERM.staff.create) && <Button onClick={() => { createForm.reset(); setCreating(true); }}>Add staff</Button>}
    </Group>
    <Paper withBorder p="md"><ServerTable columns={columns} items={list.data?.items ?? []} total={list.data?.total ?? 0} rowKey={staff => staff.id} loading={list.isPending} error={list.isError} retry={() => { void list.refetch(); }} /></Paper>

    <Modal opened={creating} onClose={() => setCreating(false)} title="Add staff" centered>
      <form onSubmit={createForm.onSubmit(values => { create.mutate(values, { onSuccess: () => { setCreating(false); notifications.show({ message: 'Staff account created.' }); }, onError: error => showApiError(error, createForm.setFieldError) }); })}>
        <Stack><TextInput label="Name" required {...createForm.getInputProps('name')} />
          <TextInput label="Email" type="email" required {...createForm.getInputProps('email')} />
          <Select label="Role" required data={[...ROLES]} {...createForm.getInputProps('role')} />
          <PasswordInput label="Initial password" required {...createForm.getInputProps('password')} />
          <Button type="submit" loading={create.isPending}>Create account</Button>
        </Stack>
      </form>
    </Modal>

    <Modal opened={resetTarget !== null} onClose={() => setResetTarget(null)} title={`Reset password${resetTarget ? ` for ${resetTarget.name}` : ''}`} centered>
      <form onSubmit={resetForm.onSubmit(values => { if (!resetTarget) return; reset.mutate({ id: resetTarget.id, password: values.password }, { onSuccess: () => { setResetTarget(null); notifications.show({ message: 'Password reset.' }); }, onError: error => showApiError(error, resetForm.setFieldError) }); })}>
        <Stack><PasswordInput label="New password" required {...resetForm.getInputProps('password')} />
          <Button type="submit" loading={reset.isPending}>Reset password</Button>
        </Stack>
      </form>
    </Modal>
  </ProtectedShell>;
}
