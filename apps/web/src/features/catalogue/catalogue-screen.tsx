'use client';

import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Button,
  Group,
  MultiSelect,
  NumberInput,
  Paper,
  Select,
  Stack,
  Switch,
  Tabs,
  TextInput,
  Textarea,
  Title,
} from '@mantine/core';
import { useForm } from '@mantine/form';
import { zod4Resolver } from 'mantine-form-zod-resolver';
import {
  can,
  PERM,
  dishBody,
  optionBody,
  optionGroupBody,
  listDishes,
  createDish,
  updateDish,
  listOptions,
  createOption,
  updateOption,
  listGroups,
  createGroup,
  updateGroup,
  deleteGroup,
  listAllergens,
  listDietaryTags,
  listKitchenStations,
} from '@fernleaf/shared';
import { api } from '../../lib/api';
import { useSession } from '../../lib/auth';
import { showApiError } from '../../lib/errors';
import { ServerTable, useTableState } from '../../components/server-table';
import { ErrorState, LoadingState } from '../../components/states';

type Dish = typeof dishBody._output & { id: string };
type Option = typeof optionBody._output & { id: string };
type GroupItem = typeof optionGroupBody._output & {
  id: string;
  dishId: string;
};

function useReferences() {
  return useQuery({
    queryKey: ['reference', 'catalogue-form'],
    queryFn: async () => {
      const [allergens, tags, stations] = await Promise.all([
        api.call(listAllergens, { query: { page: 1, pageSize: 100 } }),
        api.call(listDietaryTags, { query: { page: 1, pageSize: 100 } }),
        api.call(listKitchenStations, { query: { page: 1, pageSize: 100 } }),
      ]);
      return {
        allergens: allergens.items,
        tags: tags.items,
        stations: stations.items,
      };
    },
  });
}

export function CatalogueScreen() {
  const session = useSession();
  if (session.isPending) return <LoadingState />;
  if (session.isError)
    return (
      <ErrorState
        retry={() => {
          void session.refetch();
        }}
      />
    );
  if (!can(session.data, PERM.catalogue.read))
    return <ErrorState message="You do not have access to this page." />;
  const manage = can(session.data, PERM.catalogue.manage);
  return (
    <Stack>
      <Title order={2}>Catalogue</Title>
      <Tabs defaultValue="dishes">
        <Tabs.List>
          <Tabs.Tab value="dishes">Dishes</Tabs.Tab>
          <Tabs.Tab value="options">Options</Tabs.Tab>
        </Tabs.List>
        <Tabs.Panel value="dishes" pt="md">
          <DishesPanel manage={manage} />
        </Tabs.Panel>
        <Tabs.Panel value="options" pt="md">
          <OptionsPanel manage={manage} />
        </Tabs.Panel>
      </Tabs>
    </Stack>
  );
}

