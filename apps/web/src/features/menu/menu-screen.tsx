'use client';

import { useState } from 'react';
import { Button, Group, Paper, Stack, Switch, Table, Text, TextInput, Title, NumberInput } from '@mantine/core';
import { useForm } from '@mantine/form';
import { zod4Resolver } from 'mantine-form-zod-resolver';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { can, PERM, listCategories, createCategory, createMenuItem, setCompanyMenuHiding, previewMenu, previewSecretCategory, formatMoney } from '@fernleaf/shared';
import { api } from '../../lib/api';
import { useSession } from '../../lib/auth';
import { showApiError } from '../../lib/errors';

export function MenuScreen() {
  const session = useSession();
  const queryClient = useQueryClient();
  const [employeeId, setEmployeeId] = useState('');
  const [secretId, setSecretId] = useState('');
  const [companyId, setCompanyId] = useState('');
  const [hiddenCategories, setHiddenCategories] = useState('');
  const [hiddenItems, setHiddenItems] = useState('');
  const categories = useQuery({ queryKey: ['menu', 'categories'], queryFn: () => api.call(listCategories) });
  const preview = useQuery({ queryKey: ['menu', 'preview', employeeId], queryFn: () => api.call(previewMenu, { params: { id: employeeId } }), enabled: !!employeeId });
  const secret = useQuery({ queryKey: ['menu', 'secret', employeeId, secretId], queryFn: () => api.call(previewSecretCategory, { params: { id: employeeId, categoryId: secretId } }), enabled: !!employeeId && !!secretId });
  const categoryForm = useForm({ initialValues: { name: '', sortOrder: 0, isActive: true, isSecret: false }, validate: zod4Resolver(createCategory.body) });
  const itemForm = useForm({ initialValues: { categoryId: '', dishId: '', sortOrder: 0, isActive: true }, validate: zod4Resolver(createMenuItem.body) });
  const createCategoryMutation = useMutation({ mutationFn: (body: typeof categoryForm.values) => api.call(createCategory, { body }), onSuccess: () => { void queryClient.invalidateQueries({ queryKey: ['menu'] }); categoryForm.reset(); } });
  const createItemMutation = useMutation({ mutationFn: (body: typeof itemForm.values) => api.call(createMenuItem, { body }), onSuccess: () => { void queryClient.invalidateQueries({ queryKey: ['menu'] }); itemForm.reset(); } });
  const hidingMutation = useMutation({ mutationFn: () => api.call(setCompanyMenuHiding, { params: { id: companyId }, body: { hiddenCategoryIds: hiddenCategories.split(',').map(id => id.trim()).filter(Boolean), hiddenItemIds: hiddenItems.split(',').map(id => id.trim()).filter(Boolean) } }), onSuccess: () => void queryClient.invalidateQueries({ queryKey: ['menu'] }) });
  if (session.isLoading) return <Text>Loading permissions…</Text>;
  if (session.isError || !session.data || !can(session.data, PERM.menu.read)) return <Text>Access denied.</Text>;
  const manage = can(session.data, PERM.menu.manage), canPreview = can(session.data, PERM.menu.preview);
  return <Stack p="lg"><Title order={2}>Menu</Title>
    {categories.isLoading && <Text>Loading categories…</Text>}
    {categories.isError && <Button onClick={() => void categories.refetch()}>Could not load categories. Retry</Button>}
    {categories.data?.length === 0 && <Text>No categories yet.</Text>}
    {!!categories.data?.length && <Table striped withTableBorder><Table.Thead><Table.Tr><Table.Th>Category</Table.Th><Table.Th>Order</Table.Th><Table.Th>Active</Table.Th><Table.Th>Secret</Table.Th><Table.Th>ID</Table.Th></Table.Tr></Table.Thead><Table.Tbody>{categories.data.map(category => <Table.Tr key={category.id}><Table.Td>{category.name}</Table.Td><Table.Td>{category.sortOrder}</Table.Td><Table.Td>{category.isActive ? 'Yes' : 'No'}</Table.Td><Table.Td>{category.isSecret ? 'Yes' : 'No'}</Table.Td><Table.Td>{category.id}</Table.Td></Table.Tr>)}</Table.Tbody></Table>}
    {manage && <Group align="start" grow>
      <Paper withBorder p="md"><form onSubmit={categoryForm.onSubmit(body => { void createCategoryMutation.mutateAsync(body).catch(error => showApiError(error, categoryForm.setFieldError)); })}><Stack><Title order={3}>New category</Title><TextInput label="Name" {...categoryForm.getInputProps('name')} /><NumberInput label="Sort order" {...categoryForm.getInputProps('sortOrder')} /><Switch label="Active" {...categoryForm.getInputProps('isActive', { type: 'checkbox' })} /><Switch label="Secret" {...categoryForm.getInputProps('isSecret', { type: 'checkbox' })} /><Button type="submit" loading={createCategoryMutation.isPending}>Create category</Button></Stack></form></Paper>
      <Paper withBorder p="md"><form onSubmit={itemForm.onSubmit(body => { void createItemMutation.mutateAsync(body).catch(error => showApiError(error, itemForm.setFieldError)); })}><Stack><Title order={3}>Add dish</Title><TextInput label="Category ID" {...itemForm.getInputProps('categoryId')} /><TextInput label="Dish ID" {...itemForm.getInputProps('dishId')} /><NumberInput label="Sort order" {...itemForm.getInputProps('sortOrder')} /><Button type="submit" loading={createItemMutation.isPending}>Add item</Button></Stack></form></Paper>
      <Paper withBorder p="md"><Stack><Title order={3}>Company hiding</Title><TextInput label="Company ID" value={companyId} onChange={event => setCompanyId(event.currentTarget.value)} /><TextInput label="Hidden category IDs, comma separated" value={hiddenCategories} onChange={event => setHiddenCategories(event.currentTarget.value)} /><TextInput label="Hidden item IDs, comma separated" value={hiddenItems} onChange={event => setHiddenItems(event.currentTarget.value)} /><Button loading={hidingMutation.isPending} onClick={() => void hidingMutation.mutateAsync().catch(showApiError)}>Replace hiding</Button></Stack></Paper>
    </Group>}
    {canPreview && <Paper withBorder p="md"><Stack><Title order={3}>Employee preview</Title><TextInput label="Employee ID" value={employeeId} onChange={event => setEmployeeId(event.currentTarget.value)} /><TextInput label="Open secret category by ID" value={secretId} onChange={event => setSecretId(event.currentTarget.value)} />{preview.isLoading && <Text>Loading preview…</Text>}{preview.isError && <Button onClick={() => void preview.refetch()}>Could not load preview. Retry</Button>}{preview.data?.categories.length === 0 && <Text>No dishes available.</Text>}{preview.data?.categories.map(category => <Stack key={category.id}><Title order={4}>{category.name}</Title>{category.dishes.map(dish => <Text key={dish.id}>{dish.name} — {formatMoney(dish.priceCents)}</Text>)}</Stack>)}{secret.isLoading && <Text>Loading secret category…</Text>}{secret.isError && <Button onClick={() => void secret.refetch()}>Could not open category. Retry</Button>}{secret.data && <Stack><Title order={4}>{secret.data.name}</Title>{secret.data.dishes.length === 0 && <Text>No dishes available.</Text>}{secret.data.dishes.map(dish => <Text key={dish.id}>{dish.name} — {formatMoney(dish.priceCents)}</Text>)}</Stack>}</Stack></Paper>}
  </Stack>;
}
