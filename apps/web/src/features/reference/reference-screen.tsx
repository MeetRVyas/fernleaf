'use client';

import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Button,
  Checkbox,
  Group,
  Paper,
  Stack,
  Text,
  TextInput,
  Title,
} from '@mantine/core';
import { useForm } from '@mantine/form';
import { zod4Resolver } from 'mantine-form-zod-resolver';
import {
  can,
  PERM,
  referenceBody,
  listAllergens,
  createAllergen,
  updateAllergen,
  listDietaryTags,
  createDietaryTag,
  updateDietaryTag,
  listKitchenStations,
  createKitchenStation,
  updateKitchenStation,
} from '@fernleaf/shared';
import { api } from '../../lib/api';
import { useSession } from '../../lib/auth';
import { showApiError } from '../../lib/errors';
import { ServerTable, useTableState } from '../../components/server-table';
import { ErrorState, LoadingState } from '../../components/states';

type Kind = 'allergens' | 'dietary-tags' | 'kitchen-stations';
type Item = { id: string; name: string; isActive: boolean };
const labels: Record<Kind, string> = {
  allergens: 'Allergens',
  'dietary-tags': 'Dietary tags',
  'kitchen-stations': 'Kitchen stations',
};

function list(
  kind: Kind,
  query: { page: number; pageSize: number; sort?: string },
) {
  if (kind === 'allergens') return api.call(listAllergens, { query });
  if (kind === 'dietary-tags') return api.call(listDietaryTags, { query });
  return api.call(listKitchenStations, { query });
}
function create(kind: Kind, body: { name: string; isActive: boolean }) {
  if (kind === 'allergens') return api.call(createAllergen, { body });
  if (kind === 'dietary-tags') return api.call(createDietaryTag, { body });
  return api.call(createKitchenStation, { body });
}
function update(kind: Kind, id: string, body: { name: string }) {
  if (kind === 'allergens')
    return api.call(updateAllergen, { params: { id }, body });
  if (kind === 'dietary-tags')
    return api.call(updateDietaryTag, { params: { id }, body });
  return api.call(updateKitchenStation, { params: { id }, body });
}

export function ReferenceScreen({ kind }: { kind: Kind }) {
  const session = useSession();
  const table = useTableState([]);
  const queryClient = useQueryClient();
  const [editing, setEditing] = useState<Item | null>(null);
  const form = useForm({
    initialValues: { name: '', isActive: true },
    validate: zod4Resolver(referenceBody),
  });
  const query = useQuery({
    queryKey: ['reference', kind, table.page, table.pageSize, table.sort],
    queryFn: () =>
      list(kind, {
        page: table.page,
        pageSize: table.pageSize,
        sort: table.sort,
      }),
  });
  const mutation = useMutation({
    mutationFn: (name: string) =>
      editing
        ? update(kind, editing.id, { name })
        : create(kind, { name, isActive: true }),
    onSuccess: () => {
      form.reset();
      setEditing(null);
      void queryClient.invalidateQueries({ queryKey: ['reference', kind] });
    },
  });
  if (session.isPending) return <LoadingState />;
  if (session.isError)
    return (
      <ErrorState
        retry={() => {
          void session.refetch();
        }}
      />
    );
  if (!can(session.data, PERM.reference.read))
    return <ErrorState message="You do not have access to this page." />;
  const manage = can(session.data, PERM.reference.manage);
  return (
    <Stack>
      <Title order={2}>{labels[kind]}</Title>
      {manage && (
        <Paper withBorder p="md">
          <form
            onSubmit={form.onSubmit((values) => {
              void mutation
                .mutateAsync(values.name)
                .catch((error) => showApiError(error, form.setFieldError));
            })}
          >
            <Group align="end">
              <TextInput
                label={editing ? 'Rename' : 'New name'}
                required
                {...form.getInputProps('name')}
              />
              <Button type="submit" loading={mutation.isPending}>
                {editing ? 'Save' : 'Add'}
              </Button>
              {editing && (
                <Button
                  variant="default"
                  onClick={() => {
                    setEditing(null);
                    form.reset();
                  }}
                >
                  Cancel
                </Button>
              )}
            </Group>
            <Checkbox mt="sm" label="Active" checked disabled />
            <Text size="xs" c="dimmed">
              Deactivation will be available after the reference schema update.
            </Text>
          </form>
        </Paper>
      )}
      <ServerTable
        items={query.data?.items ?? []}
        total={query.data?.total ?? 0}
        rowKey={(item) => item.id}
        loading={query.isPending}
        error={query.isError}
        retry={() => {
          void query.refetch();
        }}
        columns={[
          {
            key: 'name',
            label: 'Name',
            sortKey: 'name',
            render: (item) => item.name,
          },
          {
            key: 'status',
            label: 'Status',
            render: (item) => (item.isActive ? 'Active' : 'Inactive'),
          },
          ...(manage
            ? [
                {
                  key: 'edit',
                  label: '',
                  render: (item: Item) => (
                    <Button
                      variant="subtle"
                      size="xs"
                      onClick={() => {
                        setEditing(item);
                        form.setValues({
                          name: item.name,
                          isActive: item.isActive,
                        });
                      }}
                    >
                      Edit
                    </Button>
                  ),
                },
              ]
            : []),
        ]}
      />
    </Stack>
  );
}