function DishesPanel({ manage }: { manage: boolean }) {
  const table = useTableState(['q']);
  const client = useQueryClient();
  const references = useReferences();
  const [editing, setEditing] = useState<Dish | null>(null);
  const query = useQuery({
    queryKey: [
      'catalogue',
      'dishes',
      table.page,
      table.pageSize,
      table.sort,
      table.filters.q,
    ],
    queryFn: () =>
      api.call(listDishes, {
        query: {
          page: table.page,
          pageSize: table.pageSize,
          sort: table.sort,
          q: table.filters.q || undefined,
        },
      }),
  });
  const form = useForm({
    initialValues: {
      name: '',
      description: '',
      imageUrl: null as string | null,
      sku: '',
      temperature: 'HOT' as 'HOT' | 'COLD',
      costCents: 0,
      stationId: null as string | null,
      minOrderQty: 1,
      allergenIds: [] as string[],
      dietaryTagIds: [] as string[],
      isActive: true,
    },
    validate: zod4Resolver(dishBody),
  });
  const mutation = useMutation({
    mutationFn: (values: typeof form.values) =>
      editing
        ? api.call(updateDish, { params: { id: editing.id }, body: values })
        : api.call(createDish, { body: values }),
    onSuccess: () => {
      setEditing(null);
      form.reset();
      void client.invalidateQueries({ queryKey: ['catalogue', 'dishes'] });
    },
  });
  const selectDish = (dish: Dish) => {
    setEditing(dish);
    form.setValues(dish);
  };
  return (
    <Stack>
      {references.isError && (
        <ErrorState
          message="Could not load reference choices."
          retry={() => {
            void references.refetch();
          }}
        />
      )}
      {manage && (
        <Paper withBorder p="md">
          <form
            onSubmit={form.onSubmit((values) => {
              void mutation
                .mutateAsync(values)
                .catch((error) => showApiError(error, form.setFieldError));
            })}
          >
            <Stack>
              <Title order={4}>{editing ? 'Edit dish' : 'New dish'}</Title>
              <Group grow>
                <TextInput
                  label="Name"
                  required
                  {...form.getInputProps('name')}
                />
                <TextInput
                  label="SKU"
                  required
                  {...form.getInputProps('sku')}
                />
              </Group>
              <Textarea
                label="Description"
                {...form.getInputProps('description')}
              />
              <TextInput
                label="Image URL"
                value={form.values.imageUrl ?? ''}
                onChange={(event) =>
                  form.setFieldValue(
                    'imageUrl',
                    event.currentTarget.value || null,
                  )
                }
                error={form.errors.imageUrl}
              />
              <Group grow>
                <Select
                  label="Temperature"
                  data={['HOT', 'COLD']}
                  value={form.values.temperature}
                  onChange={(value) =>
                    form.setFieldValue(
                      'temperature',
                      value === 'COLD' ? 'COLD' : 'HOT',
                    )
                  }
                />
                <NumberInput
                  label="Cost (cents)"
                  min={0}
                  allowDecimal={false}
                  value={form.values.costCents}
                  onChange={(value) =>
                    form.setFieldValue('costCents', Number(value))
                  }
                  error={form.errors.costCents}
                />
                <NumberInput
                  label="Minimum quantity"
                  min={1}
                  allowDecimal={false}
                  value={form.values.minOrderQty}
                  onChange={(value) =>
                    form.setFieldValue('minOrderQty', Number(value))
                  }
                  error={form.errors.minOrderQty}
                />
              </Group>
              <Select
                label="Kitchen station"
                clearable
                data={
                  references.data?.stations.map((item) => ({
                    value: item.id,
                    label: item.name,
                  })) ?? []
                }
                value={form.values.stationId}
                onChange={(value) => form.setFieldValue('stationId', value)}
              />
              <Group grow>
                <MultiSelect
                  label="Allergens"
                  data={
                    references.data?.allergens.map((item) => ({
                      value: item.id,
                      label: item.name,
                    })) ?? []
                  }
                  {...form.getInputProps('allergenIds')}
                />
                <MultiSelect
                  label="Dietary tags"
                  data={
                    references.data?.tags.map((item) => ({
                      value: item.id,
                      label: item.name,
                    })) ?? []
                  }
                  {...form.getInputProps('dietaryTagIds')}
                />
              </Group>
              <Switch
                label="Active"
                {...form.getInputProps('isActive', { type: 'checkbox' })}
              />
              <Group>
                <Button type="submit" loading={mutation.isPending}>
                  {editing ? 'Save dish' : 'Add dish'}
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
            </Stack>
          </form>
        </Paper>
      )}
      <ServerTable
        items={query.data?.items ?? []}
        total={query.data?.total ?? 0}
        rowKey={(item) => item.id}
        filterKeys={['q']}
        loading={query.isPending}
        error={query.isError}
        retry={() => {
          void query.refetch();
        }}
        columns={[
          {
            key: 'sku',
            label: 'SKU',
            sortKey: 'sku',
            render: (item) => item.sku,
          },
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
                  render: (item: Dish) => (
                    <Button
                      size="xs"
                      variant="subtle"
                      onClick={() => selectDish(item)}
                    >
                      Edit
                    </Button>
                  ),
                },
              ]
            : []),
        ]}
      />
      {editing && <GroupsEditor dishId={editing.id} manage={manage} />}
    </Stack>
  );
}

