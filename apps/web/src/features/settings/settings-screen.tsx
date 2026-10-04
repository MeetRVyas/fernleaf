'use client';

import { useState } from 'react';
import {
  Alert,
  Button,
  Group,
  Paper,
  Stack,
  Switch,
  Table,
  Text,
  TextInput,
  Title,
} from '@mantine/core';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  can,
  PERM,
  createKitchenHoliday,
  deleteKitchenHoliday,
  listKitchenHolidays,
  listSettings,
  settingValueSchemas,
  updateSetting,
  type SettingKey,
} from '@fernleaf/shared';
import { api } from '../../lib/api';
import { useSession } from '../../lib/auth';
import { readApiError, showApiError } from '../../lib/errors';
import { EmptyState, ErrorState, LoadingState } from '../../components/states';

function SettingEditor({
  setting,
}: {
  setting: {
    key: SettingKey;
    value: string | number | boolean | number[];
    updatedAt: string;
  };
}) {
  const queryClient = useQueryClient();
  const [value, setValue] = useState(
    Array.isArray(setting.value)
      ? setting.value.join(', ')
      : String(setting.value),
  );
  const [error, setError] = useState('');
  const mutation = useMutation({
    mutationFn: (next: string | number | boolean | number[]) =>
      api.call(updateSetting, {
        params: { key: setting.key },
        body: { value: next },
      }),
    onSuccess: () => {
      setError('');
      void queryClient.invalidateQueries({ queryKey: ['settings'] });
    },
    onError: (error) => showApiError(error),
  });
  const save = () => {
    let parsed: unknown = value;
    if (setting.key === 'kitchen.workingDays')
      parsed = value.split(',').map((item) => Number(item.trim()));
    else if (typeof setting.value === 'number') parsed = Number(value);
    else if (typeof setting.value === 'boolean') parsed = value === 'true';
    const result =
      settingValueSchemas[setting.key as SettingKey].safeParse(parsed);
    if (!result.success) {
      setError(result.error.issues[0]?.message ?? 'Invalid value');
      return;
    }
    mutation.mutate(result.data);
  };
  return (
    <Table.Tr>
      <Table.Td>{setting.key}</Table.Td>
      <Table.Td>
        {typeof setting.value === 'boolean' ? (
          <Switch
            checked={value === 'true'}
            onChange={(event) => setValue(String(event.currentTarget.checked))}
            aria-label={setting.key}
          />
        ) : (
          <TextInput
            value={value}
            onChange={(event) => setValue(event.currentTarget.value)}
            aria-label={setting.key}
            error={error}
          />
        )}
      </Table.Td>
      <Table.Td>
        <Button size="xs" onClick={save} loading={mutation.isPending}>
          Save
        </Button>
      </Table.Td>
    </Table.Tr>
  );
}

export function SettingsScreen() {
  const session = useSession();
  const allowed = session.data && can(session.data, PERM.settings.read);
  const canManage = session.data && can(session.data, PERM.settings.manage);
  const settings = useQuery({
    queryKey: ['settings', 'list'],
    queryFn: () => api.call(listSettings),
    enabled: !!allowed,
  });
  const holidays = useQuery({
    queryKey: ['settings', 'holidays'],
    queryFn: () => api.call(listKitchenHolidays),
    enabled: !!allowed,
  });
  const queryClient = useQueryClient();
  const [date, setDate] = useState('');
  const [name, setName] = useState('');
  const create = useMutation({
    mutationFn: () => api.call(createKitchenHoliday, { body: { date, name } }),
    onSuccess: () => {
      setDate('');
      setName('');
      void queryClient.invalidateQueries({
        queryKey: ['settings', 'holidays'],
      });
    },
    onError: (error) => showApiError(error),
  });
  const remove = useMutation({
    mutationFn: (id: string) =>
      api.call(deleteKitchenHoliday, { params: { id } }),
    onSuccess: () =>
      void queryClient.invalidateQueries({
        queryKey: ['settings', 'holidays'],
      }),
    onError: (error) => showApiError(error),
  });
  if (session.isLoading) return <LoadingState />;
  if (!session.data) return <ErrorState message="Sign in to view settings." />;
  if (!allowed)
    return (
      <Alert color="yellow">You do not have permission to view settings.</Alert>
    );
  return (
    <Stack>
      <Title order={1}>Settings</Title>
      <Paper withBorder p="md">
        <Title order={2} mb="md">
          Kitchen and delivery
        </Title>
        {settings.isLoading ? (
          <LoadingState />
        ) : settings.isError ? (
          <ErrorState
            message={readApiError(settings.error).message}
            retry={() => void settings.refetch()}
          />
        ) : settings.data?.length ? (
          <Table>
            <Table.Thead>
              <Table.Tr>
                <Table.Th>Setting</Table.Th>
                <Table.Th>Value</Table.Th>
                <Table.Th />
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {settings.data.map((setting) =>
                canManage ? (
                  <SettingEditor
                    key={`${setting.key}:${setting.updatedAt}`}
                    setting={setting}
                  />
                ) : (
                  <Table.Tr key={setting.key}>
                    <Table.Td>{setting.key}</Table.Td>
                    <Table.Td>{String(setting.value)}</Table.Td>
                    <Table.Td />
                  </Table.Tr>
                ),
              )}
            </Table.Tbody>
          </Table>
        ) : (
          <EmptyState />
        )}
      </Paper>
      <Paper withBorder p="md">
        <Title order={2} mb="md">
          Kitchen holidays
        </Title>
        {holidays.isLoading ? (
          <LoadingState />
        ) : holidays.isError ? (
          <ErrorState
            message={readApiError(holidays.error).message}
            retry={() => void holidays.refetch()}
          />
        ) : holidays.data?.length ? (
          <Table>
            <Table.Thead>
              <Table.Tr>
                <Table.Th>Date</Table.Th>
                <Table.Th>Name</Table.Th>
                <Table.Th />
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {holidays.data.map((holiday) => (
                <Table.Tr key={holiday.id}>
                  <Table.Td>{holiday.date}</Table.Td>
                  <Table.Td>{holiday.name}</Table.Td>
                  <Table.Td>
                    {canManage && (
                      <Button
                        size="xs"
                        color="red"
                        variant="subtle"
                        onClick={() => remove.mutate(holiday.id)}
                      >
                        Delete
                      </Button>
                    )}
                  </Table.Td>
                </Table.Tr>
              ))}
            </Table.Tbody>
          </Table>
        ) : (
          <EmptyState message="No kitchen holidays." />
        )}
        {canManage && (
          <Group mt="md" align="end">
            <TextInput
              type="date"
              label="Date"
              value={date}
              onChange={(event) => setDate(event.currentTarget.value)}
            />
            <TextInput
              label="Holiday name"
              value={name}
              onChange={(event) => setName(event.currentTarget.value)}
            />
            <Button
              loading={create.isPending}
              disabled={!date || !name.trim()}
              onClick={() => create.mutate()}
            >
              Add holiday
            </Button>
          </Group>
        )}
        <Text size="sm" c="dimmed" mt="sm">
          Holidays are excluded when calculating kitchen working days.
        </Text>
      </Paper>
    </Stack>
  );
}