function OptionsPanel({ manage }: { manage: boolean }) {
  const table = useTableState(['q']);
  const client = useQueryClient();
  const references = useReferences();
  const [editing, setEditing] = useState<Option | null>(null);
  const query = useQuery({
    queryKey: [
      'catalogue',
      'options',
      table.page,
      table.pageSize,
      table.sort,
      table.filters.q,
    ],
    queryFn: () =>
      api.call(listOptions, {
        query: {
          page: table.page,
          pageSize: table.pageSize,
          sort: table.sort,
          q: table.filters.q || undefined,
        },
      }),
  });
  const form = useForm({
    initialValues: {
      name: '',
      costCents: 0,
      allergenIds: [] as string[],
      dietaryTagIds: [] as string[],
      isActive: true,
    },
    validate: zod4Resolver(optionBody),
  });
  const mutation = useMutation({
    mutationFn: (values: typeof form.values) =>
      editing
        ? api.call(updateOption, { params: { id: editing.id }, body: values })
        : api.call(createOption, { body: values }),
    onSuccess: () => {
      setEditing(null);
      form.reset();
      void client.invalidateQueries({ queryKey: ['catalogue', 'options'] });
    },
  });
  return (
    <Stack>
      {references.isError && (
        <ErrorState
          message="Could not load reference choices."
          retry={() => {
            void references.refetch();
          }}
        />
      )}
      {manage && (
        <Paper withBorder p="md">
          <form
            onSubmit={form.onSubmit((values) => {
              void mutation
                .mutateAsync(values)
                .catch((error) => showApiError(error, form.setFieldError));
            })}
          >
            <Stack>
              <Title order={4}>{editing ? 'Edit option' : 'New option'}</Title>
              <Group grow>
                <TextInput
                  label="Name"
                  required
                  {...form.getInputProps('name')}
                />
                <NumberInput
                  label="Cost (cents)"
                  min={0}
                  allowDecimal={false}
                  value={form.values.costCents}
                  onChange={(value) =>
                    form.setFieldValue('costCents', Number(value))
                  }
                  error={form.errors.costCents}
                />
              </Group>
              <Group grow>
                <MultiSelect
                  label="Allergens"
                  data={
                    references.data?.allergens.map((item) => ({
                      value: item.id,
                      label: item.name,
                    })) ?? []
                  }
                  {...form.getInputProps('allergenIds')}
                />
                <MultiSelect
                  label="Dietary tags"
                  data={
                    references.data?.tags.map((item) => ({
                      value: item.id,
                      label: item.name,
                    })) ?? []
                  }
                  {...form.getInputProps('dietaryTagIds')}
                />
              </Group>
              <Switch
                label="Active"
                {...form.getInputProps('isActive', { type: 'checkbox' })}
              />
              <Group>
                <Button type="submit" loading={mutation.isPending}>
                  {editing ? 'Save option' : 'Add option'}
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
            </Stack>
          </form>
        </Paper>
      )}
      <ServerTable
        items={query.data?.items ?? []}
        total={query.data?.total ?? 0}
        rowKey={(item) => item.id}
        filterKeys={['q']}
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
            key: 'cost',
            label: 'Cost (cents)',
            render: (item) => item.costCents,
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
                  render: (item: Option) => (
                    <Button
                      size="xs"
                      variant="subtle"
                      onClick={() => {
                        setEditing(item);
                        form.setValues(item);
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

function GroupsEditor({ dishId, manage }: { dishId: string; manage: boolean }) {
  const client = useQueryClient();
  const [editing, setEditing] = useState<GroupItem | null>(null);
  const groups = useQuery({
    queryKey: ['catalogue', 'groups', dishId],
    queryFn: () => api.call(listGroups, { params: { id: dishId } }),
  });
  const options = useQuery({
    queryKey: ['catalogue', 'group-options'],
    queryFn: () => api.call(listOptions, { query: { page: 1, pageSize: 100 } }),
  });
  const form = useForm({
    initialValues: {
      name: '',
      isRequired: false,
      sortOrder: 0,
      options: [] as { optionId: string; sortOrder: number }[],
    },
    validate: zod4Resolver(optionGroupBody),
  });
  const save = useMutation({
    mutationFn: (values: typeof form.values) =>
      editing
        ? api.call(updateGroup, { params: { id: editing.id }, body: values })
        : api.call(createGroup, { params: { id: dishId }, body: values }),
    onSuccess: () => {
      setEditing(null);
      form.reset();
      void client.invalidateQueries({
        queryKey: ['catalogue', 'groups', dishId],
      });
    },
  });
  const remove = useMutation({
    mutationFn: (id: string) => api.call(deleteGroup, { params: { id } }),
    onSuccess: () => {
      void client.invalidateQueries({
        queryKey: ['catalogue', 'groups', dishId],
      });
    },
  });
  return (
    <Paper withBorder p="md">
      <Stack>
        <Title order={4}>Option groups</Title>
        {options.isError && (
          <ErrorState
            message="Could not load options."
            retry={() => {
              void options.refetch();
            }}
          />
        )}
        {remove.isError && <ErrorState message="Could not delete the group." />}
        {groups.isPending ? (
          <LoadingState />
        ) : groups.isError ? (
          <ErrorState
            retry={() => {
              void groups.refetch();
            }}
          />
        ) : groups.data.length === 0 ? (
          'No groups yet.'
        ) : (
          groups.data.map((group) => (
            <Group key={group.id} justify="space-between">
              <span>
                {group.name} · {group.isRequired ? 'Required' : 'Optional'} ·{' '}
                {group.options.length} options
              </span>
              {manage && (
                <Group>
                  <Button
                    variant="subtle"
                    size="xs"
                    onClick={() => {
                      setEditing(group);
                      form.setValues(group);
                    }}
                  >
                    Edit
                  </Button>
                  <Button
                    color="red"
                    variant="subtle"
                    size="xs"
                    loading={remove.isPending}
                    onClick={() => remove.mutate(group.id)}
                  >
                    Delete
                  </Button>
                </Group>
              )}
            </Group>
          ))
        )}
        {manage && (
          <form
            onSubmit={form.onSubmit((values) => {
              void save
                .mutateAsync(values)
                .catch((error) => showApiError(error, form.setFieldError));
            })}
          >
            <Stack>
              <TextInput
                label="Group name"
                required
                {...form.getInputProps('name')}
              />
              <Group grow>
                <NumberInput
                  label="Sort order"
                  allowDecimal={false}
                  value={form.values.sortOrder}
                  onChange={(value) =>
                    form.setFieldValue('sortOrder', Number(value))
                  }
                />
                <Switch
                  label="Required"
                  {...form.getInputProps('isRequired', { type: 'checkbox' })}
                />
              </Group>
              <MultiSelect
                label="Offered options"
                data={
                  options.data?.items.map((item) => ({
                    value: item.id,
                    label: item.name,
                  })) ?? []
                }
                value={form.values.options.map((item) => item.optionId)}
                onChange={(ids) =>
                  form.setFieldValue(
                    'options',
                    ids.map((optionId, sortOrder) => ({ optionId, sortOrder })),
                  )
                }
              />
              <Group>
                <Button type="submit" loading={save.isPending}>
                  {editing ? 'Save group' : 'Add group'}
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
            </Stack>
          </form>
        )}
      </Stack>
    </Paper>
  );
}
